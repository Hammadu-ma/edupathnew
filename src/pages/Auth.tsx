import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Button, Input } from '../components/ui/Primitives';
import { GraduationCap, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginAsAdmin } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const success = await login(email, password);
      if (success) navigate('/');
      else setError('Invalid credentials');
    } catch { setError('Something went wrong'); }
    setLoading(false);
  };

  const handleStudentDemo = async () => {
    setLoading(true); setError('');
    await login('sarah.chen@university.edu', 'demo');
    navigate('/');
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    await loginAsAdmin();
    navigate('/admin');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-midnight-800 via-midnight-900 to-midnight-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-lilac-500 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-sky-500 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl text-white">Bloom Learning</span>
          </div>
          <h1 className="font-display text-5xl text-white leading-tight mb-6">
            Your academic<br />journey, elevated.
          </h1>
          <p className="text-lg text-white/60 max-w-md leading-relaxed">
            Access courses, practice with past examinations, and track your progress — all in one beautifully designed platform.
          </p>
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-2">
              {['bg-lilac-400', 'bg-sky-400', 'bg-emerald-400', 'bg-amber-400'].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-midnight-900 flex items-center justify-center text-white text-xs font-bold`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/50">Join 12,000+ students learning smarter</p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl text-[var(--text-primary)]">Bloom Learning</span>
          </div>

          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">Welcome back</h2>
          <p className="text-[var(--text-tertiary)] mb-8">Sign in to continue your learning journey.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-[47px] -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" loading={loading}>
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-[var(--accent)] font-medium hover:underline">Create one</Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
            <p className="text-xs text-[var(--text-tertiary)] text-center mb-3">Demo Access</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={handleStudentDemo}>
                Student Demo
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleAdminLogin}>
                Admin Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const success = await signup(email, password, name);
      if (success) navigate('/onboarding');
    } catch { setError('Something went wrong'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl text-[var(--text-primary)]">Bloom Learning</span>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">Create your account</h2>
          <p className="text-[var(--text-tertiary)]">Start your learning journey today.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" placeholder="Sarah Chen" value={name} onChange={e => setName(e.target.value)} icon={<UserIcon className="w-4 h-4" />} />
          <Input label="Email address" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
          <Input label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Create Account <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
          Already have an account?{' '}
          <Link to="/auth" className="text-[var(--accent)] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [year, setYear] = useState('');
  const { updateUser } = useApp();
  const navigate = useNavigate();

  const steps = [
    { title: 'Choose your university', description: 'Select the institution you study at.' },
    { title: 'Select your program', description: 'Pick your department or field of study.' },
    { title: 'Set your study year', description: 'This helps us find the right courses for you.' },
  ];

  const handleComplete = () => {
    updateUser({ university_id: university || 'uni-1', program_id: program || 'prog-1', study_year_id: year || 'year-2', onboarding_complete: true });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`} />
          ))}
        </div>

        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">{steps[step].title}</h2>
        <p className="text-[var(--text-tertiary)] mb-8">{steps[step].description}</p>

        <div className="space-y-3 mb-8">
          {step === 0 && [
            { id: 'uni-1', name: 'University of Cambridge', country: 'United Kingdom' },
            { id: 'uni-2', name: 'Stanford University', country: 'United States' },
            { id: 'uni-3', name: 'ETH Zurich', country: 'Switzerland' },
            { id: 'uni-4', name: 'University of Toronto', country: 'Canada' },
            { id: 'uni-5', name: 'National University of Singapore', country: 'Singapore' },
          ].map(u => (
            <button
              key={u.id}
              onClick={() => setUniversity(u.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${university === u.id ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'}`}
            >
              <p className="font-medium text-[var(--text-primary)]">{u.name}</p>
              <p className="text-sm text-[var(--text-tertiary)]">{u.country}</p>
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3 mb-8">
            {[
              { id: 'prog-1', name: 'Computer Science', code: 'CS' },
              { id: 'prog-2', name: 'Mathematics', code: 'MATH' },
              { id: 'prog-3', name: 'Engineering', code: 'ENG' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setProgram(p.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${program === p.id ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'}`}
              >
                <p className="font-medium text-[var(--text-primary)]">{p.name}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{p.code}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 mb-8">
            {['First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((y, i) => (
              <button
                key={y}
                onClick={() => setYear(`year-${i + 1}`)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${year === `year-${i + 1}` ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'}`}
              >
                <p className="font-medium text-[var(--text-primary)]">{y}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          <div className="flex-1" />
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)}>Continue <ArrowRight className="w-4 h-4" /></Button>
          ) : (
            <Button onClick={handleComplete}>Complete Setup <ArrowRight className="w-4 h-4" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}
