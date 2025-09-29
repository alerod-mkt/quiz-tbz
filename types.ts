export enum QuizState {
  WELCOME,
  QUIZ,
  LEAD_CAPTURE,
  RESULTS,
  DASHBOARD,
  AUTH,
}

export enum EventType {
  VISIT = 'visit',
  QUIZ_START = 'quiz_start',
  QUESTION_VIEW = 'question_view',
  LEAD_SUBMIT = 'lead_submit',
  OFFER_CLICK = 'checkout_start', // Corrigido de 'offer_click'
  QUIZ_COMPLETE = 'quiz_complete',
}

export interface Question {
  id: number;
  category: 'A REALIDADE ATUAL' | 'SINAIS DE ALERTA' | 'O FUTURO DELES' | 'SUA DECISÃO';
  text: string;
  options: string[];
  icon: string;
}

export interface QuizMetrics {
  visits: number;
  quizStarts: number;
  leads: number;
  offerClicks: number;
  questionViews: { [key: number]: number };
}

// Novas interfaces para tipagem das funções Edge
export interface QuizAbandonment {
  id: string; // UUID
  session_id: string; // UUID
  reason: string;
  step_where_abandoned: string;
  time_spent_minutes: number;
  created_at: string;
}

export interface QuizSession {
  id: string; // UUID
  session_id: string;
  ip_address: string;
  country_code: string;
  current_step: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionAbandonmentStats {
  abandoned_count: number;
  completion_rate: number;
  drop_off_rate: number;
}

export type AbandonmentByQuestion = {
  [key: string]: QuestionAbandonmentStats;
};