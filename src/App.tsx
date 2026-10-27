import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { StudentLayout, AdminLayout } from './components/layout/Navigation';

const named = <T extends Record<string, any>>(load: () => Promise<T>, key: keyof T) =>
  lazy(() => load().then(m => ({ default: m[key] as React.ComponentType })));

const SignIn = named(() => import('./pages/Auth'), 'SignIn');
const SignUp = named(() => import('./pages/Auth'), 'SignUp');
const ForgotPassword = named(() => import('./pages/Auth'), 'ForgotPassword');
const ResetPassword = named(() => import('./pages/Auth'), 'ResetPassword');
const Onboarding = named(() => import('./pages/Auth'), 'Onboarding');
const Home = lazy(() => import('./pages/Home'));
const MyStudies = named(() => import('./pages/Studies'), 'MyStudies');
const CourseDetail = named(() => import('./pages/Studies'), 'CourseDetail');
const Resources = lazy(() => import('./pages/Resources'));
const PastExams = lazy(() => import('./pages/Exams'));
const QuizEngine = named(() => import('./pages/Exams'), 'QuizEngine');
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Progress = lazy(() => import('./pages/Progress'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = named(() => import('./pages/Admin'), 'AdminDashboard');
const AdminContent = lazy(() => import('./pages/AdminContent'));
const AdminStructure = named(() => import('./pages/Admin'), 'AdminStructure');
const AdminCourses = named(() => import('./pages/Admin'), 'AdminCourses');
const AdminResources = named(() => import('./pages/Admin'), 'AdminResources');
const AdminExams = named(() => import('./pages/Admin'), 'AdminExams');
const AdminUsers = named(() => import('./pages/Admin'), 'AdminUsers');

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <p className="text-sm text-[var(--text-tertiary)] animate-pulse">Loading...</p>
    </div>
  );
}

function ProtectedRoute({ children, admin = false, allowIncomplete = false }: { children: React.ReactNode; admin?: boolean; allowIncomplete?: boolean }) {
  const { isAuthenticated, user, loading } = useApp();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!allowIncomplete && user?.role === 'student' && !user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  if (admin && user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

const Student = ({ children }: { children: React.ReactNode }) => <ProtectedRoute><StudentLayout>{children}</StudentLayout></ProtectedRoute>;
const Admin = ({ children }: { children: React.ReactNode }) => <ProtectedRoute admin><AdminLayout>{children}</AdminLayout></ProtectedRoute>;

function AppRoutes() {
  const { isAuthenticated, user, loading } = useApp();
  if (loading) return <LoadingScreen />;
  const guest = (el: React.ReactNode) => (isAuthenticated ? <Navigate to="/" replace /> : el);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/auth" element={guest(<SignIn />)} />
        <Route path="/auth/signup" element={guest(<SignUp />)} />
        <Route path="/auth/forgot" element={guest(<ForgotPassword />)} />
        {/* the emailed recovery link signs the user in first, so this must work while authenticated */}
        <Route path="/auth/reset" element={<ResetPassword />} />
        <Route path="/onboarding" element={
          <ProtectedRoute allowIncomplete>{user?.onboarding_complete ? <Navigate to="/" replace /> : <Onboarding />}</ProtectedRoute>
        } />

        <Route path="/" element={<ProtectedRoute>{user?.role === 'admin' ? <Navigate to="/admin" replace /> : <StudentLayout><Home /></StudentLayout>}</ProtectedRoute>} />
        <Route path="/studies" element={<Student><MyStudies /></Student>} />
        <Route path="/course/:id" element={<Student><CourseDetail /></Student>} />
        <Route path="/resources" element={<Student><Resources /></Student>} />
        <Route path="/exams" element={<Student><PastExams /></Student>} />
        <Route path="/quiz/:courseId" element={<Student><QuizEngine /></Student>} />
        <Route path="/bookmarks" element={<Student><Bookmarks /></Student>} />
        <Route path="/progress" element={<Student><Progress /></Student>} />
        <Route path="/profile" element={<Student><Profile /></Student>} />

        <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
        <Route path="/admin/structure" element={<Admin><AdminStructure /></Admin>} />
        <Route path="/admin/content" element={<Admin><AdminContent /></Admin>} />
        <Route path="/admin/courses" element={<Admin><AdminCourses /></Admin>} />
        <Route path="/admin/resources" element={<Admin><AdminResources /></Admin>} />
        <Route path="/admin/exams" element={<Admin><AdminExams /></Admin>} />
        <Route path="/admin/users" element={<Admin><AdminUsers /></Admin>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <CatalogProvider>
          <AppRoutes />
        </CatalogProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
