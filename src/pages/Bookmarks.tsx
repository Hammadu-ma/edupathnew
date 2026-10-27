import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookOpen, FileText, HelpCircle, Library, Play, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { openFile, unwrap } from '../lib/db';
import { Badge, Button, Card, EmptyState, ErrorNote, PageLoader, Tabs } from '../components/ui/Primitives';
import type { BookmarkType, PastExam, Question, Resource } from '../types';

interface Item { key: string; type: BookmarkType; id: string; title: string; subtitle: string; badge: string; color: string; onOpen: () => void; }

export default function Bookmarks() {
  const { bookmarks, toggleBookmark } = useApp();
  const { courseById } = useCatalog();
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [openError, setOpenError] = useState('');

  const idsOf = (t: BookmarkType) => bookmarks.filter(b => b.item_type === t).map(b => b.item_id);
  const resIds = idsOf('resource'), examIds = idsOf('exam'), qIds = idsOf('question');
  const sig = [resIds, examIds, qIds].map(a => a.join(',')).join('|');

  const { data, loading, error, reload } = useAsync(async () => {
    const [resources, exams, questions] = await Promise.all([
      resIds.length ? unwrap<Resource[]>(supabase.from('resources').select('*').in('id', resIds) as any) : Promise.resolve([] as Resource[]),
      examIds.length ? unwrap<PastExam[]>(supabase.from('past_exams').select('*').in('id', examIds) as any) : Promise.resolve([] as PastExam[]),
      qIds.length ? unwrap<Question[]>(supabase.from('questions').select('*').in('id', qIds) as any) : Promise.resolve([] as Question[]),
    ]);
    return { resources: resources ?? [], exams: exams ?? [], questions: questions ?? [] };
  }, [sig]);

  const fail = (e: any) => setOpenError(e.message);
  const items: Item[] = [];
  bookmarks.filter(b => b.item_type === 'course').forEach(b => {
    const c = courseById(b.item_id);
    if (c) items.push({ key: b.id, type: 'course', id: c.id, title: c.title, subtitle: c.code, badge: 'Course', color: c.cover_color, onOpen: () => navigate(`/course/${c.id}`) });
  });
  (data?.resources ?? []).forEach(r => {
    const c = courseById(r.course_id);
    items.push({ key: 'r' + r.id, type: 'resource', id: r.id, title: r.title, subtitle: c?.code ?? '', badge: r.type, color: c?.cover_color ?? '#8b5cf6',
      onOpen: () => { setOpenError(''); if (r.file_path || r.external_url) openFile({ path: r.file_path, url: r.external_url }).catch(fail); else navigate(`/course/${r.course_id}`); } });
  });
  (data?.exams ?? []).forEach(e => {
    const c = courseById(e.course_id);
    items.push({ key: 'e' + e.id, type: 'exam', id: e.id, title: e.title, subtitle: `${c?.code ?? ''} · ${e.exam_year}`, badge: e.exam_type, color: c?.cover_color ?? '#8b5cf6',
      onOpen: () => { setOpenError(''); if (e.file_path) openFile({ path: e.file_path }).catch(fail); else navigate(`/course/${e.course_id}`); } });
  });
  (data?.questions ?? []).forEach(q => {
    const c = courseById(q.course_id);
    items.push({ key: 'q' + q.id, type: 'question', id: q.id, title: q.question_text, subtitle: c?.code ?? '', badge: 'Question', color: c?.cover_color ?? '#8b5cf6', onOpen: () => navigate('/quiz/saved?mode=practice') });
  });

  const icons: Record<BookmarkType, React.ElementType> = { course: BookOpen, resource: Library, exam: FileText, question: HelpCircle };
  const count = (t: BookmarkType) => items.filter(i => i.type === t).length;
  const shown = tab === 'all' ? items : items.filter(i => i.type === tab);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Saved Items</h1>
          <p className="text-[var(--text-tertiary)]">Your bookmarked courses, resources, exams and questions.</p>
        </div>
        {qIds.length > 0 && <Button onClick={() => navigate('/quiz/saved?mode=practice')}><Play className="w-4 h-4" /> Practice saved questions</Button>}
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}
      {openError && <p className="text-sm text-red-500 mb-3">{openError}</p>}
      {loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState icon={<Bookmark className="w-8 h-8" />} title="No saved items yet" description="Bookmark courses, resources, exams and questions to find them here."
          action={<Button onClick={() => navigate('/studies')}>Browse courses</Button>} />
      ) : (
        <>
          <Tabs activeTab={tab} onChange={setTab} tabs={[
            { id: 'all', label: 'All', count: items.length }, { id: 'course', label: 'Courses', count: count('course') }, { id: 'resource', label: 'Resources', count: count('resource') },
            { id: 'exam', label: 'Exams', count: count('exam') }, { id: 'question', label: 'Questions', count: count('question') },
          ]} />
          <div className="space-y-3 mt-6">
            {shown.map(it => {
              const Icon = icons[it.type];
              return (
                <Card key={it.key} hover className="p-4 flex items-center gap-4" onClick={it.onOpen}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: it.color + '20' }}><Icon className="w-5 h-5" style={{ color: it.color }} /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--text-primary)] truncate">{it.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-[var(--text-tertiary)]">{it.subtitle}</span><Badge>{it.badge}</Badge></div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleBookmark(it.type, it.id); }} aria-label="Remove bookmark"
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
