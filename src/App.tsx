import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { StudentLayout, AdminLayout } from './components/layout/Navigation';

// Lazy load pages
const SignIn = lazy(() => import('./pages/Auth').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./pages/Auth').then(m => ({ default: m.SignUp })));
const Onboarding = lazy(() => import('./pages/Auth').then(m => ({ default: m.Onboarding })));
const Home = lazy(() => import('./pages/Home'));
const MyStudies = lazy(() => import('./pages/Studies').then(m => ({ default: m.MyStudies })));
const CourseDetail = lazy(() => import('./pages/Studies').then(m => ({ default: m.CourseDetail })));
const Resources = lazy(() => import('./pages/Resources'));
const PastExams = lazy(() => import('./pages/Exams').then(m => ({ default: m.default })));
const QuizEngine = lazy(() => import('./pages/Exams').then(m => ({ default: m.QuizEngine })));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminDashboard })));
const AdminCourses = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminCourses })));
const AdminResources = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminResources })));
const AdminExams = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminExams })));
const AdminSettings = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminSettings })));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { isAuthenticated, user } = useApp();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (admin && user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useApp();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />} />
        <Route path="/auth/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignUp />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            {user?.onboarding_complete ? <Navigate to="/" replace /> : <Onboarding />}
          </ProtectedRoute>
        } />

        {/* Student routes */}
        <Route path="/" element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <Navigate to="/admin" replace /> : (
              <StudentLayout><Home /></StudentLayout>
            )}
          </ProtectedRoute>
        } />
        <Route path="/studies" element={
          <ProtectedRoute>
            <StudentLayout><MyStudies /></StudentLayout>
          </ProtectedRoute>
        } />
        <Route path="/course/:id" element={
          <ProtectedRoute>
            <StudentLayout><CourseDetail /></StudentLayout>
          </ProtectedRoute>
        } />
        <Route path="/resources" element={
          <ProtectedRoute>
            <StudentLayout><Resources /></StudentLayout>
          </ProtectedRoute>
        } />
        <Route path="/exams" element={
          <ProtectedRoute>
            <StudentLayout><PastExams /></StudentLayout>
          </ProtectedRoute>
        } />
        <Route path="/quiz/:courseId" element={
          <ProtectedRoute>
            <StudentLayout><QuizEngine /></StudentLayout>
          </ProtectedRoute>
        } />
        <Route path="/bookmarks" element={
          <ProtectedRoute>
            <StudentLayout><Bookmarks /></StudentLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <StudentLayout><Profile /></StudentLayout>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute admin>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/courses" element={
          <ProtectedRoute admin>
            <AdminLayout><AdminCourses /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/resources" element={
          <ProtectedRoute admin>
            <AdminLayout><AdminResources /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/exams" element={
          <ProtectedRoute admin>
            <AdminLayout><AdminExams /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute admin>
            <AdminLayout><AdminSettings /></AdminLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
