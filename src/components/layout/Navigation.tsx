import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Home, BookOpen, Library, FileText, Bookmark, User, LogOut, Sun, Moon, Menu, X, GraduationCap, Settings, Shield, ChevronRight, TrendingUp, Users, Layers } from 'lucide-react';

export function StudentNav() {
  const { user, theme, toggleTheme, signOut } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/studies', icon: BookOpen, label: 'My Studies' },
    { to: '/resources', icon: Library, label: 'Resources' },
    { to: '/exams', icon: FileText, label: 'Past Exams' },
    { to: '/progress', icon: TrendingUp, label: 'Progress' },
    { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
  ];

  const handleLogout = () => { void signOut(); navigate('/auth'); };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] z-30">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display text-xl text-[var(--text-primary)]">Bloom</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`
              }
            >
              <link.icon className="w-[18px] h-[18px]" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[var(--border-primary)] space-y-1">
          <NavLink to="/profile" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`
          }>
            <User className="w-[18px] h-[18px]" />
            Profile
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
              <Shield className="w-[18px] h-[18px]" /> Admin Console
            </NavLink>
          )}
          <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] w-full transition-all">
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-all">
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>

        <div className="px-4 py-4 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-sm font-semibold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.full_name}</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] z-40 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-lg text-[var(--text-primary)]">Bloom</span>
        </div>
        <div className="flex-1" />
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--bg-secondary)] animate-fade-in flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-display text-lg text-[var(--text-primary)]">Bloom</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive || (link.to !== '/' && location.pathname.startsWith(link.to))
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`
                  }
                >
                  <link.icon className="w-[18px] h-[18px]" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-3 border-t border-[var(--border-primary)] space-y-0.5">
              <NavLink to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
                <User className="w-[18px] h-[18px]" /> Profile
              </NavLink>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-red-500 w-full">
                <LogOut className="w-[18px] h-[18px]" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AdminNav() {
  const { user, theme, toggleTheme, signOut } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: '/admin', icon: Shield, label: 'Dashboard' },
    { to: '/admin/structure', icon: Layers, label: 'Structure' },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/resources', icon: Library, label: 'Resources' },
    { to: '/admin/exams', icon: FileText, label: 'Examinations' },
    { to: '/admin/users', icon: Users, label: 'Users' },
  ];

  const handleLogout = () => { void signOut(); navigate('/auth'); };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] z-30">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-midnight-700 to-midnight-900 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display text-lg text-[var(--text-primary)] block leading-tight">Bloom Admin</span>
              <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Management Console</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-midnight-800 text-white dark:bg-midnight-700'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`
              }
            >
              <link.icon className="w-[18px] h-[18px]" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[var(--border-primary)] space-y-1">
          <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] w-full">
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <NavLink to="/studies" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
            <ChevronRight className="w-[18px] h-[18px]" /> Student View
          </NavLink>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-red-500 w-full">
            <LogOut className="w-[18px] h-[18px]" /> Sign Out
          </button>
        </div>

        <div className="px-4 py-4 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-midnight-600 to-midnight-800 flex items-center justify-center text-white text-sm font-semibold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.full_name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] z-40 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-midnight-800 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-lg text-[var(--text-primary)]">Admin</span>
        </div>
        <div className="flex-1" />
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--bg-secondary)] animate-fade-in flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-primary)]">
              <span className="font-display text-lg text-[var(--text-primary)]">Admin Console</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-midnight-800 text-white dark:bg-midnight-700' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`
                  }
                >
                  <link.icon className="w-[18px] h-[18px]" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-3 border-t border-[var(--border-primary)] space-y-0.5">
              <NavLink to="/studies" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
                <ChevronRight className="w-[18px] h-[18px]" /> Student View
              </NavLink>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-red-500 w-full">
                <LogOut className="w-[18px] h-[18px]" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <StudentNav />
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
