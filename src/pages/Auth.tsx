import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useCatalog } from '../contexts/CatalogContext';
import { Button, Input } from '../components/ui/Primitives';
import { HierarchyPicker, HierarchyValue, emptyHierarchy } from '../components/HierarchyPicker';

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-midnight-800 via-midnight-900 to-midnight-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-lilac-500 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-sky-500 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
            <span className="font-display text-2xl text-white">Bloom Learning</span>
          </div>
          <h1 className="font-display text-5xl text-white leading-tight mb-6">Your academic<br />journey, elevated.</h1>
          <p className="text-lg text-white/60 max-w-md leading-relaxed">
            Course materials, past examinations and practice quizzes for your university, program and year — in one place.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-white" /></div>
            <span className="font-display text-xl text-[var(--text-primary)]">Bloom Learning</span>
          </div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">{title}</h2>
          <p className="text-[var(--text-tertiary)] mb-8">{subtitle}</p>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-[var(--text-tertiary)]">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input label={label} type={show ? 'text' : 'password'} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} icon={<Lock className="w-4 h-4" />} autoComplete="current-password" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-[47px] -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function SignIn() {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    const err = await signIn(email.trim(), password);
    if (err) { setError(err); setLoading(false); }
    // On success the auth listener updates state and the router redirects.
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your learning journey."
      footer={<>Don't have an account? <Link to="/auth/signup" className="text-[var(--accent)] font-medium hover:underline">Create one</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email address" type="email" placeholder="you@university.edu" value={email}
          onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} autoComplete="email" />
        <PasswordInput label="Password" value={password} onChange={setPassword} placeholder="Enter your password" />
        <div className="text-right -mt-2">
          <Link to="/auth/forgot" className="text-sm text-[var(--accent)] hover:underline">Forgot password?</Link>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>Sign In <ArrowRight className="w-4 h-4" /></Button>
      </form>
    </AuthShell>
  );
}

export function SignUp() {
  const { signUp } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    const res = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.needsConfirmation) setSent(true);
    else navigate('/onboarding');
  };

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${email}. Open it to activate your account, then sign in.`}
        footer={<Link to="/auth" className="text-[var(--accent)] font-medium hover:underline">Back to sign in</Link>}>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
          Didn't get it? Check your spam folder.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Start your learning journey today."
      footer={<>Already have an account? <Link to="/auth" className="text-[var(--accent)] font-medium hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" placeholder="Sarah Chen" value={name} onChange={e => setName(e.target.value)} icon={<UserIcon className="w-4 h-4" />} autoComplete="name" />
        <Input label="Email address" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} autoComplete="email" />
        <PasswordInput label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
        <PasswordInput label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Repeat your password" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>Create Account <ArrowRight className="w-4 h-4" /></Button>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const { sendPasswordReset } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Enter your email address'); return; }
    setLoading(true); setError('');
    const err = await sendPasswordReset(email.trim());
    setLoading(false);
    if (err) setError(err); else setSent(true);
  };

  return (
    <AuthShell title="Reset your password" subtitle={sent ? 'If an account exists for that email, a reset link is on its way.' : "Enter your email and we'll send you a reset link."}
      footer={<Link to="/auth" className="text-[var(--accent)] font-medium hover:underline">Back to sign in</Link>}>
      {!sent && (
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email address" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}

/** Landing page of the emailed recovery link: Supabase signs the user in, then they choose a new password. */
export function ResetPassword() {
  const { recoveryMode, session, updatePassword } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    const err = await updatePassword(password);
    setLoading(false);
    if (err) setError(err); else navigate('/', { replace: true });
  };

  if (!recoveryMode && !session) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is invalid or has expired."
        footer={<Link to="/auth/forgot" className="text-[var(--accent)] font-medium hover:underline">Request a new link</Link>}>
        <span />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you haven't used before.">
      <form onSubmit={submit} className="space-y-4">
        <PasswordInput label="New password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
        <PasswordInput label="Confirm new password" value={confirm} onChange={setConfirm} placeholder="Repeat your password" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>Update password</Button>
      </form>
    </AuthShell>
  );
}

export function Onboarding() {
  const { user, updateProfile, signOut } = useApp();
  const { universities, loading } = useCatalog();
  const navigate = useNavigate();
  const [value, setValue] = useState<HierarchyValue>({
    ...emptyHierarchy,
    university_id: user?.university_id || '', program_id: user?.program_id || '',
    study_year_id: user?.study_year_id || '', term_id: user?.term_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const finish = async () => {
    if (!value.university_id || !value.program_id) { setError('Choose your university and program to continue.'); return; }
    setSaving(true); setError('');
    const err = await updateProfile({
      university_id: value.university_id, program_id: value.program_id,
      study_year_id: value.study_year_id || null, term_id: value.term_id || null, onboarding_complete: true,
    });
    setSaving(false);
    if (err) setError(err); else navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">Set up your studies</h2>
        <p className="text-[var(--text-tertiary)] mb-8">Tell us where you study so we can show the right courses. You can change this anytime in your profile.</p>
        {!loading && universities.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)] mb-6">
            No universities have been added yet. Ask an administrator to add your university, or skip for now.
          </div>
        ) : (
          <HierarchyPicker value={value} onChange={setValue} />
        )}
        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
        <div className="flex gap-3 mt-8">
          <Button variant="ghost" onClick={signOut}>Sign out</Button>
          <div className="flex-1" />
          {universities.length === 0 && (
            <Button variant="secondary" onClick={async () => { await updateProfile({ onboarding_complete: true }); navigate('/', { replace: true }); }}>Skip for now</Button>
          )}
          <Button onClick={finish} loading={saving}>Complete setup <ArrowRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}
