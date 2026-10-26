import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Theme, Bookmark, LearningProgress } from '../types';
import { mockUser, mockAdminUser } from '../data/mockData';

interface AppContextType {
  user: User | null;
  theme: Theme;
  isAuthenticated: boolean;
  bookmarks: Bookmark[];
  progress: LearningProgress[];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsAdmin: () => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addBookmark: (resourceType: Bookmark['resource_type'], resourceId: string) => void;
  removeBookmark: (resourceType: Bookmark['resource_type'], resourceId: string) => void;
  isBookmarked: (resourceType: Bookmark['resource_type'], resourceId: string) => boolean;
  addProgress: (courseId: string, action: LearningProgress['action'], resourceId?: string, score?: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('bloom-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('bloom-theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem('bloom-user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    const savedBookmarks = localStorage.getItem('bloom-bookmarks');
    if (savedBookmarks) {
      try { setBookmarks(JSON.parse(savedBookmarks)); } catch {}
    }
    const savedProgress = localStorage.getItem('bloom-progress');
    if (savedProgress) {
      try { setProgress(JSON.parse(savedProgress)); } catch {}
    }
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState(prev => prev === 'light' ? 'dark' : 'light'), []);

  const login = useCallback(async (_email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 600));
    setUser(mockUser);
    localStorage.setItem('bloom-user', JSON.stringify(mockUser));
    return true;
  }, []);

  const loginAsAdmin = useCallback(async () => {
    await new Promise(r => setTimeout(r, 600));
    setUser(mockAdminUser);
    localStorage.setItem('bloom-user', JSON.stringify(mockAdminUser));
    return true;
  }, []);

  const signup = useCallback(async (_email: string, _password: string, name: string) => {
    await new Promise(r => setTimeout(r, 600));
    const newUser: User = { ...mockUser, full_name: name, onboarding_complete: false, university_id: undefined, program_id: undefined, study_year_id: undefined, semester_id: undefined };
    setUser(newUser);
    localStorage.setItem('bloom-user', JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('bloom-user');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('bloom-user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addBookmark = useCallback((resourceType: Bookmark['resource_type'], resourceId: string) => {
    setBookmarks(prev => {
      if (prev.some(b => b.resource_type === resourceType && b.resource_id === resourceId)) return prev;
      const newBookmark: Bookmark = {
        id: `bm-${Date.now()}`,
        user_id: user?.id || '',
        resource_type: resourceType,
        resource_id: resourceId,
        created_at: new Date().toISOString(),
      };
      const updated = [...prev, newBookmark];
      localStorage.setItem('bloom-bookmarks', JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  const removeBookmark = useCallback((resourceType: Bookmark['resource_type'], resourceId: string) => {
    setBookmarks(prev => {
      const updated = prev.filter(b => !(b.resource_type === resourceType && b.resource_id === resourceId));
      localStorage.setItem('bloom-bookmarks', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((resourceType: Bookmark['resource_type'], resourceId: string) => {
    return bookmarks.some(b => b.resource_type === resourceType && b.resource_id === resourceId);
  }, [bookmarks]);

  const addProgress = useCallback((courseId: string, action: LearningProgress['action'], resourceId?: string, score?: number) => {
    setProgress(prev => {
      const entry: LearningProgress = {
        id: `lp-${Date.now()}`,
        user_id: user?.id || '',
        course_id: courseId,
        resource_id: resourceId,
        action,
        score,
        created_at: new Date().toISOString(),
      };
      const updated = [...prev, entry];
      localStorage.setItem('bloom-progress', JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  return (
    <AppContext.Provider value={{
      user, theme, isAuthenticated: !!user, bookmarks, progress,
      setTheme, toggleTheme, login, loginAsAdmin, signup, logout, updateUser,
      addBookmark, removeBookmark, isBookmarked, addProgress,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
