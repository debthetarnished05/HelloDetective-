import axios from 'axios';

const API_URL = 'http://localhost:3001/api/game';

export const gameApi = {
  startGame: async () => {
    const response = await axios.post(`${API_URL}/start`);
    return response.data; // { sessionId, session }
  },

  chatWithSuspect: async (sessionId: string, suspectId: string, message: string, presentedEvidence: string | null = null) => {
    const response = await axios.post(`${API_URL}/chat`, {
      sessionId,
      suspectId,
      message,
      presentedEvidence
    });
    return response.data; // { dialogue, trustScore }
  },

  submitDeduction: async (sessionId: string, deduction: string) => {
    const response = await axios.post(`${API_URL}/deduction`, {
      sessionId,
      deduction
    });
    return response.data; // { isApproved, dialogue, unlockEvidence, unlockLocations }
  },

  submitWarrant: async (sessionId: string, warrant: { suspect: string, motive: string, weapon: string }) => {
    const response = await axios.post(`${API_URL}/warrant`, {
      sessionId,
      ...warrant
    });
    return response.data; // { epilogue }
  }
};