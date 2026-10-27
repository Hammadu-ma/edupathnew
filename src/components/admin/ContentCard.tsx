import React from 'react';
import { BookOpen, ExternalLink, Pencil, Play, Trash2 } from 'lucide-react';
import { ACCESS_META, Access, ContentKind, gradientFor, initials } from '../../lib/content';

export interface CardData {
  id?: string;
  kind: ContentKind;
  title: string;
  thumbnail?: string | null;
  access: Access;
  published: boolean;
  attachment?: string | null;
  subject?: string | null;
  author?: string | null;
  source?: string | null;
}

export function AccessChip({ access, className = '' }: { access: Access; className?: string }) {
  const m = ACCESS_META[access];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${m.chip} ${className}`}>
      <m.icon className="w-3 h-3" />{m.label}
    </span>
  );
}

export function Thumb({ data, className = '' }: { data: Pick<CardData, 'kind' | 'title' | 'thumbnail'>; className?: string }) {
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => setBroken(false), [data.thumbnail]);
  const Icon = data.kind === 'video' ? Play : BookOpen;
  const bg = gradientFor(data.title || data.kind, data.kind);
  const img = data.thumbnail && !broken ? data.thumbnail : null;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: bg }}>
      {img && data.kind === 'video' && <img src={img} alt="" onError={() => setBroken(true)} className="absolute inset-0 w-full h-full object-cover" />}
      {img && data.kind === 'book' && (
        <>
          <img src={img} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <img src={img} alt="" onError={() => setBroken(true)} className="h-full aspect-[3/4] object-cover rounded-md shadow-2xl ring-1 ring-white/20" />
          </div>
        </>
      )}
      {!img && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg"><Icon className="w-7 h-7 text-white" /></div>
        </div>
      )}
      {img && data.kind === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur flex items-center justify-center"><Play className="w-5 h-5 text-white ml-0.5" /></div>
        </div>
      )}
    </div>
  );
}

interface Props {
  data: CardData;
  preview?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePublish?: () => void;
  onOpen?: () => void;
}

export function ContentCard({ data, preview, selected, onSelect, onEdit, onDelete, onTogglePublish, onOpen }: Props) {
  return (
    <div className={`group relative rounded-2xl border bg-[var(--bg-secondary)] overflow-hidden transition-all duration-200
      ${selected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-[var(--border-primary)]'} ${preview ? '' : 'hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5'}`}>
      <div className="relative">
        <Thumb data={data} className="aspect-video" />
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between">
          {onSelect ? (
            <button type="button" onClick={onSelect} aria-label={selected ? 'Deselect' : 'Select'}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-white/80 bg-black/20 opacity-0 group-hover:opacity-100'}`}>
              {selected && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white"><path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          ) : <span />}
          <AccessChip access={data.access} className="backdrop-blur-md bg-[var(--bg-secondary)]/85" />
        </div>
        <div className="absolute left-3 bottom-3 flex gap-1.5">
          <span className="rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[11px] font-medium text-white capitalize">{data.kind}</span>
          {!data.published && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">Draft</span>}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 min-h-[2.5rem]">{data.title || 'Untitled'}</h3>
        <p className="mt-1 text-xs text-[var(--text-tertiary)] truncate">
          {[data.attachment, data.subject].filter(Boolean).join(' › ') || 'No subject selected'}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] font-bold flex items-center justify-center">{initials(data.author)}</span>
          <span className="text-xs text-[var(--text-secondary)] truncate flex-1">{data.author || 'No author'}</span>
          {data.source && <span className="text-[11px] rounded-md bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-tertiary)] truncate max-w-[40%]">{data.source}</span>}
        </div>
      </div>

      {!preview && (
        <div className="px-4 py-2.5 border-t border-[var(--border-primary)] flex items-center justify-between">
          <button type="button" onClick={onTogglePublish} className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]" aria-label="Toggle published">
            <span className={`relative w-8 h-[18px] rounded-full transition-colors ${data.published ? 'bg-emerald-500' : 'bg-[var(--border-secondary)]'}`}>
              <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${data.published ? 'left-[16px]' : 'left-[2px]'}`} />
            </span>
            {data.published ? 'Published' : 'Draft'}
          </button>
          <div className="flex items-center gap-0.5">
            {onOpen && <button type="button" onClick={onOpen} aria-label="Open" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"><ExternalLink className="w-4 h-4" /></button>}
            <button type="button" onClick={onEdit} aria-label="Edit" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"><Pencil className="w-4 h-4" /></button>
            <button type="button" onClick={onDelete} aria-label="Delete" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
