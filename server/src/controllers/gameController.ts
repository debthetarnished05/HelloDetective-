import { Request, Response } from 'express';
import GameSession from '../models/GameSession';
import Story from '../models/StoryData';
import { DEFAULT_STORY } from '../data/defaultStory';
import { OPERA_STORY, ARCTIC_STORY } from '../data/seedStories';
import { GroqService } from '../services/GroqService';
import { IStory, ISuspectRuntimeState } from '../types/index';

export async function seedDefaultStories() {
  // 1. Ensure DEFAULT_STORY (Silicon Alibi)
  let defaultStory = await Story.findOne({ caseNumber: DEFAULT_STORY.caseNumber });
  if (!defaultStory) {
    defaultStory = await Story.findOne({ isDefault: true });
  }
  if (!defaultStory) {
    defaultStory = new Story(DEFAULT_STORY);
    await defaultStory.save();
    console.log('Seeded default story: Silicon Alibi');
  } else {
    if (!defaultStory.suspects || defaultStory.suspects.length < DEFAULT_STORY.suspects.length) {
      defaultStory.suspects = DEFAULT_STORY.suspects as any;
      await defaultStory.save();
    }
  }

  // 2. Ensure OPERA_STORY (The Gilded Aria)
  let operaStory = await Story.findOne({ caseNumber: OPERA_STORY.caseNumber });
  if (!operaStory) {
    operaStory = new Story(OPERA_STORY);
    await operaStory.save();
    console.log('Seeded story: The Gilded Aria');
  }

  // 3. Ensure ARCTIC_STORY (The Frostbite Protocol)
  let arcticStory = await Story.findOne({ caseNumber: ARCTIC_STORY.caseNumber });
  if (!arcticStory) {
    arcticStory = new Story(ARCTIC_STORY);
    await arcticStory.save();
    console.log('Seeded story: The Frostbite Protocol');
  }

  return defaultStory;
}

export const startNewGame = async (req: Request, res: Response) => {
  try {
    const { storyId } = req.body;
    let story: any;

    if (storyId) {
      story = await Story.findById(storyId);
    }
    if (!story) {
      story = await seedDefaultStories();
    }
    if (!story) {
      return res.status(500).json({ error: 'Failed to find or seed detective story.' });
    }

    // Determine initial stage 1 unlocks
    const stage1Evidence = (story.evidence || [])
      .filter((e: any) => e.unlockStage <= 1)
      .map((e: any) => e.id);

    const stage1Locations = (story.locations || [])
      .filter((l: any) => l.unlockStage <= 1)
      .map((l: any) => l.id);

    // Build initial suspect runtime states
    const suspectsMap = new Map<string, ISuspectRuntimeState>();
    for (const suspect of story.suspects || []) {
      suspectsMap.set(suspect.id, {
        suspectId: suspect.id,
        trustScore: suspect.initialTrust ?? 50,
        stressLevel: suspect.initialStress ?? 20,
        mood: 'composed',
        revealedFacts: [],
        chatHistory: []
      });
    }

    const session = new GameSession({
      storyId: story._id,
      currentStage: 1,
      unlockedEvidence: stage1Evidence,
      unlockedLocations: stage1Locations,
      suspects: suspectsMap,
      officerChatHistory: [
        {
          role: 'assistant',
          content: `Welcome to the precinct, Detective. We've got a fresh homicide: ${story.victimProfile.name}, found dead in ${story.locations[0]?.title || 'the crime scene'}. Look over the initial scene evidence and start breaking down these alibis. Report back to me when you catch your first lie.`,
          timestamp: new Date()
        }
      ],
      notes: '',
      recordedClues: [],
      groundTruth: story.groundTruth,
      status: 'active'
    });

    await session.save();

    res.status(200).json({
      sessionId: session._id,
      session,
      story
    });
  } catch (error: any) {
    console.error('startNewGame error:', error);
    res.status(500).json({ error: error.message || 'Failed to start new game' });
  }
};

export const getSessionState = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let story = await Story.findById(session.storyId);
    if (!story) {
      story = await ensureDefaultStory();
    }

    res.status(200).json({
      sessionId: session._id,
      session,
      story
    });
  } catch (error: any) {
    console.error('getSessionState error:', error);
    res.status(500).json({ error: error.message || 'Failed to get session state' });
  }
};

export const chatSuspect = async (req: Request, res: Response) => {
  try {
    const { sessionId, suspectId, message, presentedEvidenceId } = req.body;

    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const suspectProfile = story.suspects.find((s: any) => s.id === suspectId);
    if (!suspectProfile) return res.status(404).json({ error: `Suspect ${suspectId} not found in story` });

    // Ensure suspect runtime state exists
    let suspectState = session.suspects.get(suspectId);
    if (!suspectState) {
      suspectState = {
        suspectId,
        trustScore: suspectProfile.initialTrust ?? 50,
        stressLevel: suspectProfile.initialStress ?? 20,
        mood: 'composed',
        revealedFacts: [],
        chatHistory: []
      };
    }

    // Find presented evidence object if any
    let presentedEvidence = null;
    if (presentedEvidenceId) {
      presentedEvidence = story.evidence.find((e: any) => e.id === presentedEvidenceId) || null;
    }

    // Collect revealed facts across ALL suspects for cross-referencing contradictions
    const allRevealedFacts: string[] = [];
    session.suspects.forEach((state) => {
      if (state.revealedFacts && state.revealedFacts.length > 0) {
        allRevealedFacts.push(...state.revealedFacts);
      }
    });

    // Save user's message to chat history
    suspectState.chatHistory.push({
      role: 'user',
      content: userMessageWithEvidencePrefix(message, presentedEvidence),
      timestamp: new Date(),
      attachedEvidence: presentedEvidenceId || null
    });

    // Invoke AI Interrogation
    const aiResponse = await GroqService.chatWithSuspect(
      suspectProfile,
      suspectState,
      message,
      presentedEvidence,
      allRevealedFacts
    );

    // Apply updates
    suspectState.trustScore = Math.max(0, Math.min(100, suspectState.trustScore + (aiResponse.trust_delta || 0)));
    suspectState.stressLevel = Math.max(0, Math.min(100, suspectState.stressLevel + (aiResponse.stress_delta || 0)));
    suspectState.mood = aiResponse.mood || (suspectState.stressLevel >= 80 ? 'broken_down' : suspectState.stressLevel >= 50 ? 'nervous' : suspectState.trustScore < 30 ? 'defensive' : 'composed');

    if (aiResponse.new_revealed_fact && !suspectState.revealedFacts.includes(aiResponse.new_revealed_fact)) {
      suspectState.revealedFacts.push(aiResponse.new_revealed_fact);
    }

    // Save AI response to chat history
    suspectState.chatHistory.push({
      role: 'assistant',
      content: aiResponse.dialogue,
      timestamp: new Date()
    });

    session.suspects.set(suspectId, suspectState);
    session.markModified('suspects');
    await session.save();

    res.status(200).json({
      dialogue: aiResponse.dialogue,
      trustScore: suspectState.trustScore,
      stressLevel: suspectState.stressLevel,
      mood: suspectState.mood,
      revealedFacts: suspectState.revealedFacts,
      newRevealedFact: aiResponse.new_revealed_fact,
      brokeDown: aiResponse.broke_down || suspectState.stressLevel >= 80
    });
  } catch (error: any) {
    console.error('chatSuspect error:', error);
    res.status(500).json({ error: error.message || 'Failed to interrogate suspect' });
  }
};

function userMessageWithEvidencePrefix(msg: string, ev: any) {
  if (!ev) return msg;
  return `[Confronts with evidence: ${ev.title}] ${msg}`;
}

export const submitDeduction = async (req: Request, res: Response) => {
  try {
    const { sessionId, deduction } = req.body;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const currentStageDef = story.stages.find((s: any) => s.stage === session.currentStage) || {
      stage: session.currentStage,
      title: `Stage ${session.currentStage}`,
      description: 'Proceed with the investigation',
      gateRules: 'Establish significant evidence',
      unlockEvidenceIds: [],
      unlockLocationIds: []
    };

    // Gather all revealed admissions so far
    const allAdmissions: string[] = [];
    session.suspects.forEach(s => {
      if (s.revealedFacts) allAdmissions.push(...s.revealedFacts);
    });

    const officerResult = await GroqService.evaluateDeduction(
      session.currentStage,
      currentStageDef,
      deduction,
      allAdmissions,
      story.groundTruth
    );

    let newlyUnlockedEvidence: string[] = [];
    let newlyUnlockedLocations: string[] = [];

    if (officerResult.isApproved && session.currentStage < 4) {
      session.currentStage += 1;

      // Unlock items configured for the completed stage
      newlyUnlockedEvidence = currentStageDef.unlockEvidenceIds || [];
      newlyUnlockedLocations = currentStageDef.unlockLocationIds || [];

      // Also unlock any items tagged with the new stage
      const nextStageEvidence = (story.evidence || [])
        .filter((e: any) => e.unlockStage === session.currentStage)
        .map((e: any) => e.id);
      const nextStageLocations = (story.locations || [])
        .filter((l: any) => l.unlockStage === session.currentStage)
        .map((l: any) => l.id);

      session.unlockedEvidence = [...new Set([...session.unlockedEvidence, ...newlyUnlockedEvidence, ...nextStageEvidence])];
      session.unlockedLocations = [...new Set([...session.unlockedLocations, ...newlyUnlockedLocations, ...nextStageLocations])];
    }

    session.officerChatHistory.push({
      role: 'user',
      content: deduction,
      timestamp: new Date()
    });

    session.officerChatHistory.push({
      role: 'assistant',
      content: officerResult.dialogue,
      timestamp: new Date(),
      isApproved: officerResult.isApproved
    });

    await session.save();

    res.status(200).json({
      isApproved: officerResult.isApproved,
      dialogue: officerResult.dialogue,
      feedback: officerResult.feedback,
      newStage: session.currentStage,
      unlockedEvidence: session.unlockedEvidence,
      unlockedLocations: session.unlockedLocations
    });
  } catch (error: any) {
    console.error('submitDeduction error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit deduction' });
  }
};

export const submitWarrant = async (req: Request, res: Response) => {
  try {
    const { sessionId, suspect, motive, weapon, keyContradiction } = req.body;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const verdict = await GroqService.evaluateWarrant(
      { suspect, motive, weapon, keyContradiction },
      story.groundTruth,
      story.title
    );

    session.status = 'solved';
    session.verdict = {
      suspect,
      motive,
      weapon,
      keyContradiction,
      outcome: verdict.outcome,
      epilogue: verdict.epilogue,
      score: verdict.score
    };

    await session.save();

    res.status(200).json({
      outcome: verdict.outcome,
      score: verdict.score,
      verdictTitle: verdict.verdictTitle,
      epilogue: verdict.epilogue
    });
  } catch (error: any) {
    console.error('submitWarrant error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit warrant' });
  }
};

export const saveNotes = async (req: Request, res: Response) => {
  try {
    const { sessionId, notes } = req.body;
    const session = await GameSession.findByIdAndUpdate(sessionId, { notes }, { new: true });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.status(200).json({ notes: session.notes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save notes' });
  }
};

export const recordClue = async (req: Request, res: Response) => {
  try {
    const { sessionId, suspectId, suspectName, statement } = req.body;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const newClue = {
      id: `clue_${Date.now()}`,
      suspectId,
      suspectName,
      statement,
      timestamp: new Date()
    };

    session.recordedClues.push(newClue);
    await session.save();

    res.status(200).json({ clues: session.recordedClues });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record clue' });
  }
};

// ================= STORY MANAGEMENT ENDPOINTS =================

export const listStories = async (req: Request, res: Response) => {
  try {
    await seedDefaultStories();
    const stories = await Story.find().select('title caseNumber leadDetective status isDefault createdAt victimProfile briefing suspects locations evidence');
    res.status(200).json({ stories });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list stories' });
  }
};

export const getStoryById = async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.status(200).json({ story });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get story' });
  }
};

export const createStory = async (req: Request, res: Response) => {
  try {
    const storyData = req.body;
    const newStory = new Story(storyData);
    await newStory.save();
    res.status(201).json({ story: newStory });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create story' });
  }
};

export const generateAiStory = async (req: Request, res: Response) => {
  try {
    const { promptTheme } = req.body;
    const generated = await GroqService.generateCompleteStory(promptTheme);
    const story = new Story(generated);
    await story.save();
    res.status(201).json({ story });
  } catch (error: any) {
    console.error('generateAiStory error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI story' });
  }
};