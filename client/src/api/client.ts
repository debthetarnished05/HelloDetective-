import axios from 'axios';

// Assuming your backend is running on port 5000
const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const gameApi = {
  startGame: (playerId: string) => 
    apiClient.post('/game/start', { playerId }),
  
  interrogate: (sessionId: string, suspectId: string, message: string, evidenceId?: string) =>
    apiClient.post(`/chat/${sessionId}/interrogate`, { suspectId, message, evidenceId }),
};