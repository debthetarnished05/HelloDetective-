import { Request, Response } from 'express';
import GameSession from '../models/GameSession';
import { GroqService } from '../services/GroqService';

export const startNewGame = async (req: Request, res: Response) => {
  const session = new GameSession({
    currentStage: 1,
    unlockedEvidence: ['autopsy_report', 'crime_scene_photos'],
    unlockedLocations: ['riverside_corporate_center'],
    groundTruth: {
      killer: 'marcus_chen',
      weapon: 'letter_opener',
      motive: 'patent_control'
    }
  });
  await session.save();
  res.json({ sessionId: session._id, session });
};

export const chatSuspect = async (req: Request, res: Response) => {
  const { sessionId, suspectId, message, presentedEvidence } = req.body;
  
  const session = await GameSession.findById(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const suspectState = session.suspects.get(suspectId);
  if (!suspectState) return res.status(404).json({ error: 'Suspect not found' });

  // Pass to AI
  const aiResponse = await GroqService.chatWithSuspect(suspectId, suspectState, message, presentedEvidence);

  // Apply AI logic updates to the global game state
  suspectState.trustScore = Math.max(0, Math.min(100, suspectState.trustScore + (aiResponse.trust_delta || 0)));
  
  if (aiResponse.new_revealed_fact) {
    suspectState.revealedFacts.push(aiResponse.new_revealed_fact);
  }

  session.suspects.set(suspectId, suspectState);
  await session.save();

  res.json({ 
    dialogue: aiResponse.dialogue, 
    trustScore: suspectState.trustScore 
  });
};

export const submitDeduction = async (req: Request, res: Response) => {
  const { sessionId, deduction } = req.body;
  const session = await GameSession.findById(sessionId);
  
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const officerResponse = await GroqService.evaluateDeduction(session, deduction);

  // If the AI officer approves the deduction, advance the game state
  if (officerResponse.isApproved) {
    session.currentStage += 1;
    session.unlockedEvidence = [...new Set([...session.unlockedEvidence, ...officerResponse.unlockEvidence])];
    session.unlockedLocations = [...new Set([...session.unlockedLocations, ...officerResponse.unlockLocations])];
    await session.save();
  }

  res.json(officerResponse);
};

export const submitWarrant = async (req: Request, res: Response) => {
  const { sessionId, suspect, motive, weapon } = req.body;
  const session = await GameSession.findById(sessionId);
  
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const epilogue = await GroqService.evaluateWarrant({ suspect, motive, weapon }, session.groundTruth);
  
  res.json({ epilogue });
};