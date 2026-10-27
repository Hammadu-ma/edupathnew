import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock, FileText, Library, Play, Sparkles, Target, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/db';
import { matchesAcademic } from '../lib/academic';
import { Badge, Card, ErrorNote, PageLoader, ProgressBar } from '../components/ui/Primitives';
import type { Activity, Resource } from '../types';

const ACTION_LABEL: Record<string, string> = { opened: 'Opened', downloaded: 'Downloaded', completed: 'Completed', quiz_attempted: 'Took a quiz' };

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export default function Home() {
  const { user, completions, bookmarks } = useApp();
  const { courses, stats, courseById, pathLabel, loading: catalogLoading } = useCatalog();
  const navigate = useNavigate();

  const myCourses = courses.filter(c => matchesAcademic(c, user ?? {}));
  const myIds = myCourses.map(c => c.id);

  const { data, loading, error, reload } = useAsync(async () => {
    const activity = await unwrap<Activity[]>(
      supabase.from('study_activity').select('*, resource:resources(id,title,type)').order('created_at', { ascending: false }).limit(8) as any);
    let recs: Resource[] = [];
    if (myIds.length) {
      recs = await unwrap<Resource[]>(
        supabase.from('resources').select('*').in('course_id', myIds).eq('is_published', true).order('created_at', { ascending: false }).limit(30) as any);
    }
    return { activity: activity ?? [], recs: recs ?? [] };
  }, [myIds.join(',')]);

  if (catalogLoading || loading) return <PageLoader />;
  if (error) return <div className="p-8"><ErrorNote message={error} onRetry={reload} /></div>;

  const activity = data?.activity ?? [];
  const lastCourseId = activity.find(a => a.course_id && courseById(a.course_id))?.course_id;
  const featured = courseById(lastCourseId) ?? myCourses[0];
  const doneIds = new Set(completions.map(c => c.resource_id));
  const recs = (data?.recs ?? []).filter(r => !doneIds.has(r.id)).slice(0, 3);
  const progressFor = (courseId: string) => {
    const total = stats[courseId].resource_count;
    return total ? Math.round((completions.filter(c => c.course_id === courseId).length / total) * 100) : 0;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const totalResources = myCourses.reduce((s, c) => s + stats[c.id].resource_count, 0);
  const totalExams = myCourses.reduce((s, c) => s + stats[c.id].exam_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-[var(--accent)] mb-2 tracking-wide uppercase">{greeting}</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[var(--text-primary)] leading-[1.1] mb-3">
              {user?.full_name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-lg text-[var(--text-tertiary)] max-w-lg">
              {myCourses.length > 0 ? `You have ${myCourses.length} course${myCourses.length === 1 ? '' : 's'} in your program. Let's make today count.` : 'No courses match your academic details yet.'}
            </p>
          </div>
          <button onClick={() => navigate('/studies')} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:brightness-110 shadow-sm self-start">
            <Play className="w-4 h-4" /> Browse courses
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'My Courses', value: myCourses.length, icon: BookOpen, color: 'text-lilac-500' },
            { label: 'Materials Completed', value: `${completions.length}/${totalResources}`, icon: Library, color: 'text-sky-500' },
            { label: 'Past Exams', value: totalExams, icon: FileText, color: 'text-emerald-500' },
            { label: 'Saved Items', value: bookmarks.length, icon: Clock, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {featured && (
        <section className="mb-12">
          <h2 className="font-display text-2xl text-[var(--text-primary)] mb-6">Continue learning</h2>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow" hover onClick={() => navigate(`/course/${featured.id}`)}>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 h-40 md:h-auto relative flex-shrink-0" style={{ background: `linear-gradient(135deg, ${featured.cover_color}, ${featured.cover_color}cc)` }}>
                <div className="absolute inset-0 flex items-center justify-center"><p className="text-4xl font-display text-white/30">{featured.code}</p></div>
              </div>
              <div className="flex-1 p-6">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">{pathLabel(featured)}</p>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{featured.title}</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4 line-clamp-2">{featured.description}</p>
                <ProgressBar value={progressFor(featured.id)} className="mb-2" />
                <p className="text-xs text-[var(--text-tertiary)] mb-4">{progressFor(featured.id)}% of materials completed</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">Resume studying <ArrowRight className="w-4 h-4" /></span>
              </div>
            </div>
          </Card>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Your courses</h2>
            <button onClick={() => navigate('/studies')} className="text-sm text-[var(--accent)] font-medium flex items-center gap-1">All courses <ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myCourses.slice(0, 4).map(c => (
              <Card key={c.id} hover onClick={() => navigate(`/course/${c.id}`)} className="overflow-hidden group">
                <div className="h-2" style={{ backgroundColor: c.cover_color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">{c.code}</span>
                    {c.credits ? <Badge>{c.credits} cr</Badge> : null}
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors">{c.title}</h3>
                  <ProgressBar value={progressFor(c.id)} className="mb-2" />
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{stats[c.id].resource_count}</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{stats[c.id].exam_count}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {myCourses.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">Update your university, program and year in your profile to see your courses.</p>}
        </div>

        <div>
          <h2 className="font-display text-2xl text-[var(--text-primary)] mb-6">Recent activity</h2>
          <div className="space-y-3">
            {activity.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">Nothing yet — open a resource or take a quiz to get started.</p>}
            {activity.slice(0, 5).map(a => {
              const course = courseById(a.course_id);
              return (
                <Card key={a.id} hover className="p-4" onClick={() => a.course_id && navigate(`/course/${a.course_id}`)}>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ACTION_LABEL[a.action]}{a.resource ? ` · ${a.resource.title}` : ''}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{course?.code} · {timeAgo(a.created_at)}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {recs.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6"><Sparkles className="w-5 h-5 text-[var(--accent)]" /><h2 className="font-display text-2xl text-[var(--text-primary)]">Recommended for you</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map(r => {
              const c = courseById(r.course_id);
              return (
                <Card key={r.id} hover className="p-5" onClick={() => navigate(`/course/${r.course_id}`)}>
                  <Badge variant="info" className="mb-3">{r.type}</Badge>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">{r.title}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">{r.description}</p>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: c?.cover_color }} /><span className="text-xs text-[var(--text-tertiary)]">{c?.code}</span></div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <button onClick={() => navigate('/progress')} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
        <Target className="w-4 h-4" /> View your progress & goals <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
