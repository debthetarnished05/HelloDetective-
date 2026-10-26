import { create } from 'zustand';

interface GameState {
  sessionId: string | null;
  currentStage: number;
  unlockedEvidence: string[];
  unlockedLocations: string[];
  notes: string; // Add notes state
  
  // Actions
  setSessionData: (id: string, evidence: string[], locations: string[]) => void;
  advanceStage: (newStage: number) => void;
  unlockItems: (newEvidence?: string[], newLocations?: string[]) => void;
  setNotes: (newNotes: string) => void; // Add setNotes action
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  currentStage: 1,
  unlockedEvidence: [],
  unlockedLocations: [],
  notes: '',

  setSessionData: (id, evidence, locations) => 
    set({ sessionId: id, unlockedEvidence: evidence, unlockedLocations: locations }),
    
  advanceStage: (newStage) => 
    set({ currentStage: newStage }),
    
  unlockItems: (newEvidence = [], newLocations = []) =>
    set((state) => ({
      unlockedEvidence: [...new Set([...state.unlockedEvidence, ...newEvidence])],
      unlockedLocations: [...new Set([...state.unlockedLocations, ...newLocations])]
    })),
    
  setNotes: (newNotes) => set({ notes: newNotes })
}));