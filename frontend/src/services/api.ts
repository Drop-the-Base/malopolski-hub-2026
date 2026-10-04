import axios from 'axios';
import {
  InnovationItem,
  InnovationRatingSummary,
  InnovationUpsert,
  MatchmakingResult,
  RegionalChallenge,
  CanvasData,
  CanvasAudit,
  CanvasAutofillResult,
  ServiceBlueprint,
  TestingCampaignItem,
  EvaluationReport,
  CommunicationThreadItem,
  MentorItem,
  MentorSlot,
  BookingConfirmation,
  TrendRadarData,
  GrantApplication,
  GrantCall,
  ProblemReportItem,
  MunicipalReportSummary,
  FiszkaAdminItem,
  FiszkaPublicStatus,
  FiszkaUpdatePayload,
  IdeaVoteResponse,
  NotificationItem,
  EducationalMaterial,
  FiszkaCaseView,
  CaseMessage,
  ProblemPublicStatus,
  AdminInboxSummary,
  SubscriptionPayload,
  SubscriptionResult,
  SubscriptionInfo,
  SubscriptionStats,
  GrantCallUpsert,
  GrantCallAdminResult
} from '../types';

const API_BASE = '/api/v1';
const TOKEN_KEY = 'mhis_admin_token';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token koordynatora ROPS (sesja przeglądarki)
export const authStore = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* brak dostępu do storage – token tylko w pamięci żądania */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignoruj */
    }
  }
};

client.interceptors.request.use((config) => {
  const token = authStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Czytelny komunikat błędu z odpowiedzi API (walidacja, konflikty, brak połączenia). */
export const apiErrorMessage = (err: unknown, fallback = 'Wystąpił błąd. Spróbuj ponownie.'): string => {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.';
    const detail = (err.response.data as { detail?: unknown })?.detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  return fallback;
};

export const isUnauthorized = (err: unknown) => axios.isAxiosError(err) && err.response?.status === 401;

export const api = {
  // Uwierzytelnianie
  login: async (password: string, username?: string) => {
    const res = await client.post<{ access_token: string; user_name?: string; user_role?: string }>('/auth/login', {
      password,
      username: username || 'sedzia.hackyeah@malopolska.pl'
    });
    authStore.set(res.data.access_token);
    return res.data;
  },

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

  transcribeVoice: async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    const res = await client.post<{ text: string; latency_ms: number; model: string; is_fallback: boolean }>(
      '/voice/transcribe',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return res.data;
  },

  // Moduł II: Zasobnik Wiedzy
  getInnovations: async (category?: string, search?: string) => {
    const res = await client.get<InnovationItem[]>('/knowledge/innovations', {
      params: { category: category || undefined, search: search || undefined }
    });
    return res.data;
  },

  getInnovationById: async (id: string) => {
    const res = await client.get<InnovationItem>(`/knowledge/innovations/${id}`);
    return res.data;
  },

  createInnovation: async (data: InnovationUpsert) => {
    const res = await client.post<InnovationItem>('/knowledge/innovations', data);
    return res.data;
  },

  updateInnovation: async (id: string, data: InnovationUpsert) => {
    const res = await client.put<InnovationItem>(`/knowledge/innovations/${id}`, data);
    return res.data;
  },

  unpublishInnovation: async (id: string) => {
    await client.delete(`/knowledge/innovations/${id}`);
  },

  getRegionalChallenges: async () => {
    const res = await client.get<RegionalChallenge[]>('/knowledge/challenges');
    return res.data;
  },

  getMaterials: async () => {
    const res = await client.get<EducationalMaterial[]>('/knowledge/materials');
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
    rodo_consent: boolean;
  }) => {
    const res = await client.post<FiszkaPublicStatus>('/ideas', data);
    return res.data;
  },

  getFiszkaStatus: async (id: string) => {
    const res = await client.get<FiszkaPublicStatus>(`/ideas/${encodeURIComponent(id)}/status`);
    return res.data;
  },

  getVotingIdeas: async () => {
    const res = await client.get<FiszkaPublicStatus[]>('/ideas/voting');
    return res.data;
  },

  voteForIdea: async (fiszkaId: string) => {
    const res = await client.post<IdeaVoteResponse>(`/ideas/${encodeURIComponent(fiszkaId)}/vote`);
    return res.data;
  },

  updateIdeaFull: async (fiszkaId: string, data: FiszkaUpdatePayload) => {
    const res = await client.patch<FiszkaAdminItem>(`/ideas/${encodeURIComponent(fiszkaId)}`, data);
    return res.data;
  },

  evaluateCanvas: async (canvas: CanvasData) => {
    const res = await client.post<CanvasAudit>('/canvas/evaluate', canvas);
    return res.data;
  },

  autofillCanvas: async (prompt: string, powiat?: string, target_group?: string) => {
    const res = await client.post<CanvasAutofillResult>('/canvas/autofill', {
      prompt,
      powiat: powiat || 'Kraków',
      target_group: target_group || undefined
    });
    return res.data;
  },

  getGrantCalls: async () => {
    const res = await client.get<GrantCall[]>('/grant-calls');
    return res.data;
  },

  generateGrantApplication: async (data: {
    call_id: string;
    idea_title: string;
    summary: string;
    target_group: string;
    powiat?: string;
    gmina?: string;
    author_name?: string;
    requested_budget_pln: number;
    canvas_data?: Partial<CanvasData>;
  }) => {
    const res = await client.post<GrantApplication>('/grant-applications/generate', data);
    return res.data;
  },

  // Moduł VII: Middleman dla JST
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

  chatWithMiddlemanConsultant: async (params: {
    messages: Array<{ role: string; content: string }>;
    innovation_id: string;
    municipality_name: string;
    powiat: string;
    population: number;
    senior_percentage: number;
    has_cus: boolean;
    annual_budget_pln: number;
    blueprint_summary?: string;
  }) => {
    const res = await client.post<{ reply: string; suggested_followups: string[]; latency_ms: number }>(
      '/middleman/chat',
      params
    );
    return res.data;
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

  registerTester: async (data: {
    campaign_id: string;
    tester_name: string;
    tester_email: string;
    tester_role: string;
    motivation: string;
    guardian_consent: boolean;
    rodo_consent: boolean;
  }) => {
    const res = await client.post<{ message: string; slots_taken: number; slots_total: number }>('/testing/register', data);
    return res.data;
  },

  submitTestingFeedback: async (feedback: {
    campaign_id: string;
    tester_name: string;
    tester_role: string;
    sus_answers: number[];
    usability_rating: number;
    identified_barriers: string;
    improvement_proposals: string;
  }) => {
    const res = await client.post<{ message: string; sus_score: number; sus_grade: string }>('/testing/feedback', feedback);
    return res.data;
  },

  getRatingSummaries: async () => {
    const res = await client.get<InnovationRatingSummary[]>('/testing/ratings');
    return res.data;
  },

  getInnovationRating: async (innovationId: string) => {
    const res = await client.get<InnovationRatingSummary>(`/testing/innovations/${innovationId}/rating`);
    return res.data;
  },

  rateInnovation: async (innovationId: string, data: { rating: number; improvement_proposal: string; author_role: string }) => {
    const res = await client.post<{ message: string; summary: InnovationRatingSummary }>(
      `/testing/innovations/${innovationId}/rating`,
      data
    );
    return res.data;
  },

  getCampaignReport: async (campaignId: string) => {
    const res = await client.get<EvaluationReport>(`/testing/campaigns/${campaignId}/report`);
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

  getMentorSlots: async (mentorId: string) => {
    const res = await client.get<MentorSlot[]>(`/communication/mentors/${mentorId}/slots`);
    return res.data;
  },

  bookMentor: async (mentorId: string, data: {
    slot_start: string;
    requester_name: string;
    requester_email: string;
    topic: string;
    rodo_consent: boolean;
  }) => {
    const res = await client.post<BookingConfirmation>(`/communication/mentors/${mentorId}/bookings`, data);
    return res.data;
  },

  // Moduł VI: Panel ROPS (wymaga zalogowania)
  getTrendRadar: async () => {
    const res = await client.get<TrendRadarData>('/admin/trends');
    return res.data;
  },

  getSubmissions: async () => {
    const res = await client.get<FiszkaAdminItem[]>('/admin/submissions');
    return res.data;
  },

  moderateFiszka: async (id: string, data: { status: string; admin_notes?: string; assigned_mentor_id?: string }) => {
    const res = await client.patch<FiszkaAdminItem>(`/ideas/${id}`, data);
    return res.data;
  },

  getNotifications: async (channel?: 'panel' | 'email') => {
    const res = await client.get<NotificationItem[]>('/admin/notifications', { params: { channel } });
    return res.data;
  },

  markNotificationsRead: async () => {
    await client.post('/admin/notifications/mark-read');
  },

  // „Moje sprawy” (G4): status, oś czasu i rozmowa autora z ROPS
  openMyCase: async (fiszkaId: string, email: string) => {
    const res = await client.post<FiszkaCaseView>(`/ideas/${encodeURIComponent(fiszkaId)}/case`, { email });
    return res.data;
  },

  sendCaseMessage: async (fiszkaId: string, email: string, body: string) => {
    const res = await client.post<FiszkaCaseView>(`/ideas/${encodeURIComponent(fiszkaId)}/messages`, { email, body });
    return res.data;
  },

  getProblemStatus: async (problemId: string) => {
    const res = await client.get<ProblemPublicStatus>(`/cases/problems/${encodeURIComponent(problemId)}`);
    return res.data;
  },

  getInboxSummary: async () => {
    const res = await client.get<AdminInboxSummary>('/admin/inbox-summary');
    return res.data;
  },

  acknowledgeSubmission: async (fiszkaId: string) => {
    await client.post(`/admin/submissions/${encodeURIComponent(fiszkaId)}/read`);
  },

  getCaseMessagesAdmin: async (fiszkaId: string) => {
    const res = await client.get<CaseMessage[]>(`/admin/submissions/${encodeURIComponent(fiszkaId)}/messages`);
    return res.data;
  },

  replyToAuthor: async (fiszkaId: string, body: string) => {
    const res = await client.post<CaseMessage[]>(`/admin/submissions/${encodeURIComponent(fiszkaId)}/messages`, { body });
    return res.data;
  },

  // Subskrypcje powiadomień (G5)
  subscribe: async (data: SubscriptionPayload) => {
    const res = await client.post<SubscriptionResult>('/subscriptions', data);
    return res.data;
  },

  getSubscription: async (token: string) => {
    const res = await client.get<SubscriptionInfo>(`/subscriptions/${encodeURIComponent(token)}`);
    return res.data;
  },

  unsubscribe: async (token: string) => {
    const res = await client.post<SubscriptionInfo>(`/subscriptions/${encodeURIComponent(token)}/unsubscribe`);
    return res.data;
  },

  getSubscriptionStats: async () => {
    const res = await client.get<SubscriptionStats>('/admin/subscriptions/stats');
    return res.data;
  },

  createGrantCall: async (data: GrantCallUpsert) => {
    const res = await client.post<GrantCallAdminResult>('/admin/grant-calls', data);
    return res.data;
  },

  updateGrantCall: async (id: string, data: GrantCallUpsert) => {
    const res = await client.put<GrantCallAdminResult>(`/admin/grant-calls/${encodeURIComponent(id)}`, data);
    return res.data;
  },

  // Rejestr Wyzwań JST
  getProblems: async (params?: {
    powiat?: string;
    category?: string;
    urgency?: string;
    status?: string;
    reporter_type?: string;
  }) => {
    const res = await client.get<ProblemReportItem[]>('/problems', { params });
    return res.data;
  },

  createProblem: async (data: {
    title: string;
    raw_text: string;
    category?: string;
    powiat: string;
    gmina?: string;
    reporter_type?: string;
    reporter_name?: string;
    reporter_role?: string;
    urgency?: string;
    affected_count?: number;
  }) => {
    const res = await client.post<ProblemReportItem>('/problems', data);
    return res.data;
  },

  updateProblem: async (id: string, data: {
    status?: string;
    urgency?: string;
    assigned_innovation_id?: string;
    assigned_notes?: string;
  }) => {
    const res = await client.patch<ProblemReportItem>(`/problems/${id}`, data);
    return res.data;
  },

  assignInnovationToProblem: async (problemId: string, innovationId: string, notes?: string) => {
    const res = await client.post<ProblemReportItem>(`/problems/${problemId}/assign-innovation`, {
      innovation_id: innovationId,
      notes
    });
    return res.data;
  },

  getMunicipalSummary: async (powiat: string) => {
    const res = await client.get<MunicipalReportSummary>('/problems/summary/regional', {
      params: { powiat }
    });
    return res.data;
  }
};
