import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, Button, Input, Select, Toggle, Badge, Toast } from '../components/ui/Primitives';
import { universities, programs, studyYears } from '../data/mockData';
import { User, Mail, GraduationCap, BookOpen, Calendar, Palette, Shield, LogOut, Camera } from 'lucide-react';

export default function Profile() {
  const { user, updateUser, theme, toggleTheme, logout } = useApp();
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [universityId, setUniversityId] = useState(user?.university_id || '');
  const [programId, setProgramId] = useState(user?.program_id || '');
  const [studyYearId, setStudyYearId] = useState(user?.study_year_id || '');
  const [toast, setToast] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('profile');

  const handleSaveProfile = () => {
    updateUser({ full_name: name, email });
    setToast('Profile updated successfully');
  };

  const handleSaveAcademic = () => {
    updateUser({ university_id: universityId, program_id: programId, study_year_id: studyYearId });
    setToast('Academic details updated');
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Profile & Settings</h1>
        <p className="text-[var(--text-tertiary)]">Manage your account, academic details, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === s.id ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Personal Information</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors">
                    <Camera className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{user?.full_name}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">{user?.email}</p>
                  <Badge variant="accent" className="mt-1">Student</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <Input label="Full name" value={name} onChange={e => setName(e.target.value)} icon={<User className="w-4 h-4" />} />
                <Input label="Email address" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} />
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </Card>
          )}

          {activeSection === 'academic' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Academic Details</h2>
              <div className="space-y-4">
                <Select
                  label="University"
                  options={universities.map(u => ({ value: u.id, label: u.name }))}
                  value={universityId}
                  onChange={setUniversityId}
                />
                <Select
                  label="Program / Department"
                  options={programs.filter(p => p.university_id === universityId).map(p => ({ value: p.id, label: p.name }))}
                  value={programId}
                  onChange={setProgramId}
                />
                <Select
                  label="Study Year"
                  options={studyYears.filter(y => y.program_id === programId).map(y => ({ value: y.id, label: y.name }))}
                  value={studyYearId}
                  onChange={setStudyYearId}
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveAcademic}>Update Academic Details</Button>
              </div>
            </Card>
          )}

          {activeSection === 'preferences' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Dark Mode</p>
                    <p className="text-sm text-[var(--text-tertiary)]">Use dark theme across the application</p>
                  </div>
                  <Toggle checked={theme === 'dark'} onChange={() => toggleTheme()} />
                </div>
                <div className="border-t border-[var(--border-primary)] pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Email Notifications</p>
                      <p className="text-sm text-[var(--text-tertiary)]">Receive updates about new resources and exams</p>
                    </div>
                    <Toggle checked={true} onChange={() => {}} />
                  </div>
                </div>
                <div className="border-t border-[var(--border-primary)] pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Study Reminders</p>
                      <p className="text-sm text-[var(--text-tertiary)]">Get reminded about your study goals</p>
                    </div>
                    <Toggle checked={false} onChange={() => {}} />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Security</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">Change Password</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mb-4">Update your password to keep your account secure.</p>
                  <div className="space-y-3 max-w-sm">
                    <Input label="Current password" type="password" placeholder="Enter current password" />
                    <Input label="New password" type="password" placeholder="Enter new password" />
                    <Input label="Confirm new password" type="password" placeholder="Confirm new password" />
                  </div>
                  <Button className="mt-4">Update Password</Button>
                </div>
                <div className="border-t border-[var(--border-primary)] pt-6">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">Sign Out</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mb-4">End your current session.</p>
                  <Button variant="danger" onClick={logout}>
                    <LogOut className="w-4 h-4" /> Sign Out
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
