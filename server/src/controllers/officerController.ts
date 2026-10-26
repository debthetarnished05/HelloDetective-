import { Request, Response } from 'express';
import GameSession from '../models/GameSession.js';

export const submitDeduction = async (req: Request, res: Response) => {
  try {
    const { sessionId, playerDeduction } = req.body;
    const session = await GameSession.findById(sessionId);
    
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // MOCK LOGIC: If the player types the word "coffee", we advance to stage 2.
    // In the future, the Groq AI will evaluate 'playerDeduction' to decide this.
    let stageAdvanced = false;
    let unlockedItems = { locations: [] as string[], evidence: [] as string[] };
    let officerResponse = "I'm not seeing the connection yet, Detective.";

    if (session.currentStage === 1 && playerDeduction.toLowerCase().includes('coffee')) {
      session.currentStage = 2;
      session.unlockedLocations.push('riverside_brews');
      session.unlockedEvidence.push('threatening_email');
      
      stageAdvanced = true;
      unlockedItems.locations.push('riverside_brews');
      unlockedItems.evidence.push('threatening_email');
      officerResponse = "Good catch. I'll get a warrant for the coffee shop immediately.";
    }

    session.officerChatHistory.push({ role: 'user', content: playerDeduction, timestamp: new Date() });
    session.officerChatHistory.push({ role: 'assistant', content: officerResponse, timestamp: new Date() });
    await session.save();

    res.status(200).json({
      officerResponse,
      stageAdvanced,
      newStage: session.currentStage,
      unlockedItems
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process deduction' });
  }
};