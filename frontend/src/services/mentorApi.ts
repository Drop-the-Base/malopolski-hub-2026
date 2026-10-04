import axios from 'axios';
import { MentorDashboard, MentorFiszkaItem, MentorItem, MentorThreadItem } from '../types';

/**
 * Panel mentora (G15) – osobny klient HTTP i osobny token (rola „mentor”), żeby nie mieszać go
 * z tokenem koordynatora ROPS dołączanym automatycznie w `api.ts`.
 */
const MENTOR_TOKEN_KEY = 'mhis_mentor_token';

export const mentorAuthStore = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(MENTOR_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      sessionStorage.setItem(MENTOR_TOKEN_KEY, token);
    } catch {
      /* brak dostępu do storage – sesja tylko do odświeżenia strony */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(MENTOR_TOKEN_KEY);
    } catch {
      /* ignoruj */
    }
  }
};

const mentorClient = axios.create({ baseURL: '/api/v1', headers: { 'Content-Type': 'application/json' } });

let memoryToken: string | null = null;

mentorClient.interceptors.request.use((config) => {
  const token = mentorAuthStore.get() ?? memoryToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const mentorApi = {
  login: async (mentorId: string, accessCode: string) => {
    const res = await mentorClient.post<{ access_token: string; mentor: MentorItem }>('/auth/mentor-login', {
      mentor_id: mentorId,
      access_code: accessCode
    });
    memoryToken = res.data.access_token;
    mentorAuthStore.set(res.data.access_token);
    return res.data;
  },

  logout: () => {
    memoryToken = null;
    mentorAuthStore.clear();
  },

  isLoggedIn: () => !!(mentorAuthStore.get() ?? memoryToken),

  getDashboard: async () => {
    const res = await mentorClient.get<MentorDashboard>('/mentor/me');
    return res.data;
  },

  sendFeedback: async (fiszkaId: string, body: string) => {
    const res = await mentorClient.post<MentorFiszkaItem>(`/mentor/fiszki/${encodeURIComponent(fiszkaId)}/feedback`, { body });
    return res.data;
  },

  replyThread: async (threadId: string, body: string) => {
    const res = await mentorClient.post<MentorThreadItem>(`/mentor/threads/${encodeURIComponent(threadId)}/reply`, { body });
    return res.data;
  }
};
