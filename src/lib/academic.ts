import type { Course } from '../types';

export interface AcademicPath {
  university_id?: string | null;
  program_id?: string | null;
  study_year_id?: string | null;
  term_id?: string | null;
}

/**
 * Lenient match used for "my courses". A course with no year (or no term) applies
 * to the whole program / year, so institutions that don't use years or terms still work.
 */
export function matchesAcademic(course: Course, p: AcademicPath): boolean {
  if (p.university_id && course.university_id !== p.university_id) return false;
  if (p.program_id && course.program_id !== p.program_id) return false;
  if (p.study_year_id && course.study_year_id && course.study_year_id !== p.study_year_id) return false;
  if (p.term_id && course.term_id && course.term_id !== p.term_id) return false;
  return true;
}
