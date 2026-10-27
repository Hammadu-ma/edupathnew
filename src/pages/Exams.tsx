import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Award, Bookmark, BookmarkCheck, CheckCircle2, FileText, Flag, Timer, XCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { openFile, unwrap } from '../lib/db';
import { Badge, Button, Card, EmptyState, ErrorNote, PageLoader, ProgressBar, SearchInput, Select } from '../components/ui/Primitives';
import type { PastExam, Question } from '../types';

export default function PastExams() {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useApp();
  const { universities, programs, studyYears, courses, courseById } = useCatalog();
  const [search, setSearch] = useState('');
  const [uni, setUni] = useState('');
  const [prog, setProg] = useState('');
  const [year, setYear] = useState('');
  const [course, setCourse] = useState('');
  const [examYear, setExamYear] = useState('');
  const [type, setType] = useState('');
  const [fileError, setFileError] = useState('');

  const { data, loading, error, reload } = useAsync(async () => {
    const exams = await unwrap<PastExam[]>(supabase.from('past_exams').select('*').eq('is_published', true).order('exam_year', { ascending: false }) as any);
    const qs = await unwrap<{ exam_id: string }[]>(supabase.from('questions').select('exam_id').eq('is_published', true).not('exam_id', 'is', null) as any);
    const counts: Record<string, number> = {};
    (qs ?? []).forEach(q => { counts[q.exam_id] = (counts[q.exam_id] ?? 0) + 1; });
    return { exams: exams ?? [], counts };
  }, []);

  const exams = data?.exams ?? [];
  const yearsAvailable = useMemo(() => Array.from(new Set(exams.map(e => e.exam_year))).sort((a, b) => b - a), [exams]);

  const filtered = useMemo(() => exams.filter(e => {
    const c = courseById(e.course_id);
    if (!c) return false;
    if (uni && c.university_id !== uni) return false;
    if (prog && c.program_id !== prog) return false;
    if (year && c.study_year_id !== year) return false;
    if (course && e.course_id !== course) return false;
    if (examYear && String(e.exam_year) !== examYear) return false;
    if (type && e.exam_type !== type) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [exams, courseById, uni, prog, year, course, examYear, type, search]);

  const all = (l: string) => ({ value: '', label: l });
  const open = (path: string | null) => { setFileError(''); openFile({ path }).catch(e => setFileError(e.message)); };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Past Examinations</h1>
        <p className="text-[var(--text-tertiary)]">Browse by university, program, year, course and exam type. Practice digitized questions where available.</p>
      </div>

      <div className="space-y-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search exams..." />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <Select value={uni} onChange={v => { setUni(v); setProg(''); setYear(''); setCourse(''); }} options={[all('University'), ...universities.map(u => ({ value: u.id, label: u.name }))]} />
          <Select value={prog} onChange={v => { setProg(v); setYear(''); setCourse(''); }} options={[all('Program'), ...programs.filter(p => !uni || p.university_id === uni).map(p => ({ value: p.id, label: p.name }))]} />
          <Select value={year} onChange={v => { setYear(v); setCourse(''); }} options={[all('Study year'), ...studyYears.filter(y => !prog || y.program_id === prog).map(y => ({ value: y.id, label: y.name }))]} />
          <Select value={course} onChange={setCourse} options={[all('Course'), ...courses.filter(c => (!uni || c.university_id === uni) && (!prog || c.program_id === prog) && (!year || c.study_year_id === year)).map(c => ({ value: c.id, label: c.code }))]} />
          <Select value={examYear} onChange={setExamYear} options={[all('Exam year'), ...yearsAvailable.map(y => ({ value: String(y), label: String(y) }))]} />
          <Select value={type} onChange={setType} options={[all('Type'), ...['midterm', 'final', 'quiz', 'supplementary', 'practice'].map(t => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))]} />
        </div>
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}
      {fileError && <p className="text-sm text-red-500 mb-3">{fileError}</p>}
      {loading ? <PageLoader /> : (
        <>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">{filtered.length} examinations found</p>
          <div className="space-y-3">
            {filtered.map(e => {
              const c = courseById(e.course_id);
              const qn = data?.counts[e.id] ?? 0;
              const saved = isBookmarked('exam', e.id);
              return (
                <Card key={e.id} className="p-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: c?.cover_color }}>{String(e.exam_year).slice(-2)}</div>
                    <div className="flex-1 min-w-[12rem]">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">{e.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={e.exam_type === 'final' ? 'accent' : 'info'}>{e.exam_type}</Badge>
                        <span className="text-xs text-[var(--text-tertiary)]">{c?.code} · {e.exam_year}{e.semester_label ? ` · ${e.semester_label}` : ''}</span>
                        {e.has_answers && <Badge variant="success">Answers available</Badge>}
                        {e.has_explanations && <Badge variant="success">Explanations</Badge>}
                        {qn > 0 && <Badge variant="accent">{qn} interactive questions</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleBookmark('exam', e.id)} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]" aria-label="Bookmark exam">
                        {saved ? <BookmarkCheck className="w-4 h-4 text-[var(--accent)]" /> : <Bookmark className="w-4 h-4 text-[var(--text-tertiary)]" />}
                      </button>
                      {e.file_path && <Button size="sm" variant="secondary" onClick={() => open(e.file_path)}>Paper</Button>}
                      {e.answers_file_path && <Button size="sm" variant="secondary" onClick={() => open(e.answers_file_path)}>Answers</Button>}
                      {qn > 0 && <Button size="sm" onClick={() => navigate(`/quiz/${e.course_id}?exam=${e.id}&mode=practice`)}>Practice</Button>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {filtered.length === 0 && !error && <EmptyState icon={<FileText className="w-8 h-8" />} title="No examinations found" description="Try adjusting your filters." />}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz engine — practice mode (instant feedback) and exam mode (timed)
// ---------------------------------------------------------------------------
const SECONDS_PER_QUESTION = 90;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function QuizEngine() {
  const { courseId } = useParams();
  const [params] = useSearchParams();
  const examId = params.get('exam');
  const mode: 'practice' | 'exam' = params.get('mode') === 'exam' ? 'exam' : 'practice';
  const navigate = useNavigate();
  const { user, logActivity, isBookmarked, toggleBookmark, bookmarks } = useApp();
  const { courseById } = useCatalog();
  const isSaved = courseId === 'saved';
  const course = courseById(courseId);

  const { data: questions, loading, error, reload } = useAsync(async () => {
    let q = supabase.from('questions').select('*').eq('is_published', true);
    if (isSaved) {
      const ids = bookmarks.filter(b => b.item_type === 'question').map(b => b.item_id);
      if (!ids.length) return [] as Question[];
      q = q.in('id', ids);
    } else {
      q = q.eq('course_id', courseId!);
      if (examId) q = q.eq('exam_id', examId);
    }
    return (await unwrap<Question[]>(q.order('order_index').order('created_at') as any)) ?? [];
  }, [courseId, examId]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [review, setReview] = useState(false);
  const [saveError, setSaveError] = useState('');
  const startedAt = useRef(Date.now());
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const qs = questions ?? [];
  const totalPoints = qs.reduce((s, q) => s + q.points, 0);
  const [remaining, setRemaining] = useState<number | null>(null);

  const scoreOf = useCallback((a: Record<string, string>) => qs.reduce((s, q) => s + (a[q.id] === q.correct_option_id ? q.points : 0), 0), [qs]);
  const score = useMemo(() => scoreOf(answers), [scoreOf, answers]);

  const finish = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    const finalAnswers = answersRef.current;
    const finalScore = scoreOf(finalAnswers);
    if (!user) return;
    const { error: err } = await supabase.from('quiz_attempts').insert({
      user_id: user.id, course_id: isSaved ? null : courseId, exam_id: examId, mode,
      question_ids: qs.map(q => q.id), answers: finalAnswers, score: finalScore, total_points: totalPoints,
      time_spent_seconds: Math.round((Date.now() - startedAt.current) / 1000),
    });
    if (err) setSaveError('Your result could not be saved: ' + err.message);
    else logActivity('quiz_attempted', isSaved ? null : courseId);
  }, [submitted, scoreOf, user, isSaved, courseId, examId, mode, qs, totalPoints, logActivity]);

  // start the clock once questions are loaded (exam mode)
  useEffect(() => {
    if (mode === 'exam' && qs.length) { setRemaining(qs.length * SECONDS_PER_QUESTION); startedAt.current = Date.now(); }
  }, [mode, qs.length]);
  useEffect(() => {
    if (mode !== 'exam' || submitted || remaining === null) return;
    if (remaining <= 0) { void finish(); return; }
    const t = setTimeout(() => setRemaining(r => (r === null ? r : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [mode, submitted, remaining, finish]);

  const restart = () => {
    setIndex(0); setAnswers({}); setFlagged(new Set()); setSubmitted(false); setReview(false); setSaveError('');
    startedAt.current = Date.now(); if (mode === 'exam') setRemaining(qs.length * SECONDS_PER_QUESTION);
  };
  const back = () => navigate(isSaved ? '/bookmarks' : `/course/${courseId}`);

  if (loading) return <PageLoader />;
  if (error) return <div className="max-w-3xl mx-auto p-8"><ErrorNote message={error} onRetry={reload} /></div>;
  if (!isSaved && !course) return <div className="p-8 text-center text-[var(--text-tertiary)]">Course not found</div>;
  if (qs.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <EmptyState icon={<FileText className="w-8 h-8" />} title="No questions available" description="There are no practice questions here yet." action={<Button onClick={back}>Go back</Button>} />
    </div>
  );

  const title = isSaved ? 'Saved questions' : course!.title;

  // ----- results -----
  if (submitted && !review) {
    const pct = totalPoints ? Math.round((score / totalPoints) * 100) : 0;
    const tone = pct >= 70
      ? { bg: 'bg-emerald-50 dark:bg-emerald-900/30', fg: 'text-emerald-500' }
      : pct >= 50 ? { bg: 'bg-amber-50 dark:bg-amber-900/30', fg: 'text-amber-500' }
      : { bg: 'bg-red-50 dark:bg-red-900/30', fg: 'text-red-500' };
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${tone.bg}`}>
            <Award className={`w-10 h-10 ${tone.fg}`} />
          </div>
          <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">{mode === 'exam' ? 'Exam complete' : 'Quiz complete'}</h2>
          <p className="text-[var(--text-tertiary)] mb-6">{title}</p>
          <div className="flex items-center justify-center gap-8 mb-8">
            <div><p className="text-4xl font-bold text-[var(--text-primary)]">{score}/{totalPoints}</p><p className="text-sm text-[var(--text-tertiary)]">Points</p></div>
            <div><p className="text-4xl font-bold text-[var(--text-primary)]">{pct}%</p><p className="text-sm text-[var(--text-tertiary)]">Score</p></div>
            <div><p className="text-4xl font-bold text-[var(--text-primary)]">{Object.keys(answers).length}/{qs.length}</p><p className="text-sm text-[var(--text-tertiary)]">Answered</p></div>
          </div>
          <ProgressBar value={pct} className="mb-6" color={pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e'} />
          {saveError && <p className="text-sm text-red-500 mb-4">{saveError}</p>}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="secondary" onClick={() => setReview(true)}>Review answers</Button>
            <Button onClick={restart}>Try again</Button>
            <Button variant="ghost" onClick={back}>{isSaved ? 'Back to saved' : 'Back to course'}</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ----- review -----
  if (submitted && review) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-[var(--text-primary)]">Answer review</h2>
          <Button variant="secondary" onClick={() => setReview(false)}>Back to results</Button>
        </div>
        <div className="space-y-6">
          {qs.map((q, i) => {
            const mine = answers[q.id];
            const ok = mine === q.correct_option_id;
            return (
              <Card key={q.id} className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-sm font-mono text-[var(--text-tertiary)]">Q{i + 1}</span>
                  <p className="flex-1 font-medium text-[var(--text-primary)]">{q.question_text}</p>
                  {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="space-y-2 mb-4">
                  {q.options.map(o => {
                    const cls = o.id === q.correct_option_id ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
                      : o.id === mine ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]';
                    return <div key={o.id} className={`p-3 rounded-lg border ${cls} text-sm text-[var(--text-primary)]`}>{o.text}{o.id === mine && ' (your answer)'}</div>;
                  })}
                </div>
                {!mine && <p className="text-xs text-amber-600 mb-2">Not answered</p>}
                {q.explanation && <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)]"><strong>Explanation:</strong> {q.explanation}</div>}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ----- active question -----
  const q = qs[index];
  const chosen = answers[q.id];
  const revealed = mode === 'practice' && !!chosen;
  const answeredCount = Object.keys(answers).length;
  const isLast = index === qs.length - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{isSaved ? 'Saved' : course!.code} · {mode === 'exam' ? 'Exam mode' : 'Practice'}</p>
          <h2 className="font-display text-xl text-[var(--text-primary)]">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'exam' && remaining !== null && (
            <span className={`flex items-center gap-1 text-sm font-mono ${remaining < 60 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}><Timer className="w-4 h-4" />{fmt(Math.max(0, remaining))}</span>
          )}
          <span className="text-sm text-[var(--text-tertiary)] hidden sm:inline">{answeredCount}/{qs.length} answered</span>
          <Button variant="ghost" size="sm" onClick={back}>Exit</Button>
        </div>
      </div>

      <div className="flex gap-1 mb-8">
        {qs.map((x, i) => (
          <button key={x.id} onClick={() => setIndex(i)} aria-label={`Question ${i + 1}`}
            className={`flex-1 h-1.5 rounded-full ${i === index ? 'bg-[var(--accent)]' : flagged.has(x.id) ? 'bg-amber-400' : answers[x.id] ? 'bg-[var(--accent)]/40' : 'bg-[var(--bg-tertiary)]'}`} />
        ))}
      </div>

      <Card className="p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <span className="text-sm font-mono text-[var(--text-tertiary)]">Question {index + 1} of {qs.length}</span>
          <div className="flex items-center gap-2">
            <Badge>{q.points} pts</Badge>
            <Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>{q.difficulty}</Badge>
            <button onClick={() => toggleBookmark('question', q.id)} aria-label="Save question" className="p-1 rounded hover:bg-[var(--bg-tertiary)]">
              {isBookmarked('question', q.id) ? <BookmarkCheck className="w-4 h-4 text-[var(--accent)]" /> : <Bookmark className="w-4 h-4 text-[var(--text-tertiary)]" />}
            </button>
          </div>
        </div>
        <p className="text-lg text-[var(--text-primary)] font-medium mb-8 leading-relaxed">{q.question_text}</p>
        <div className="space-y-3">
          {q.options.map((o, i) => {
            const selected = chosen === o.id;
            let cls = selected ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]';
            if (revealed) {
              if (o.id === q.correct_option_id) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
              else if (selected) cls = 'border-red-400 bg-red-50 dark:bg-red-900/20';
              else cls = 'border-[var(--border-primary)] bg-[var(--bg-secondary)] opacity-70';
            }
            return (
              <button key={o.id} disabled={revealed} onClick={() => setAnswers(a => ({ ...a, [q.id]: o.id }))}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${cls}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${selected && !revealed ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border-secondary)] text-[var(--text-tertiary)]'}`}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-[var(--text-primary)]">{o.text}</span>
                </div>
              </button>
            );
          })}
        </div>
        {revealed && (
          <div className="mt-6 p-4 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)] mb-1">{chosen === q.correct_option_id ? 'Correct!' : 'Not quite.'}</p>
            {q.explanation || 'No explanation has been added for this question.'}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(i => i - 1)}><ArrowLeft className="w-4 h-4" /> Previous</Button>
        <button onClick={() => setFlagged(p => { const n = new Set(p); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
          aria-label="Flag for review" className={`p-2.5 rounded-lg ${flagged.has(q.id) ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
          <Flag className="w-4 h-4" />
        </button>
        {!isLast
          ? <Button onClick={() => setIndex(i => i + 1)}>Next <ArrowRight className="w-4 h-4" /></Button>
          : <Button onClick={() => { if (answeredCount < qs.length && !window.confirm(`You've answered ${answeredCount} of ${qs.length} questions. Submit anyway?`)) return; void finish(); }} disabled={answeredCount === 0}>Submit</Button>}
      </div>
    </div>
  );
}
