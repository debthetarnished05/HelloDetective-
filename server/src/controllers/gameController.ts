import { Request, Response } from 'express';
import GameSession from '../models/GameSession.js'; // Note the .js extension
import { INITIAL_GAME_STATE, GROUND_TRUTH } from '../data/gameStory.js';

export const startGame = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    
    const newSession = await GameSession.create({
      playerId,
      status: 'active',
      currentStage: 1,
      unlockedEvidence: INITIAL_GAME_STATE.unlockedEvidence,
      unlockedLocations: INITIAL_GAME_STATE.unlockedLocations,
      suspectStates: INITIAL_GAME_STATE.suspects,
      officerChatHistory: []
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start game' });
  }
};

export const getGameStatus = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game status' });
  }
};

export const submitWarrant = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { suspectId, motiveEvidenceId, weaponId, contradictionId } = req.body;

    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Mock AI Evaluation Logic for now
    let isCorrect = true;
    if (suspectId !== GROUND_TRUTH.killer) isCorrect = false;
    if (motiveEvidenceId !== GROUND_TRUTH.motive) isCorrect = false;
    if (weaponId !== GROUND_TRUTH.weapon) isCorrect = false;
    if (contradictionId !== GROUND_TRUTH.keyContradiction) isCorrect = false;

    session.status = isCorrect ? 'solved' : 'failed';
    await session.save();

    res.status(200).json({
      success: isCorrect,
      epilogue: isCorrect 
        ? "Mock Epilogue: You nailed it! The suspect confessed." 
        : "Mock Epilogue: You arrested the wrong person or lacked evidence.",
      sessionStatus: session.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit warrant' });
  }
};