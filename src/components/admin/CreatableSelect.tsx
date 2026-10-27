import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';

export interface SelOption { value: string; label: string; hint?: string }

interface Props {
  label: string;
  icon?: React.ReactNode;
  value: string;
  options: SelOption[];
  onChange: (value: string) => void;
  /** Creates a record from the typed name and returns its new id. Omit to disable "create new". */
  onCreate?: (name: string) => Promise<string>;
  optional?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  placeholder?: string;
  noun?: string;
}

/** Searchable dropdown where a missing item can be created on the spot. */
export function CreatableSelect({ label, icon, value, options, onChange, onCreate, optional, disabled, disabledHint, placeholder = 'Select…', noun = 'item' }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    setQ(''); setErr('');
    const t = setTimeout(() => input.current?.focus(), 20);
    return () => { document.removeEventListener('mousedown', h); clearTimeout(t); };
  }, [open]);

  const selected = options.find(o => o.value === value);
  const term = q.trim();
  const filtered = options.filter(o => o.label.toLowerCase().includes(term.toLowerCase()));
  const exact = options.some(o => o.label.toLowerCase() === term.toLowerCase());
  const canCreate = !!onCreate && term.length > 0 && !exact;

  const pick = (v: string) => { onChange(v); setOpen(false); };
  const create = async () => {
    if (!onCreate || busy) return;
    setBusy(true); setErr('');
    try { const id = await onCreate(term); onChange(id); setOpen(false); }
    catch (e: any) { setErr(e.message || 'Could not create'); }
    finally { setBusy(false); }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter') { e.preventDefault(); if (filtered.length && !(canCreate && filtered.length === 0)) pick(filtered[0].value); else if (canCreate) void create(); }
  };

  return (
    <div ref={wrap} className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        {optional && <span className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Optional</span>}
      </div>
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} title={disabled ? disabledHint : undefined}
        className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-left transition-all
          ${open ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/25' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-secondary)]'}`}>
        {icon && <span className="text-[var(--text-tertiary)] flex-shrink-0">{icon}</span>}
        <span className={`flex-1 truncate ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          {selected ? selected.label : disabled && disabledHint ? disabledHint : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${open ? 'rotate-180' : ''} ${optional && value ? 'mr-6' : ''}`} />
      </button>
      {optional && value && !disabled && (
        <button type="button" onClick={() => onChange('')} aria-label={`Clear ${label}`}
          className="absolute right-9 bottom-[9px] p-0.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"><X className="w-3.5 h-3.5" /></button>
      )}

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xl shadow-black/20 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border-primary)]">
            <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
            <input ref={input} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder={`Search or type a new ${noun}…`}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none" />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.map(o => (
              <li key={o.value}>
                <button type="button" onClick={() => pick(o.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="text-xs text-[var(--text-tertiary)]">{o.hint}</span>}
                  {o.value === value && <Check className="w-4 h-4 text-[var(--accent)]" />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && !canCreate && <li className="px-3 py-3 text-sm text-[var(--text-tertiary)]">{options.length ? 'No matches.' : `No ${noun}s yet — type a name to create one.`}</li>}
            {canCreate && (
              <li>
                <button type="button" onClick={create} disabled={busy}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-[var(--accent)] font-medium bg-[var(--accent-subtle)] hover:brightness-95 border-t border-[var(--border-primary)]">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create “{term}”
                </button>
              </li>
            )}
          </ul>
          {err && <p className="px-3 py-2 text-xs text-red-500 border-t border-[var(--border-primary)]">{err}</p>}
        </div>
      )}
    </div>
  );
}
