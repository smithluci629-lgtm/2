export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  total_score: number;
  total_lessons: number;
}

export interface PhraseBreakdown {
  phrase: string;
  meaning: string;
}

export interface SentenceData {
  vi: string;
  en_best: string;
  phrase_breakdown?: PhraseBreakdown[];
}

export interface StoryResponse {
  sentences: SentenceData[];
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  note_content: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  user_id: string;
  vietnamese_text: string;
  total_sentences: number;
  completed_sentences: number;
  score: number;
  status: 'in_progress' | 'completed';
}