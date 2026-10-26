export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'admin';
  university_id?: string;
  program_id?: string;
  study_year_id?: string;
  semester_id?: string;
  onboarding_complete: boolean;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  code: string;
  country: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Program {
  id: string;
  university_id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

export interface StudyYear {
  id: string;
  program_id: string;
  name: string;
  year_number: number;
  is_active: boolean;
}

export interface Semester {
  id: string;
  study_year_id: string;
  name: string;
  semester_number: number;
  is_active: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  university_id: string;
  program_id: string;
  study_year_id?: string;
  semester_id?: string;
  cover_color: string;
  cover_pattern: string;
  is_published: boolean;
  created_at: string;
  resource_count?: number;
  exam_count?: number;
}

export interface LearningResource {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'textbook' | 'notes' | 'guide' | 'link' | 'practice';
  file_url?: string;
  file_size?: number;
  external_url?: string;
  is_published: boolean;
  created_at: string;
  uploaded_by?: string;
}

export interface PastExam {
  id: string;
  course_id: string;
  title: string;
  year: number;
  semester?: string;
  exam_type: 'midterm' | 'final' | 'quiz' | 'supplementary' | 'practice';
  file_url?: string;
  has_answers: boolean;
  has_explanations: boolean;
  is_published: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  exam_id?: string;
  course_id: string;
  question_text: string;
  question_image?: string;
  options: QuizOption[];
  correct_option_id: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  order_index: number;
}

export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  course_id: string;
  exam_id?: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  score: number;
  total_points: number;
  started_at: string;
  completed_at?: string;
  time_spent_seconds?: number;
}

export interface Bookmark {
  id: string;
  user_id: string;
  resource_type: 'course' | 'resource' | 'exam';
  resource_id: string;
  created_at: string;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  course_id: string;
  resource_id?: string;
  action: 'opened' | 'completed' | 'quiz_attempted';
  score?: number;
  created_at: string;
}

export type Theme = 'light' | 'dark';

export interface AppState {
  user: User | null;
  theme: Theme;
  isAuthenticated: boolean;
  isLoading: boolean;
}
