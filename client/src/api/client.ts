import axios from 'axios';
import type { IStory } from '../types/index';

const API_URL = 'http://localhost:3001/api/game';

export const gameApi = {
  startGame: async (storyId?: string) => {
    const response = await axios.post(`${API_URL}/start`, { storyId });
    return response.data; // { sessionId, session, story }
  },

  getSession: async (sessionId: string) => {
    const response = await axios.get(`${API_URL}/session/${sessionId}`);
    return response.data; // { sessionId, session, story }
  },

  chatWithSuspect: async (
    sessionId: string,
    suspectId: string,
    message: string,
    presentedEvidenceId: string | null = null
  ) => {
    const response = await axios.post(`${API_URL}/chat`, {
      sessionId,
      suspectId,
      message,
      presentedEvidenceId
    });
    return response.data; // { dialogue, trustScore, stressLevel, mood, revealedFacts, newRevealedFact, brokeDown }
  },

  submitDeduction: async (sessionId: string, deduction: string) => {
    const response = await axios.post(`${API_URL}/deduction`, {
      sessionId,
      deduction
    });
    return response.data; // { isApproved, dialogue, feedback, newStage, unlockedEvidence, unlockedLocations }
  },

  submitWarrant: async (
    sessionId: string,
    warrant: { suspect: string; motive: string; weapon: string; keyContradiction: string }
  ) => {
    const response = await axios.post(`${API_URL}/warrant`, {
      sessionId,
      ...warrant
    });
    return response.data; // { outcome, score, verdictTitle, epilogue }
  },

  saveNotes: async (sessionId: string, notes: string) => {
    const response = await axios.post(`${API_URL}/notes`, {
      sessionId,
      notes
    });
    return response.data;
  },

  recordClue: async (
    sessionId: string,
    clue: { suspectId: string; suspectName: string; statement: string }
  ) => {
    const response = await axios.post(`${API_URL}/clue`, {
      sessionId,
      ...clue
    });
    return response.data; // { clues }
  },

  listStories: async () => {
    const response = await axios.get(`${API_URL}/stories`);
    return response.data.stories as IStory[];
  },

  getStory: async (storyId: string) => {
    const response = await axios.get(`${API_URL}/stories/${storyId}`);
    return response.data.story as IStory;
  },

  createStory: async (storyData: Partial<IStory>) => {
    const response = await axios.post(`${API_URL}/stories`, storyData);
    return response.data.story as IStory;
  },

  generateAiStory: async (promptTheme: string, archetype?: string) => {
    const response = await axios.post(`${API_URL}/stories/generate`, { promptTheme, archetype });
    return response.data.story as IStory;
  }
};