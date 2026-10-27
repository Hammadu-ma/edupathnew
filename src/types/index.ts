export type Theme = 'light' | 'dark';
export type Role = 'student' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  university_id: string | null;
  program_id: string | null;
  study_year_id: string | null;
  term_id: string | null;
  onboarding_complete: boolean;
  preferences: Record<string, any>;
  created_at: string;
}

export interface University { id: string; name: string; code: string | null; country: string | null; logo_url: string | null; is_active: boolean; }
export interface Program { id: string; university_id: string; name: string; code: string | null; description: string | null; is_active: boolean; }
export interface StudyYear { id: string; program_id: string; name: string; sort_order: number; is_active: boolean; }
export interface Term { id: string; study_year_id: string; name: string; kind: string; sort_order: number; is_active: boolean; }

export interface Course {
  id: string;
  university_id: string;
  program_id: string;
  study_year_id: string | null;
  term_id: string | null;
  code: string;
  title: string;
  description: string | null;
  credits: number | null;
  cover_color: string;
  is_published: boolean;
  created_at: string;
}
export interface CourseStats { resource_count: number; exam_count: number; question_count: number; }

export type ResourceType = 'notes' | 'book' | 'pdf' | 'video' | 'slides' | 'guide' | 'link' | 'other';
export interface Resource {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  file_path: string | null;
  external_url: string | null;
  file_size: number | null;
  is_published: boolean;
  created_at: string;
}

export type ExamType = 'midterm' | 'final' | 'quiz' | 'supplementary' | 'practice';
export interface PastExam {
  id: string;
  course_id: string;
  title: string;
  exam_year: number;
  exam_type: ExamType;
  semester_label: string | null;
  file_path: string | null;
  answers_file_path: string | null;
  has_answers: boolean;
  has_explanations: boolean;
  is_published: boolean;
  created_at: string;
}

export interface QuestionOption { id: string; text: string; }
export interface Question {
  id: string;
  course_id: string;
  exam_id: string | null;
  question_text: string;
  options: QuestionOption[];
  correct_option_id: string;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  order_index: number;
  is_published: boolean;
}

export type BookmarkType = 'course' | 'resource' | 'exam' | 'question';
export interface Bookmark { id: string; user_id: string; item_type: BookmarkType; item_id: string; created_at: string; }

export interface QuizAttempt {
  id: string;
  user_id: string;
  course_id: string | null;
  exam_id: string | null;
  mode: 'practice' | 'exam';
  question_ids: string[];
  answers: Record<string, string>;
  score: number;
  total_points: number;
  time_spent_seconds: number | null;
  started_at: string;
  completed_at: string;
}

export type ActivityAction = 'opened' | 'downloaded' | 'completed' | 'quiz_attempted';
export interface Activity {
  id: string;
  user_id: string;
  course_id: string | null;
  resource_id: string | null;
  action: ActivityAction;
  created_at: string;
  resource?: { id: string; title: string; type: ResourceType } | null;
}

export interface Completion { resource_id: string; course_id: string | null; completed_at: string; }

export interface Goal {
  id: string;
  title: string;
  kind: 'resources' | 'quizzes' | 'custom';
  target: number;
  due_date: string | null;
  is_done: boolean;
  created_at: string;
}
