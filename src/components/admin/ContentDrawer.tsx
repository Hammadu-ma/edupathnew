import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Building2, Check, FileUp, Image as ImageIcon, Layers, Link2, Loader2, Play, Tag, User, X, ExternalLink, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatSize, uploadFile } from '../../lib/db';
import { ACCESS_META, Access, AssetRow, ContentKind, ContentRow, Named, detectPlatform, isValidUrl } from '../../lib/content';
import { CreatableSelect } from './CreatableSelect';
import { ContentCard } from './ContentCard';

export interface Lookups {
  universities: Named[];
  attachments: Named[];
  subjects: (Named & { attachment_id: string })[];
  topics: (Named & { subject_id: string })[];
  authors: Named[];
}
export interface Creators {
  university: (name: string) => Promise<string>;
  attachment: (name: string) => Promise<string>;
  subject: (name: string, attachmentId: string) => Promise<string>;
  topic: (name: string, subjectId: string) => Promise<string>;
  author: (name: string) => Promise<string>;
}

interface Props {
  kind: ContentKind;
  item: ContentRow | null;
  asset: AssetRow | null;
  lk: Lookups;
  creators: Creators;
  onClose: () => void;
  onSaved: () => void;
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

const Section = ({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5">
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">{n}</span>
      <div><h3 className="font-semibold text-[var(--text-primary)] leading-tight">{title}</h3>{hint && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}</div>
    </div>
    {children}
  </section>
);

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon: React.ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-[var(--bg-tertiary)] p-1 mb-4">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${value === o.value ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]';

function DropZone({ file, existing, accept, onFile, icon, label }: { file: File | null; existing?: string | null; accept?: string; onFile: (f: File) => void; icon: React.ReactNode; label: string }) {
  const [over, setOver] = useState(false);
  return (
    <label onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      className={`flex items-center gap-4 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-colors ${over ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-secondary)] hover:border-[var(--accent)]'}`}>
      <span className="w-11 h-11 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        {file ? (<><span className="block text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</span><span className="text-xs text-[var(--text-tertiary)]">{formatSize(file.size)} · click to replace</span></>)
          : existing ? (<><span className="block text-sm font-medium text-[var(--text-primary)] truncate">Current: {existing.split('/').pop()}</span><span className="text-xs text-[var(--text-tertiary)]">Click or drop to replace</span></>)
          : (<><span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span><span className="text-xs text-[var(--text-tertiary)]">Drag & drop or click to browse</span></>)}
      </span>
      <input type="file" hidden accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </label>
  );
}

export function ContentDrawer({ kind, item, asset, lk, creators, onClose, onSaved }: Props) {
  const editing = !!item;
  const [shown, setShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [universityId, setUniversityId] = useState(item?.university_id ?? '');
  const [attachmentId, setAttachmentId] = useState(item?.attachment_id ?? '');
  const [subjectId, setSubjectId] = useState(item?.subject_id ?? '');
  const [topicId, setTopicId] = useState(item?.topic_id ?? '');
  const [authorId, setAuthorId] = useState(item?.author_id ?? '');
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [sourceType, setSourceType] = useState<'external' | 'upload'>(asset?.source_type ?? 'external');
  const [url, setUrl] = useState(asset?.url ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [thumbMode, setThumbMode] = useState<'url' | 'upload'>('url');
  const [thumbUrl, setThumbUrl] = useState(item?.thumbnail_url ?? '');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [access, setAccess] = useState<Access>(item?.access ?? 'free');
  const [published, setPublished] = useState(item?.is_published ?? false);

  useEffect(() => { const t = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(t); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, saving]);

  const platform = sourceType === 'external' ? detectPlatform(url) : null;
  const thumbPreviewFile = useObjectUrl(thumbMode === 'upload' ? thumbFile : null);
  const autoThumb = !thumbUrl.trim() && !thumbFile && platform?.thumbnail ? platform.thumbnail : null;
  const previewThumb = thumbMode === 'upload' ? (thumbPreviewFile ?? thumbUrl) || autoThumb : thumbUrl.trim() || autoThumb;

  const subjects = lk.subjects.filter(s => s.attachment_id === attachmentId);
  const topics = lk.topics.filter(t => t.subject_id === subjectId);
  const noun = kind === 'video' ? 'video' : 'book';

  // Subject default policy as a suggestion when creating
  const pickAttachment = (v: string) => { setAttachmentId(v); setSubjectId(''); setTopicId(''); };
  const pickSubject = (v: string) => { setSubjectId(v); setTopicId(''); };

  const save = async () => {
    setError('');
    if (!attachmentId) return setError('Choose or create an attachment.');
    if (!subjectId) return setError('Choose or create a subject.');
    if (!title.trim()) return setError('Give it a title.');
    if (sourceType === 'external' && !isValidUrl(url)) return setError('Enter a valid link starting with https://');
    if (sourceType === 'upload' && !file && !asset?.file_path) return setError('Upload a file, or switch to “Link”.');
    if (thumbFile && thumbFile.size > 2_000_000) return setError('Thumbnail must be under 2 MB.');

    setSaving(true);
    try {
      let thumbnail: string | null = thumbUrl.trim() || null;
      if (thumbMode === 'upload' && thumbFile) {
        const path = await uploadFile('thumbnails', thumbFile, kind);
        thumbnail = supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl;
      }
      if (!thumbnail && platform?.thumbnail) thumbnail = platform.thumbnail;

      let filePath = asset?.file_path ?? null;
      let fileSize = asset?.file_size ?? null;
      if (sourceType === 'upload' && file) { filePath = await uploadFile('content', file, `${kind}s`); fileSize = file.size; }

      const row = {
        kind, title: title.trim(), description: description.trim() || null,
        university_id: universityId || null, attachment_id: attachmentId, subject_id: subjectId, topic_id: topicId || null,
        author_id: authorId || null, thumbnail_url: thumbnail, access, is_published: published,
      };
      let id = item?.id;
      if (id) {
        const { error: e } = await supabase.from('content_items').update(row).eq('id', id);
        if (e) throw new Error(e.message);
      } else {
        const { data, error: e } = await supabase.from('content_items').insert(row).select('id').single();
        if (e) throw new Error(e.message);
        id = (data as { id: string }).id;
      }
      const assetRow = {
        item_id: id, source_type: sourceType,
        url: sourceType === 'external' ? url.trim() : null,
        file_path: sourceType === 'upload' ? filePath : null,
        file_size: sourceType === 'upload' ? fileSize : null,
      };
      const existing = await supabase.from('content_assets').select('id').eq('item_id', id).maybeSingle();
      const res = existing.data
        ? await supabase.from('content_assets').update(assetRow).eq('id', (existing.data as { id: string }).id)
        : await supabase.from('content_assets').insert(assetRow);
      if (res.error) throw new Error(res.error.message);
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setSaving(false);
    }
  };

  const opts = (list: Named[]) => list.map(x => ({ value: x.id, label: x.name }));
  const accept = kind === 'video' ? 'video/*,.mkv,.mov' : '.pdf,.epub,.mobi,.doc,.docx,.ppt,.pptx';

  return (
    <div className="fixed inset-0 z-[60]">
      <div onClick={() => !saving && onClose()} className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`} />
      <aside role="dialog" aria-label={`${editing ? 'Edit' : 'New'} ${noun}`}
        className={`absolute right-0 top-0 bottom-0 w-full max-w-5xl flex flex-col bg-[var(--bg-primary)] shadow-2xl transition-transform duration-300 ease-out ${shown ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-400 text-white flex items-center justify-center">{kind === 'video' ? <Play className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}</span>
          <div className="flex-1">
            <h2 className="font-display text-xl text-[var(--text-primary)] leading-tight">{editing ? `Edit ${noun}` : `Add a new ${noun}`}</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Pick where it lives, add the source, set who can open it.</p>
          </div>
          <button onClick={onClose} disabled={saving} aria-label="Close" className="p-2 rounded-xl text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 p-6">
            <div className="space-y-5 min-w-0">
              <Section n={1} title="Where does it belong?" hint="Select an existing entry or type a new name to create it instantly.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <CreatableSelect label="University" optional icon={<Building2 className="w-4 h-4" />} noun="university" placeholder="Any / not specific"
                    value={universityId} options={opts(lk.universities)} onChange={setUniversityId} onCreate={creators.university} />
                  <CreatableSelect label="Attachment" icon={<Layers className="w-4 h-4" />} noun="attachment" placeholder="e.g. Surgery"
                    value={attachmentId} options={opts(lk.attachments)} onChange={pickAttachment} onCreate={creators.attachment} />
                  <CreatableSelect label="Subject" icon={<Tag className="w-4 h-4" />} noun="subject" placeholder="e.g. Acute abdomen"
                    value={subjectId} options={opts(subjects)} onChange={pickSubject} disabled={!attachmentId} disabledHint="Choose an attachment first"
                    onCreate={name => creators.subject(name, attachmentId)} />
                  <CreatableSelect label="Topic" optional icon={<Tag className="w-4 h-4" />} noun="topic" placeholder="e.g. Appendicitis"
                    value={topicId} options={opts(topics)} onChange={setTopicId} disabled={!subjectId} disabledHint="Choose a subject first"
                    onCreate={name => creators.topic(name, subjectId)} />
                  <div className="sm:col-span-2">
                    <CreatableSelect label="Author" optional icon={<User className="w-4 h-4" />} noun="author" placeholder="e.g. Dr. Najeeb, Ninja Nerd"
                      value={authorId} options={opts(lk.authors)} onChange={setAuthorId} onCreate={creators.author} />
                  </div>
                </div>
              </Section>

              <Section n={2} title="Details">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'video' ? 'Appendicitis — complete lecture' : 'Bailey & Love — Short Practice of Surgery'} className={inputCls} />
                <label className="block text-sm font-medium text-[var(--text-secondary)] mt-4 mb-1.5">Description <span className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] ml-1">Optional</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What will students learn from this?" className={`${inputCls} resize-none`} />
              </Section>

              <Section n={3} title={kind === 'video' ? 'Video source' : 'Book source'} hint={kind === 'video' ? 'Link from any platform, or upload the file.' : 'Link to the book, or upload the file.'}>
                <Segmented value={sourceType} onChange={setSourceType} options={[
                  { value: 'external', label: 'Link', icon: <Link2 className="w-4 h-4" /> }, { value: 'upload', label: 'Upload file', icon: <FileUp className="w-4 h-4" /> }]} />
                {sourceType === 'external' ? (
                  <div>
                    <div className="relative">
                      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" inputMode="url" className={`${inputCls} pr-28`} />
                      {platform && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-xs font-semibold">
                          <Check className="w-3 h-3" />{platform.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                      {url && !platform ? <span className="text-red-500">That doesn’t look like a valid link.</span>
                        : platform?.thumbnail ? 'Thumbnail detected automatically.' : 'YouTube, Vimeo, Google Drive, Bunny, Cloudflare, Facebook… any link works.'}
                      {platform && <a href={url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-[var(--accent)] hover:underline">Test link <ExternalLink className="w-3 h-3" /></a>}
                    </p>
                  </div>
                ) : (
                  <DropZone file={file} existing={asset?.file_path} accept={accept} onFile={setFile} icon={<Upload className="w-5 h-5" />} label={kind === 'video' ? 'Upload a video file' : 'Upload the book (PDF, EPUB…)'} />
                )}
              </Section>

              <Section n={4} title="Thumbnail" hint={kind === 'video' ? 'Shown on the card. Leave empty to use the platform’s thumbnail or an auto cover.' : 'Book cover image.'}>
                <Segmented value={thumbMode} onChange={setThumbMode} options={[
                  { value: 'url', label: 'Image URL', icon: <Link2 className="w-4 h-4" /> }, { value: 'upload', label: 'Upload image', icon: <ImageIcon className="w-4 h-4" /> }]} />
                {thumbMode === 'url'
                  ? <input value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} placeholder="https://…/cover.jpg" className={inputCls} />
                  : <DropZone file={thumbFile} accept="image/*" onFile={setThumbFile} icon={<ImageIcon className="w-5 h-5" />} label="Upload thumbnail (max 2 MB)" />}
              </Section>

              <Section n={5} title="Content policy" hint="Who can open this item.">
                <div className="grid sm:grid-cols-3 gap-3">
                  {(Object.keys(ACCESS_META) as Access[]).map(a => {
                    const m = ACCESS_META[a]; const on = access === a;
                    return (
                      <button key={a} type="button" onClick={() => setAccess(a)}
                        className={`relative text-left rounded-xl border-2 p-4 transition-all ${on ? m.card : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}>
                        {on && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                        <span className={`inline-flex w-9 h-9 rounded-lg items-center justify-center mb-2 ring-1 ring-inset ${m.chip}`}><m.icon className="w-4.5 h-4.5" /></span>
                        <span className="block font-semibold text-[var(--text-primary)]">{m.label}</span>
                        <span className="block text-xs text-[var(--text-tertiary)] mt-0.5 leading-snug">{m.blurb}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setPublished(p => !p)} className="mt-5 w-full flex items-center justify-between rounded-xl border border-[var(--border-primary)] p-4 text-left hover:border-[var(--border-secondary)]">
                  <span>
                    <span className="block font-medium text-[var(--text-primary)]">{published ? 'Published' : 'Save as draft'}</span>
                    <span className="block text-xs text-[var(--text-tertiary)]">{published ? 'Visible in the catalog right away.' : 'Hidden from students until you publish.'}</span>
                  </span>
                  <span className={`relative w-11 h-6 rounded-full transition-colors ${published ? 'bg-emerald-500' : 'bg-[var(--border-secondary)]'}`}>
                    <span className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${published ? 'left-[23px]' : 'left-[3px]'}`} />
                  </span>
                </button>
              </Section>
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-0 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Live preview</p>
                <ContentCard preview data={{
                  kind, title, thumbnail: previewThumb, access, published,
                  attachment: lk.attachments.find(a => a.id === attachmentId)?.name, subject: lk.subjects.find(s => s.id === subjectId)?.name,
                  author: lk.authors.find(a => a.id === authorId)?.name,
                  source: sourceType === 'upload' ? (file ? 'Uploaded' : asset?.file_path ? 'Uploaded' : null) : platform?.name,
                }} />
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">This is how the item appears in the library.</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <p className="flex-1 text-sm text-red-500 min-w-0 truncate" role="alert">{error}</p>
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">Cancel</button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--accent)] hover:brightness-110 shadow-lg shadow-[var(--accent)]/25 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Save changes' : published ? `Publish ${noun}` : 'Save draft'}
          </button>
        </footer>
      </aside>
    </div>
  );
}
