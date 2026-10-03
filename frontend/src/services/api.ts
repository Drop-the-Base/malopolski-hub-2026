import axios from 'axios';
import {
  InnovationItem,
  MatchmakingResult,
  RegionalChallenge,
  CanvasData,
  CanvasAudit,
  ServiceBlueprint,
  TestingCampaignItem,
  CommunicationThreadItem,
  MentorItem,
  TrendRadarData
} from '../types';

const API_BASE = '/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Moduł I: Matchmaking
  matchProblem: async (problem_description: string, powiat?: string, category?: string) => {
    const res = await client.post<MatchmakingResult>('/matchmaking', {
      problem_description,
      powiat: powiat || undefined,
      category: category || undefined,
      limit: 4
    });
    return res.data;
  },

  // Moduł II: Zasobnik Wiedzy
  getInnovations: async (category?: string, search?: string) => {
    const res = await client.get<InnovationItem[]>('/knowledge/innovations', {
      params: { category, search }
    });
    return res.data;
  },

  getInnovationById: async (id: string) => {
    const res = await client.get<InnovationItem>(`/knowledge/innovations/${id}`);
    return res.data;
  },

  getRegionalChallenges: async () => {
    const res = await client.get<RegionalChallenge[]>('/knowledge/challenges');
    return res.data;
  },

  // Moduł III: Kreator Pomysłów
  submitFiszka: async (data: {
    title: string;
    summary: string;
    target_audience: string;
    implementation_stage: string;
    author_name: string;
    author_email: string;
    author_type: string;
    powiat: string;
  }) => {
    const res = await client.post('/ideas', data);
    return res.data;
  },

  evaluateCanvas: async (canvas: CanvasData) => {
    const res = await client.post<CanvasAudit>('/canvas/evaluate', canvas);
    return res.data;
  },

  autofillCanvas: async (prompt: string, powiat?: string, target_group?: string) => {
    const res = await client.post<import('../types').CanvasAutofillResult>('/canvas/autofill', {
      prompt,
      powiat: powiat || 'Kraków',
      target_group: target_group || undefined
    });
    return res.data;
  },

  generateGrantApplication: async (data: {
    idea_title: string;
    summary: string;
    target_group: string;
    requested_budget_pln: number;
  }) => {
    const res = await client.post('/grant-applications/generate', data);
    return res.data;
  },

  // Moduł VII: Middleman Innowacji dla JST
  adaptService: async (params: {
    innovation_id: string;
    municipality_name: string;
    powiat: string;
    population: number;
    senior_percentage: number;
    annual_budget_pln: number;
    has_cus: boolean;
  }) => {
    const res = await client.post<{ blueprint: ServiceBlueprint; generated_at: string }>('/middleman/adapt', params);
    return res.data.blueprint;
  },

  simplifyTextETR: async (source_text: string) => {
    const res = await client.post<{ simple_text: string; key_points: string[]; reading_ease_score: number }>('/tools/etr-simplify', {
      source_text
    });
    return res.data;
  },

  // Moduł IV: Tester Innowacji
  getTestingCampaigns: async () => {
    const res = await client.get<TestingCampaignItem[]>('/testing/campaigns');
    return res.data;
  },

  registerTester: async (campaign_id: string, tester_name: string, tester_email: string, tester_role: string, motivation: string) => {
    const res = await client.post('/testing/register', {
      campaign_id,
      tester_name,
      tester_email,
      tester_role,
      motivation
    });
    return res.data;
  },

  submitTestingFeedback: async (feedback: {
    campaign_id: string;
    tester_name: string;
    tester_role: string;
    sus_score: number;
    usability_rating: number;
    identified_barriers: string;
    improvement_proposals: string;
  }) => {
    const res = await client.post('/testing/feedback', feedback);
    return res.data;
  },

  // Moduł V: Komunikacja
  getThreads: async (category?: string) => {
    const res = await client.get<CommunicationThreadItem[]>('/communication/threads', {
      params: { category }
    });
    return res.data;
  },

  createThread: async (thread: {
    title: string;
    category: string;
    author_name: string;
    author_role: string;
    powiat: string;
    initial_message: string;
  }) => {
    const res = await client.post<CommunicationThreadItem>('/communication/threads', thread);
    return res.data;
  },

  replyThread: async (threadId: string, sender_name: string, sender_role: string, content: string) => {
    const res = await client.post(`/communication/threads/${threadId}/messages`, {
      sender_name,
      sender_role,
      content
    });
    return res.data;
  },

  getMentors: async () => {
    const res = await client.get<MentorItem[]>('/communication/mentors');
    return res.data;
  },

  // Moduł VI: Panel Admina
  getTrendRadar: async () => {
    const res = await client.get<TrendRadarData>('/admin/trends');
    return res.data;
  }
};
