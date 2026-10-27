import React, { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/db';
import { EmptyState, ErrorNote, PageLoader, SearchInput, Select } from '../components/ui/Primitives';
import { ResourceCard } from '../components/ResourceCard';
import type { Resource } from '../types';

export default function Resources() {
  const { courses, courseById } = useCatalog();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [courseId, setCourseId] = useState('all');

  const { data, loading, error, reload } = useAsync(
    () => unwrap<Resource[]>(supabase.from('resources').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(500) as any),
    [],
  );

  const filtered = useMemo(() => {
    let r = (data ?? []).filter(x => courseById(x.course_id)); // only resources of published courses
    if (search) { const q = search.toLowerCase(); r = r.filter(x => x.title.toLowerCase().includes(q) || x.description?.toLowerCase().includes(q)); }
    if (type !== 'all') r = r.filter(x => x.type === type);
    if (courseId !== 'all') r = r.filter(x => x.course_id === courseId);
    return r;
  }, [data, search, type, courseId, courseById]);

  const typeOptions = [
    { value: 'all', label: 'All types' }, { value: 'notes', label: 'Lecture notes' }, { value: 'book', label: 'Books' },
    { value: 'pdf', label: 'PDFs' }, { value: 'video', label: 'Videos' }, { value: 'slides', label: 'Slides' },
    { value: 'guide', label: 'Study guides' }, { value: 'link', label: 'Links' }, { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Resource Library</h1>
        <p className="text-[var(--text-tertiary)]">Search, view, download and bookmark learning materials across all courses.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search resources..." className="flex-1" />
        <Select options={typeOptions} value={type} onChange={setType} className="sm:w-44" />
        <Select options={[{ value: 'all', label: 'All courses' }, ...courses.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` }))]} value={courseId} onChange={setCourseId} className="sm:w-60" />
      </div>
      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading ? <PageLoader /> : (
        <>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">{filtered.length} resources found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(r => { const c = courseById(r.course_id); return <ResourceCard key={r.id} resource={r} courseLabel={c?.code} courseColor={c?.cover_color} />; })}
          </div>
          {filtered.length === 0 && !error && <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No resources found" description="Try adjusting your search or filters." />}
        </>
      )}
    </div>
  );
}
