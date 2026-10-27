import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from './AppContext';
import type { Course, CourseStats, Program, StudyYear, Term, University } from '../types';

interface CatalogType {
  loading: boolean;
  universities: University[];
  programs: Program[];
  studyYears: StudyYear[];
  terms: Term[];
  courses: Course[];
  stats: Record<string, CourseStats>;
  refresh: () => Promise<void>;
  courseById: (id?: string | null) => Course | undefined;
  /** "Cambridge › Computer Science › Year 2 › Michaelmas Term" */
  pathLabel: (c: Course) => string;
}

const CatalogContext = createContext<CatalogType | null>(null);
const EMPTY_STATS: CourseStats = { resource_count: 0, exam_count: 0, question_count: 0 };

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [studyYears, setStudyYears] = useState<StudyYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Record<string, CourseStats>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [u, p, y, t, c, s] = await Promise.all([
        supabase.from('universities').select('*').eq('is_active', true).order('name'),
        supabase.from('programs').select('*').eq('is_active', true).order('name'),
        supabase.from('study_years').select('*').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('terms').select('*').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('courses').select('*').eq('is_published', true).order('code'),
        supabase.from('course_stats').select('*'),
      ]);
      setUniversities((u.data as University[]) ?? []);
      setPrograms((p.data as Program[]) ?? []);
      setStudyYears((y.data as StudyYear[]) ?? []);
      setTerms((t.data as Term[]) ?? []);
      setCourses((c.data as Course[]) ?? []);
      const map: Record<string, CourseStats> = {};
      (s.data ?? []).forEach((r: any) => {
        map[r.course_id] = {
          resource_count: Number(r.resource_count), exam_count: Number(r.exam_count), question_count: Number(r.question_count),
        };
      });
      setStats(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) void refresh(); }, [isAuthenticated, refresh]);

  const courseById = useCallback((id?: string | null) => courses.find(c => c.id === id), [courses]);

  const pathLabel = useCallback((c: Course) => {
    const uni = universities.find(u => u.id === c.university_id);
    const prog = programs.find(p => p.id === c.program_id);
    const year = studyYears.find(y => y.id === c.study_year_id);
    const term = terms.find(t => t.id === c.term_id);
    return [uni?.code || uni?.name, prog?.name, year?.name, term?.name].filter(Boolean).join(' › ');
  }, [universities, programs, studyYears, terms]);

  const value = useMemo(() => ({
    loading, universities, programs, studyYears, terms, courses,
    stats: new Proxy(stats, { get: (t, k: string) => t[k] ?? EMPTY_STATS }) as Record<string, CourseStats>,
    refresh, courseById, pathLabel,
  }), [loading, universities, programs, studyYears, terms, courses, stats, refresh, courseById, pathLabel]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
