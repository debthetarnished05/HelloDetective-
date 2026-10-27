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
    defaultStory.locations = DEFAULT_STORY.locations as any;
    defaultStory.evidence = DEFAULT_STORY.evidence as any;
    defaultStory.suspects = DEFAULT_STORY.suspects as any;
    defaultStory.groundTruth = DEFAULT_STORY.groundTruth as any;
    await defaultStory.save();
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

    // Determine initial unlocks for dynamic lead-web
    const initialEvidence = (story.evidence || [])
      .filter((e: any) => e.isInitiallyUnlocked !== false && (e.unlockStage === undefined || e.unlockStage <= 1))
      .map((e: any) => e.id);
    if (initialEvidence.length === 0 && story.evidence?.[0]) {
      initialEvidence.push(story.evidence[0].id);
    }

    const initialLocations = (story.locations || [])
      .filter((l: any) => l.isInitiallyUnlocked !== false && (l.unlockStage === undefined || l.unlockStage <= 1))
      .map((l: any) => l.id);
    if (initialLocations.length === 0 && story.locations?.[0]) {
      initialLocations.push(story.locations[0].id);
    }

    const initialSuspects = (story.suspects || [])
      .filter((s: any) => s.isInitiallyUnlocked !== false)
      .map((s: any) => s.id);
    if (initialSuspects.length === 0) {
      initialSuspects.push(...(story.suspects || []).slice(0, 2).map((s: any) => s.id));
    }

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
      unlockedEvidence: initialEvidence,
      unlockedLocations: initialLocations,
      canvassedLocations: [],
      unlockedSuspects: initialSuspects,
      caseClosingTriggered: false,
      remainingClosingQuestions: 12,
      interrogationLocked: false,
      closingNotificationSent: false,
      suspects: suspectsMap,
      officerChatHistory: [
        {
          role: 'assistant',
          content: `Welcome to the precinct, Detective. We've got a fresh homicide: ${story.victimProfile.name}, found dead in ${story.locations[0]?.title || 'the crime scene'}. Canvas the crime scene and interrogate our prime suspects. When every lead is uncovered, I'll alert you to prepare the final indictment.`,
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
      story = await seedDefaultStories();
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

function checkAndTriggerClosing(session: any, story: any): boolean {
  const totalLocations = (story.locations || []).length;
  const totalEvidence = (story.evidence || []).length;
  const canvassedCount = (session.canvassedLocations || []).length;
  const evidenceCount = (session.unlockedEvidence || []).length;

  if (canvassedCount >= totalLocations && evidenceCount >= totalEvidence && !session.caseClosingTriggered) {
    session.caseClosingTriggered = true;
    session.remainingClosingQuestions = 12;
    session.closingNotificationSent = true;

    session.officerChatHistory.push({
      role: 'assistant',
      content: `🚨 URGENT DISPATCH FROM OFFICER DAVIS: Detective! Forensics has finished processing every known crime scene, and all leads in town have been canvassed. The District Attorney is demanding our final indictment. You have 12 questions remaining across your suspects before interrogations are locked and we must take our Arrest Warrant to the Judge. Make every question count!`,
      timestamp: new Date()
    });
    return true;
  }
  return false;
}

export const chatSuspect = async (req: Request, res: Response) => {
  try {
    const { sessionId, suspectId, message, presentedEvidenceId } = req.body;

    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    // Backward compatibility for existing active sessions
    if (!session.unlockedSuspects) session.unlockedSuspects = (story.suspects || []).slice(0, 2).map((s: any) => s.id);
    if (!session.canvassedLocations) session.canvassedLocations = [];
    if (session.remainingClosingQuestions === undefined) session.remainingClosingQuestions = 12;

    if (session.interrogationLocked) {
      return res.status(403).json({
        error: 'Interrogations have been locked by District Attorney mandate. Please review your findings and submit your Arrest Warrant to the Court.'
      });
    }

    const suspectProfile = story.suspects.find((s: any) => s.id === suspectId);
    if (!suspectProfile) return res.status(404).json({ error: `Suspect ${suspectId} not found in story` });

    // Decrement countdown if in closing phase
    if (session.caseClosingTriggered) {
      session.remainingClosingQuestions = Math.max(0, session.remainingClosingQuestions - 1);
      if (session.remainingClosingQuestions <= 0) {
        session.interrogationLocked = true;
      }
    }

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

    // Check dynamic unlock rules
    let mandatoryUnlockDialogue: string | undefined;
    const newlyUnlocked: { type: 'location' | 'evidence' | 'character'; id: string; name: string }[] = [];

    const unlockRules = suspectProfile.dynamicUnlocks || [];
    for (const rule of unlockRules) {
      let triggered = false;
      if (rule.triggerEvidenceId && presentedEvidenceId === rule.triggerEvidenceId) {
        triggered = true;
      } else if (typeof rule.triggerStress === 'number' && suspectState.stressLevel >= rule.triggerStress) {
        triggered = true;
      }

      if (triggered) {
        if (rule.type === 'location' && !session.unlockedLocations.includes(rule.targetId)) {
          session.unlockedLocations.push(rule.targetId);
          const loc = story.locations.find((l: any) => l.id === rule.targetId);
          newlyUnlocked.push({ type: 'location', id: rule.targetId, name: loc?.title || rule.targetId });
          if (rule.revealDialogue) mandatoryUnlockDialogue = rule.revealDialogue;
        } else if (rule.type === 'evidence' && !session.unlockedEvidence.includes(rule.targetId)) {
          session.unlockedEvidence.push(rule.targetId);
          const ev = story.evidence.find((e: any) => e.id === rule.targetId);
          newlyUnlocked.push({ type: 'evidence', id: rule.targetId, name: ev?.title || rule.targetId });
          if (rule.revealDialogue) mandatoryUnlockDialogue = rule.revealDialogue;
        } else if (rule.type === 'character' && !session.unlockedSuspects.includes(rule.targetId)) {
          session.unlockedSuspects.push(rule.targetId);
          const susp = story.suspects.find((s: any) => s.id === rule.targetId);
          newlyUnlocked.push({ type: 'character', id: rule.targetId, name: susp?.name || rule.targetId });
          if (rule.revealDialogue) mandatoryUnlockDialogue = rule.revealDialogue;
        }
      }
    }

    // Collect revealed facts across ALL suspects for cross-referencing contradictions
    const allRevealedFacts: string[] = [];
    session.suspects.forEach((state) => {
      if (state.revealedFacts && state.revealedFacts.length > 0) {
        allRevealedFacts.push(...state.revealedFacts);
      }
    });

    const userContent = presentedEvidence
      ? `[Presents Evidence: ${presentedEvidence.title}] ${message}`
      : message;

    // Save user's message to chat history
    suspectState.chatHistory.push({
      role: 'user',
      content: userContent,
      timestamp: new Date(),
      attachedEvidence: presentedEvidenceId || null
    });

    // Invoke AI Interrogation
    const aiResponse = await GroqService.chatWithSuspect(
      suspectProfile,
      suspectState,
      message,
      presentedEvidence,
      allRevealedFacts,
      mandatoryUnlockDialogue
    );

    // Apply updates
    suspectState.trustScore = Math.max(0, Math.min(100, suspectState.trustScore + (aiResponse.trust_delta || 0)));
    suspectState.stressLevel = Math.max(0, Math.min(100, suspectState.stressLevel + (aiResponse.stress_delta || 0)));
    suspectState.mood = aiResponse.mood || (suspectState.stressLevel >= 80 ? 'broken_down' : suspectState.stressLevel >= 50 ? 'nervous' : suspectState.trustScore < 30 ? 'defensive' : 'composed');

    if (aiResponse.new_revealed_fact && !suspectState.revealedFacts.includes(aiResponse.new_revealed_fact)) {
      suspectState.revealedFacts.push(aiResponse.new_revealed_fact);
    }

    // Second-pass check: if new stress level just triggered any unlock rule
    for (const rule of unlockRules) {
      if (typeof rule.triggerStress === 'number' && suspectState.stressLevel >= rule.triggerStress) {
        if (rule.type === 'location' && !session.unlockedLocations.includes(rule.targetId)) {
          session.unlockedLocations.push(rule.targetId);
          const loc = story.locations.find((l: any) => l.id === rule.targetId);
          newlyUnlocked.push({ type: 'location', id: rule.targetId, name: loc?.title || rule.targetId });
        } else if (rule.type === 'evidence' && !session.unlockedEvidence.includes(rule.targetId)) {
          session.unlockedEvidence.push(rule.targetId);
          const ev = story.evidence.find((e: any) => e.id === rule.targetId);
          newlyUnlocked.push({ type: 'evidence', id: rule.targetId, name: ev?.title || rule.targetId });
        } else if (rule.type === 'character' && !session.unlockedSuspects.includes(rule.targetId)) {
          session.unlockedSuspects.push(rule.targetId);
          const susp = story.suspects.find((s: any) => s.id === rule.targetId);
          newlyUnlocked.push({ type: 'character', id: rule.targetId, name: susp?.name || rule.targetId });
        }
      }
    }

    // Save AI response to chat history
    suspectState.chatHistory.push({
      role: 'assistant',
      content: aiResponse.dialogue,
      timestamp: new Date()
    });

    session.suspects.set(suspectId, suspectState);
    session.markModified('suspects');

    // Check if case closing countdown triggers
    checkAndTriggerClosing(session, story);

    await session.save();

    res.status(200).json({
      dialogue: aiResponse.dialogue,
      trustScore: suspectState.trustScore,
      stressLevel: suspectState.stressLevel,
      mood: suspectState.mood,
      revealedFacts: suspectState.revealedFacts,
      newRevealedFact: aiResponse.new_revealed_fact,
      brokeDown: aiResponse.broke_down || suspectState.stressLevel >= 80,
      newlyUnlocked,
      unlockedLocations: session.unlockedLocations,
      unlockedEvidence: session.unlockedEvidence,
      unlockedSuspects: session.unlockedSuspects,
      caseClosingTriggered: session.caseClosingTriggered,
      remainingClosingQuestions: session.remainingClosingQuestions,
      interrogationLocked: session.interrogationLocked
    });
  } catch (error: any) {
    console.error('chatSuspect error:', error);
    res.status(500).json({ error: error.message || 'Failed to interrogate suspect' });
  }
};

export const canvassLocation = async (req: Request, res: Response) => {
  try {
    const { sessionId, locationId } = req.body;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    if (!session.canvassedLocations) session.canvassedLocations = [];

    const location = (story.locations || []).find((l: any) => l.id === locationId);
    if (!location) return res.status(404).json({ error: 'Location not found' });

    if (!session.canvassedLocations.includes(locationId)) {
      session.canvassedLocations.push(locationId);
    }

    const newlyFoundEvidence: any[] = [];
    const hiddenIds = location.hiddenEvidenceIds || [];
    for (const hid of hiddenIds) {
      if (!session.unlockedEvidence.includes(hid)) {
        session.unlockedEvidence.push(hid);
        const ev = (story.evidence || []).find((e: any) => e.id === hid);
        if (ev) newlyFoundEvidence.push(ev);
      }
    }

    for (const ev of story.evidence || []) {
      if (ev.locationId === locationId && !session.unlockedEvidence.includes(ev.id)) {
        session.unlockedEvidence.push(ev.id);
        if (!newlyFoundEvidence.some((e: any) => e.id === ev.id)) {
          newlyFoundEvidence.push(ev);
        }
      }
    }

    checkAndTriggerClosing(session, story);

    await session.save();

    res.status(200).json({
      location,
      canvassReport: location.canvassReport || `CSI forensic canvass of ${location.title} completed.`,
      canvassedLocations: session.canvassedLocations,
      unlockedEvidence: session.unlockedEvidence,
      newlyFoundEvidence,
      caseClosingTriggered: session.caseClosingTriggered,
      remainingClosingQuestions: session.remainingClosingQuestions
    });
  } catch (error: any) {
    console.error('canvassLocation error:', error);
    res.status(500).json({ error: error.message || 'Failed to canvass location' });
  }
};

export const chatOfficer = async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    if (!session.unlockedSuspects) session.unlockedSuspects = (story.suspects || []).slice(0, 2).map((s: any) => s.id);
    if (!session.canvassedLocations) session.canvassedLocations = [];

    const caseContext = {
      caseTitle: story.title,
      victimName: story.victimProfile?.name || 'the victim',
      totalEvidence: (story.evidence || []).length,
      unlockedEvidence: session.unlockedEvidence.length,
      totalLocations: (story.locations || []).length,
      canvassedLocations: session.canvassedLocations.length,
      totalSuspects: (story.suspects || []).length,
      unlockedSuspects: session.unlockedSuspects.length,
      discoveredClues: (session.recordedClues || []).map((c: any) => c.statement),
      groundTruthSummary: story.groundTruth?.timelineSummary || ''
    };

    session.officerChatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    const officerDialogue = await GroqService.chatWithOfficerAdvisor(
      message,
      caseContext,
      session.officerChatHistory
    );

    session.officerChatHistory.push({
      role: 'assistant',
      content: officerDialogue,
      timestamp: new Date()
    });

    await session.save();

    res.status(200).json({
      dialogue: officerDialogue,
      officerChatHistory: session.officerChatHistory
    });
  } catch (error: any) {
    console.error('chatOfficer error:', error);
    res.status(500).json({ error: error.message || 'Failed to consult Officer Davis' });
  }
};

export const submitDeduction = async (req: Request, res: Response) => {
  const { sessionId, deduction, message } = req.body;
  req.body.message = deduction || message;
  return chatOfficer(req, res);
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
    const stories = await Story.find().select('title caseNumber leadDetective status isDefault createdAt victimProfile briefing suspects locations evidence groundTruth');
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
    const { promptTheme, archetype } = req.body;
    const generated = await GroqService.generateCompleteStory(promptTheme, archetype);
    const story = new Story(generated);
    await story.save();
    res.status(201).json({ story });
  } catch (error: any) {
    console.error('generateAiStory error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI story' });
  }
};