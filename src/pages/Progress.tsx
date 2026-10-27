import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, Plus, Target, Trash2, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/db';
import { matchesAcademic } from '../lib/academic';
import { Badge, Button, Card, EmptyState, ErrorNote, Input, PageLoader, ProgressBar, Select } from '../components/ui/Primitives';
import type { Goal, QuizAttempt } from '../types';

export default function Progress() {
  const { user, completions } = useApp();
  const { courses, stats, courseById } = useCatalog();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<Goal['kind']>('resources');
  const [target, setTarget] = useState('5');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, loading, error, reload } = useAsync(async () => {
    const since = new Date(Date.now() - 6 * 86400000); since.setHours(0, 0, 0, 0);
    const [attempts, activity, goals] = await Promise.all([
      unwrap<QuizAttempt[]>(supabase.from('quiz_attempts').select('*').order('completed_at', { ascending: false }).limit(100) as any),
      unwrap<{ created_at: string }[]>(supabase.from('study_activity').select('created_at').gte('created_at', since.toISOString()) as any),
      unwrap<Goal[]>(supabase.from('learning_goals').select('*').order('created_at', { ascending: false }) as any),
    ]);
    return { attempts: attempts ?? [], activity: activity ?? [], goals: goals ?? [] };
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <div className="p-8"><ErrorNote message={error} onRetry={reload} /></div>;

  const attempts = data?.attempts ?? [];
  const goals = data?.goals ?? [];
  const pct = (a: QuizAttempt) => (a.total_points ? Math.round((a.score / a.total_points) * 100) : 0);
  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + pct(a), 0) / attempts.length) : 0;
  const myCourses = courses.filter(c => matchesAcademic(c, user ?? {}));

  // activity per day for the last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const n = (data?.activity ?? []).filter(a => { const t = new Date(a.created_at); return t >= d && t < next; }).length;
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), n };
  });
  const maxDay = Math.max(1, ...days.map(d => d.n));

  const goalProgress = (g: Goal) => {
    const since = new Date(g.created_at).getTime();
    if (g.kind === 'resources') return completions.filter(c => new Date(c.completed_at).getTime() >= since).length;
    if (g.kind === 'quizzes') return attempts.filter(a => new Date(a.completed_at).getTime() >= since).length;
    return g.is_done ? g.target : 0;
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) { setFormError('Give your goal a title.'); return; }
    setBusy(true); setFormError('');
    const { error: err } = await supabase.from('learning_goals').insert({
      user_id: user.id, title: title.trim(), kind, target: kind === 'custom' ? 1 : Math.max(1, Number(target) || 1), due_date: due || null,
    });
    setBusy(false);
    if (err) { setFormError(err.message); return; }
    setTitle(''); setDue(''); reload();
  };
  const toggleDone = async (g: Goal) => { await supabase.from('learning_goals').update({ is_done: !g.is_done }).eq('id', g.id); reload(); };
  const removeGoal = async (g: Goal) => { await supabase.from('learning_goals').delete().eq('id', g.id); reload(); };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Progress</h1>
        <p className="text-[var(--text-tertiary)]">Your study activity, completed materials, quiz results and goals.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { i: CheckCircle2, c: 'text-emerald-500', v: completions.length, l: 'Materials completed' },
          { i: Award, c: 'text-lilac-500', v: attempts.length, l: 'Quizzes taken' },
          { i: TrendingUp, c: 'text-sky-500', v: attempts.length ? `${avg}%` : '—', l: 'Average score' },
          { i: Target, c: 'text-amber-500', v: goals.filter(g => g.is_done || goalProgress(g) >= g.target).length + `/${goals.length}`, l: 'Goals reached' },
        ].map(s => (
          <Card key={s.l} className="p-4"><s.i className={`w-5 h-5 ${s.c} mb-2`} /><p className="text-2xl font-semibold text-[var(--text-primary)]">{s.v}</p><p className="text-xs text-[var(--text-tertiary)]">{s.l}</p></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Last 7 days</h2>
            <div className="flex items-end gap-3 h-32">
              {days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <span className="text-[10px] text-[var(--text-tertiary)]">{d.n || ''}</span>
                  <div className="w-full rounded-t-md bg-[var(--accent)]" style={{ height: `${Math.max(4, (d.n / maxDay) * 100)}%`, opacity: d.n ? 1 : 0.2 }} />
                  <span className="text-[10px] text-[var(--text-tertiary)]">{d.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Course progress</h2>
            {myCourses.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">No courses to track yet.</p> : (
              <div className="space-y-4">
                {myCourses.map(c => {
                  const total = stats[c.id].resource_count;
                  const done = completions.filter(x => x.course_id === c.id).length;
                  return (
                    <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="block w-full text-left">
                      <div className="flex justify-between text-sm mb-1.5"><span className="text-[var(--text-primary)] font-medium">{c.code} · {c.title}</span><span className="text-[var(--text-tertiary)]">{done}/{total}</span></div>
                      <ProgressBar value={total ? (done / total) * 100 : 0} color={c.cover_color} />
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Quiz results</h2>
            {attempts.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">Take a practice quiz to see your results here.</p> : (
              <div className="divide-y divide-[var(--border-primary)]">
                {attempts.slice(0, 8).map(a => {
                  const c = courseById(a.course_id); const p = pct(a);
                  return (
                    <div key={a.id} className="py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c ? `${c.code} · ${c.title}` : 'Saved questions'}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{new Date(a.completed_at).toLocaleString()} · {a.mode}</p>
                      </div>
                      <Badge variant={p >= 70 ? 'success' : p >= 50 ? 'warning' : 'danger'}>{a.score}/{a.total_points} · {p}%</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Learning goals</h2>
            <form onSubmit={addGoal} className="space-y-3 mb-6">
              <Input placeholder="e.g. Finish OS notes" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={kind} onChange={v => setKind(v as Goal['kind'])} options={[{ value: 'resources', label: 'Complete materials' }, { value: 'quizzes', label: 'Take quizzes' }, { value: 'custom', label: 'Custom (tick off)' }]} />
                {kind !== 'custom' ? <Input type="number" min={1} value={target} onChange={e => setTarget(e.target.value)} /> : <div />}
              </div>
              <Input type="date" value={due} onChange={e => setDue(e.target.value)} />
              {formError && <p className="text-xs text-red-500">{formError}</p>}
              <Button type="submit" size="sm" className="w-full" loading={busy}><Plus className="w-4 h-4" /> Add goal</Button>
            </form>
            {goals.length === 0 ? <EmptyState icon={<Target className="w-6 h-6" />} title="No goals yet" description="Set a goal to stay on track." /> : (
              <div className="space-y-4">
                {goals.map(g => {
                  const cur = Math.min(goalProgress(g), g.target); const done = g.is_done || cur >= g.target;
                  return (
                    <div key={g.id}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${done ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>{g.title}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{g.kind === 'custom' ? 'Manual' : `${cur}/${g.target}`}{g.due_date ? ` · due ${new Date(g.due_date).toLocaleDateString()}` : ''}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {g.kind === 'custom' && <button onClick={() => toggleDone(g)} className="p-1 rounded hover:bg-[var(--bg-tertiary)]" aria-label="Toggle done"><CheckCircle2 className={`w-4 h-4 ${g.is_done ? 'text-emerald-500' : 'text-[var(--text-tertiary)]'}`} /></button>}
                          <button onClick={() => removeGoal(g)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-red-500" aria-label="Delete goal"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {g.kind !== 'custom' && <ProgressBar value={cur} max={g.target} color={done ? '#10b981' : undefined} />}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
