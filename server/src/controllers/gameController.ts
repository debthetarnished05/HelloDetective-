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
  NEON_STORY,
  OBSIDIAN_CONSPIRACY_STORY,
  ALCHEMISTS_PACT_STORY
} from '../data/seedStories.js';
import { LLMService } from '../services/llmService.js';
import { scoreWarrant } from '../services/warrantScoring.js';
import { IStory, ISuspectRuntimeState } from '../types/index.js';
import { createGuestSessionToken, hashGuestSessionToken, matchesGuestSessionToken } from '../utils/guestSession.js';
import { randomUUID } from 'node:crypto';

function sameId(left: unknown, right: unknown): boolean {
  return String(left ?? '') === String(right ?? '');
}

function normalizedText(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function refersTo(text: string, candidates: unknown[]): boolean {
  const normalized = normalizedText(text);
  return candidates.some(candidate => {
    const phrase = normalizedText(candidate);
    return phrase.length > 2 && (` ${normalized} `).includes(` ${phrase} `);
  });
}

function supportingAttachmentText(attachments: {
  clue?: any;
  evidence?: any;
  location?: any;
}): string {
  return [
    attachments.clue?.statement,
    attachments.clue?.suspectName,
    attachments.evidence?.id,
    attachments.evidence?.title,
    attachments.evidence?.subtitle,
    attachments.evidence?.details,
    attachments.evidence?.location,
    attachments.location?.id,
    attachments.location?.title,
    attachments.location?.subtitle,
    attachments.location?.notes,
    attachments.location?.witnesses,
    attachments.location?.canvassReport
  ].filter(Boolean).join(' ');
}

function ownsSession(req: AuthRequest, res: Response, session: any): boolean {
  if (!session.userId) {
    const guestToken = req.get('X-Guest-Session-Token') || '';
    if (req.user || !matchesGuestSessionToken(guestToken, session.guestAccessTokenHash)) {
      res.status(404).json({ error: 'Session not found' });
      return false;
    }
    return true;
  }

  if (!req.user || !sameId(session.userId, req.user._id)) {
    res.status(404).json({ error: 'Session not found' });
    return false;
  }
  return true;
}

function toPlayerSession(session: any): Record<string, unknown> {
  const unlockedSuspects = session.unlockedSuspects || [];
  const states: Record<string, unknown> = {};
  const storedStates = session.suspects as Map<string, any> | Record<string, any> | undefined;
  const suspectStates: Array<[string, any]> = storedStates instanceof Map
    ? Array.from(storedStates.entries())
    : Object.entries(storedStates || {});

  for (const [id, state] of suspectStates) {
    if (unlockedSuspects.includes(id)) states[id] = state;
  }

  return {
    _id: session._id,
    storyId: session.storyId,
    isGuest: session.isGuest,
    leadDetectiveName: session.leadDetectiveName,
    currentStage: session.currentStage,
    unlockedEvidence: session.unlockedEvidence || [],
    unlockedLocations: session.unlockedLocations || [],
    canvassedLocations: session.canvassedLocations || [],
    unlockedSuspects,
    caseClosingTriggered: session.caseClosingTriggered,
    remainingClosingQuestions: session.remainingClosingQuestions,
    interrogationLocked: session.interrogationLocked,
    closingNotificationSent: session.closingNotificationSent,
    suspects: states,
    officerChatHistory: session.officerChatHistory || [],
    notes: session.notes || '',
    recordedClues: session.recordedClues || [],
    status: session.status,
    verdict: session.status === 'solved' ? session.verdict : undefined
  };
}

function toPlayerStory(story: any, session?: any, includeSolution = false): any {
  const result = story.toObject ? story.toObject() : { ...story };
  if (!includeSolution) {
    delete result.groundTruth;
    delete result.archetype;
    delete result.trope;
    delete result.stages;
  }

  if (!session) {
    result.locations = [];
    result.evidence = [];
    result.suspects = [];
    return result;
  }

  const unlockedEvidence = new Set(session.unlockedEvidence || []);
  const unlockedLocations = new Set(session.unlockedLocations || []);
  const canvassedLocations = new Set(session.canvassedLocations || []);
  const unlockedSuspects = new Set(session.unlockedSuspects || []);

  result.locations = (result.locations || [])
    .filter((location: any) => unlockedLocations.has(location.id))
    .map((location: any) => {
      if (!canvassedLocations.has(location.id)) {
        delete location.canvassReport;
        delete location.hiddenEvidenceIds;
      }
      return location;
    });
  result.evidence = (result.evidence || []).filter((evidence: any) => unlockedEvidence.has(evidence.id));
  result.evidence = result.evidence.map((evidence: any) => {
    delete evidence.isMurderWeapon;
    delete evidence.allowSubpoena;
    delete evidence.subpoenaSource;
    delete evidence.locationId;
    delete evidence.discoveryType;
    return evidence;
  });
  result.suspects = (result.suspects || []).filter((suspect: any) => unlockedSuspects.has(suspect.id)).map((suspect: any) => {
      delete suspect.privateKnowledge;
      delete suspect.secrets;
      delete suspect.evidenceReactions;
      delete suspect.dynamicUnlocks;
      delete suspect.isPrimeSuspect;
      delete suspect.category;
      delete suspect.motive;
      return suspect;
    });

  if (!includeSolution) delete result.groundTruth;
  return result;
}

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
    NEON_STORY,
    OBSIDIAN_CONSPIRACY_STORY,
    ALCHEMISTS_PACT_STORY
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

    // If an authenticated detective already has an active session on this case, resume it instead of wiping progress
    if (req.user && !req.body.forceNew) {
      const existingSession = await GameSession.findOne({
        userId: req.user._id,
        storyId: story._id,
        status: 'active'
      }).sort({ updatedAt: -1 });

      if (existingSession) {
        const storyObj = story.toObject ? story.toObject() : { ...story };
        storyObj.leadDetective = leadDetectiveName;
        return res.status(200).json({
          sessionId: existingSession._id,
          session: toPlayerSession(existingSession),
          story: toPlayerStory(storyObj, existingSession)
        });
      }
    }

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
        stressLevel: suspect.initialStress ?? 5,
        mood: 'composed',
        revealedFacts: [],
        chatHistory: []
      });
    }

    const guestAccessToken = req.user ? undefined : createGuestSessionToken();
    const session = new GameSession({
      userId: req.user ? req.user._id : undefined,
      isGuest: !req.user,
      guestAccessTokenHash: guestAccessToken ? hashGuestSessionToken(guestAccessToken) : undefined,
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
      guestAccessToken,
      session: toPlayerSession(session),
      story: toPlayerStory(storyObj, session)
    });
  } catch (error: any) {
    console.error('startNewGame error:', error);
    res.status(500).json({ error: error.message || 'Failed to start new game' });
  }
};

export const getSessionState = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findById(sessionId).select('+guestAccessTokenHash');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!ownsSession(req, res, session)) return;

    let story = await Story.findById(session.storyId);
    if (!story) {
      story = await seedDefaultStories();
    }

    let leadDetectiveName = session.leadDetectiveName || 'Guest Detective';
    if (req.user) leadDetectiveName = `Detective ${req.user.username}`;

    // Auto-heal any suspects or locations that Officer Davis confirmed in previous chat history but failed to add to session arrays
    let sessionDirty = false;
    if (story && session.officerChatHistory && session.officerChatHistory.length > 0) {
      for (const suspect of story.suspects || []) {
        if (!session.unlockedSuspects.includes(suspect.id)) {
          const nameRegex = new RegExp(`\\b${suspect.name.replace(/['"]+/g, '')}\\b`, 'i');
          const firstName = suspect.name.split(' ')[0];
          const firstNameRegex = firstName.length > 2 ? new RegExp(`\\b${firstName}\\b`, 'i') : null;

          const confirmedInHistory = session.officerChatHistory.some((m: any) =>
            m.role === 'assistant' && (
              (m.unlockedEntity && m.unlockedEntity.id === suspect.id) ||
              ((nameRegex.test(m.content) || (firstNameRegex && firstNameRegex.test(m.content))) &&
                /\b(dispatched (patrol|a squad|units)|waiting in (the )?(interrogation|interview) room|bringing them in)\b/i.test(m.content) &&
                !/\b(not|cannot|can't|won't|denied|without (probable cause|a warrant)|need (a warrant|proof))\b/i.test(m.content)
              )
            )
          );

          if (confirmedInHistory) {
            session.unlockedSuspects.push(suspect.id);
            sessionDirty = true;
          }
        }
      }

      const techSuspect = (story.suspects || []).find((s: any) => /cto|chief technology officer|tech/i.test(s.role || ''));
      for (const m of session.officerChatHistory) {
        if (m.content) {
          if (techSuspect) {
            if (/\bthe CFO\b/i.test(m.content)) {
              m.content = m.content.replace(/\bthe CFO\b/gi, `${techSuspect.name}, the ${techSuspect.role}`);
              m.content = m.content.replace(/\bCFO\b/g, 'CTO');
              sessionDirty = true;
            }
            if (/julian thorne/i.test(m.content)) {
              m.content = m.content.replace(/julian thorne/gi, techSuspect.name);
              sessionDirty = true;
            }
          } else {
            if (/julian thorne/i.test(m.content)) {
              m.content = m.content.replace(/julian thorne/gi, story.victimProfile?.name || 'the suspect');
              sessionDirty = true;
            }
          }
          if (/\b(?:interrogation\s+)?room\s+\d+\b/i.test(m.content)) {
            m.content = m.content.replace(/\b(?:interrogation\s+)?room\s+\d+\b/gi, 'the interrogation room');
            sessionDirty = true;
          }
        }
      }
    }
    if (sessionDirty) {
      await session.save();
    }

    const storyObj = story ? toPlayerStory(story, session) : null;
    if (storyObj) storyObj.leadDetective = leadDetectiveName;

    res.status(200).json({
      sessionId: session._id,
      session: toPlayerSession(session),
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

  const allLocationsCanvassed = totalLocations > 0 && canvassedCount >= totalLocations;
  const allEvidenceRecovered = totalEvidence > 0 && evidenceCount >= totalEvidence;

  if ((allLocationsCanvassed || allEvidenceRecovered) && !session.caseClosingTriggered) {
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

export const chatSuspect = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, suspectId, message, presentedEvidenceId } = req.body;
    if (typeof sessionId !== 'string' || typeof suspectId !== 'string' || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A session, available suspect, and non-empty question are required.' });
    }
    if (message.length > 2000) return res.status(413).json({ error: 'Interrogation questions are limited to 2,000 characters.' });
    if (presentedEvidenceId != null && typeof presentedEvidenceId !== 'string') {
      return res.status(400).json({ error: 'Invalid evidence reference.' });
    }

    const session = await GameSession.findById(sessionId).select('+guestAccessTokenHash');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!ownsSession(req, res, session)) return;

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
    if (!session.unlockedSuspects.includes(suspectId)) {
      return res.status(403).json({ error: 'That person has not been cleared for interrogation.' });
    }

    // Ensure suspect runtime state exists
    let suspectState = session.suspects.get(suspectId);
    if (!suspectState) {
      suspectState = {
        suspectId,
        trustScore: suspectProfile.initialTrust ?? 50,
        stressLevel: suspectProfile.initialStress ?? 5,
        mood: 'composed',
        revealedFacts: [],
        chatHistory: []
      };
    }

    // Find presented evidence object if any
    let presentedEvidence = null;
    if (presentedEvidenceId) {
      if (!session.unlockedEvidence.includes(presentedEvidenceId)) {
        return res.status(403).json({ error: 'That evidence has not been entered into the case locker.' });
      }
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
    // Exempt legitimate short dialogue words: "no", "yes", "why", "who", "how", "lie"
    const isShort = cleanMsg.length < 4 && !/^(no|yes|why|who|how|lie)\b/i.test(cleanMsg) && !presentedEvidenceId;
    const isRepeatedChar = /(.)\1{4,}/.test(cleanMsg);
    const isGibberish = isShort || isRepeatedChar || (/^[bcdfghjklmnpqrstvwxyz]{6,}$/i.test(cleanMsg));

    const lastUserHistoryItem = (suspectState.chatHistory || [])
      .filter(m => m.role === 'user')
      .slice(-1)[0];
    const isRepeatQuestion = Boolean(
      lastUserHistoryItem &&
      !lastUserHistoryItem.attachedEvidence &&
      !presentedEvidenceId &&
      lastUserHistoryItem.content.toLowerCase().trim() === cleanMsg.toLowerCase()
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
        // Robust secret filtering: check if exact secret or substantial keyword overlap already revealed
        const unrevealedSecrets = (suspectProfile.secrets || []).filter((s: string) => {
          const sNorm = s.toLowerCase().replace(/[^a-z0-9]/g, ' ');
          const isCovered = (suspectState.revealedFacts || []).some(rf => {
            if (rf === s) return true;
            const rfNorm = rf.toLowerCase().replace(/[^a-z0-9]/g, ' ');
            const keyWords = sNorm.split(/\s+/).filter(w => w.length > 4);
            const matches = keyWords.filter(w => rfNorm.includes(w));
            return keyWords.length > 0 && matches.length >= Math.min(2, keyWords.length);
          });
          return !isCovered;
        });

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

    // Collect revealed facts across OTHER suspects for cross-referencing contradictions (exclude current suspect!)
    const allRevealedFacts: string[] = [];
    session.suspects.forEach((state, id) => {
      if (id !== suspectId && state.revealedFacts && state.revealedFacts.length > 0) {
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

    // Track all physical evidence items presented to this suspect across interrogation
    const presentedEvidenceIds = new Set<string>();
    if (presentedEvidenceId) presentedEvidenceIds.add(presentedEvidenceId);
    (suspectState.chatHistory || []).forEach((msg: any) => {
      if (msg.attachedEvidence) presentedEvidenceIds.add(msg.attachedEvidence);
    });
    const presentedEvidenceTitles = (story.evidence || [])
      .filter((e: any) => presentedEvidenceIds.has(e.id))
      .map((e: any) => e.title);

    const murderWeaponItem = (story.evidence || []).find((e: any) => e.isMurderWeapon);
    const murderWeaponTitle = murderWeaponItem?.title || undefined;

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
        otherSuspects,
        presentedEvidenceTitles,
        murderWeaponTitle
      }
    );

    // Decrement countdown if in closing phase only on SUCCESSFUL interrogation turn
    if (session.caseClosingTriggered) {
      session.remainingClosingQuestions = Math.max(0, (session.remainingClosingQuestions ?? 12) - 1);
      if (session.remainingClosingQuestions <= 0) {
        session.interrogationLocked = true;
      }
    }

    // Apply clamped updates
    const clampedTrustDelta = Math.max(-20, Math.min(20, aiResponse.trust_delta || 0));
    const clampedStressDelta = Math.max(-15, Math.min(35, aiResponse.stress_delta || 0));
    suspectState.trustScore = Math.max(0, Math.min(100, suspectState.trustScore + clampedTrustDelta));
    suspectState.stressLevel = Math.max(0, Math.min(100, suspectState.stressLevel + clampedStressDelta));

    // Mood synchronization: breakdown threshold (>= 90) strictly overrides "composed"
    const breakdownPoint = suspectProfile.breakdownThreshold || 90;
    suspectState.mood = suspectState.stressLevel >= breakdownPoint
      ? 'broken_down'
      : (aiResponse.mood && aiResponse.mood !== 'composed' && suspectState.stressLevel >= 50
        ? aiResponse.mood
        : suspectState.stressLevel >= 50
        ? 'nervous'
        : suspectState.trustScore < 30
        ? 'defensive'
        : 'composed');

    if (aiResponse.new_revealed_fact && !suspectState.revealedFacts.includes(aiResponse.new_revealed_fact)) {
      suspectState.revealedFacts.push(aiResponse.new_revealed_fact);
      // If the dynamic admission matches any canonical secret, also mark canonical secret
      const normFact = aiResponse.new_revealed_fact.toLowerCase();
      for (const sec of suspectProfile.secrets || []) {
        const secKeywords = sec.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
        const matches = secKeywords.filter((w: string) => normFact.includes(w));
        if (secKeywords.length > 0 && matches.length >= Math.min(2, secKeywords.length)) {
          if (!suspectState.revealedFacts.includes(sec)) {
            suspectState.revealedFacts.push(sec);
          }
        }
      }
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

    // Increment user interrogations stat if authenticated
    if (session.userId) {
      User.findByIdAndUpdate(session.userId, { $inc: { 'stats.interrogationsCount': 1 } }).catch(() => {});
    }

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

export const canvassLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, locationId } = req.body;
    if (typeof sessionId !== 'string' || typeof locationId !== 'string') {
      return res.status(400).json({ error: 'A session and location are required.' });
    }
    const session = await GameSession.findById(sessionId).select('+guestAccessTokenHash');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!ownsSession(req, res, session)) return;

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    if (!session.canvassedLocations) session.canvassedLocations = [];

    const location = (story.locations || []).find((l: any) => l.id === locationId);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    if (!session.unlockedLocations.includes(locationId)) {
      return res.status(403).json({ error: 'That location has not been cleared for canvassing.' });
    }

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

    const playerStory = toPlayerStory(story, session);
    const newlyFoundIds = new Set(newlyFoundEvidence.map(evidence => evidence.id));
    const safeNewEvidence = playerStory.evidence.filter((evidence: any) => newlyFoundIds.has(evidence.id));
    const playerLocation = playerStory.locations.find((item: any) => item.id === locationId);

    res.status(200).json({
      location: playerLocation,
      canvassReport: location.canvassReport || `CSI forensic canvass of ${location.title} completed.`,
      story: playerStory,
      canvassedLocations: session.canvassedLocations,
      unlockedEvidence: session.unlockedEvidence,
      newlyFoundEvidence: safeNewEvidence,
      caseClosingTriggered: session.caseClosingTriggered,
      remainingClosingQuestions: session.remainingClosingQuestions
    });
  } catch (error: any) {
    console.error('canvassLocation error:', error);
    res.status(500).json({ error: error.message || 'Failed to canvass location' });
  }
};

export const chatOfficer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      sessionId,
      message,
      attachedClue,
      attachedClueId,
      referencedEvidenceId,
      referencedLocationId
    } = req.body;

    if (typeof sessionId !== 'string') return res.status(400).json({ error: 'A session is required.' });
    if (message != null && typeof message !== 'string') return res.status(400).json({ error: 'Invalid precinct message.' });
    if (typeof message === 'string' && message.length > 2000) {
      return res.status(413).json({ error: 'Precinct messages are limited to 2,000 characters.' });
    }

    const session = await GameSession.findById(sessionId).select('+guestAccessTokenHash');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!ownsSession(req, res, session)) return;

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    if (!session.unlockedSuspects) session.unlockedSuspects = (story.suspects || []).slice(0, 2).map((s: any) => s.id);
    if (!session.unlockedLocations) session.unlockedLocations = (story.locations || []).slice(0, 1).map((l: any) => l.id);
    if (!session.unlockedEvidence) session.unlockedEvidence = [];
    if (!session.canvassedLocations) session.canvassedLocations = [];

    // Resolve attached clue if only ID was provided
    const requestedClueId = attachedClueId || attachedClue?.id;
    const activeClue = requestedClueId
      ? (session.recordedClues || []).find((c: any) => c.id === requestedClueId) || null
      : null;

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
    const lockedEvidence = (story.evidence || []).filter((e: any) =>
      !session.unlockedEvidence.includes(e.id) &&
      (e.discoveryType === 'officer_subpoena' ||
       e.allowSubpoena === true ||
       /subpoena|record|log|contract|audit|telemetry|bank|email|warrant|agreement/i.test((e.title || '') + ' ' + (e.subtitle || ''))
      )
    );

    const unlockedEvidenceList = (story.evidence || [])
      .filter((e: any) => session.unlockedEvidence.includes(e.id))
      .map((e: any) => ({
        id: e.id,
        title: e.title,
        subtitle: e.subtitle,
        details: e.details,
        location: e.location,
        isMurderWeapon: e.isMurderWeapon
      }));

    const unlockedSuspectsList = (story.suspects || [])
      .filter((s: any) => session.unlockedSuspects.includes(s.id))
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        trait: s.trait
      }));

    const locationsStatusList = (story.locations || [])
      .filter((l: any) => session.unlockedLocations.includes(l.id))
      .map((l: any) => ({
        id: l.id,
        title: l.title,
        isCanvassed: (session.canvassedLocations || []).includes(l.id)
      }));

    const hasMurderWeapon = unlockedEvidenceList.some((e: any) => {
      const truthWeapon = (story.groundTruth?.weapon || '').toLowerCase();
      const titleLower = (e.title || '').toLowerCase();
      const subtitleLower = (e.subtitle || '').toLowerCase();

      if (e.isMurderWeapon === true) return true;
      if (truthWeapon && e.id && (e.id.toLowerCase() === truthWeapon || truthWeapon.includes(e.id.toLowerCase()))) return true;

      const knownWeaponIds = [
        'damascus_letter_opener',
        'poison_vial_dumbwaiter',
        'obsidian_dagger',
        'bloody_cargo_hook',
        'neural_disruptor',
        'arsenic_bottle',
        'cyanide_cocktail_glass',
        'alchemical_elixir'
      ];
      if (knownWeaponIds.includes(e.id)) return true;

      if (subtitleLower.includes('recovered murder weapon') || titleLower.includes('recovered murder weapon')) return true;

      return false;
    });

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
      unlockedEvidenceDetails: unlockedEvidenceList,
      unlockedSuspectsDetails: unlockedSuspectsList,
      locationsStatus: locationsStatusList,
      hasMurderWeapon
    };

    // Save user message with supporting metadata
    const safeOfficerQuery = (message || '').trim() || 'Officer Davis, requesting sit-rep on available leads.';

    session.officerChatHistory.push({
      role: 'user',
      content: safeOfficerQuery,
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

    // Officer Davis AI evaluates probable cause and semantic relevance directly
    const evalResult = await LLMService.chatWithOfficerAdvisor(
      safeOfficerQuery,
      {
        clue: activeClue ? { id: activeClue.id, suspectName: activeClue.suspectName, statement: activeClue.statement, suspectId: activeClue.suspectId } : null,
        evidence: activeEvidence ? { id: activeEvidence.id, title: activeEvidence.title, subtitle: activeEvidence.subtitle, details: activeEvidence.details, location: activeEvidence.location } : null,
        location: activeLocation ? { id: activeLocation.id, title: activeLocation.title, subtitle: activeLocation.subtitle, notes: activeLocation.notes, witnesses: activeLocation.witnesses, canvassReport: activeLocation.canvassReport } : null
      },
      {
        locations: lockedLocations.map((l: any) => ({ id: l.id, title: l.title, subtitle: l.subtitle, notes: l.notes })),
        suspects: lockedSuspects.map((s: any) => ({ id: s.id, name: s.name, role: s.role })),
        evidence: lockedEvidence.map((e: any) => ({ id: e.id, title: e.title, subtitle: e.subtitle, details: e.details }))
      },
      caseContext,
      session.officerChatHistory
    );

    // Dynamic role/name hallucination correction (prevents LLM default fallback tropes)
    const techSuspect = (story.suspects || []).find((s: any) => /cto|chief technology officer|tech/i.test(s.role || ''));
    if (techSuspect) {
      evalResult.dialogue = evalResult.dialogue.replace(/\bthe CFO\b/gi, `${techSuspect.name}, our ${techSuspect.role}`);
      evalResult.dialogue = evalResult.dialogue.replace(/\bCFO\b/g, techSuspect.role);
      evalResult.dialogue = evalResult.dialogue.replace(/\bjulian thorne\b/gi, techSuspect.name);
    } else {
      evalResult.dialogue = evalResult.dialogue.replace(/\bthe CFO\b/gi, 'our suspect');
      evalResult.dialogue = evalResult.dialogue.replace(/\bjulian thorne\b/gi, story.victimProfile?.name || 'the suspect');
    }

    // Eliminate phantom room numbers (e.g. Room 2, Room 4, Interrogation Room 2)
    evalResult.dialogue = evalResult.dialogue.replace(/\b(?:interrogation\s+)?room\s+\d+\b/gi, 'the interrogation room');

    let newlyUnlocked: { type: 'location' | 'evidence' | 'character'; id: string; name: string } | null = null;
    let isAuthorized = false;

    // LLM output can nominate an entity, but only the server can approve an unlock.
    const messageText = safeOfficerQuery;
    const attachmentText = supportingAttachmentText({ clue: activeClue, evidence: activeEvidence, location: activeLocation });
    const interrogationRequest = /\b(interrogate|question|interview|summon|bring in|talk to|speak with|call in|pull in)\b/i.test(messageText);
    const locationRequest = /\b(search|canvas|visit|investigate|inspect|go to|secure)\b/i.test(messageText);
    const subpoenaRequest = /\b(subpoena|pull|request|obtain|retrieve|records|logs|audit|telemetry)\b/i.test(messageText);
    const pronounRequest = /\b(her|him|them|this person|that witness|the suspect|that location|there)\b/i.test(messageText);

    const supportsSuspect = (suspect: any) => {
      const lead = suspect.leadSource || {};
      const terms = [suspect.name, suspect.id, lead.sourceName, lead.sourceId];
      return refersTo(attachmentText, terms) || Boolean(lead.description && refersTo(attachmentText, [lead.description]));
    };
    const supportsLocation = (location: any) => {
      const lead = location.leadSource || {};
      const terms = [location.title, location.id, location.subtitle, lead.sourceName, lead.sourceId];
      const referencedInAttachment = refersTo(attachmentText, terms) || Boolean(lead.description && refersTo(attachmentText, [lead.description]));
      const evidenceFromLocation = Boolean(activeEvidence && (
        activeEvidence.locationId === location.id || (location.hiddenEvidenceIds || []).includes(activeEvidence.id)
      ));
      return referencedInAttachment || evidenceFromLocation;
    };
    const supportsSubpoena = (evidence: any) => {
      const terms = [evidence.title, evidence.subtitle, evidence.id, evidence.subpoenaSource];
      return refersTo(attachmentText, terms) || Boolean(evidence.subpoenaSource && activeEvidence?.id === evidence.subpoenaSource);
    };

    const eligibleUnlocks: Array<{ type: 'location' | 'evidence' | 'character'; id: string; name: string }> = [];
    for (const suspect of lockedSuspects) {
      const lead: any = suspect.leadSource || {};
      const requestReferences = refersTo(messageText, [suspect.name, suspect.id, lead.sourceName, lead.sourceId]) || pronounRequest;
      if (interrogationRequest && requestReferences && supportsSuspect(suspect)) {
        eligibleUnlocks.push({ type: 'character', id: suspect.id, name: suspect.name });
      }
    }
    for (const location of lockedLocations) {
      const lead: any = location.leadSource || {};
      const requestReferences = refersTo(messageText, [location.title, location.id, location.subtitle, lead.sourceName, lead.sourceId]) || pronounRequest;
      if (locationRequest && requestReferences && supportsLocation(location)) {
        eligibleUnlocks.push({ type: 'location', id: location.id, name: location.title });
      }
    }
    for (const evidence of lockedEvidence) {
      const requestReferences = refersTo(messageText, [evidence.title, evidence.subtitle, evidence.id, evidence.subpoenaSource]) || pronounRequest;
      if (subpoenaRequest && requestReferences && supportsSubpoena(evidence)) {
        eligibleUnlocks.push({ type: 'evidence', id: evidence.id, name: evidence.title });
      }
    }

    const requested = evalResult.authorizedUnlock;
    const validNomination = requested?.id
      ? eligibleUnlocks.find(item => item.type === requested.type && item.id === requested.id)
      : undefined;
    const authorizedUnlock = validNomination || (eligibleUnlocks.length === 1 ? eligibleUnlocks[0] : undefined);

    if (requested?.id && !authorizedUnlock) {
      evalResult.dialogue = `I can't authorize that dispatch on a hunch, Detective. Cite a recorded statement or evidence that directly connects the person, place, or record to this case.`;
    } else if (!requested?.id && eligibleUnlocks.length === 1) {
      evalResult.dialogue = `The cited material gives us grounds to proceed. I've authorized ${eligibleUnlocks[0].name} for the case file, Detective.`;
    } else if (eligibleUnlocks.length > 1 && (!validNomination || !requested?.id)) {
      evalResult.dialogue = `Your cited material points to more than one lead. Name the specific person, place, or record you want me to pursue.`;
    } else if (!authorizedUnlock && /\b(dispatched|subpoenaed|pulled|authorized|bringing .* in)\b/i.test(evalResult.dialogue)) {
      evalResult.dialogue = `I can't authorize a dispatch or subpoena without a specific lead in the case file, Detective.`;
    }
    evalResult.authorizedUnlock = authorizedUnlock || null;

    // Interrogation lock check: If DA locked interrogation, block character summons
    if (session.interrogationLocked && evalResult.authorizedUnlock?.type === 'character') {
      evalResult.authorizedUnlock = null;
      evalResult.dialogue = `Negative, Detective. The District Attorney has locked down all interrogations while the indictment is being finalized. We can't bring in any more suspects.`;
    }

    if (evalResult.authorizedUnlock && evalResult.authorizedUnlock.id) {
      const auth = evalResult.authorizedUnlock;
      const normalize = (str: string) => (str || '').toLowerCase().replace(/[\s\-_'"]+/g, '');

      if (auth.type === 'location') {
        const matched = (story.locations || []).find((l: any) =>
          l.id === auth.id ||
          normalize(l.id) === normalize(auth.id) ||
          normalize(l.title) === normalize(auth.name || auth.id)
        );
        const targetId = matched ? matched.id : auth.id;

        if (session.unlockedLocations.includes(targetId)) {
          isAuthorized = true;
          if (matched && !/already/i.test(evalResult.dialogue)) {
            evalResult.dialogue = `${matched.title} is already an active crime scene on your board, Detective. You can head over to canvas it.`;
          }
        } else if (matched) {
          session.unlockedLocations.push(matched.id);
          newlyUnlocked = { type: 'location', id: matched.id, name: matched.title };
          isAuthorized = true;
        }
      } else if (auth.type === 'character') {
        const matched = (story.suspects || []).find((s: any) =>
          s.id === auth.id ||
          normalize(s.id) === normalize(auth.id) ||
          normalize(s.name) === normalize(auth.name || auth.id)
        );
        const targetId = matched ? matched.id : auth.id;

        if (session.unlockedSuspects.includes(targetId)) {
          isAuthorized = true;
          if (matched && !/already/i.test(evalResult.dialogue)) {
            evalResult.dialogue = `${matched.name} is already waiting in the interrogation room, Detective. You can go question them right now.`;
          }
        } else if (matched) {
          session.unlockedSuspects.push(matched.id);
          newlyUnlocked = { type: 'character', id: matched.id, name: matched.name };
          isAuthorized = true;
        }
      } else if (auth.type === 'evidence') {
        const matched = (story.evidence || []).find((e: any) =>
          e.id === auth.id ||
          normalize(e.id) === normalize(auth.id) ||
          normalize(e.title) === normalize(auth.name || auth.id)
        );
        const targetId = matched ? matched.id : auth.id;

        if (session.unlockedEvidence.includes(targetId)) {
          isAuthorized = true;
          if (matched && !/already/i.test(evalResult.dialogue)) {
            evalResult.dialogue = `${matched.title} is already logged in our evidence locker, Detective.`;
          }
        } else if (matched) {
          session.unlockedEvidence.push(matched.id);
          newlyUnlocked = { type: 'evidence', id: matched.id, name: matched.title };
          isAuthorized = true;
        }
      }
    }

    // Save assistant response
    session.officerChatHistory.push({
      role: 'assistant',
      content: evalResult.dialogue,
      timestamp: new Date(),
      isApproved: isAuthorized,
      unlockedEntity: newlyUnlocked
    });

    checkAndTriggerClosing(session, story);

    await session.save();

    res.status(200).json({
      dialogue: evalResult.dialogue,
      officerChatHistory: session.officerChatHistory,
      story: toPlayerStory(story, session),
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

export const submitDeduction = async (req: AuthRequest, res: Response) => {
  const { sessionId, deduction, message } = req.body;
  req.body.message = deduction || message;
  return chatOfficer(req, res);
};

export const submitWarrant = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, suspect, motive, weapon, keyContradiction } = req.body;
    const session = await GameSession.findById(sessionId).select('+guestAccessTokenHash');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!ownsSession(req, res, session)) return;
    if (session.status === 'solved') return res.status(409).json({ error: 'This case has already been closed.' });

    const story = await Story.findById(session.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    if (typeof suspect !== 'string' || !session.unlockedSuspects.includes(suspect)) {
      return res.status(403).json({ error: 'The accused must be a person cleared for this investigation.' });
    }
    const weaponEvidence = (story.evidence || []).find((item: any) => item.id === weapon);
    if (typeof weapon !== 'string' || !weaponEvidence || !session.unlockedEvidence.includes(weapon)) {
      return res.status(403).json({ error: 'The weapon or opportunity evidence must be in the case locker.' });
    }
    const isUnlockedEvidenceContradiction = (story.evidence || []).some((item: any) =>
      item.id === keyContradiction && session.unlockedEvidence.includes(item.id)
    );
    const isRecordedClueContradiction = (session.recordedClues || []).some((clue: any) => clue.statement === keyContradiction);
    if (!isUnlockedEvidenceContradiction && !isRecordedClueContradiction) {
      return res.status(403).json({ error: 'The contradiction must come from unlocked evidence or a recorded statement.' });
    }
    if (typeof motive !== 'string' || !motive.trim() || motive.length > 2000) {
      return res.status(400).json({ error: 'Provide a motive of no more than 2,000 characters.' });
    }

    session.warrantAttemptsCount = (session.warrantAttemptsCount || 0) + 1;

    const warrant = { suspect, motive, weapon, keyContradiction };
    const verdict = scoreWarrant(warrant, story.groundTruth, story as unknown as IStory);
    const epilogue = await LLMService.generateWarrantEpilogue(warrant, verdict, story as unknown as IStory);

    const isConvicted = verdict.outcome === 'perfect';
    session.status = isConvicted ? 'solved' : 'active';
    session.verdict = {
      suspect,
      motive,
      weapon,
      keyContradiction,
      outcome: isConvicted ? 'perfect' : verdict.outcome,
      epilogue,
      score: verdict.score,
      criteria: verdict.criteria
    };

    await session.save();

    let userRank: string | undefined;
    let newlyUnlockedBadges: string[] = [];
    let userStats: any = undefined;

    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.stats.totalWarrantsFiled = (user.stats.totalWarrantsFiled || 0) + 1;
        if (isConvicted) {
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
      epilogue,
      criteria: verdict.criteria,
      userRank,
      newBadges: newlyUnlockedBadges,
      userStats
    });
  } catch (error: any) {
    console.error('submitWarrant error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit warrant' });
  }
};

export const saveNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, notes } = req.body;
    const session = await GameSession.findById(sessionId).select('+guestAccessTokenHash');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!ownsSession(req, res, session)) return;
    session.notes = notes;
    await session.save();
    res.status(200).json({ notes: session.notes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save notes' });
  }
};

export const recordClue = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, suspectId, suspectName, statement } = req.body;
    const session = await GameSession.findById(sessionId).select('+guestAccessTokenHash');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!ownsSession(req, res, session)) return;

    if (typeof suspectId !== 'string' || !session.unlockedSuspects.includes(suspectId)) {
      return res.status(403).json({ error: 'Only statements from an available interview can be recorded.' });
    }
    if (typeof statement !== 'string' || !statement.trim() || statement.length > 2000) {
      return res.status(400).json({ error: 'The recorded statement is invalid.' });
    }
    const suspectState = session.suspects.get(suspectId);
    const statementExists = suspectState?.chatHistory?.some((entry: any) =>
      entry.role === 'assistant' && entry.content === statement
    );
    if (!statementExists) {
      return res.status(403).json({ error: 'Only a statement actually made in this interview can be recorded.' });
    }

    const existingClue = (session.recordedClues || []).find((clue: any) =>
      clue.suspectId === suspectId && clue.statement === statement
    );
    if (existingClue) return res.status(200).json({ clues: session.recordedClues });

    const story = await Story.findById(session.storyId);
    const suspectProfile = story?.suspects?.find((item: any) => item.id === suspectId);
    if (!suspectProfile) return res.status(404).json({ error: 'Suspect not found in story' });

    const newClue = {
      id: `clue_${randomUUID()}`,
      suspectId,
      suspectName: suspectProfile.name,
      statement: statement.trim(),
      timestamp: new Date()
    };

    session.recordedClues.push(newClue);
    await session.save();

    // Increment user clues stat if authenticated
    if (session.userId) {
      User.findByIdAndUpdate(session.userId, { $inc: { 'stats.cluesFoundCount': 1 } }).catch(() => {});
    }

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
    const solvedIds = new Set((req.user?.casesSolved || []).map(id => String(id)));
    const stories = storiesDocs.map(doc => {
      const includeSolution = solvedIds.has(String(doc._id));
      const obj = toPlayerStory(doc, undefined, includeSolution);
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
    const includeSolution = Boolean(req.user?.casesSolved?.some(id => String(id) === String(story._id)));
    const storyObj = toPlayerStory(story, undefined, includeSolution);
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
    res.status(201).json({ story: toPlayerStory(newStory) });
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
    res.status(201).json({ story: toPlayerStory(story) });
  } catch (error: any) {
    console.error('generateAiStory error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI story' });
  }
};
