import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { ActivityAction, Bookmark, BookmarkType, Completion, Profile, Theme } from '../types';

interface AppContextType {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  recoveryMode: boolean;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  updateProfile: (patch: Partial<Profile>) => Promise<string | null>;
  bookmarks: Bookmark[];
  isBookmarked: (type: BookmarkType, id: string) => boolean;
  toggleBookmark: (type: BookmarkType, id: string) => Promise<void>;
  completions: Completion[];
  isCompleted: (resourceId: string) => boolean;
  toggleCompleted: (resourceId: string, courseId: string) => Promise<void>;
  logActivity: (action: ActivityAction, courseId?: string | null, resourceId?: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('bloom-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // ----- theme -----
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('bloom-theme', theme);
  }, [theme]);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState(p => (p === 'light' ? 'dark' : 'light')), []);

  // ----- session -----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') { setRecoveryMode(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ----- load profile + personal data whenever the signed-in user changes -----
  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) { setUser(null); setBookmarks([]); setCompletions([]); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [p, b, c] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
          supabase.from('bookmarks').select('*'),
          supabase.from('resource_completions').select('resource_id,course_id,completed_at'),
        ]);
        if (cancelled) return;
        if (p.data && !p.data.is_active) { await supabase.auth.signOut(); return; }
        setUser((p.data as Profile) ?? null);
        setBookmarks((b.data as Bookmark[]) ?? []);
        setCompletions((c.data as Completion[]) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  // ----- auth actions -----
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name } },
    });
    if (error) return { error: error.message };
    // With email confirmation enabled Supabase returns a user but no session.
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    return error ? error.message : null;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setRecoveryMode(false);
    return error ? error.message : null;
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!uid) return 'Not signed in';
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', uid).select('*').single();
    if (error) return error.message;
    setUser(data as Profile);
    return null;
  }, [uid]);

  // ----- bookmarks -----
  const isBookmarked = useCallback(
    (type: BookmarkType, id: string) => bookmarks.some(b => b.item_type === type && b.item_id === id),
    [bookmarks],
  );

  const toggleBookmark = useCallback(async (type: BookmarkType, id: string) => {
    if (!uid) return;
    const existing = bookmarks.find(b => b.item_type === type && b.item_id === id);
    if (existing) {
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id);
      if (error) setBookmarks(prev => [...prev, existing]);
    } else {
      const { data } = await supabase.from('bookmarks')
        .insert({ user_id: uid, item_type: type, item_id: id }).select('*').single();
      if (data) setBookmarks(prev => [...prev, data as Bookmark]);
    }
  }, [uid, bookmarks]);

  // ----- activity & completion -----
  const logActivity = useCallback((action: ActivityAction, courseId?: string | null, resourceId?: string | null) => {
    if (!uid) return;
    void supabase.from('study_activity').insert({ user_id: uid, action, course_id: courseId ?? null, resource_id: resourceId ?? null });
  }, [uid]);

  const isCompleted = useCallback((rid: string) => completions.some(c => c.resource_id === rid), [completions]);

  const toggleCompleted = useCallback(async (resourceId: string, courseId: string) => {
    if (!uid) return;
    if (completions.some(c => c.resource_id === resourceId)) {
      setCompletions(prev => prev.filter(c => c.resource_id !== resourceId));
      await supabase.from('resource_completions').delete().eq('resource_id', resourceId).eq('user_id', uid);
    } else {
      const row = { resource_id: resourceId, course_id: courseId, completed_at: new Date().toISOString() };
      setCompletions(prev => [...prev, row]);
      const { error } = await supabase.from('resource_completions').insert({ ...row, user_id: uid });
      if (error) setCompletions(prev => prev.filter(c => c.resource_id !== resourceId));
      else logActivity('completed', courseId, resourceId);
    }
  }, [uid, completions, logActivity]);

  const value = useMemo<AppContextType>(() => ({
    user, session, loading, isAuthenticated: !!user, recoveryMode, theme, setTheme, toggleTheme,
    signIn, signUp, signOut, sendPasswordReset, updatePassword, updateProfile,
    bookmarks, isBookmarked, toggleBookmark, completions, isCompleted, toggleCompleted, logActivity,
  }), [user, session, loading, recoveryMode, theme, setTheme, toggleTheme, signIn, signUp, signOut, sendPasswordReset,
    updatePassword, updateProfile, bookmarks, isBookmarked, toggleBookmark, completions, isCompleted, toggleCompleted, logActivity]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
