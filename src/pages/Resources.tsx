import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, SearchInput, Select, EmptyState, Button } from '../components/ui/Primitives';
import { courses, resources } from '../data/mockData';
import { BookOpen, FileText, Play, Download, ExternalLink, Bookmark, BookmarkCheck, Filter, Grid3X3, List } from 'lucide-react';

export default function Resources() {
  const { isBookmarked, addBookmark, removeBookmark, addProgress } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = resources.filter(r => r.is_published);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') result = result.filter(r => r.type === typeFilter);
    if (courseFilter !== 'all') result = result.filter(r => r.course_id === courseFilter);
    return result;
  }, [search, typeFilter, courseFilter]);

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'video', label: 'Videos' },
    { value: 'notes', label: 'Lecture Notes' },
    { value: 'textbook', label: 'Textbooks' },
    { value: 'guide', label: 'Study Guides' },
    { value: 'link', label: 'External Links' },
  ];

  const courseOptions = [
    { value: 'all', label: 'All Courses' },
    ...courses.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` })),
  ];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'link': return <ExternalLink className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'danger';
      case 'pdf': return 'info';
      case 'notes': return 'warning';
      case 'guide': return 'success';
      case 'textbook': return 'accent';
      case 'link': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Resource Library</h1>
        <p className="text-[var(--text-tertiary)]">Browse and access learning materials across all your courses.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search resources..." className="flex-1" />
        <Select label="" options={typeOptions} value={typeFilter} onChange={setTypeFilter} className="sm:w-48" />
        <Select label="" options={courseOptions} value={courseFilter} onChange={setCourseFilter} className="sm:w-56" />
      </div>

      <p className="text-sm text-[var(--text-tertiary)] mb-4">{filtered.length} resources found</p>

      {/* Resource grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(res => {
          const course = courses.find(c => c.id === res.course_id);
          const bookmarked = isBookmarked('resource', res.id);
          return (
            <Card key={res.id} hover className="flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={getTypeColor(res.type) as any}>
                    <span className="flex items-center gap-1">{getResourceIcon(res.type)} {res.type}</span>
                  </Badge>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (bookmarked) removeBookmark('resource', res.id); else addBookmark('resource', res.id); }}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    {bookmarked ? <BookmarkCheck className="w-4 h-4 text-[var(--accent)]" /> : <Bookmark className="w-4 h-4 text-[var(--text-tertiary)]" />}
                  </button>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-2">{res.title}</h3>
                <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">{res.description}</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: course?.cover_color }} />
                  <span className="text-xs text-[var(--text-tertiary)]">{course?.code}</span>
                  {res.file_size && <span className="text-xs text-[var(--text-tertiary)] ml-auto">{(res.file_size / 1000000).toFixed(1)} MB</span>}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-[var(--border-primary)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-tertiary)]">{new Date(res.created_at).toLocaleDateString()}</span>
                <Button size="sm" variant="ghost" onClick={() => addProgress(res.course_id, 'opened', res.id)}>
                  {res.type === 'video' ? 'Watch' : res.type === 'link' ? 'Open' : 'View'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No resources found" description="Try adjusting your search or filters." />
      )}
    </div>
  );
}
