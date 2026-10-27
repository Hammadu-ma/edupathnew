import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Crown, Eye, EyeOff, Film, LayoutGrid, List, Pencil, Plus, Search, Trash2, X, Play, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { openFile, unwrap } from '../lib/db';
import { useAsync } from '../hooks/useAsync';
import { ACCESS_META, Access, AssetRow, ContentKind, ContentRow, detectPlatform } from '../lib/content';
import { ContentCard, AccessChip, Thumb } from '../components/admin/ContentCard';
import { ContentDrawer, Creators, Lookups } from '../components/admin/ContentDrawer';
import { EmptyState, ErrorNote, PageLoader, Select, Toast } from '../components/ui/Primitives';

const EMPTY_LK: Lookups = { universities: [], attachments: [], subjects: [], topics: [], authors: [] };

export default function AdminContent() {
  const [kindTab, setKindTab] = useState<'all' | ContentKind>('all');
  const [search, setSearch] = useState('');
  const [fAttachment, setFAttachment] = useState('');
  const [fSubject, setFSubject] = useState('');
  const [fAuthor, setFAuthor] = useState('');
  const [fAccess, setFAccess] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<{ kind: ContentKind; item: ContentRow | null; key: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [lk, setLk] = useState<Lookups>(EMPTY_LK);

  const { data, loading, error, reload } = useAsync(async () => {
    const [items, assets, universities, attachments, subjects, topics, authors] = await Promise.all([
      unwrap<ContentRow[]>(supabase.from('content_items')
        .select('*, author:authors(id,name), subject:subjects(id,name), attachment:attachments(id,name), university:universities(id,name)')
        .order('created_at', { ascending: false }) as any),
      unwrap<AssetRow[]>(supabase.from('content_assets').select('*') as any),
      unwrap<any[]>(supabase.from('universities').select('id,name').order('name') as any),
      unwrap<any[]>(supabase.from('attachments').select('*').order('name') as any),
      unwrap<any[]>(supabase.from('subjects').select('*').order('name') as any),
      unwrap<any[]>(supabase.from('topics').select('*').order('name') as any),
      unwrap<any[]>(supabase.from('authors').select('*').order('name') as any),
    ]);
    return {
      items: items ?? [], assets: Object.fromEntries((assets ?? []).map(a => [a.item_id, a])) as Record<string, AssetRow>,
      lookups: { universities: universities ?? [], attachments: attachments ?? [], subjects: subjects ?? [], topics: topics ?? [], authors: authors ?? [] } as Lookups,
    };
  }, []);
  useEffect(() => { if (data) setLk(data.lookups); }, [data]);

  const items = data?.items ?? [];
  const assets = data?.assets ?? {};
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  // ---- select-or-create handlers (rows are inserted immediately, so the new option is usable at once)
  const create = async (table: keyof Lookups, row: Record<string, unknown>) => {
    const { data: created, error: e } = await supabase.from(table).insert(row).select('*').single();
    if (e) throw new Error(/duplicate|unique/i.test(e.message) ? 'That name already exists here.' : e.message);
    setLk(prev => ({ ...prev, [table]: [...prev[table], created] }) as Lookups);
    return (created as { id: string }).id;
  };
  const creators: Creators = {
    university: name => create('universities', { name, is_active: true }),
    attachment: name => create('attachments', { name }),
    subject: (name, attachment_id) => create('subjects', { name, attachment_id }),
    topic: (name, subject_id) => create('topics', { name, subject_id }),
    author: name => create('authors', { name }),
  };

  const filtered = useMemo(() => items.filter(i => {
    if (kindTab !== 'all' && i.kind !== kindTab) return false;
    if (fAttachment && i.attachment_id !== fAttachment) return false;
    if (fSubject && i.subject_id !== fSubject) return false;
    if (fAuthor && i.author_id !== fAuthor) return false;
    if (fAccess && i.access !== fAccess) return false;
    if (fStatus && (fStatus === 'published') !== i.is_published) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![i.title, i.author?.name, i.subject?.name, i.attachment?.name].some(v => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [items, kindTab, fAttachment, fSubject, fAuthor, fAccess, fStatus, search]);

  const counts = {
    all: items.length, video: items.filter(i => i.kind === 'video').length, book: items.filter(i => i.kind === 'book').length,
    premium: items.filter(i => i.access === 'premium').length, drafts: items.filter(i => !i.is_published).length,
  };
  const hasFilters = !!(search || fAttachment || fSubject || fAuthor || fAccess || fStatus);
  const clearFilters = () => { setSearch(''); setFAttachment(''); setFSubject(''); setFAuthor(''); setFAccess(''); setFStatus(''); };

  // ---- actions
  const toggleSel = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const mutate = async (ids: string[], patch: Partial<ContentRow>, msg: string) => {
    const { error: e } = await supabase.from('content_items').update(patch).in('id', ids);
    if (e) return notify(e.message, 'error');
    notify(msg); setSelected(new Set()); reload();
  };
  const remove = async (ids: string[]) => {
    if (!window.confirm(`Delete ${ids.length} item${ids.length > 1 ? 's' : ''}? This can't be undone.`)) return;
    const { error: e } = await supabase.from('content_items').delete().in('id', ids);
    if (e) return notify(e.message, 'error');
    notify(`${ids.length} deleted`); setSelected(new Set()); reload();
  };
  const open = (i: ContentRow) => {
    const a = assets[i.id]; if (!a) return;
    openFile({ url: a.url, path: a.file_path, bucket: 'content' }).catch(e => notify(e.message, 'error'));
  };
  const openDrawer = (kind: ContentKind, item: ContentRow | null = null) => setDrawer({ kind, item, key: Date.now() });

  const cardData = (i: ContentRow) => ({
    id: i.id, kind: i.kind, title: i.title, thumbnail: i.thumbnail_url, access: i.access, published: i.is_published,
    attachment: i.attachment?.name, subject: i.subject?.name, author: i.author?.name,
    source: assets[i.id]?.source_type === 'upload' ? 'Uploaded' : assets[i.id]?.url ? detectPlatform(assets[i.id].url!)?.name : null,
  });

  const stat = (label: string, value: number, icon: React.ReactNode, tone: string) => (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 flex items-center gap-4">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>{icon}</span>
      <div><p className="text-2xl font-bold text-[var(--text-primary)] leading-none">{value}</p><p className="text-xs text-[var(--text-tertiary)] mt-1">{label}</p></div>
    </div>
  );

  const allOpt = (l: string) => ({ value: '', label: l });
  const tabs: { id: 'all' | ContentKind; label: string; n: number }[] = [{ id: 'all', label: 'All', n: counts.all }, { id: 'video', label: 'Videos', n: counts.video }, { id: 'book', label: 'Books', n: counts.book }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 pb-28">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-6 text-white bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600">
        <div className="absolute -right-10 -top-16 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-24 -bottom-24 w-64 h-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">Admin · Content</p>
            <h1 className="font-display text-3xl sm:text-4xl leading-tight">Content Library</h1>
            <p className="text-white/80 mt-1.5 max-w-xl">Videos and books organised by attachment, subject and author — with a policy for who can open each one.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => openDrawer('video')} className="inline-flex items-center gap-2 rounded-xl bg-white text-violet-700 font-semibold text-sm px-4 py-2.5 shadow-lg hover:bg-white/90"><Plus className="w-4 h-4" /> New video</button>
            <button onClick={() => openDrawer('book')} className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur text-white font-semibold text-sm px-4 py-2.5 ring-1 ring-white/30 hover:bg-white/25"><Plus className="w-4 h-4" /> New book</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stat('Videos', counts.video, <Film className="w-5 h-5" />, 'bg-violet-500/15 text-violet-600 dark:text-violet-400')}
        {stat('Books', counts.book, <BookOpen className="w-5 h-5" />, 'bg-sky-500/15 text-sky-600 dark:text-sky-400')}
        {stat('Premium items', counts.premium, <Crown className="w-5 h-5" />, 'bg-amber-500/15 text-amber-600 dark:text-amber-400')}
        {stat('Drafts', counts.drafts, <EyeOff className="w-5 h-5" />, 'bg-rose-500/15 text-rose-600 dark:text-rose-400')}
      </div>

      {/* toolbar */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex rounded-xl bg-[var(--bg-tertiary)] p-1 self-start">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setKindTab(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${kindTab === t.id ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
                {t.label} <span className="text-xs opacity-60 ml-0.5">{t.n}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author, subject…"
              className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] pl-10 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]" />
          </div>
          <div className="inline-flex rounded-xl bg-[var(--bg-tertiary)] p-1 self-start">
            {(['grid', 'table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} className={`p-2 rounded-lg ${view === v ? 'bg-[var(--bg-secondary)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-tertiary)]'}`}>
                {v === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Select value={fAttachment} onChange={v => { setFAttachment(v); setFSubject(''); }} options={[allOpt('All attachments'), ...lk.attachments.map(a => ({ value: a.id, label: a.name }))]} />
          <Select value={fSubject} onChange={setFSubject} options={[allOpt('All subjects'), ...lk.subjects.filter(s => !fAttachment || s.attachment_id === fAttachment).map(s => ({ value: s.id, label: s.name }))]} />
          <Select value={fAuthor} onChange={setFAuthor} options={[allOpt('All authors'), ...lk.authors.map(a => ({ value: a.id, label: a.name }))]} />
          <Select value={fAccess} onChange={setFAccess} options={[allOpt('Any policy'), ...(Object.keys(ACCESS_META) as Access[]).map(a => ({ value: a, label: ACCESS_META[a].label }))]} />
          <Select value={fStatus} onChange={setFStatus} options={[allOpt('Any status'), { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]} />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"><X className="w-3.5 h-3.5" /> Clear filters · {filtered.length} result{filtered.length === 1 ? '' : 's'}</button>
        )}
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon={<Film className="w-8 h-8" />} title={items.length ? 'Nothing matches your filters' : 'Your library is empty'}
          description={items.length ? 'Try clearing a filter or searching for something else.' : 'Add your first video or book to get started.'}
          action={items.length ? undefined : <button onClick={() => openDrawer('video')} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm px-4 py-2.5"><Plus className="w-4 h-4" /> Add a video</button>} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(i => (
            <ContentCard key={i.id} data={cardData(i)} selected={selected.has(i.id)} onSelect={() => toggleSel(i.id)}
              onEdit={() => openDrawer(i.kind, i)} onDelete={() => remove([i.id])} onOpen={assets[i.id] ? () => open(i) : undefined}
              onTogglePublish={() => mutate([i.id], { is_published: !i.is_published }, i.is_published ? 'Moved to drafts' : 'Published')} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/60 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                <th className="px-4 py-3 w-10" />
                <th className="px-2 py-3">Item</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">Policy</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-tertiary)]/50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(i.id)} onChange={() => toggleSel(i.id)} aria-label="Select" /></td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Thumb data={{ kind: i.kind, title: i.title, thumbnail: i.thumbnail_url }} className="w-20 aspect-video rounded-lg flex-shrink-0" />
                      <div className="min-w-0"><p className="font-medium text-sm text-[var(--text-primary)] truncate">{i.title}</p><p className="text-xs text-[var(--text-tertiary)] capitalize flex items-center gap-1">{i.kind === 'video' ? <Play className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}{i.kind}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{[i.attachment?.name, i.subject?.name].filter(Boolean).join(' › ')}{i.university && <span className="block text-xs text-[var(--text-tertiary)]">{i.university.name}</span>}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{i.author?.name ?? '—'}</td>
                  <td className="px-4 py-3"><AccessChip access={i.access} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => mutate([i.id], { is_published: !i.is_published }, i.is_published ? 'Moved to drafts' : 'Published')}
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 ${i.is_published ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>{i.is_published ? 'Published' : 'Draft'}</button>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {assets[i.id] && <button onClick={() => open(i)} aria-label="Open" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"><ExternalLink className="w-4 h-4" /></button>}
                    <button onClick={() => openDrawer(i.kind, i)} aria-label="Edit" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove([i.id])} aria-label="Delete" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* bulk bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xl shadow-black/30 px-4 py-3 max-w-[95vw]">
          <span className="text-sm font-semibold text-[var(--text-primary)] mr-1">{selected.size} selected</span>
          <button onClick={() => mutate([...selected], { is_published: true }, 'Published')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"><Eye className="w-4 h-4" />Publish</button>
          <button onClick={() => mutate([...selected], { is_published: false }, 'Moved to drafts')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"><EyeOff className="w-4 h-4" />Unpublish</button>
          <span className="w-px h-5 bg-[var(--border-primary)]" />
          {(Object.keys(ACCESS_META) as Access[]).map(a => {
            const M = ACCESS_META[a];
            return <button key={a} onClick={() => mutate([...selected], { access: a }, `Policy set to ${M.label}`)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"><M.icon className="w-4 h-4" />{M.label}</button>;
          })}
          <span className="w-px h-5 bg-[var(--border-primary)]" />
          <button onClick={() => remove([...selected])} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10"><Trash2 className="w-4 h-4" />Delete</button>
          <button onClick={() => setSelected(new Set())} aria-label="Clear selection" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"><X className="w-4 h-4" /></button>
        </div>
      )}

      {drawer && (
        <ContentDrawer key={drawer.key} kind={drawer.kind} item={drawer.item} asset={drawer.item ? assets[drawer.item.id] ?? null : null}
          lk={lk} creators={creators} onClose={() => setDrawer(null)}
          onSaved={() => { const edit = !!drawer.item; setDrawer(null); notify(edit ? 'Changes saved' : 'Added to the library'); reload(); }} />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
