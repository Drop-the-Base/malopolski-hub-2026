export interface InnovationItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  target_groups: string[];
  full_description: string;
  readiness_level: string;
  budget_bracket: string;
  video_url?: string;
  handbook_url?: string;
  etr_summary?: string;
  origin_poviat?: string;
}

export interface MatchmakingMatch {
  innovation_id: string;
  title: string;
  tagline: string;
  match_score: number;
  why_matched: string;
  readiness_level: string;
  category: string;
  target_groups: string[];
  etr_summary?: string;
  video_url?: string;
  handbook_url?: string;
}

export interface MatchmakingResult {
  clean_query: string;
  detected_topics: string[];
  powiat?: string;
  matches: MatchmakingMatch[];
  similar_cases_count: number;
  trend_alert?: string;
  ceneo_intro?: string;
  ceneo_bundle_rationale?: string;
  action_steps?: string[];
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

export interface GrantApplication {
  application_id: string;
  call_title: string;
  submission_date: string;
  applicant_name: string;
  powiat: string;
  gmina?: string;
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
    rekomendowane_zrodlo: string;
    wskaznik_efektywnosci_kosztowej: string;
  };
  staffing_requirements: string;
  resolution_draft: string;
  risk_mitigation: Array<{ risk: string; action: string }>;
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
  average_sus_score: number;
  satisfaction_rate: number;
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

export interface TrendRadarData {
  total_problems_analyzed: number;
  most_acute_challenges: Array<{
    category: string;
    impact_score: number;
    hotspot_powiaty: string[];
    suggested_action: string;
  }>;
  poviat_breakdown: Array<{
    powiat: string;
    top_problem_category: string;
    reported_cases_count: number;
    quarterly_growth_pct: number;
    alert_level: string;
  }>;
  systemic_gaps: string[];
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
  recommended_innovations: Array<{ id: string; title: string; tagline: string; category: string }>;
}

