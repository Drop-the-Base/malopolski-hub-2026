export interface InnovationItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  category_label?: string;
  target_groups: string[];
  full_description: string;
  readiness_level: string;
  budget_bracket: string;
  video_url?: string | null;
  handbook_url?: string | null;
  etr_summary?: string | null;
  origin_poviat?: string | null;
  problem_statement?: string | null;
  effect_description?: string | null;
  is_published?: boolean;
}

export interface InnovationRatingSummary {
  innovation_id: string;
  ratings_count: number;
  average_rating: number | null;
  proposals_count: number;
}

export interface InnovationUpsert {
  title: string;
  tagline: string;
  category: string;
  target_groups: string[];
  full_description: string;
  readiness_level: string;
  budget_bracket: string;
  video_url?: string | null;
  handbook_url?: string | null;
  etr_summary?: string | null;
  origin_poviat?: string | null;
  is_published: boolean;
}

export interface EducationalMaterial {
  id: string;
  title: string;
  category: string;
  description: string;
  download_url: string;
  format: string;
  is_external: boolean;
}

export interface EducationalMaterialAdmin extends EducationalMaterial {
  is_published: boolean;
  sort_order: number;
}

export interface EducationalMaterialUpsert {
  title: string;
  category: string;
  description: string;
  download_url: string;
  format: string;
  is_published: boolean;
  sort_order: number;
}

export interface NewSinceLogin {
  since: string;
  first_login: boolean;
  new_ideas: number;
  new_problem_reports: number;
  new_matchmaking_queries: number;
  new_tester_feedback: number;
  new_mentor_bookings: number;
  total: number;
}

export type AdminExportKind = 'ideas' | 'problems' | 'needs';

export interface MatchmakingMatch {
  innovation_id: string;
  title: string;
  tagline: string;
  match_score: number;
  why_matched: string;
  readiness_level: string;
  category: string;
  category_label: string;
  target_groups: string[];
  matched_needs: string[];
  /** Słowa z opisu użytkownika, które zdecydowały o dopasowaniu */
  matched_keywords?: string[];
  etr_summary?: string | null;
  video_url?: string | null;
  handbook_url?: string | null;
}

export interface KeywordHighlight {
  start: number;
  end: number;
  text: string;
  reasons: string[];
}

export interface SimilarReportGroup {
  powiat?: string | null;
  powiat_label: string;
  count: number;
  registry_count: number;
  last_reported_at?: string | null;
  example_titles: string[];
  is_user_powiat: boolean;
}

export interface MatchmakingResult {
  clean_query: string;
  detected_topics: string[];
  powiat?: string;
  matches: MatchmakingMatch[];
  no_match: boolean;
  similar_cases_count: number;
  trend_alert?: string | null;
  highlights?: KeywordHighlight[];
  similar_reports?: SimilarReportGroup[];
  similar_reports_total?: number;
  ceneo_intro?: string;
  ceneo_bundle_rationale?: string;
  action_steps?: string[];
  ai_generated?: boolean;
}


export interface RegionalChallenge {
  powiat_code: string;
  powiat_name: string;
  population: number;
  senior_share_pct: number;
  youth_share_pct: number;
  demographic_trend: string;
  reported_problems_count: number;
  active_innovations_count: number;
  key_social_challenge: string;
}

export interface CanvasData {
  problem: string;
  target_group: string;
  value_proposition: string;
  barriers: string;
  resources: string;
  partners: string;
  testing_plan: string;
  metrics: string;
  scalability: string;
}

export interface CanvasAudit {
  overall_score: number;
  strengths: string[];
  logic_gaps: string[];
  coaching_tips: string[];
  visual_concept_prompt: string;
}

export interface CanvasAutofillResult {
  idea_title: string;
  problem: string;
  target_group: string;
  value_proposition: string;
  barriers: string;
  resources: string;
  partners: string;
  testing_plan: string;
  metrics: string;
  scalability: string;
  ai_powered: boolean;
  latency_ms: number;
}

/** Podpowiedzi na „Plakat pomysłu” (POST /canvas/poster-hints). */
export interface PosterHints {
  tagline: string;
  twists: string[];
  ai_powered: boolean;
}

export interface GrantCall {
  id: string;
  title: string;
  opens_on: string;
  closes_on: string;
  min_budget_pln: number;
  max_budget_pln: number;
  criteria: string[];
  is_open: boolean;
  category?: string | null;
  powiat?: string | null;
  updated_at?: string | null;
}

export interface GrantApplication {
  application_id: string;
  call_id: string;
  completeness_pct: number;
  missing_elements: string[];
  call_title: string;
  submission_date: string;
  applicant_name: string;
  powiat: string;
  gmina?: string | null;
  target_group: string;
  idea_title: string;
  executive_summary: string;
  problem_diagnosis: string;
  detailed_methodology: string;
  budget_breakdown: Record<string, number>;
  total_budget_pln: number;
  monitoring_indicators: string[];
  risk_assessment: Array<{ risk: string; action: string }>;
  declarations: string[];
}

export interface ServiceBlueprint {
  title: string;
  summary: string;
  operational_steps: string[];
  estimated_budget: {
    koszt_uruchomienia_pln: number;
    miesieczny_koszt_utrzymania_pln: number;
    roczny_koszt_utrzymania_pln: number;
    rekomendowane_zrodlo: string;
    wskaznik_efektywnosci_kosztowej: string;
  };
  staffing_requirements: string;
  resolution_draft: string;
  risk_mitigation: Array<{ risk: string; action: string }>;
  disclaimer: string;
}

export interface TestingCampaignItem {
  id: string;
  innovation_id: string;
  campaign_name: string;
  goal_description: string;
  tester_profile_needed: string;
  slots_total: number;
  slots_taken: number;
  status: string;
  deadline: string;
}

export interface EvaluationReport {
  campaign_id: string;
  total_feedbacks: number;
  average_sus_score: number | null;
  sus_grade: string | null;
  satisfaction_rate: number | null;
  common_barriers: string[];
  readiness_for_scaling: boolean;
}

export interface ThreadMessageItem {
  id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
}

export interface CommunicationThreadItem {
  id: string;
  title: string;
  category: string;
  author_name: string;
  author_role: string;
  powiat: string;
  status: string;
  created_at: string;
  messages: ThreadMessageItem[];
}

export interface MentorItem {
  id: string;
  full_name: string;
  specialization: string;
  bio: string;
  available_hours: string;
  contact_email: string;
}

export interface MentorSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface BookingConfirmation {
  id: string;
  mentor_id: string;
  mentor_name: string;
  slot_start: string;
  slot_end: string;
  topic: string;
}

export interface TrendRadarData {
  total_problems_analyzed: number;
  baseline_cases_count: number;
  platform_cases_count: number;
  platform_cases_last_30_days: number;
  quarterly_growth_pct: number | null;
  pending_ideas_count: number;
  unread_notifications_count: number;
  most_acute_challenges: Array<{
    category: string;
    impact_score: number;
    cases_count: number;
    hotspot_powiaty: string[];
    suggested_action: string;
  }>;
  poviat_breakdown: Array<{
    powiat: string;
    top_problem_category: string;
    reported_cases_count: number;
    platform_cases_count: number;
    quarterly_growth_pct: number | null;
    alert_level: string;
    alert_reason: string;
  }>;
  systemic_gaps: string[];
  methodology_note: string;
}

export interface FiszkaAdminItem {
  id: string;
  title: string;
  summary: string;
  target_audience: string;
  implementation_stage: string;
  author_name: string;
  author_email: string;
  author_type: string;
  powiat: string;
  status: string;
  admin_notes?: string | null;
  assigned_mentor_id?: string | null;
  cluster_group?: string | null;
  votes_count?: number;
  read_at?: string | null;
  review_started_at?: string | null;
  decided_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface FiszkaPublicStatus {
  id: string;
  title: string;
  summary?: string | null;
  powiat?: string | null;
  target_audience?: string | null;
  status: string;
  status_label: string;
  implementation_stage: string;
  admin_notes?: string | null;
  mentor_name?: string | null;
  cluster_group?: string | null;
  votes_count?: number;
  created_at: string;
  updated_at?: string | null;
  timeline?: TimelineStep[];
}

export interface FiszkaUpdatePayload {
  title?: string;
  summary?: string;
  target_audience?: string;
  implementation_stage?: string;
  powiat?: string;
  cluster_group?: string | null;
  status?: string;
  admin_notes?: string | null;
  assigned_mentor_id?: string | null;
}

export interface IdeaVoteResponse {
  id: string;
  title: string;
  votes_count: number;
  message: string;
}

export interface NotificationItem {
  id: string;
  recipient: string;
  channel: 'panel' | 'email' | string;
  subject: string;
  body: string;
  related_type?: string | null;
  related_id?: string | null;
  delivery_status: string;
  is_read: boolean;
  created_at: string;
}

export interface ProblemReportItem {
  id: string;
  title?: string;
  raw_text: string;
  clean_text: string;
  category?: string;
  powiat?: string;
  gmina?: string;
  reporter_type: string;
  reporter_name?: string;
  reporter_role?: string;
  urgency: 'krytyczny' | 'wysoki' | 'standardowy' | string;
  affected_count: number;
  matched_innovations: string[];
  assigned_innovation_id?: string;
  assigned_notes?: string;
  status: 'nowy' | 'w_analizie' | 'przypisana_innowacja' | 'wdrazany' | 'rozwiazany' | string;
  created_at: string;
}

export interface MunicipalReportSummary {
  powiat: string;
  total_challenges: number;
  critical_challenges: number;
  total_affected_residents: number;
  top_categories: Array<{ category: string; count: number }>;
  recommended_innovations: Array<{ id: string; title: string; tagline: string; category: string; matched_reports?: number }>;
}


// „Moje sprawy” (G4): oś czasu, rozmowa autora z ROPS, liczniki panelu
export interface TimelineStep {
  key: string;
  label: string;
  description: string;
  done: boolean;
  current: boolean;
  tone: 'neutral' | 'positive' | 'warning' | 'negative' | string;
  date?: string | null;
}

export interface CaseMessage {
  id: string;
  sender: 'author' | 'rops' | 'mentor' | string;
  /** Podpis nadawcy (opinia mentora: imię i nazwisko oraz specjalizacja). */
  sender_name?: string | null;
  sender_role?: string | null;
  body: string;
  read_by_rops: boolean;
  created_at: string;
}

export interface FiszkaCaseView {
  status: FiszkaPublicStatus;
  messages: CaseMessage[];
}

export interface ProblemPublicStatus {
  id: string;
  title?: string | null;
  powiat?: string | null;
  gmina?: string | null;
  status: string;
  status_label: string;
  assigned_innovation_id?: string | null;
  assigned_innovation_title?: string | null;
  created_at: string;
  timeline: TimelineStep[];
}

export interface AdminInboxSummary {
  new_submissions: number;
  new_submission_ids: string[];
  unread_messages: number;
  unread_by_case: Record<string, number>;
  unread_notifications: number;
  total_attention: number;
}

// Subskrypcje powiadomień (G5)
export type SubscriptionTopic = 'innowacje' | 'nabory';

export interface SubscriptionPayload {
  email: string;
  topics: SubscriptionTopic[];
  categories: string[];
  powiaty: string[];
  rodo_consent: boolean;
}

export interface SubscriptionResult {
  message: string;
  email_masked: string;
  topics: string[];
  categories: string[];
  powiaty: string[];
  is_update: boolean;
}

export interface SubscriptionInfo {
  email_masked: string;
  topics: string[];
  categories: string[];
  powiaty: string[];
  is_active: boolean;
}

export interface CountItem {
  key: string;
  label: string;
  count: number;
}

export interface SubscriptionStats {
  active_total: number;
  by_topic: CountItem[];
  by_category: CountItem[];
  all_categories_count: number;
  by_powiat: CountItem[];
  all_powiaty_count: number;
  alerts_sent: number;
}

export interface GrantCallUpsert {
  title: string;
  opens_on: string;
  closes_on: string;
  min_budget_pln: number;
  max_budget_pln: number;
  criteria: string[];
  category?: string | null;
  powiat?: string | null;
}

export interface GrantCallAdminResult {
  call: GrantCall;
  notified_count: number;
  message: string;
}

// --- G15: panel eksperta / mentora ---------------------------------------------------------------------

export interface MentorFiszkaItem {
  id: string;
  title: string;
  summary: string;
  target_audience: string;
  implementation_stage: string;
  powiat: string;
  status: string;
  status_label: string;
  author_name: string;
  author_type?: string | null;
  cluster_group?: string | null;
  created_at: string;
  messages: CaseMessage[];
  my_feedback_count: number;
  last_feedback_at?: string | null;
}

export interface MentorThreadItem {
  id: string;
  title: string;
  category: string;
  category_label: string;
  powiat: string;
  author_name: string;
  author_role: string;
  status: string;
  created_at: string;
  messages: { id: string; sender_name: string; sender_role: string; content: string; created_at: string }[];
  matches_specialization: boolean;
  answered_by_me: boolean;
  needs_answer: boolean;
}

export interface MentorBookingItem {
  id: string;
  slot_start: string;
  slot_end: string;
  requester_name: string;
  requester_email: string;
  topic: string;
  upcoming: boolean;
}

export interface MentorDashboard {
  mentor: MentorItem;
  stats: {
    assigned_fiszki: number;
    waiting_for_feedback: number;
    feedback_sent: number;
    thread_replies: number;
    open_threads: number;
    upcoming_bookings: number;
  };
  fiszki: MentorFiszkaItem[];
  threads: MentorThreadItem[];
  bookings: MentorBookingItem[];
}

export interface MentorActivityItem {
  mentor_id: string;
  full_name: string;
  specialization: string;
  assigned_fiszki: number;
  feedback_sent: number;
  thread_replies: number;
  upcoming_bookings: number;
  total_bookings: number;
  last_activity_at?: string | null;
}

export interface MentorActivitySummary {
  mentors: MentorActivityItem[];
  total_feedback: number;
  total_thread_replies: number;
  fiszki_without_feedback: number;
}

// --- G16: Teczka wdrożeń (porównanie innowacji) ---------------------------------------------------------

export interface ComparisonItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  category_label: string;
  problem_statement?: string | null;
  target_groups: string[];
  budget_bracket?: string | null;
  setup_cost_pln?: number | null;
  monthly_cost_pln?: number | null;
  staff_needs?: string | null;
  readiness_level?: string | null;
  origin_poviat?: string | null;
  average_rating?: number | null;
  ratings_count: number;
}

export interface ComparisonResponse {
  items: ComparisonItem[];
  missing_ids: string[];
  cost_basis: string;
}
