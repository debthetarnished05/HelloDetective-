import axios from 'axios';
import type { IStory } from '../types/index';
import type { AuthResponse, IUser } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let accessToken: string | null = localStorage.getItem('detective_access_token');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('detective_access_token', token);
  } else {
    localStorage.removeItem('detective_access_token');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Request interceptor: attach bearer token
apiClient.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: handle token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshRes.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (username: string, email: string, password: string, guestSessionId?: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      username,
      email,
      password,
      guestSessionId
    });
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  login: async (identifier: string, password: string, guestSessionId?: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      identifier,
      password,
      guestSessionId
    });
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh');
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  getMe: async () => {
    const response = await apiClient.get<{ user: IUser }>('/auth/me');
    return response.data.user;
  }
};

export const gameApi = {
  startGame: async (storyId?: string) => {
    const response = await apiClient.post('/game/start', { storyId });
    return response.data; // { sessionId, session, story }
  },

  getSession: async (sessionId: string) => {
    const response = await apiClient.get(`/game/session/${sessionId}`);
    return response.data; // { sessionId, session, story }
  },

  chatWithSuspect: async (
    sessionId: string,
    suspectId: string,
    message: string,
    presentedEvidenceId: string | null = null
  ) => {
    const response = await apiClient.post('/game/chat', {
      sessionId,
      suspectId,
      message,
      presentedEvidenceId
    });
    return response.data;
  },

  canvassLocation: async (sessionId: string, locationId: string) => {
    const response = await apiClient.post('/game/location/canvass', {
      sessionId,
      locationId
    });
    return response.data;
  },

  chatOfficer: async (sessionId: string, message: string) => {
    const response = await apiClient.post('/game/officer/chat', {
      sessionId,
      message
    });
    return response.data;
  },

  submitDeduction: async (sessionId: string, deduction: string) => {
    const response = await apiClient.post('/game/deduction', {
      sessionId,
      deduction
    });
    return response.data;
  },

  submitWarrant: async (
    sessionId: string,
    warrant: { suspect: string; motive: string; weapon: string; keyContradiction: string }
  ) => {
    const response = await apiClient.post('/game/warrant', {
      sessionId,
      ...warrant
    });
    return response.data;
  },

  saveNotes: async (sessionId: string, notes: string) => {
    const response = await apiClient.post('/game/notes', {
      sessionId,
      notes
    });
    return response.data;
  },

  recordClue: async (
    sessionId: string,
    clue: { suspectId: string; suspectName: string; statement: string }
  ) => {
    const response = await apiClient.post('/game/clue', {
      sessionId,
      ...clue
    });
    return response.data;
  },

  listStories: async () => {
    const response = await apiClient.get('/game/stories');
    return response.data.stories as IStory[];
  },

  getStory: async (storyId: string) => {
    const response = await apiClient.get(`/game/stories/${storyId}`);
    return response.data.story as IStory;
  },

  createStory: async (storyData: Partial<IStory>) => {
    const response = await apiClient.post('/game/stories', storyData);
    return response.data.story as IStory;
  },

  generateAiStory: async (promptTheme?: string, archetype?: string) => {
    const response = await apiClient.post('/game/stories/generate', {
      promptTheme,
      archetype
    });
    return response.data.story as IStory;
  }
};
