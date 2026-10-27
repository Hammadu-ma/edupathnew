import React, { useState } from 'react';
import { Button, Input } from './ui/Primitives';
import { useApp } from '../contexts/AppContext';

export function PasswordForm({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const { updatePassword } = useApp();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return onError('Password must be at least 8 characters');
    if (pw !== confirm) return onError('Passwords do not match');
    setBusy(true);
    const err = await updatePassword(pw);
    setBusy(false);
    if (err) onError(err); else { setPw(''); setConfirm(''); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3 max-w-sm">
      <Input label="New password" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
      <Input label="Confirm new password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
      <Button type="submit" loading={busy}>Update password</Button>
    </form>
  );
}
