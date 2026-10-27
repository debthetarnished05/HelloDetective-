import { create } from 'zustand';
import type { IStory, ISuspectRuntimeState, IOfficerChatMessage, IRecordedClue, IChatMessage } from '../types/index';

interface GameState {
  sessionId: string | null;
  currentStage: number;
  story: IStory | null;
  unlockedEvidence: string[];
  unlockedLocations: string[];
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
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  currentStage: 1,
  story: null,
  unlockedEvidence: [],
  unlockedLocations: [],
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

    set({
      sessionId,
      currentStage: session.currentStage || 1,
      story,
      unlockedEvidence: session.unlockedEvidence || [],
      unlockedLocations: session.unlockedLocations || [],
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

  setLoading: (loading) => set({ isLoading: loading })
}));