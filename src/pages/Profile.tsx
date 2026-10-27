import React, { useRef, useState } from 'react';
import { Camera, GraduationCap, LogOut, Mail, Palette, Shield, User as UserIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { Badge, Button, Card, Input, Toast, Toggle } from '../components/ui/Primitives';
import { HierarchyPicker, HierarchyValue } from '../components/HierarchyPicker';
import { PasswordForm } from '../components/PasswordForm';

export default function Profile() {
  const { user, updateProfile, theme, toggleTheme, signOut } = useApp();
  const [name, setName] = useState(user?.full_name || '');
  const [academic, setAcademic] = useState<HierarchyValue>({
    university_id: user?.university_id || '', program_id: user?.program_id || '',
    study_year_id: user?.study_year_id || '', term_id: user?.term_id || '',
  });
  const [section, setSection] = useState('profile');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const prefs = user?.preferences ?? {};

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });
  const save = async (patch: Parameters<typeof updateProfile>[0], ok: string) => {
    setBusy(true);
    const err = await updateProfile(patch);
    setBusy(false);
    err ? notify(err, 'error') : notify(ok);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) { notify('Please choose an image file', 'error'); return; }
    if (file.size > 3_000_000) { notify('Image must be under 3 MB', 'error'); return; }
    setBusy(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
    if (error) { setBusy(false); notify(error.message, 'error'); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await save({ avatar_url: data.publicUrl }, 'Profile picture updated');
  };

  const setPref = (key: string, value: boolean) => save({ preferences: { ...prefs, [key]: value } }, 'Preferences saved');

  const sections = [
    { id: 'profile', label: 'Profile', icon: UserIcon }, { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'preferences', label: 'Preferences', icon: Palette }, { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Profile & Settings</h1>
        <p className="text-[var(--text-tertiary)]">Manage your account, academic details, and preferences.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 flex lg:block gap-1 overflow-x-auto space-y-0 lg:space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap lg:w-full ${section === s.id ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
              <s.icon className="w-4 h-4" />{s.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {section === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Personal information</h2>
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                    : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-2xl font-bold">{user?.full_name?.charAt(0) || 'U'}</div>}
                  <button onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Change profile picture"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-tertiary)]">
                    <Camera className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) void uploadAvatar(f); e.target.value = ''; }} />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{user?.full_name}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">{user?.email}</p>
                  <Badge variant="accent" className="mt-1">{user?.role === 'admin' ? 'Administrator' : 'Student'}</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <Input label="Full name" value={name} onChange={e => setName(e.target.value)} icon={<UserIcon className="w-4 h-4" />} />
                <Input label="Email address" value={user?.email || ''} disabled icon={<Mail className="w-4 h-4" />} />
              </div>
              <div className="mt-6 flex justify-end">
                <Button loading={busy} onClick={() => name.trim() ? save({ full_name: name.trim() }, 'Profile updated') : notify('Name cannot be empty', 'error')}>Save changes</Button>
              </div>
            </Card>
          )}

          {section === 'academic' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Academic details</h2>
              <HierarchyPicker value={academic} onChange={setAcademic} />
              <div className="mt-6 flex justify-end">
                <Button loading={busy} onClick={() => !academic.university_id || !academic.program_id ? notify('Choose a university and program', 'error')
                  : save({ university_id: academic.university_id, program_id: academic.program_id, study_year_id: academic.study_year_id || null, term_id: academic.term_id || null }, 'Academic details updated')}>
                  Update academic details
                </Button>
              </div>
            </Card>
          )}

          {section === 'preferences' && (
            <Card className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Preferences</h2>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-[var(--text-primary)]">Dark mode</p><p className="text-sm text-[var(--text-tertiary)]">Use the dark theme across the app</p></div>
                <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
              <div className="border-t border-[var(--border-primary)] pt-6 flex items-center justify-between">
                <div><p className="font-medium text-[var(--text-primary)]">Email notifications</p><p className="text-sm text-[var(--text-tertiary)]">Updates about new resources and exams</p></div>
                <Toggle checked={prefs.email_notifications !== false} onChange={v => setPref('email_notifications', v)} />
              </div>
              <div className="border-t border-[var(--border-primary)] pt-6 flex items-center justify-between">
                <div><p className="font-medium text-[var(--text-primary)]">Study reminders</p><p className="text-sm text-[var(--text-tertiary)]">Reminders about your study goals</p></div>
                <Toggle checked={!!prefs.study_reminders} onChange={v => setPref('study_reminders', v)} />
              </div>
            </Card>
          )}

          {section === 'security' && (
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Change password</h2>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">Use at least 8 characters.</p>
                <PasswordForm onDone={() => notify('Password updated')} onError={m => notify(m, 'error')} />
              </div>
              <div className="border-t border-[var(--border-primary)] pt-6">
                <h3 className="font-medium text-[var(--text-primary)] mb-2">Sign out</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">End your current session on this device.</p>
                <Button variant="danger" onClick={signOut}><LogOut className="w-4 h-4" /> Sign out</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
