import { Crown, Globe, UserCheck } from 'lucide-react';

export type Access = 'public' | 'free' | 'premium';
export type ContentKind = 'video' | 'book';

export interface Named { id: string; name: string }
export interface ContentRow {
  id: string;
  kind: ContentKind;
  title: string;
  description: string | null;
  university_id: string | null;
  attachment_id: string;
  subject_id: string;
  topic_id: string | null;
  author_id: string | null;
  thumbnail_url: string | null;
  access: Access;
  is_published: boolean;
  created_at: string;
  author?: Named | null;
  subject?: Named | null;
  attachment?: Named | null;
  university?: Named | null;
}
export interface AssetRow { id: string; item_id: string; source_type: 'external' | 'upload'; url: string | null; file_path: string | null; file_size: number | null }

export const ACCESS_META: Record<Access, { label: string; blurb: string; icon: typeof Globe; chip: string; card: string }> = {
  public: {
    label: 'Public', blurb: 'Anyone can open it — no account needed.', icon: Globe,
    chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30', card: 'border-emerald-500 bg-emerald-500/5',
  },
  free: {
    label: 'Logged-in', blurb: 'Free, but visitors must sign in first.', icon: UserCheck,
    chip: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-sky-500/30', card: 'border-sky-500 bg-sky-500/5',
  },
  premium: {
    label: 'Premium', blurb: 'Only paying subscribers can open it.', icon: Crown,
    chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30', card: 'border-amber-500 bg-amber-500/5',
  },
};

export function isValidUrl(v: string) {
  try { const u = new URL(v.trim()); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
}

export interface PlatformInfo { name: string; thumbnail?: string }

/** Recognises common hosts (any other https link is accepted as a generic "Link"). */
export function detectPlatform(raw: string): PlatformInfo | null {
  if (!isValidUrl(raw)) return null;
  const u = new URL(raw.trim());
  const host = u.hostname.replace(/^(www|m)\./, '');
  const is = (...d: string[]) => d.some(x => host === x || host.endsWith('.' + x));

  if (is('youtube.com', 'youtu.be', 'youtube-nocookie.com')) {
    let id = u.searchParams.get('v');
    if (!id && host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    if (!id) { const m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/); id = m?.[1] ?? null; }
    return { name: 'YouTube', thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined };
  }
  if (is('vimeo.com')) return { name: 'Vimeo' };
  if (is('facebook.com', 'fb.watch')) return { name: 'Facebook' };
  if (is('tiktok.com')) return { name: 'TikTok' };
  if (is('dailymotion.com', 'dai.ly')) return { name: 'Dailymotion' };
  if (is('drive.google.com', 'docs.google.com')) return { name: 'Google Drive' };
  if (is('dropbox.com')) return { name: 'Dropbox' };
  if (is('onedrive.live.com', '1drv.ms', 'sharepoint.com')) return { name: 'OneDrive' };
  if (is('archive.org')) return { name: 'Internet Archive' };
  if (is('wistia.com', 'wistia.net')) return { name: 'Wistia' };
  if (is('loom.com')) return { name: 'Loom' };
  if (is('twitch.tv')) return { name: 'Twitch' };
  if (is('mediadelivery.net', 'b-cdn.net')) return { name: 'Bunny Stream' };
  if (is('cloudflarestream.com', 'videodelivery.net')) return { name: 'Cloudflare Stream' };
  if (is('telegram.me', 't.me')) return { name: 'Telegram' };
  return { name: host };
}

/** Stable pleasant gradient for items without a thumbnail. */
export function gradientFor(seed: string, kind: ContentKind) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const h2 = (h + (kind === 'book' ? 40 : 70)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 52%), hsl(${h2} 75% 38%))`;
}

export const initials = (name?: string | null) =>
  (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
