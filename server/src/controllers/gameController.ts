import { Request, Response } from 'express';
import GameSession from '../models/GameSession.js';
import Story from '../models/StoryData.js';
import User, { calculateDetectiveRank } from '../models/User.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { DEFAULT_STORY } from '../data/defaultStory.js';
import {
  OPERA_STORY,
  ARCTIC_STORY,
  JAZZ_STORY,
  HARBOR_STORY,
  MANOR_STORY,
  MIDNIGHT_LOUNGE_STORY,
  NEON_STORY
} from '../data/seedStories.js';
import { LLMService } from '../services/llmService.js';
import { IStory, ISuspectRuntimeState } from '../types/index.js';

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
    defaultStory.title = DEFAULT_STORY.title;
    defaultStory.caseNumber = DEFAULT_STORY.caseNumber;
    defaultStory.leadDetective = DEFAULT_STORY.leadDetective;
    defaultStory.status = DEFAULT_STORY.status;
    defaultStory.archetype = (DEFAULT_STORY.archetype || DEFAULT_STORY.groundTruth?.archetype) as any;
    defaultStory.trope = DEFAULT_STORY.trope || '';
    defaultStory.isDefault = true;
    defaultStory.locations = DEFAULT_STORY.locations as any;
    defaultStory.evidence = DEFAULT_STORY.evidence as any;
    defaultStory.suspects = DEFAULT_STORY.suspects as any;
    defaultStory.groundTruth = DEFAULT_STORY.groundTruth as any;
    defaultStory.briefing = DEFAULT_STORY.briefing as any;
    defaultStory.objectives = DEFAULT_STORY.objectives as any;
    defaultStory.victimProfile = DEFAULT_STORY.victimProfile as any;
    await defaultStory.save();
  }

  // 2. Ensure all other archetypal stories (including Neon Vein & Midnight Lounge) are seeded and updated
  const ALL_SEED_STORIES = [
    OPERA_STORY,
    ARCTIC_STORY,
    JAZZ_STORY,
    HARBOR_STORY,
    MANOR_STORY,
    MIDNIGHT_LOUNGE_STORY,
    NEON_STORY
  ];

  for (const seed of ALL_SEED_STORIES) {
    let doc = await Story.findOne({ caseNumber: seed.caseNumber });
    if (!doc) {
      doc = new Story(seed);
      await doc.save();
      console.log(`Seeded story: ${seed.title}`);
    } else {
      doc.title = seed.title;
      doc.caseNumber = seed.caseNumber;
      doc.leadDetective = seed.leadDetective;
      doc.status = seed.status;
      doc.archetype = (seed.archetype || seed.groundTruth?.archetype) as any;
      doc.trope = seed.trope || '';
      doc.isDefault = seed.isDefault || false;
      doc.locations = seed.locations as any;
      doc.evidence = seed.evidence as any;
      doc.suspects = seed.suspects as any;
      doc.groundTruth = seed.groundTruth as any;
      doc.briefing = seed.briefing as any;
      doc.objectives = seed.objectives as any;
      doc.victimProfile = seed.victimProfile as any;
      await doc.save();
    }
  }

  // Remove legacy stages field from any existing documents in MongoDB
  await Story.collection.updateMany({}, { $unset: { stages: "" } });

  return defaultStory;
}

export const startNewGame = async (req: AuthRequest, res: Response) => {
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

    const leadDetectiveName = req.user ? `Detective ${req.user.username}` : 'Guest Detective';

    // Determine initial unlocks for dynamic lead-web
    const initialEvidence = (story.evidence || [])
      .filter((e: any) => e.isInitiallyUnlocked !== false)
      .map((e: any) => e.id);
    if (initialEvidence.length === 0 && story.evidence?.[0]) {
      initialEvidence.push(story.evidence[0].id);
    }

    const initialLocations = (story.locations || [])
      .filter((l: any) => l.isInitiallyUnlocked !== false)
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
      userId: req.user ? req.user._id : undefined,
      isGuest: !req.user,
      leadDetectiveName,
      storyId: story._id,
      unlockedEvidence: initialEvidence,
      unlockedLocations: initialLocations,
      canvassedLocations: [],
      unlockedSuspects: initialSuspects,
      caseClosingTriggered: false,
      remainingClosingQuestions: 12,
      interrogationLocked: false,
      closingNotificationSent: false,
      evidencePresentedCount: 0,
      warrantAttemptsCount: 0,
      suspects: suspectsMap,
      officerChatHistory: [
        {
          role: 'assistant',
          content: `Welcome to the precinct, ${leadDetectiveName}. We've got a fresh homicide: ${story.victimProfile.name}, found dead in ${story.locations[0]?.title || 'the crime scene'}. Canvas the crime scene and interrogate our prime suspects. When every lead is uncovered, I'll alert you to prepare the final indictment.`,
          timestamp: new Date()
        }
      ],
      notes: '',
      recordedClues: [],
      groundTruth: story.groundTruth,
      status: 'active'
    });

    await session.save();

    const storyObj = story.toObject ? story.toObject() : { ...story };
    storyObj.leadDetective = leadDetectiveName;

    res.status(200).json({
      sessionId: session._id,
      session,
      story: storyObj
    });
  } catch (error: any) {
    console.error('startNewGame error:', error);
    res.status(500).json({ error: error.message || 'Failed to start new game' });
  }
};

export const getSessionState = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let story = await Story.findById(session.storyId);
    if (!story) {
      story = await seedDefaultStories();
    }

    let leadDetectiveName = session.leadDetectiveName || 'Guest Detective';
    if (req.user) {
      leadDetectiveName = `Detective ${req.user.username}`;
      if (session.isGuest || !session.userId) {
        session.userId = req.user._id;
        session.isGuest = false;
        session.leadDetectiveName = leadDetectiveName;
        await session.save();
      }
    }

    const storyObj = story ? (story.toObject ? story.toObject() : { ...story }) : null;
    if (storyObj) {
      storyObj.leadDetective = leadDetectiveName;
    }

    res.status(200).json({
      sessionId: session._id,
      session,
      story: storyObj
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
      if (rule.triggerEvidenceId && presentedEvidenceId === rule.triggerEvidenceId) {
        if (rule.revealDialogue) mandatoryUnlockDialogue = rule.revealDialogue;
      }
    }

    // Detect incoherent spam, gibberish or repeated questioning
    const cleanMsg = (message || '').trim();
    const isShort = cleanMsg.length < 4 && !presentedEvidenceId;
    const isRepeatedChar = /(.)\1{4,}/.test(cleanMsg);
    const isGibberish = isShort || isRepeatedChar || (/^[bcdfghjklmnpqrstvwxyz]{6,}$/i.test(cleanMsg));

    const lastUserMsg = (suspectState.chatHistory || [])
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content;
    const isRepeatQuestion = Boolean(
      lastUserMsg &&
      lastUserMsg.toLowerCase().replace(/\[presents evidence:.*?\]\s*/i, '').trim() === cleanMsg.toLowerCase() &&
      !presentedEvidenceId
    );
    const isSpamOrGibberish = Boolean(isGibberish || isRepeatQuestion);

    // Calculate dynamic slip-of-the-tongue probability based on personality and stress
    const getSlipProbability = (personality: string, stress: number): number => {
      const isHighStress = stress >= 65;
      switch (personality) {
        case 'cunning': return isHighStress ? 0.02 : 0.005;
        case 'aggressive': return isHighStress ? 0.09 : 0.04;
        case 'nervous': return isHighStress ? 0.14 : 0.075;
        case 'confident': return isHighStress ? 0.04 : 0.015;
        case 'defensive':
        default: return isHighStress ? 0.07 : 0.03;
      }
    };

    let slipOfTongueDetail: string | null = null;
    if (!isSpamOrGibberish && !mandatoryUnlockDialogue) {
      const personality = suspectProfile.personality || 'defensive';
      const slipChance = getSlipProbability(personality, suspectState.stressLevel);
      if (Math.random() < slipChance) {
        const unrevealedSecrets = (suspectProfile.secrets || []).filter(
          (s: string) => !suspectState.revealedFacts.includes(s)
        );
        if (unrevealedSecrets.length > 0) {
          slipOfTongueDetail = unrevealedSecrets[0];
        } else if (suspectProfile.privateKnowledge && !suspectState.revealedFacts.includes(suspectProfile.privateKnowledge)) {
          slipOfTongueDetail = suspectProfile.privateKnowledge;
        }
      }
    }

    // List of other suspects in case for blame shifting
    const otherSuspects = (story.suspects || [])
      .filter((s: any) => s.id !== suspectProfile.id)
      .map((s: any) => ({ id: s.id, name: s.name, role: s.role }));

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

    // Invoke AI Interrogation with personality-driven psychology
    const aiResponse = await LLMService.chatWithSuspect(
      suspectProfile,
      suspectState,
      message,
      presentedEvidence,
      allRevealedFacts,
      mandatoryUnlockDialogue,
      {
        isSpamOrGibberish,
        slipOfTongueDetail,
        otherSuspects
      }
    );

    // Apply updates
    suspectState.trustScore = Math.max(0, Math.min(100, suspectState.trustScore + (aiResponse.trust_delta || 0)));
    suspectState.stressLevel = Math.max(0, Math.min(100, suspectState.stressLevel + (aiResponse.stress_delta || 0)));
    suspectState.mood = aiResponse.mood || (suspectState.stressLevel >= 80 ? 'broken_down' : suspectState.stressLevel >= 50 ? 'nervous' : suspectState.trustScore < 30 ? 'defensive' : 'composed');

    if (aiResponse.new_revealed_fact && !suspectState.revealedFacts.includes(aiResponse.new_revealed_fact)) {
      suspectState.revealedFacts.push(aiResponse.new_revealed_fact);
    }
    if (slipOfTongueDetail && !suspectState.revealedFacts.includes(slipOfTongueDetail)) {
      suspectState.revealedFacts.push(slipOfTongueDetail);
    }

// Suspects do not silently unlock entities into the session. Unlocking is strictly player-directed via Officer Davis probable cause.

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
      newRevealedFact: aiResponse.new_revealed_fact || slipOfTongueDetail,
      brokeDown: suspectState.stressLevel >= 80,
      slippedUp: Boolean(slipOfTongueDetail),
      threwUnderTheBus: aiResponse.threw_under_the_bus || null,
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
    const {
      sessionId,
      message,
      attachedClue,
      attachedClueId,
      referencedEvidenceId,
      referencedLocationId
    } = req.body;

    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    if (!session.unlockedSuspects) session.unlockedSuspects = (story.suspects || []).slice(0, 2).map((s: any) => s.id);
    if (!session.unlockedLocations) session.unlockedLocations = (story.locations || []).slice(0, 1).map((l: any) => l.id);
    if (!session.unlockedEvidence) session.unlockedEvidence = [];
    if (!session.canvassedLocations) session.canvassedLocations = [];

    // Resolve attached clue if only ID was provided
    let activeClue = attachedClue || null;
    if (!activeClue && attachedClueId) {
      activeClue = (session.recordedClues || []).find((c: any) => c.id === attachedClueId) || null;
    }

    // Resolve referenced evidence if unlocked
    let activeEvidence = null;
    if (referencedEvidenceId && session.unlockedEvidence.includes(referencedEvidenceId)) {
      activeEvidence = (story.evidence || []).find((e: any) => e.id === referencedEvidenceId) || null;
    }

    // Resolve referenced location if visited / unlocked
    let activeLocation = null;
    if (referencedLocationId && session.unlockedLocations.includes(referencedLocationId)) {
      activeLocation = (story.locations || []).find((l: any) => l.id === referencedLocationId) || null;
    }

    // Match candidate target among locked entities
    const lockedLocations = (story.locations || []).filter((l: any) => !session.unlockedLocations.includes(l.id));
    const lockedSuspects = (story.suspects || []).filter((s: any) => !session.unlockedSuspects.includes(s.id));
    const lockedEvidence = (story.evidence || []).filter((e: any) => !session.unlockedEvidence.includes(e.id) && e.discoveryType === 'officer_subpoena');

    const combinedSearchText = `${message || ''} ${activeClue?.statement || ''} ${activeEvidence?.title || ''} ${activeLocation?.title || ''}`.toLowerCase();

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const targetMatches = (text: string, titleOrName: string, id: string): boolean => {
      if (!text || !titleOrName) return false;
      const lowerText = text.toLowerCase();
      const lowerTitle = titleOrName.toLowerCase();
      const lowerId = id.toLowerCase();

      // 1. Direct whole-word or phrase match for id or full title
      const idRegex = new RegExp(`\\b${escapeRegExp(lowerId)}\\b`, 'i');
      if (idRegex.test(lowerText) || lowerText.includes(lowerId)) return true;

      const titleRegex = new RegExp(`\\b${escapeRegExp(lowerTitle)}\\b`, 'i');
      if (titleRegex.test(lowerText)) return true;

      // 2. Distinctive single-word boundary matching (ignoring generic common words)
      const titleWords = lowerTitle
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 4 && !['cafe', 'suite', 'lane', 'street', 'drive', 'center', 'park', 'parkade', 'room', 'office', 'with', 'from', 'that', 'this', 'have', 'were', 'rear', 'drain', 'service'].includes(t));

      for (const word of titleWords) {
        const wordRegex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        if (wordRegex.test(lowerText)) return true;
      }

      // 3. Two-word bigram match (e.g., "storm drain", "service alley")
      const rawWords = lowerTitle.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      for (let i = 0; i < rawWords.length - 1; i++) {
        const bigram = `${rawWords[i]} ${rawWords[i + 1]}`;
        if (bigram.length >= 8 && new RegExp(`\\b${escapeRegExp(bigram)}\\b`, 'i').test(lowerText)) {
          return true;
        }
      }

      return false;
    };

    let targetEntity: any = null;
    let targetType: 'location' | 'character' | 'evidence' | null = null;

    // 1. Check locations
    for (const loc of lockedLocations) {
      if (targetMatches(combinedSearchText, loc.title, loc.id)) {
        targetEntity = loc;
        targetType = 'location';
        break;
      }
    }

    // 2. Check suspects
    if (!targetEntity) {
      for (const susp of lockedSuspects) {
        if (targetMatches(combinedSearchText, susp.name, susp.id)) {
          targetEntity = susp;
          targetType = 'character';
          break;
        }
      }
    }

    // 3. Check subpoena evidence
    if (!targetEntity) {
      for (const ev of lockedEvidence) {
        if (targetMatches(combinedSearchText, ev.title, ev.id)) {
          targetEntity = ev;
          targetType = 'evidence';
          break;
        }
      }
    }

    // Evaluate Probable Cause
    let isAuthorized = false;
    let proofDescription = '';
    let rejectionReason = '';
    let newlyUnlocked: { type: 'location' | 'evidence' | 'character'; id: string; name: string } | null = null;

    if (targetEntity && targetType) {
      if (targetType === 'location') {
        if (activeClue && targetMatches(activeClue.statement, targetEntity.title, targetEntity.id)) {
          isAuthorized = true;
          proofDescription = `Suspect statement recorded from ${activeClue.suspectName}`;
        } else if (activeEvidence && targetMatches(`${activeEvidence.title} ${activeEvidence.details} ${activeEvidence.location}`, targetEntity.title, targetEntity.id)) {
          isAuthorized = true;
          proofDescription = `Physical lead from evidence "${activeEvidence.title}"`;
        } else if (targetEntity.leadSource && activeClue && targetEntity.leadSource.sourceId === activeClue.suspectId) {
          isAuthorized = true;
          proofDescription = `Suspect statement recorded from ${activeClue.suspectName}`;
        } else if (targetEntity.leadSource && activeEvidence && targetEntity.leadSource.sourceId === activeEvidence.id) {
          isAuthorized = true;
          proofDescription = `Physical lead from evidence "${activeEvidence.title}"`;
        } else {
          rejectionReason = 'No recorded witness statement from your notebook or verified forensic evidence was attached to support investigating this location.';
        }

        if (isAuthorized) {
          session.unlockedLocations.push(targetEntity.id);
          newlyUnlocked = { type: 'location', id: targetEntity.id, name: targetEntity.title };
        }
      } else if (targetType === 'character') {
        if (activeClue && targetMatches(activeClue.statement, targetEntity.name, targetEntity.id)) {
          isAuthorized = true;
          proofDescription = `Witness statement recorded from ${activeClue.suspectName}`;
        } else if (activeEvidence && targetMatches(`${activeEvidence.title} ${activeEvidence.details}`, targetEntity.name, targetEntity.id)) {
          isAuthorized = true;
          proofDescription = `Official forensic lead from evidence "${activeEvidence.title}"`;
        } else if (activeLocation && targetMatches(`${activeLocation.notes} ${activeLocation.witnesses} ${activeLocation.canvassReport || ''}`, targetEntity.name, targetEntity.id)) {
          isAuthorized = true;
          proofDescription = `Crime scene canvass report from "${activeLocation.title}"`;
        } else if (targetEntity.leadSource && activeClue && targetEntity.leadSource.sourceId === activeClue.suspectId) {
          isAuthorized = true;
          proofDescription = `Witness statement recorded from ${activeClue.suspectName}`;
        } else if (targetEntity.leadSource && activeEvidence && targetEntity.leadSource.sourceId === activeEvidence.id) {
          isAuthorized = true;
          proofDescription = `Official forensic lead from evidence "${activeEvidence.title}"`;
        } else {
          rejectionReason = `No recorded suspect admission or physical evidence naming ${targetEntity.name} was attached.`;
        }

        if (isAuthorized) {
          session.unlockedSuspects.push(targetEntity.id);
          newlyUnlocked = { type: 'character', id: targetEntity.id, name: targetEntity.name };
        }
      } else if (targetType === 'evidence') {
        if (activeClue && (targetMatches(activeClue.statement, targetEntity.title, targetEntity.id) || (targetEntity.subpoenaSource && activeClue.suspectId === targetEntity.subpoenaSource))) {
          isAuthorized = true;
          proofDescription = `Sworn suspect statement from ${activeClue.suspectName}`;
        } else if (activeEvidence && targetMatches(`${activeEvidence.title} ${activeEvidence.details}`, targetEntity.title, targetEntity.id)) {
          isAuthorized = true;
          proofDescription = `Forensic link from "${activeEvidence.title}"`;
        } else {
          rejectionReason = 'Judge requires a sworn witness statement or prior digital audit trail to sign an evidence subpoena.';
        }

        if (isAuthorized) {
          session.unlockedEvidence.push(targetEntity.id);
          newlyUnlocked = { type: 'evidence', id: targetEntity.id, name: targetEntity.title };
        }
      }
    }

    let dispatchContext: any = null;
    if (targetEntity) {
      if (isAuthorized) {
        dispatchContext = {
          status: 'authorized',
          entityType: targetType!,
          entityName: targetEntity.title || targetEntity.name,
          sourceProof: proofDescription
        };
      } else {
        dispatchContext = {
          status: 'rejected',
          entityName: targetEntity.title || targetEntity.name,
          reason: rejectionReason
        };
      }
    }

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

    // Save user message with supporting metadata
    session.officerChatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachedClue: activeClue ? {
        id: activeClue.id,
        suspectId: activeClue.suspectId,
        suspectName: activeClue.suspectName,
        statement: activeClue.statement,
        timestamp: activeClue.timestamp || new Date()
      } : null,
      referencedEvidenceId: activeEvidence ? activeEvidence.id : null,
      referencedLocationId: activeLocation ? activeLocation.id : null
    });

    const officerDialogue = await LLMService.chatWithOfficerAdvisor(
      message,
      caseContext,
      session.officerChatHistory,
      dispatchContext
    );

    // Save assistant response
    session.officerChatHistory.push({
      role: 'assistant',
      content: officerDialogue,
      timestamp: new Date(),
      isApproved: isAuthorized,
      unlockedEntity: newlyUnlocked
    });

    checkAndTriggerClosing(session, story);

    await session.save();

    res.status(200).json({
      dialogue: officerDialogue,
      officerChatHistory: session.officerChatHistory,
      newlyUnlocked,
      unlockedLocations: session.unlockedLocations,
      unlockedEvidence: session.unlockedEvidence,
      unlockedSuspects: session.unlockedSuspects,
      caseClosingTriggered: session.caseClosingTriggered,
      remainingClosingQuestions: session.remainingClosingQuestions
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

export const submitWarrant = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, suspect, motive, weapon, keyContradiction } = req.body;
    const session = await GameSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    session.warrantAttemptsCount = (session.warrantAttemptsCount || 0) + 1;

    const verdict = await LLMService.evaluateWarrant(
      { suspect, motive, weapon, keyContradiction },
      story.groundTruth,
      story.title
    );

    session.status = verdict.outcome === 'guilty' ? 'solved' : 'active';
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

    let userRank: string | undefined;
    let newlyUnlockedBadges: string[] = [];
    let userStats: any = undefined;

    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.stats.totalWarrantsFiled = (user.stats.totalWarrantsFiled || 0) + 1;
        if (verdict.outcome === 'guilty') {
          user.stats.totalConvictions = (user.stats.totalConvictions || 0) + 1;
          const storyIdStr = story._id.toString();
          if (!user.casesSolved.includes(storyIdStr)) {
            user.casesSolved.push(storyIdStr);
          }
          user.rank = calculateDetectiveRank(user.casesSolved.length);

          const existingBadgeIds = new Set(user.badges.map((b: any) => b.id));

          if (!existingBadgeIds.has('smoking_gun') && (session.unlockedEvidence || []).length >= 3) {
            user.badges.push({
              id: 'smoking_gun',
              title: 'Smoking Gun',
              icon: '🔫',
              description: 'Cracked the case with conclusive physical evidence.',
              unlockedAt: new Date(),
              caseTitle: story.title
            });
            newlyUnlockedBadges.push('Smoking Gun');
          }

          if (!existingBadgeIds.has('forensic_eagle') && (session.canvassedLocations || []).length >= (story.locations || []).length) {
            user.badges.push({
              id: 'forensic_eagle',
              title: 'Forensic Eagle',
              icon: '🦅',
              description: 'Scoured every single crime scene location without missing a clue.',
              unlockedAt: new Date(),
              caseTitle: story.title
            });
            newlyUnlockedBadges.push('Forensic Eagle');
          }

          if (!existingBadgeIds.has('flawless_juror') && verdict.score >= 90) {
            user.badges.push({
              id: 'flawless_juror',
              title: 'Flawless Juror',
              icon: '⚖️',
              description: 'Secured an indictment score of 90 or above before the Grand Jury.',
              unlockedAt: new Date(),
              caseTitle: story.title
            });
            newlyUnlockedBadges.push('Flawless Juror');
          }

          if (!existingBadgeIds.has('beat_the_clock') && session.caseClosingTriggered && (session.remainingClosingQuestions || 0) > 0) {
            user.badges.push({
              id: 'beat_the_clock',
              title: 'Beat the Clock',
              icon: '⏳',
              description: 'Secured the indictment before the 12-hour interrogation limit expired.',
              unlockedAt: new Date(),
              caseTitle: story.title
            });
            newlyUnlockedBadges.push('Beat the Clock');
          }

          if (!existingBadgeIds.has('patsy_shield') && session.warrantAttemptsCount === 1) {
            user.badges.push({
              id: 'patsy_shield',
              title: 'Patsy Shield',
              icon: '🛡️',
              description: 'Saw through the red herrings and indicted the real culprit on first attempt.',
              unlockedAt: new Date(),
              caseTitle: story.title
            });
            newlyUnlockedBadges.push('Patsy Shield');
          }

          if (!existingBadgeIds.has('mastermind_catcher') && user.casesSolved.length >= 3) {
            user.badges.push({
              id: 'mastermind_catcher',
              title: 'Mastermind Catcher',
              icon: '🎖️',
              description: 'Brought 3 or more criminal masterminds to justice.',
              unlockedAt: new Date(),
              caseTitle: story.title
            });
            newlyUnlockedBadges.push('Mastermind Catcher');
          }
        }

        await user.save();
        userRank = user.rank;
        userStats = user.stats;
      }
    }

    res.status(200).json({
      outcome: verdict.outcome,
      score: verdict.score,
      verdictTitle: verdict.verdictTitle,
      epilogue: verdict.epilogue,
      userRank,
      newBadges: newlyUnlockedBadges,
      userStats
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

export const listStories = async (req: AuthRequest, res: Response) => {
  try {
    await seedDefaultStories();
    const storiesDocs = await Story.find();
    const leadDetectiveName = req.user ? `Detective ${req.user.username}` : 'Guest Detective';
    const stories = storiesDocs.map(doc => {
      const obj = doc.toObject();
      obj.leadDetective = leadDetectiveName;
      return obj;
    });
    res.status(200).json({ stories });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list stories' });
  }
};

export const getStoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    const leadDetectiveName = req.user ? `Detective ${req.user.username}` : 'Guest Detective';
    const storyObj = story.toObject();
    storyObj.leadDetective = leadDetectiveName;
    res.status(200).json({ story: storyObj });
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
    const generated = await LLMService.generateCompleteStory(promptTheme, archetype);
    const story = new Story(generated);
    await story.save();
    res.status(201).json({ story });
  } catch (error: any) {
    console.error('generateAiStory error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI story' });
  }
};