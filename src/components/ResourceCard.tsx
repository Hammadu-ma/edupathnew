import React, { useState } from 'react';
import { BookOpen, Bookmark, BookmarkCheck, CheckCircle2, Circle, Download, ExternalLink, FileText, Play } from 'lucide-react';
import { Badge, Card } from './ui/Primitives';
import { useApp } from '../contexts/AppContext';
import { formatSize, openFile } from '../lib/db';
import type { Resource } from '../types';

const variantFor = (t: string) =>
  ({ video: 'danger', pdf: 'info', notes: 'warning', guide: 'success', book: 'accent', slides: 'info' } as Record<string, any>)[t] || 'default';

export function ResourceIcon({ type, className = 'w-4 h-4' }: { type: string; className?: string }) {
  if (type === 'video') return <Play className={className} />;
  if (type === 'link') return <ExternalLink className={className} />;
  if (type === 'pdf') return <FileText className={className} />;
  return <BookOpen className={className} />;
}

export function ResourceCard({ resource, courseLabel, courseColor }: { resource: Resource; courseLabel?: string; courseColor?: string }) {
  const { isBookmarked, toggleBookmark, isCompleted, toggleCompleted, logActivity } = useApp();
  const [error, setError] = useState('');
  const bookmarked = isBookmarked('resource', resource.id);
  const done = isCompleted(resource.id);
  const hasFile = !!resource.file_path;
  const hasLink = !!resource.external_url;

  const open = async (download = false) => {
    setError('');
    try {
      await openFile({ path: resource.file_path, url: download ? null : resource.external_url, download });
      logActivity(download ? 'downloaded' : 'opened', resource.course_id, resource.id);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <Card className="flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={variantFor(resource.type)}>
            <span className="flex items-center gap-1"><ResourceIcon type={resource.type} className="w-3 h-3" /> {resource.type}</span>
          </Badge>
          <div className="flex items-center gap-1">
            <button onClick={() => toggleCompleted(resource.id, resource.course_id)} title={done ? 'Mark as not done' : 'Mark as completed'}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
              {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-[var(--text-tertiary)]" />}
            </button>
            <button onClick={() => toggleBookmark('resource', resource.id)} title="Bookmark" className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
              {bookmarked ? <BookmarkCheck className="w-4 h-4 text-[var(--accent)]" /> : <Bookmark className="w-4 h-4 text-[var(--text-tertiary)]" />}
            </button>
          </div>
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-2">{resource.title}</h3>
        {resource.description && <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">{resource.description}</p>}
        <div className="flex items-center gap-2">
          {courseLabel && <>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: courseColor }} />
            <span className="text-xs text-[var(--text-tertiary)]">{courseLabel}</span>
          </>}
          {resource.file_size ? <span className="text-xs text-[var(--text-tertiary)] ml-auto">{formatSize(resource.file_size)}</span> : null}
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
      <div className="px-5 py-3 border-t border-[var(--border-primary)] flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--text-tertiary)]">{new Date(resource.created_at).toLocaleDateString()}</span>
        <div className="flex gap-1">
          {(hasFile || hasLink) && (
            <button onClick={() => open(false)} className="px-3 py-1.5 text-sm rounded-lg font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)]">
              {resource.type === 'video' ? 'Watch' : hasLink && !hasFile ? 'Open' : 'View'}
            </button>
          )}
          {hasFile && (
            <button onClick={() => open(true)} className="px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" title="Download">
              <Download className="w-4 h-4" />
            </button>
          )}
          {!hasFile && !hasLink && <span className="text-xs text-[var(--text-tertiary)] py-1.5">No file yet</span>}
        </div>
      </div>
    </Card>
  );
}
