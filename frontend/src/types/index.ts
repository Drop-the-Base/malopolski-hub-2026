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
  etr_summary?: string | null;
  video_url?: string | null;
  handbook_url?: string | null;
}

export interface MatchmakingResult {
  clean_query: string;
  detected_topics: string[];
  powiat?: string;
  matches: MatchmakingMatch[];
  no_match: boolean;
  similar_cases_count: number;
  trend_alert?: string | null;
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

export interface GrantCall {
  id: string;
  title: string;
  opens_on: string;
  closes_on: string;
  min_budget_pln: number;
  max_budget_pln: number;
  criteria: string[];
  is_open: boolean;
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

