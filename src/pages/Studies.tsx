import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Bookmark, BookmarkCheck, ChevronRight, Clock, FileText, Grid3X3, List, Play, Search, Timer } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { openFile, RESOURCE_TYPE_LABELS, unwrap } from '../lib/db';
import { matchesAcademic } from '../lib/academic';
import { Badge, Button, Card, EmptyState, ErrorNote, PageLoader, ProgressBar, SearchInput, Select, Tabs } from '../components/ui/Primitives';
import { ResourceCard } from '../components/ResourceCard';
import type { PastExam, Resource } from '../types';

export function MyStudies() {
  const { user } = useApp();
  const { courses, universities, programs, studyYears, terms, stats, pathLabel, loading } = useCatalog();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [scope, setScope] = useState<'mine' | 'browse'>('mine');
  const [uni, setUni] = useState('');
  const [prog, setProg] = useState('');
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');

  const mine = useMemo(() => courses.filter(c => matchesAcademic(c, user ?? {})), [courses, user]);

  const filtered = useMemo(() => {
    let r = scope === 'mine' ? mine : courses;
    if (scope === 'browse') {
      if (uni) r = r.filter(c => c.university_id === uni);
      if (prog) r = r.filter(c => c.program_id === prog);
      if (year) r = r.filter(c => c.study_year_id === year);
      if (term) r = r.filter(c => c.term_id === term);
    }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    return r;
  }, [scope, mine, courses, uni, prog, year, term, search]);

  const all = (label: string) => ({ value: '', label });
  const progOpts = programs.filter(p => !uni || p.university_id === uni);
  const yearOpts = studyYears.filter(y => !prog || y.program_id === prog);
  const termOpts = terms.filter(t => !year || t.study_year_id === year);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">My Studies</h1>
        <p className="text-[var(--text-tertiary)]">Your academic workspace — courses, resources, and assessments.</p>
      </div>

      <Tabs tabs={[{ id: 'mine', label: 'My courses', count: mine.length }, { id: 'browse', label: 'Browse all', count: courses.length }]}
        activeTab={scope} onChange={id => setScope(id as 'mine' | 'browse')} />

      <div className="mt-6 space-y-3 mb-6">
        {scope === 'browse' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={uni} onChange={v => { setUni(v); setProg(''); setYear(''); setTerm(''); }} options={[all('All universities'), ...universities.map(u => ({ value: u.id, label: u.name }))]} />
            <Select value={prog} onChange={v => { setProg(v); setYear(''); setTerm(''); }} options={[all('All programs'), ...progOpts.map(p => ({ value: p.id, label: p.name }))]} />
            <Select value={year} onChange={v => { setYear(v); setTerm(''); }} options={[all('All years'), ...yearOpts.map(y => ({ value: y.id, label: y.name }))]} />
            <Select value={term} onChange={setTerm} options={[all('All semesters / bundles'), ...termOpts.map(t => ({ value: t.id, label: t.name }))]} />
          </div>
        )}
        <div className="flex gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search courses..." className="flex-1" />
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
              className={`p-2.5 rounded-lg border transition-colors ${view === v ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-primary)] text-[var(--text-tertiary)]'}`}>
              {v === 'grid' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
        {filtered.map(c => view === 'grid' ? (
          <Card key={c.id} hover onClick={() => navigate(`/course/${c.id}`)} className="overflow-hidden group">
            <div className="h-28 relative" style={{ background: `linear-gradient(135deg, ${c.cover_color}ee, ${c.cover_color}88)` }}>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-display text-white/25">{c.code}</span></div>
              {c.credits ? <div className="absolute bottom-3 left-3"><Badge className="bg-white/20 text-white">{c.credits} credits</Badge></div> : null}
            </div>
            <div className="p-5">
              <p className="text-xs font-mono text-[var(--text-tertiary)] mb-1">{c.code}</p>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors">{c.title}</h3>
              <p className="text-[11px] text-[var(--text-tertiary)] mb-3 truncate">{pathLabel(c)}</p>
              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{stats[c.id].resource_count}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{stats[c.id].exam_count}</span>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:text-[var(--accent)]" />
              </div>
            </div>
          </Card>
        ) : (
          <Card key={c.id} hover onClick={() => navigate(`/course/${c.id}`)} className="p-4 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.cover_color }}>{c.code.slice(0, 2)}</div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono text-[var(--text-tertiary)]">{c.code}</span>
              <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">{c.title}</h3>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">{pathLabel(c)}</p>
            </div>
            <div className="hidden sm:flex gap-4 text-xs text-[var(--text-tertiary)]">
              <span>{stats[c.id].resource_count} resources</span><span>{stats[c.id].exam_count} exams</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState icon={<Search className="w-8 h-8" />} title="No courses found"
          description={scope === 'mine' ? 'No courses match your academic details yet. Try "Browse all" or update your profile.' : 'Try adjusting your search or filters.'}
          action={scope === 'mine' ? <Button variant="secondary" onClick={() => setScope('browse')}>Browse all courses</Button> : undefined} />
      )}
    </div>
  );
}

export function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, completions } = useApp();
  const { courseById, stats, pathLabel, loading: catalogLoading } = useCatalog();
  const [tab, setTab] = useState('overview');
  const course = courseById(id);

  const { data, loading, error, reload } = useAsync(async () => {
    const [resources, exams, qs] = await Promise.all([
      unwrap<Resource[]>(supabase.from('resources').select('*').eq('course_id', id!).eq('is_published', true).order('created_at', { ascending: false }) as any),
      unwrap<PastExam[]>(supabase.from('past_exams').select('*').eq('course_id', id!).eq('is_published', true).order('exam_year', { ascending: false }) as any),
      unwrap<{ exam_id: string | null }[]>(supabase.from('questions').select('exam_id').eq('course_id', id!).eq('is_published', true) as any),
    ]);
    const perExam: Record<string, number> = {};
    (qs ?? []).forEach(q => { if (q.exam_id) perExam[q.exam_id] = (perExam[q.exam_id] ?? 0) + 1; });
    return { resources: resources ?? [], exams: exams ?? [], questionCount: (qs ?? []).length, perExam };
  }, [id]);

  if (catalogLoading) return <PageLoader />;
  if (!course) return <div className="p-8 text-center text-[var(--text-tertiary)]">Course not found</div>;

  const resources = data?.resources ?? [];
  const exams = data?.exams ?? [];
  const questionCount = data?.questionCount ?? 0;
  const bookmarked = isBookmarked('course', course.id);
  const doneCount = completions.filter(c => c.course_id === course.id).length;
  const pct = resources.length ? Math.round((doneCount / resources.length) * 100) : 0;

  // group materials: notes, books, PDFs, videos, ...
  const order = ['notes', 'slides', 'book', 'pdf', 'video', 'guide', 'link', 'other'];
  const groups = order.map(t => ({ type: t, items: resources.filter(r => r.type === t) })).filter(g => g.items.length);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'materials', label: 'Materials', count: resources.length },
    { id: 'quizzes', label: 'Quizzes', count: questionCount },
    { id: 'exams', label: 'Past Exams', count: exams.length },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative h-48 sm:h-60 overflow-hidden" style={{ background: `linear-gradient(135deg, ${course.cover_color}, ${course.cover_color}bb)` }}>
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-8xl font-display text-white/10">{course.code}</span></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <button onClick={() => navigate('/studies')} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"><ArrowLeft className="w-4 h-4" /> Back to Studies</button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-mono text-white/70 mb-1">{course.code}{course.credits ? ` · ${course.credits} credits` : ''}</p>
              <h1 className="font-display text-3xl sm:text-4xl text-white">{course.title}</h1>
              <p className="text-xs text-white/60 mt-1">{pathLabel(course)}</p>
            </div>
            <button onClick={() => toggleBookmark('course', course.id)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 flex-shrink-0" aria-label="Bookmark course">
              {bookmarked ? <BookmarkCheck className="w-5 h-5 text-white" /> : <Bookmark className="w-5 h-5 text-white/70" />}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />
        <div className="mt-8">
          {error && <ErrorNote message={error} onRetry={reload} />}
          {loading && <PageLoader />}

          {!loading && !error && tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="font-display text-2xl text-[var(--text-primary)] mb-4">About this course</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">{course.description || 'No description has been added yet.'}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[{ i: BookOpen, v: stats[course.id].resource_count, l: 'Materials' }, { i: FileText, v: stats[course.id].exam_count, l: 'Past exams' }, { i: Clock, v: course.credits ?? '—', l: 'Credits' }].map(s => (
                    <div key={s.l} className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                      <s.i className="w-5 h-5 text-[var(--accent)] mb-2" />
                      <p className="text-lg font-semibold text-[var(--text-primary)]">{s.v}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Card className="p-5 h-fit">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">Your progress</h3>
                <ProgressBar value={pct} className="mb-2" />
                <p className="text-xs text-[var(--text-tertiary)] mb-4">{doneCount} of {resources.length} materials completed</p>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start" onClick={() => setTab('materials')}><BookOpen className="w-4 h-4" /> Browse materials</Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => setTab('exams')}><FileText className="w-4 h-4" /> Past exams</Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => setTab('quizzes')}><Play className="w-4 h-4" /> Practice quizzes</Button>
                </div>
              </Card>
            </div>
          )}

          {!loading && !error && tab === 'materials' && (
            groups.length === 0
              ? <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No materials yet" description="Lecture notes, books, PDFs and videos will appear here." />
              : <div className="space-y-8">
                  {groups.map(g => (
                    <section key={g.type}>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-3">{RESOURCE_TYPE_LABELS[g.type]} <span className="text-[var(--text-tertiary)] font-normal">({g.items.length})</span></h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {g.items.map(r => <ResourceCard key={r.id} resource={r} />)}
                      </div>
                    </section>
                  ))}
                </div>
          )}

          {!loading && !error && tab === 'quizzes' && (
            questionCount === 0
              ? <EmptyState icon={<Play className="w-8 h-8" />} title="No questions yet" description="Practice questions for this course haven't been added." />
              : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center mb-4"><Play className="w-6 h-6 text-[var(--accent)]" /></div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Practice mode</h3>
                    <p className="text-sm text-[var(--text-tertiary)] mb-4">Instant feedback and explanations after every question. {questionCount} questions.</p>
                    <Button onClick={() => navigate(`/quiz/${course.id}?mode=practice`)}>Start practice</Button>
                  </Card>
                  <Card className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4"><Timer className="w-6 h-6 text-amber-500" /></div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Exam mode</h3>
                    <p className="text-sm text-[var(--text-tertiary)] mb-4">Timed, no feedback until you submit — just like the real thing.</p>
                    <Button variant="secondary" onClick={() => navigate(`/quiz/${course.id}?mode=exam`)}>Start timed exam</Button>
                  </Card>
                </div>
          )}

          {!loading && !error && tab === 'exams' && (
            exams.length === 0
              ? <EmptyState icon={<FileText className="w-8 h-8" />} title="No exams available" description="Past examinations will appear here when published." />
              : <div className="space-y-3">
                  {exams.map(e => (
                    <Card key={e.id} className="p-5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: course.cover_color }}>{String(e.exam_year).slice(-2)}</div>
                        <div className="flex-1 min-w-[12rem]">
                          <h4 className="font-medium text-[var(--text-primary)]">{e.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant={e.exam_type === 'final' ? 'accent' : 'info'}>{e.exam_type}</Badge>
                            <span className="text-xs text-[var(--text-tertiary)]">{e.exam_year}{e.semester_label ? ` · ${e.semester_label}` : ''}</span>
                            {e.has_answers && <Badge variant="success">Answers</Badge>}
                            {e.has_explanations && <Badge variant="success">Explanations</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {e.file_path && <Button size="sm" variant="secondary" onClick={() => openFile({ path: e.file_path }).catch(err => alert(err.message))}>Paper</Button>}
                          {e.answers_file_path && <Button size="sm" variant="secondary" onClick={() => openFile({ path: e.answers_file_path }).catch(err => alert(err.message))}>Answers</Button>}
                          {(data?.perExam[e.id] ?? 0) > 0 && <Button size="sm" onClick={() => navigate(`/quiz/${course.id}?exam=${e.id}&mode=practice`)}>Practice</Button>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
          )}
        </div>
      </div>
    </div>
  );
}
