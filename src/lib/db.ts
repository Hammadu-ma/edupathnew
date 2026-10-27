import { supabase } from './supabase';

/** Await a Supabase query and throw on error so callers can use try/catch. */
export async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

export async function signedUrl(path: string, download = false): Promise<string> {
  const { data, error } = await supabase.storage
    .from('resources')
    .createSignedUrl(path, 3600, download ? { download: true } : undefined);
  if (error || !data) throw new Error(error?.message || 'Could not create download link');
  return data.signedUrl;
}

/** Open an external link or a private storage file in a new tab. */
export async function openFile(opts: { path?: string | null; url?: string | null; download?: boolean }) {
  if (opts.url) { window.open(opts.url, '_blank', 'noopener'); return; }
  if (!opts.path) throw new Error('This item has no file attached yet.');
  const w = window.open('', '_blank'); // open synchronously so popup blockers allow it
  try {
    const u = await signedUrl(opts.path, opts.download);
    if (w) w.location.href = u; else window.location.href = u;
  } catch (e) { w?.close(); throw e; }
}

export async function uploadFile(bucket: string, file: File, folder: string): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  return path;
}

export function formatSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  notes: 'Lecture notes', book: 'Books', pdf: 'PDFs', video: 'Videos', slides: 'Slides', guide: 'Study guides', link: 'Links', other: 'Other',
};
