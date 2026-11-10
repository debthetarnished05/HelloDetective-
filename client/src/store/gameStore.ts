import { create } from 'zustand';
import type { IStory, ISuspectRuntimeState, IOfficerChatMessage, IRecordedClue, IChatMessage } from '../types/index';

interface GameState {
  sessionId: string | null;
  currentStage: number;
  story: IStory | null;
  unlockedEvidence: string[];
  unlockedLocations: string[];
  unlockedSuspects: string[];
  canvassedLocations: string[];
  caseClosingTriggered: boolean;
  remainingClosingQuestions: number;
  interrogationLocked: boolean;
  suspectStates: Record<string, ISuspectRuntimeState>;
  officerChatHistory: IOfficerChatMessage[];
  notes: string;
  recordedClues: IRecordedClue[];
  isLoading: boolean;
  activeSuspectId: string | null;
  draggedEvidenceId: string | null;

  // Actions
  setSessionData: (payload: { sessionId: string; session: any; story: IStory }) => void;
  updateSuspectState: (suspectId: string, updates: Partial<ISuspectRuntimeState>) => void;
  addSuspectChatMessage: (suspectId: string, message: IChatMessage) => void;
  advanceStage: (newStage: number, newEvidence?: string[], newLocations?: string[]) => void;
  setNotes: (newNotes: string) => void;
  addRecordedClue: (clue: IRecordedClue) => void;
  setActiveSuspect: (suspectId: string | null) => void;
  setDraggedEvidence: (evidenceId: string | null) => void;
  setLoading: (loading: boolean) => void;
  markLocationCanvassed: (locationId: string, newlyFoundEvidenceIds?: string[]) => void;
  setClosingState: (data: { caseClosingTriggered?: boolean; remainingClosingQuestions?: number; interrogationLocked?: boolean }) => void;
  setUnlockedEntities: (data: { suspects?: string[]; locations?: string[]; evidence?: string[] }) => void;
  setOfficerChatHistory: (history: IOfficerChatMessage[]) => void;
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  currentStage: 1,
  story: null,
  unlockedEvidence: [],
  unlockedLocations: [],
  unlockedSuspects: [],
  canvassedLocations: [],
  caseClosingTriggered: false,
  remainingClosingQuestions: 12,
  interrogationLocked: false,
  suspectStates: {},
  officerChatHistory: [],
  notes: '',
  recordedClues: [],
  isLoading: true,
  activeSuspectId: null,
  draggedEvidenceId: null,

  setSessionData: ({ sessionId, session, story }) => {
    // Convert suspects map/object to record
    const states: Record<string, ISuspectRuntimeState> = {};
    if (session.suspects) {
      if (session.suspects instanceof Map) {
        session.suspects.forEach((val: ISuspectRuntimeState, key: string) => {
          states[key] = val;
        });
      } else {
        Object.entries(session.suspects).forEach(([key, val]) => {
          states[key] = val as ISuspectRuntimeState;
        });
      }
    }

      if (sessionId) {
        localStorage.setItem('detective_session_id', sessionId);
      }

      set({
        sessionId,
        currentStage: session.currentStage || 1,
      story,
      unlockedEvidence: session.unlockedEvidence || [],
      unlockedLocations: session.unlockedLocations || [],
      unlockedSuspects: session.unlockedSuspects || (story.suspects || []).slice(0, 2).map((s: any) => s.id),
      canvassedLocations: session.canvassedLocations || [],
      caseClosingTriggered: session.caseClosingTriggered || false,
      remainingClosingQuestions: session.remainingClosingQuestions !== undefined ? session.remainingClosingQuestions : 12,
      interrogationLocked: session.interrogationLocked || false,
      suspectStates: states,
      officerChatHistory: session.officerChatHistory || [],
      notes: session.notes || '',
      recordedClues: session.recordedClues || [],
      isLoading: false
    });
  },

  updateSuspectState: (suspectId, updates) =>
    set((state) => {
      const current = state.suspectStates[suspectId] || {
        suspectId,
        trustScore: 50,
        stressLevel: 20,
        mood: 'composed',
        revealedFacts: [],
        chatHistory: []
      };

      return {
        suspectStates: {
          ...state.suspectStates,
          [suspectId]: {
            ...current,
            ...updates
          }
        }
      };
    }),

  addSuspectChatMessage: (suspectId, message) =>
    set((state) => {
      const current = state.suspectStates[suspectId];
      if (!current) return state;

      return {
        suspectStates: {
          ...state.suspectStates,
          [suspectId]: {
            ...current,
            chatHistory: [...(current.chatHistory || []), message]
          }
        }
      };
    }),

  advanceStage: (newStage, newEvidence = [], newLocations = []) =>
    set((state) => ({
      currentStage: newStage,
      unlockedEvidence: [...new Set([...state.unlockedEvidence, ...newEvidence])],
      unlockedLocations: [...new Set([...state.unlockedLocations, ...newLocations])]
    })),

  setNotes: (newNotes) => set({ notes: newNotes }),

  addRecordedClue: (clue) =>
    set((state) => ({
      recordedClues: [...state.recordedClues, clue]
    })),

  setActiveSuspect: (suspectId) => set({ activeSuspectId: suspectId }),

  setDraggedEvidence: (evidenceId) => set({ draggedEvidenceId: evidenceId }),

  setLoading: (loading) => set({ isLoading: loading }),

  markLocationCanvassed: (locationId, newlyFoundEvidenceIds = []) =>
    set((state) => ({
      canvassedLocations: state.canvassedLocations.includes(locationId)
        ? state.canvassedLocations
        : [...state.canvassedLocations, locationId],
      unlockedEvidence: [...new Set([...state.unlockedEvidence, ...newlyFoundEvidenceIds])]
    })),

  setClosingState: (data) =>
    set((state) => ({
      caseClosingTriggered: data.caseClosingTriggered !== undefined ? data.caseClosingTriggered : state.caseClosingTriggered,
      remainingClosingQuestions: data.remainingClosingQuestions !== undefined ? data.remainingClosingQuestions : state.remainingClosingQuestions,
      interrogationLocked: data.interrogationLocked !== undefined ? data.interrogationLocked : state.interrogationLocked
    })),

  setUnlockedEntities: ({ suspects, locations, evidence }) =>
    set((state) => ({
      unlockedSuspects: suspects ? [...new Set([...state.unlockedSuspects, ...suspects])] : state.unlockedSuspects,
      unlockedLocations: locations ? [...new Set([...state.unlockedLocations, ...locations])] : state.unlockedLocations,
      unlockedEvidence: evidence ? [...new Set([...state.unlockedEvidence, ...evidence])] : state.unlockedEvidence
    })),

  setOfficerChatHistory: (history) => set({ officerChatHistory: history })
}));