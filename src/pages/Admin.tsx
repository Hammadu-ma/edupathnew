import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, SearchInput, Modal, Input, Select, Tabs, EmptyState, Toast } from '../components/ui/Primitives';
import { courses, resources, pastExams, universities, programs, quizQuestions } from '../data/mockData';
import { BookOpen, FileText, Library, Users, TrendingUp, Plus, Edit, Trash2, Eye, Upload, CheckCircle2, AlertCircle, Settings, Shield } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    { label: 'Total Courses', value: courses.length, icon: BookOpen, color: '#8b5cf6', change: '+3 this month' },
    { label: 'Resources', value: resources.length, icon: Library, color: '#0ea5e9', change: '+12 this month' },
    { label: 'Examinations', value: pastExams.length, icon: FileText, color: '#10b981', change: '+5 this month' },
    { label: 'Questions', value: quizQuestions.length, icon: CheckCircle2, color: '#f59e0b', change: '+24 this month' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Admin Dashboard</h1>
          <p className="text-[var(--text-tertiary)]">Overview of your learning platform content and activity.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <Badge variant="success">{stat.change}</Badge>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-sm text-[var(--text-tertiary)]">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Courses</h3>
          <div className="space-y-3">
            {courses.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.cover_color }}>
                  {c.code.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{c.code} · {c.resource_count} resources</p>
                </div>
                <Badge variant="success">Published</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Examinations</h3>
          <div className="space-y-3">
            {pastExams.slice(0, 5).map(e => {
              const course = courses.find(c => c.id === e.course_id);
              return (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: course?.cover_color }}>
                    {e.year.toString().slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{e.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{course?.code} · {e.exam_type}</p>
                  </div>
                  <Badge variant={e.has_answers ? 'success' : 'warning'}>{e.has_answers ? 'With answers' : 'No answers'}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AdminCourses() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = courses.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1">Course Management</h1>
          <p className="text-[var(--text-tertiary)]">Create, edit, and manage courses across all programs.</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> New Course</Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search courses..." className="mb-6" />

      <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Course</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden sm:table-cell">Program</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">Resources</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">Exams</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(course => (
                <tr key={course.id} className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: course.cover_color }}>
                        {course.code.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{course.title}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{course.code} · {course.credits} cr</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden sm:table-cell">
                    {programs.find(p => p.id === course.program_id)?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{course.resource_count}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{course.exam_count}</td>
                  <td className="px-4 py-3">
                    <Badge variant={course.is_published ? 'success' : 'warning'}>{course.is_published ? 'Published' : 'Draft'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Course Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Course" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Course Code" placeholder="e.g. CS301" />
            <Input label="Credits" type="number" placeholder="12" />
          </div>
          <Input label="Course Title" placeholder="e.g. Distributed Systems" />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
            <textarea className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none" rows={3} placeholder="Course description..." />
          </div>
          <Select label="University" options={universities.map(u => ({ value: u.id, label: u.name }))} value="uni-1" onChange={() => {}} />
          <Select label="Program" options={programs.map(p => ({ value: p.id, label: p.name }))} value="prog-1" onChange={() => {}} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowModal(false); setToast('Course created successfully'); }}>Create Course</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export function AdminResources() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = resources.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.type.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1">Resource Management</h1>
          <p className="text-[var(--text-tertiary)]">Upload, organize, and manage learning resources.</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Upload className="w-4 h-4" /> Upload Resource</Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search resources..." className="mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(res => {
          const course = courses.find(c => c.id === res.course_id);
          return (
            <Card key={res.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Badge variant={res.type === 'video' ? 'danger' : res.type === 'pdf' ? 'info' : 'default'}>{res.type}</Badge>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"><Edit className="w-3.5 h-3.5" /></button>
                  <button className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-medium text-[var(--text-primary)] text-sm mb-1">{res.title}</h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-3 line-clamp-2">{res.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: course?.cover_color }} />
                  <span className="text-xs text-[var(--text-tertiary)]">{course?.code}</span>
                </div>
                <Badge variant={res.is_published ? 'success' : 'warning'}>{res.is_published ? 'Published' : 'Draft'}</Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Upload Resource" size="lg">
        <div className="space-y-4">
          <Input label="Resource Title" placeholder="e.g. Lecture Notes Week 1" />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
            <textarea className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none" rows={2} placeholder="Brief description..." />
          </div>
          <Select label="Resource Type" options={[{ value: 'pdf', label: 'PDF Document' }, { value: 'video', label: 'Video' }, { value: 'notes', label: 'Lecture Notes' }, { value: 'textbook', label: 'Textbook' }, { value: 'guide', label: 'Study Guide' }, { value: 'link', label: 'External Link' }]} value="pdf" onChange={() => {}} />
          <Select label="Course" options={courses.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` }))} value="course-1" onChange={() => {}} />
          
          {/* File upload area */}
          <div className="border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-8 text-center hover:border-[var(--accent)] transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Drop file here or click to browse</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">PDF, DOC, MP4 up to 100MB</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowModal(false); setToast('Resource uploaded successfully'); }}>Upload</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export function AdminExams() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('exams');
  const [toast, setToast] = useState<string | null>(null);

  const filteredExams = pastExams.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q);
  });

  const filteredQuestions = quizQuestions.filter(q => {
    if (!search) return true;
    const sq = search.toLowerCase();
    return q.question_text.toLowerCase().includes(sq);
  });

  const tabs = [
    { id: 'exams', label: 'Examinations', count: pastExams.length },
    { id: 'questions', label: 'Questions', count: quizQuestions.length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1">Examination Management</h1>
          <p className="text-[var(--text-tertiary)]">Manage past exams and digitized question banks.</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> {activeTab === 'exams' ? 'New Exam' : 'New Question'}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search..." className="flex-1" />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'exams' && (
          <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Exam</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase hidden sm:table-cell">Course</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase hidden md:table-cell">Year</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Answers</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map(exam => {
                    const course = courses.find(c => c.id === exam.course_id);
                    return (
                      <tr key={exam.id} className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{exam.title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden sm:table-cell">{course?.code}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{exam.year}</td>
                        <td className="px-4 py-3"><Badge>{exam.exam_type}</Badge></td>
                        <td className="px-4 py-3">
                          {exam.has_answers ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Edit className="w-4 h-4" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const course = courses.find(c => c.id === q.course_id);
              return (
                <Card key={q.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--text-tertiary)]">Q{idx + 1}</span>
                      <Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>{q.difficulty}</Badge>
                      <Badge>{q.points} pts</Badge>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] mb-3">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map(opt => (
                      <div key={opt.id} className={`text-xs p-2 rounded-lg border ${opt.is_correct ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700' : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)]'}`}>
                        {opt.text} {opt.is_correct && '✓'}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-[var(--text-tertiary)]">{course?.code}</span>
                    {q.explanation && <Badge variant="info">Has explanation</Badge>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Question Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={activeTab === 'exams' ? 'Create Examination' : 'Create Question'} size="lg">
        <div className="space-y-4">
          {activeTab === 'exams' ? (
            <>
              <Input label="Exam Title" placeholder="e.g. Final Examination 2024" />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Course" options={courses.map(c => ({ value: c.id, label: c.code }))} value="course-1" onChange={() => {}} />
                <Select label="Type" options={[{ value: 'midterm', label: 'Midterm' }, { value: 'final', label: 'Final' }, { value: 'practice', label: 'Practice' }]} value="final" onChange={() => {}} />
              </div>
              <Input label="Year" type="number" placeholder="2024" />
              <div className="border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-8 text-center">
                <Upload className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-primary)]">Upload exam file (PDF)</p>
              </div>
            </>
          ) : (
            <>
              <Select label="Course" options={courses.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` }))} value="course-1" onChange={() => {}} />
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Question Text</label>
                <textarea className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none" rows={3} placeholder="Enter question..." />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Options</p>
                {['A', 'B', 'C', 'D'].map(letter => (
                  <div key={letter} className="flex items-center gap-2">
                    <input type="radio" name="correct" className="text-[var(--accent)]" />
                    <Input placeholder={`Option ${letter}`} className="flex-1" />
                  </div>
                ))}
              </div>
              <Select label="Difficulty" options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} value="medium" onChange={() => {}} />
              <Input label="Points" type="number" placeholder="3" />
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Explanation (optional)</label>
                <textarea className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none" rows={2} placeholder="Explain the correct answer..." />
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowModal(false); setToast(activeTab === 'exams' ? 'Exam created' : 'Question added'); }}>
              {activeTab === 'exams' ? 'Create Exam' : 'Add Question'}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export function AdminSettings() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[var(--text-primary)] mb-1">Platform Settings</h1>
        <p className="text-[var(--text-tertiary)]">Configure universities, programs, and system settings.</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Universities</h3>
          <div className="space-y-2">
            {universities.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-midnight-100 dark:bg-midnight-800 flex items-center justify-center text-xs font-bold text-midnight-600 dark:text-midnight-300">
                    {u.code}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{u.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{u.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.is_active ? 'success' : 'warning'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                  <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"><Edit className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4"><Plus className="w-4 h-4" /> Add University</Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Programs</h3>
          <div className="space-y-2">
            {programs.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{p.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{p.code} · {universities.find(u => u.id === p.university_id)?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.is_active ? 'success' : 'warning'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                  <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"><Edit className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4"><Plus className="w-4 h-4" /> Add Program</Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">System Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <p className="text-xs text-[var(--text-tertiary)]">Version</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">1.0.0</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <p className="text-xs text-[var(--text-tertiary)]">Environment</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">Production</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <p className="text-xs text-[var(--text-tertiary)]">Total Users</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">142</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <p className="text-xs text-[var(--text-tertiary)]">Storage Used</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">2.4 GB</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
