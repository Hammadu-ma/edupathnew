import React, { useMemo, useState } from 'react';
import { Edit, Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatSize, uploadFile } from '../../lib/db';
import { useAsync } from '../../hooks/useAsync';
import { Button, EmptyState, ErrorNote, Input, Modal, PageLoader, SearchInput, Select, Textarea, Toast } from '../ui/Primitives';

export interface Opt { value: string; label: string }
type Values = Record<string, any>;

export interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'file' | 'color' | 'options';
  options?: Opt[] | ((values: Values) => Opt[]);
  required?: boolean;
  nullable?: boolean;        // '' is stored as NULL
  placeholder?: string;
  half?: boolean;            // take half the form width
  resets?: string[];         // keys to clear when this select changes (dependent dropdowns)
  sizeKey?: string;          // file fields: also store the file size here
  accept?: string;
  bucket?: string;           // file fields: storage bucket (default "resources")
  folder?: string;
  hint?: string;
}

export interface Column { header: string; cell: (row: any) => React.ReactNode; className?: string }

interface Props {
  table: string;
  title: string;
  subtitle?: string;
  singular: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  columns: Column[];
  fields: Field[];
  defaults?: Values;
  searchText?: (row: any) => string;
  validate?: (values: Values, files: Record<string, File>) => string | null;
  onChanged?: () => void;
  /** change this value to force a reload (e.g. when lookups changed) */
  reloadKey?: unknown;
}

const OPTION_SLOTS = 4;

export function CrudManager(p: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ id?: string; values: Values } | null>(null);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    let q = supabase.from(p.table).select(p.select ?? '*');
    if (p.orderBy) q = q.order(p.orderBy.column, { ascending: p.orderBy.ascending ?? true });
    else q = q.order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  }, [p.table, p.reloadKey]);

  const rows = useMemo(() => {
    const all = data ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(r => (p.searchText ? p.searchText(r) : JSON.stringify(r)).toLowerCase().includes(q));
  }, [data, search, p]);

  const blank = (): Values => {
    const v: Values = { ...(p.defaults ?? {}) };
    p.fields.forEach(f => {
      if (v[f.key] === undefined) {
        v[f.key] = f.type === 'checkbox' ? false : f.type === 'color' ? '#8b5cf6' : '';
        if (f.type === 'options') {
          v.options = Array.from({ length: OPTION_SLOTS }, (_, i) => ({ id: String.fromCharCode(97 + i), text: '' }));
          v.correct_option_id = '';
        }
      }
    });
    return v;
  };

  const startCreate = () => { setFiles({}); setFormError(''); setEditing({ values: blank() }); };
  const startEdit = (row: any) => {
    const v: Values = { ...blank(), ...row };
    p.fields.forEach(f => {
      if (f.type === 'options') {
        const existing: { id: string; text: string }[] = Array.isArray(row.options) ? row.options : [];
        v.options = Array.from({ length: Math.max(OPTION_SLOTS, existing.length) }, (_, i) => existing[i] ?? { id: String.fromCharCode(97 + i), text: '' });
      } else if (row[f.key] === null || row[f.key] === undefined) {
        v[f.key] = f.type === 'checkbox' ? false : '';
      }
    });
    setFiles({}); setFormError(''); setEditing({ id: row.id, values: v });
  };

  const setValue = (f: Field, value: any) => {
    setEditing(e => {
      if (!e) return e;
      const next = { ...e.values, [f.key]: value };
      f.resets?.forEach(k => { next[k] = ''; });
      return { ...e, values: next };
    });
  };

  const save = async () => {
    if (!editing) return;
    const v = editing.values;
    const payload: Values = {};
    for (const f of p.fields) {
      if (f.type === 'options') {
        const opts = (v.options as { id: string; text: string }[]).map(o => ({ id: o.id, text: o.text.trim() })).filter(o => o.text);
        if (f.required && opts.length < 2) return setFormError('Add at least two answer options.');
        if (!opts.some(o => o.id === v.correct_option_id)) return setFormError('Mark which option is correct.');
        payload.options = opts; payload.correct_option_id = v.correct_option_id;
        continue;
      }
      if (f.type === 'file') continue;
      let val = v[f.key];
      if (f.type === 'number') val = val === '' || val === null ? null : Number(val);
      else if (f.type === 'checkbox') val = !!val;
      else if (typeof val === 'string') { val = val.trim(); if (val === '' && (f.nullable || f.type === 'select' || f.type === 'textarea')) val = null; }
      if (f.required && (val === null || val === '' || val === undefined)) return setFormError(`${f.label} is required.`);
      payload[f.key] = val;
    }
    const custom = p.validate?.(v, files);
    if (custom) return setFormError(custom);

    setSaving(true); setFormError('');
    try {
      for (const f of p.fields.filter(x => x.type === 'file')) {
        const file = files[f.key];
        if (file) {
          payload[f.key] = await uploadFile(f.bucket ?? 'resources', file, f.folder ?? p.table);
          if (f.sizeKey) payload[f.sizeKey] = file.size;
        }
      }
      const res = editing.id
        ? await supabase.from(p.table).update(payload).eq('id', editing.id)
        : await supabase.from(p.table).insert(payload);
      if (res.error) throw new Error(res.error.message);
      setEditing(null);
      setToast({ msg: `${p.singular} ${editing.id ? 'updated' : 'created'}`, type: 'success' });
      reload(); p.onChanged?.();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    if (!window.confirm(`Delete this ${p.singular.toLowerCase()}? Anything that belongs to it may be deleted too.`)) return;
    const { error } = await supabase.from(p.table).delete().eq('id', row.id);
    if (error) setToast({ msg: error.message, type: 'error' });
    else { setToast({ msg: `${p.singular} deleted`, type: 'success' }); reload(); p.onChanged?.(); }
  };

  const optionsFor = (f: Field, values: Values): Opt[] => {
    const base = typeof f.options === 'function' ? f.options(values) : f.options ?? [];
    return f.type === 'select' && (f.nullable || !values[f.key]) ? [{ value: '', label: f.nullable ? '— None —' : 'Select…' }, ...base] : base;
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="font-display text-2xl text-[var(--text-primary)]">{p.title}</h2>
          {p.subtitle && <p className="text-sm text-[var(--text-tertiary)]">{p.subtitle}</p>}
        </div>
        <Button onClick={startCreate}><Plus className="w-4 h-4" /> New {p.singular.toLowerCase()}</Button>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder={`Search ${p.title.toLowerCase()}...`} className="mb-4" />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading ? <PageLoader /> : rows.length === 0 ? (
        <EmptyState icon={<Plus className="w-8 h-8" />} title={`No ${p.title.toLowerCase()} yet`} description={`Create the first ${p.singular.toLowerCase()} to get started.`} />
      ) : (
        <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                  {p.columns.map(c => <th key={c.header} className={`text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider ${c.className ?? ''}`}>{c.header}</th>)}
                  <th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-tertiary)]">
                    {p.columns.map(c => <td key={c.header} className={`px-4 py-3 text-sm text-[var(--text-secondary)] ${c.className ?? ''}`}>{c.cell(row)}</td>)}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(row)} aria-label="Edit" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => remove(row)} aria-label="Delete" className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!editing} onClose={() => !saving && setEditing(null)} title={`${editing?.id ? 'Edit' : 'New'} ${p.singular.toLowerCase()}`} size="lg">
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {p.fields.map(f => {
                const v = editing.values;
                const span = f.half ? '' : 'col-span-2';
                const label = f.label + (f.required ? ' *' : '');
                if (f.type === 'text' || f.type === 'number')
                  return <div key={f.key} className={span}><Input label={label} type={f.type} placeholder={f.placeholder} value={v[f.key] ?? ''} onChange={e => setValue(f, e.target.value)} />{f.hint && <p className="text-xs text-[var(--text-tertiary)] mt-1">{f.hint}</p>}</div>;
                if (f.type === 'textarea')
                  return <div key={f.key} className={span}><Textarea label={label} placeholder={f.placeholder} value={v[f.key] ?? ''} onChange={e => setValue(f, e.target.value)} /></div>;
                if (f.type === 'select')
                  return <div key={f.key} className={span}><Select label={label} value={v[f.key] ?? ''} options={optionsFor(f, v)} onChange={val => setValue(f, val)} /></div>;
                if (f.type === 'color')
                  return <div key={f.key} className={span}><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label><input type="color" value={v[f.key] || '#8b5cf6'} onChange={e => setValue(f, e.target.value)} className="h-10 w-16 rounded-lg border border-[var(--border-primary)] bg-transparent" /></div>;
                if (f.type === 'checkbox')
                  return <label key={f.key} className={`${span} flex items-center gap-2 text-sm text-[var(--text-primary)]`}><input type="checkbox" checked={!!v[f.key]} onChange={e => setValue(f, e.target.checked)} /> {f.label}</label>;
                if (f.type === 'file')
                  return (
                    <div key={f.key} className={span}>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
                      <label className="flex items-center gap-3 border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-4 cursor-pointer hover:border-[var(--accent)]">
                        <Upload className="w-5 h-5 text-[var(--text-tertiary)]" />
                        <span className="text-sm text-[var(--text-secondary)] flex-1 truncate">
                          {files[f.key] ? `${files[f.key].name} (${formatSize(files[f.key].size)})` : v[f.key] ? `Current: ${String(v[f.key]).split('/').pop()}` : 'Click to choose a file'}
                        </span>
                        <input type="file" hidden accept={f.accept} onChange={e => { const file = e.target.files?.[0]; if (file) setFiles(prev => ({ ...prev, [f.key]: file })); }} />
                      </label>
                    </div>
                  );
                if (f.type === 'options')
                  return (
                    <div key={f.key} className="col-span-2 space-y-2">
                      <p className="text-sm font-medium text-[var(--text-secondary)]">Answer options * <span className="font-normal text-[var(--text-tertiary)]">(select the correct one)</span></p>
                      {(v.options as { id: string; text: string }[]).map((o, i) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <input type="radio" name="correct" checked={v.correct_option_id === o.id} onChange={() => setEditing(e => e && ({ ...e, values: { ...e.values, correct_option_id: o.id } }))} aria-label={`Option ${i + 1} is correct`} />
                          <Input className="flex-1" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={o.text}
                            onChange={ev => setEditing(e => e && ({ ...e, values: { ...e.values, options: e.values.options.map((x: any) => x.id === o.id ? { ...x, text: ev.target.value } : x) } }))} />
                        </div>
                      ))}
                    </div>
                  );
                return null;
              })}
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button onClick={save} loading={saving}>{editing.id ? 'Save changes' : 'Create'}</Button>
            </div>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
