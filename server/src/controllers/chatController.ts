import { Request, Response } from 'express';
import GameSession from '../models/GameSession.js';

export const interrogateSuspect = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { suspectId, message, evidenceId } = req.body;

    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Find the specific suspect's state
    const suspectState = session.suspectStates.find(s => s.suspectId === suspectId);
    if (!suspectState) return res.status(404).json({ error: 'Suspect not found in this session' });

    // Save player's message
    suspectState.chatHistory.push({
      role: 'user',
      content: evidenceId ? `[Shows evidence: ${evidenceId}] ${message}` : message,
      timestamp: new Date()
    });

    // MOCK AI LOGIC: Static responses based on evidence presented
    let aiDialogue = `I don't know what you're talking about. I was at home.`;
    
    if (evidenceId === 'threatening_email') {
      aiDialogue = `Fine... yes, I sent the email. But I didn't kill him!`;
      suspectState.stressLevel += 20;
      if (!suspectState.revealedFacts.includes('admitted_sending_email')) {
        suspectState.revealedFacts.push('admitted_sending_email');
      }
    } else if (message.toLowerCase().includes('murder')) {
      aiDialogue = `How dare you accuse me? I want a lawyer.`;
      suspectState.trustScore -= 10;
    }

    // Save AI's mock response
    suspectState.chatHistory.push({
      role: 'assistant',
      content: aiDialogue,
      timestamp: new Date()
    });

    await session.save();

    res.status(200).json({
      dialogue: aiDialogue,
      trustScore: suspectState.trustScore,
      stressLevel: suspectState.stressLevel,
      revealedFacts: suspectState.revealedFacts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process interrogation' });
  }
};