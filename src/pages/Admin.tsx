import React, { useState } from 'react';
import { BookOpen, CheckCircle2, FileText, GraduationCap, Library, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/db';
import { useApp } from '../contexts/AppContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useAsync } from '../hooks/useAsync';
import { Badge, Card, ErrorNote, PageLoader, SearchInput, Select, Tabs, Toast } from '../components/ui/Primitives';
import { CrudManager, Field, Opt } from '../components/admin/CrudManager';
import type { Profile } from '../types';

const Page = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    <div className="mb-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1">{title}</h1>
      <p className="text-[var(--text-tertiary)]">{subtitle}</p>
    </div>
    {children}
  </div>
);
const Status = ({ on, yes = 'Active', no = 'Inactive' }: { on: boolean; yes?: string; no?: string }) => <Badge variant={on ? 'success' : 'warning'}>{on ? yes : no}</Badge>;

/** Every record (including inactive / unpublished) for the admin dropdowns. */
function useLookups() {
  const { data, reload, loading } = useAsync(async () => {
    const get = <T,>(t: string, cols = '*') => unwrap<T[]>(supabase.from(t).select(cols).order('created_at') as any).then(r => r ?? []);
    const [universities, programs, years, terms, courses, exams] = await Promise.all([
      get<any>('universities'), get<any>('programs'), get<any>('study_years'), get<any>('terms'), get<any>('courses'), get<any>('past_exams', 'id,title,course_id,exam_year'),
    ]);
    return { universities, programs, years, terms, courses, exams };
  }, []);
  const lk = data ?? { universities: [], programs: [], years: [], terms: [], courses: [], exams: [] };
  const uniName = (id: string) => { const u = lk.universities.find((x: any) => x.id === id); return u?.code || u?.name || '?'; };
  const progLabel = (p: any) => `${uniName(p.university_id)} — ${p.name}`;
  const yearLabel = (y: any) => { const p = lk.programs.find((x: any) => x.id === y.program_id); return `${p ? progLabel(p) : '?'} — ${y.name}`; };
  const courseLabel = (c: any) => `${c.code} — ${c.title}`;
  const find = (list: any[], id?: string | null) => list.find(x => x.id === id);
  return { lk, reload, loading, uniName, progLabel, yearLabel, courseLabel, find };
}

// --------------------------------------------------------------------------- Dashboard
export function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(async () => {
    const count = async (t: string) => { const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true }); if (error) throw new Error(error.message); return count ?? 0; };
    const [universities, programs, courses, resources, exams, questions, users, attempts] = await Promise.all(
      ['universities', 'programs', 'courses', 'resources', 'past_exams', 'questions', 'profiles', 'quiz_attempts'].map(count));
    const recent = await unwrap<any[]>(supabase.from('courses').select('id,code,title,cover_color,is_published').order('created_at', { ascending: false }).limit(5) as any);
    return { universities, programs, courses, resources, exams, questions, users, attempts, recent: recent ?? [] };
  }, []);
  if (loading) return <PageLoader />;
  if (error) return <Page title="Admin Dashboard" subtitle=""><ErrorNote message={error} onRetry={reload} /></Page>;
  const d = data!;
  const stats = [
    { l: 'Universities', v: d.universities, i: GraduationCap, c: '#6366f1' }, { l: 'Courses', v: d.courses, i: BookOpen, c: '#8b5cf6' },
    { l: 'Resources', v: d.resources, i: Library, c: '#0ea5e9' }, { l: 'Past exams', v: d.exams, i: FileText, c: '#10b981' },
    { l: 'Questions', v: d.questions, i: CheckCircle2, c: '#f59e0b' }, { l: 'Users', v: d.users, i: UsersIcon, c: '#ec4899' },
  ];
  return (
    <Page title="Admin Dashboard" subtitle="Overview of your learning platform content and activity.">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.l} className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.c + '20' }}><s.i className="w-5 h-5" style={{ color: s.c }} /></div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{s.v}</p><p className="text-sm text-[var(--text-tertiary)]">{s.l}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recently added courses</h3>
        <div className="space-y-2">
          {d.recent.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No courses yet. Start under “Structure”, then add courses.</p>}
          {d.recent.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.cover_color }}>{c.code.slice(0, 2)}</div>
              <p className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{c.code} · {c.title}</p>
              <Status on={c.is_published} yes="Published" no="Draft" />
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-4">{d.attempts} quiz attempts recorded across all students.</p>
      </Card>
    </Page>
  );
}

// --------------------------------------------------------------------------- Structure
export function AdminStructure() {
  const { refresh } = useCatalog();
  const { lk, reload, loading, uniName, progLabel, yearLabel, find } = useLookups();
  const [tab, setTab] = useState('universities');
  const [ver, setVer] = useState(0);
  const changed = () => { reload(); void refresh(); setVer(v => v + 1); };
  if (loading && !lk.universities.length && ver === 0) return <PageLoader />;

  const active: Field = { key: 'is_active', label: 'Active (visible to students)', type: 'checkbox' };
  const uniOpts: Opt[] = lk.universities.map((u: any) => ({ value: u.id, label: u.name }));

  return (
    <Page title="Academic Structure" subtitle="University → Program/Department → Study year → optional Semester / course bundle. Names are free text, so any academic system fits.">
      <Tabs activeTab={tab} onChange={setTab} tabs={[
        { id: 'universities', label: 'Universities', count: lk.universities.length }, { id: 'programs', label: 'Programs / Departments', count: lk.programs.length },
        { id: 'years', label: 'Study years', count: lk.years.length }, { id: 'terms', label: 'Semesters / bundles', count: lk.terms.length },
      ]} />
      <div className="mt-6">
        {tab === 'universities' && (
          <CrudManager table="universities" title="Universities" singular="University" orderBy={{ column: 'name' }} onChanged={changed}
            defaults={{ is_active: true }}
            columns={[{ header: 'Name', cell: r => <span className="font-medium text-[var(--text-primary)]">{r.name}</span> }, { header: 'Code', cell: r => r.code ?? '—' }, { header: 'Country', cell: r => r.country ?? '—', className: 'hidden sm:table-cell' }, { header: 'Status', cell: r => <Status on={r.is_active} /> }]}
            fields={[{ key: 'name', label: 'Name', type: 'text', required: true }, { key: 'code', label: 'Short code', type: 'text', half: true, placeholder: 'CAM' }, { key: 'country', label: 'Country', type: 'text', half: true }, active]} />
        )}
        {tab === 'programs' && (
          <CrudManager table="programs" title="Programs / Departments" singular="Program" orderBy={{ column: 'name' }} onChanged={changed} reloadKey={ver}
            defaults={{ is_active: true }}
            columns={[{ header: 'Program', cell: r => <span className="font-medium text-[var(--text-primary)]">{r.name}</span> }, { header: 'University', cell: r => uniName(r.university_id) }, { header: 'Status', cell: r => <Status on={r.is_active} /> }]}
            fields={[{ key: 'university_id', label: 'University', type: 'select', required: true, options: uniOpts }, { key: 'name', label: 'Name', type: 'text', required: true, half: true }, { key: 'code', label: 'Code', type: 'text', half: true }, { key: 'description', label: 'Description', type: 'textarea' }, active]} />
        )}
        {tab === 'years' && (
          <CrudManager table="study_years" title="Study years" singular="Study year" orderBy={{ column: 'created_at', ascending: false }} onChanged={changed} reloadKey={ver}
            defaults={{ is_active: true, sort_order: 0 }}
            columns={[{ header: 'Year', cell: r => <span className="font-medium text-[var(--text-primary)]">{r.name}</span> }, { header: 'Program', cell: r => { const p = find(lk.programs, r.program_id); return p ? progLabel(p) : '—'; } }, { header: 'Status', cell: r => <Status on={r.is_active} /> }]}
            fields={[{ key: 'program_id', label: 'Program', type: 'select', required: true, options: lk.programs.map((p: any) => ({ value: p.id, label: progLabel(p) })) }, { key: 'name', label: 'Name', type: 'text', required: true, half: true, placeholder: 'Year 2 / Level 200 / Sophomore' }, { key: 'sort_order', label: 'Sort order', type: 'number', half: true }, active]} />
        )}
        {tab === 'terms' && (
          <CrudManager table="terms" title="Semesters / course bundles" singular="Semester or bundle" orderBy={{ column: 'created_at', ascending: false }} onChanged={changed} reloadKey={ver}
            defaults={{ is_active: true, sort_order: 0, kind: 'semester' }}
            columns={[{ header: 'Name', cell: r => <span className="font-medium text-[var(--text-primary)]">{r.name}</span> }, { header: 'Kind', cell: r => r.kind }, { header: 'Year', cell: r => { const y = find(lk.years, r.study_year_id); return y ? yearLabel(y) : '—'; } }, { header: 'Status', cell: r => <Status on={r.is_active} /> }]}
            fields={[{ key: 'study_year_id', label: 'Study year', type: 'select', required: true, options: lk.years.map((y: any) => ({ value: y.id, label: yearLabel(y) })) }, { key: 'name', label: 'Name', type: 'text', required: true, half: true, placeholder: 'Semester 1 / Trimester B / Core bundle' },
              { key: 'kind', label: 'Kind', type: 'select', half: true, options: ['semester', 'trimester', 'quarter', 'bundle', 'module', 'other'].map(k => ({ value: k, label: k })) }, { key: 'sort_order', label: 'Sort order', type: 'number', half: true }, active]} />
        )}
      </div>
    </Page>
  );
}

// --------------------------------------------------------------------------- Courses
export function AdminCourses() {
  const { refresh } = useCatalog();
  const { lk, reload, loading, uniName, progLabel, find } = useLookups();
  const [ver, setVer] = useState(0);
  if (loading && !lk.universities.length && ver === 0) return <PageLoader />;

  return (
    <Page title="Course Management" subtitle="Courses sit under a program. Study year and semester/bundle are optional.">
      <CrudManager table="courses" title="Courses" singular="Course" orderBy={{ column: 'code' }} reloadKey={ver}
        onChanged={() => { reload(); void refresh(); setVer(v => v + 1); }}
        defaults={{ cover_color: '#8b5cf6', is_published: false }}
        searchText={r => `${r.code} ${r.title}`}
        columns={[
          { header: 'Course', cell: r => <div><p className="font-medium text-[var(--text-primary)]">{r.title}</p><p className="text-xs text-[var(--text-tertiary)]">{r.code}{r.credits ? ` · ${r.credits} cr` : ''}</p></div> },
          { header: 'Program', className: 'hidden sm:table-cell', cell: r => { const p = find(lk.programs, r.program_id); return p ? progLabel(p) : '—'; } },
          { header: 'Year / term', className: 'hidden md:table-cell', cell: r => [find(lk.years, r.study_year_id)?.name, find(lk.terms, r.term_id)?.name].filter(Boolean).join(' · ') || 'Whole program' },
          { header: 'Status', cell: r => <Status on={r.is_published} yes="Published" no="Draft" /> },
        ]}
        fields={[
          { key: 'university_id', label: 'University', type: 'select', required: true, resets: ['program_id', 'study_year_id', 'term_id'], options: lk.universities.map((u: any) => ({ value: u.id, label: u.name })) },
          { key: 'program_id', label: 'Program / Department', type: 'select', required: true, resets: ['study_year_id', 'term_id'], options: v => lk.programs.filter((p: any) => p.university_id === v.university_id).map((p: any) => ({ value: p.id, label: p.name })) },
          { key: 'study_year_id', label: 'Study year (optional)', type: 'select', nullable: true, half: true, resets: ['term_id'], options: v => lk.years.filter((y: any) => y.program_id === v.program_id).map((y: any) => ({ value: y.id, label: y.name })) },
          { key: 'term_id', label: 'Semester / bundle (optional)', type: 'select', nullable: true, half: true, options: v => lk.terms.filter((t: any) => t.study_year_id === v.study_year_id).map((t: any) => ({ value: t.id, label: t.name })) },
          { key: 'code', label: 'Course code', type: 'text', required: true, half: true, placeholder: 'CS201' },
          { key: 'credits', label: 'Credits', type: 'number', half: true },
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'cover_color', label: 'Cover color', type: 'color', half: true },
          { key: 'is_published', label: 'Published (visible to students)', type: 'checkbox', half: true },
        ]} />
    </Page>
  );
}

// --------------------------------------------------------------------------- Resources
export function AdminResources() {
  const { refresh } = useCatalog();
  const { lk, loading, courseLabel, find } = useLookups();
  if (loading && !lk.courses.length) return <PageLoader />;
  return (
    <Page title="Resource Management" subtitle="Upload lecture notes, books, PDFs and videos, or link to external material.">
      <CrudManager table="resources" title="Resources" singular="Resource" onChanged={() => void refresh()}
        defaults={{ type: 'notes', is_published: true }} searchText={r => `${r.title} ${r.type}`}
        validate={(v, files) => (!v.file_path && !files.file_path && !String(v.external_url ?? '').trim() ? 'Upload a file or provide a link.' : null)}
        columns={[
          { header: 'Title', cell: r => <span className="font-medium text-[var(--text-primary)]">{r.title}</span> },
          { header: 'Type', cell: r => <Badge>{r.type}</Badge> },
          { header: 'Course', className: 'hidden sm:table-cell', cell: r => find(lk.courses, r.course_id)?.code ?? '—' },
          { header: 'Source', className: 'hidden md:table-cell', cell: r => (r.file_path ? 'Uploaded file' : r.external_url ? 'Link' : '—') },
          { header: 'Status', cell: r => <Status on={r.is_published} yes="Published" no="Draft" /> },
        ]}
        fields={[
          { key: 'course_id', label: 'Course', type: 'select', required: true, options: lk.courses.map((c: any) => ({ value: c.id, label: courseLabel(c) })) },
          { key: 'title', label: 'Title', type: 'text', required: true, half: true },
          { key: 'type', label: 'Type', type: 'select', half: true, options: [['notes', 'Lecture notes'], ['book', 'Book'], ['pdf', 'PDF'], ['slides', 'Slides'], ['video', 'Video'], ['guide', 'Study guide'], ['link', 'Link'], ['other', 'Other']].map(([value, label]) => ({ value, label })) },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'file_path', label: 'File', type: 'file', sizeKey: 'file_size' },
          { key: 'external_url', label: 'Or external link (video, website…)', type: 'text', placeholder: 'https://…' },
          { key: 'is_published', label: 'Published (visible to students)', type: 'checkbox' },
        ]} />
    </Page>
  );
}

// --------------------------------------------------------------------------- Exams & questions
export function AdminExams() {
  const { refresh } = useCatalog();
  const { lk, reload, loading, courseLabel, find } = useLookups();
  const [tab, setTab] = useState('exams');
  if (loading && !lk.courses.length) return <PageLoader />;
  const courseOpts: Opt[] = lk.courses.map((c: any) => ({ value: c.id, label: courseLabel(c) }));
  const published: Field = { key: 'is_published', label: 'Published (visible to students)', type: 'checkbox' };

  return (
    <Page title="Examination Management" subtitle="Past papers with answers, and the digitized question bank used for quizzes.">
      <Tabs activeTab={tab} onChange={setTab} tabs={[{ id: 'exams', label: 'Past exams', count: lk.exams.length }, { id: 'questions', label: 'Questions' }]} />
      <div className="mt-6">
        {tab === 'exams' ? (
          <CrudManager table="past_exams" title="Past exams" singular="Exam" orderBy={{ column: 'exam_year', ascending: false }}
            onChanged={() => { reload(); void refresh(); }} defaults={{ exam_type: 'final', exam_year: new Date().getFullYear(), is_published: true }}
            searchText={r => r.title}
            columns={[
              { header: 'Exam', cell: r => <span className="font-medium text-[var(--text-primary)]">{r.title}</span> },
              { header: 'Course', className: 'hidden sm:table-cell', cell: r => find(lk.courses, r.course_id)?.code ?? '—' },
              { header: 'Year', className: 'hidden md:table-cell', cell: r => r.exam_year },
              { header: 'Type', cell: r => <Badge>{r.exam_type}</Badge> },
              { header: 'Answers', cell: r => (r.has_answers ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : '—') },
              { header: 'Status', cell: r => <Status on={r.is_published} yes="Published" no="Draft" /> },
            ]}
            fields={[
              { key: 'course_id', label: 'Course', type: 'select', required: true, options: courseOpts },
              { key: 'title', label: 'Title', type: 'text', required: true },
              { key: 'exam_year', label: 'Exam year', type: 'number', required: true, half: true },
              { key: 'exam_type', label: 'Type', type: 'select', half: true, options: ['midterm', 'final', 'quiz', 'supplementary', 'practice'].map(t => ({ value: t, label: t })) },
              { key: 'semester_label', label: 'Semester / session label', type: 'text', half: true, placeholder: 'Michaelmas 2024' },
              { key: 'file_path', label: 'Exam paper (PDF)', type: 'file', accept: '.pdf,image/*,.doc,.docx' },
              { key: 'answers_file_path', label: 'Answers / marking scheme (optional)', type: 'file', accept: '.pdf,image/*,.doc,.docx' },
              { key: 'has_answers', label: 'Answers available', type: 'checkbox', half: true },
              { key: 'has_explanations', label: 'Explanations available', type: 'checkbox', half: true },
              published,
            ]} />
        ) : (
          <CrudManager table="questions" title="Questions" singular="Question" orderBy={{ column: 'created_at', ascending: false }}
            onChanged={() => void refresh()} defaults={{ difficulty: 'medium', points: 1, order_index: 0, is_published: true }}
            searchText={r => r.question_text}
            columns={[
              { header: 'Question', cell: r => <span className="line-clamp-2 text-[var(--text-primary)]">{r.question_text}</span> },
              { header: 'Course', className: 'hidden sm:table-cell', cell: r => find(lk.courses, r.course_id)?.code ?? '—' },
              { header: 'Difficulty', className: 'hidden md:table-cell', cell: r => <Badge variant={r.difficulty === 'hard' ? 'danger' : r.difficulty === 'medium' ? 'warning' : 'success'}>{r.difficulty}</Badge> },
              { header: 'Status', cell: r => <Status on={r.is_published} yes="Published" no="Draft" /> },
            ]}
            fields={[
              { key: 'course_id', label: 'Course', type: 'select', required: true, resets: ['exam_id'], options: courseOpts },
              { key: 'exam_id', label: 'Belongs to past exam (optional)', type: 'select', nullable: true, options: v => lk.exams.filter((e: any) => e.course_id === v.course_id).map((e: any) => ({ value: e.id, label: `${e.title} (${e.exam_year})` })) },
              { key: 'question_text', label: 'Question', type: 'textarea', required: true },
              { key: 'options', label: 'Options', type: 'options', required: true },
              { key: 'difficulty', label: 'Difficulty', type: 'select', half: true, options: ['easy', 'medium', 'hard'].map(d => ({ value: d, label: d })) },
              { key: 'points', label: 'Points', type: 'number', half: true },
              { key: 'explanation', label: 'Explanation (shown after answering)', type: 'textarea' },
              { key: 'order_index', label: 'Order', type: 'number', half: true },
              published,
            ]} />
        )}
      </div>
    </Page>
  );
}

// --------------------------------------------------------------------------- Users
export function AdminUsers() {
  const { user: me } = useApp();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { data, loading, error, reload } = useAsync(
    () => unwrap<Profile[]>(supabase.from('profiles').select('*').order('created_at', { ascending: false }) as any).then(r => r ?? []), []);

  const update = async (u: Profile, patch: Partial<Profile>, ok: string) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', u.id);
    if (error) setToast({ msg: error.message, type: 'error' }); else { setToast({ msg: ok, type: 'success' }); reload(); }
  };

  const rows = (data ?? []).filter(u => !search || `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <Page title="Users & Access" subtitle="Promote administrators and suspend or restore accounts.">
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="mb-4" />
      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading ? <PageLoader /> : (
        <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden bg-[var(--bg-secondary)] overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
              {['User', 'Role', 'Access', 'Joined'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(u => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-b border-[var(--border-primary)] last:border-0">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-[var(--text-primary)]">{u.full_name || '—'}{self && ' (you)'}</p><p className="text-xs text-[var(--text-tertiary)]">{u.email}</p></td>
                    <td className="px-4 py-3 w-40">
                      <Select value={u.role} onChange={v => update(u, { role: v as Profile['role'] }, 'Role updated')} options={[{ value: 'student', label: 'Student' }, { value: 'admin', label: 'Admin' }]} className={self ? 'pointer-events-none opacity-60' : ''} />
                    </td>
                    <td className="px-4 py-3">
                      <button disabled={self} onClick={() => update(u, { is_active: !u.is_active }, u.is_active ? 'Account suspended' : 'Account restored')} className="disabled:opacity-40">
                        <Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active — click to suspend' : 'Suspended — click to restore'}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-tertiary)]">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </Page>
  );
}
