/**
 * Demo-mode backend. Implements the small slice of the Supabase client API the app uses
 * (auth, query builder, storage) on top of an in-memory database persisted in localStorage.
 * Used automatically when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.
 */
type Row = Record<string, any>;
interface DB { tables: Record<string, Row[]>; auth: { id: string; email: string; password: string }[] }

const DB_KEY = 'bloom-mock-db-v1';
const SESSION_KEY = 'bloom-mock-session-v1';
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const opt = (...t: string[]) => t.map((text, i) => ({ id: String.fromCharCode(97 + i), text }));

function seed(): DB {
  const uni = (id: string, name: string, code: string, country: string) => ({ id, name, code, country, logo_url: null, is_active: true, created_at: ago(90) });
  const course = (id: string, university_id: string, program_id: string, study_year_id: string | null, term_id: string | null, code: string, title: string, description: string, credits: number, cover_color: string) =>
    ({ id, university_id, program_id, study_year_id, term_id, code, title, description, credits, cover_color, is_published: true, created_at: ago(60) });
  const res = (id: string, course_id: string, title: string, type: string, description: string, external_url: string, d: number) =>
    ({ id, course_id, title, description, type, file_path: null, external_url, file_size: null, is_published: true, uploaded_by: 'u-admin', created_at: ago(d) });
  const exam = (id: string, course_id: string, title: string, exam_year: number, exam_type: string, semester_label: string, has: boolean) =>
    ({ id, course_id, title, exam_year, exam_type, semester_label, file_path: null, answers_file_path: null, has_answers: has, has_explanations: has, is_published: true, created_at: ago(40) });
  const q = (id: string, course_id: string, exam_id: string | null, question_text: string, options: any[], correct_option_id: string, explanation: string, difficulty: string, points: number, order_index: number) =>
    ({ id, course_id, exam_id, question_text, options, correct_option_id, explanation, difficulty, points, order_index, is_published: true, created_at: ago(30) });
  const profile = (id: string, email: string, full_name: string, role: string, extra: Row = {}) =>
    ({ id, email, full_name, avatar_url: null, role, is_active: true, university_id: null, program_id: null, study_year_id: null, term_id: null, onboarding_complete: true, preferences: {}, created_at: ago(80), ...extra });

  const ci = (id: string, kind: string, title: string, subject_id: string, attachment_id: string, topic_id: string | null, author_id: string, access: string, is_published: boolean, d: number, university_id: string | null = null) =>
    ({ id, kind, title, description: null, university_id, attachment_id, subject_id, topic_id, author_id, thumbnail_url: null, access, is_published, created_at: ago(d) });
  const asset = (item_id: string, url: string) => ({ id: 'as-' + item_id, item_id, source_type: 'external', url, file_path: null, file_size: null });

  return {
    auth: [
      { id: 'u-student', email: 'student@demo.com', password: 'demo1234' },
      { id: 'u-admin', email: 'admin@demo.com', password: 'admin1234' },
      { id: 'u-marcus', email: 'marcus@demo.com', password: 'demo1234' },
    ],
    tables: {
      universities: [uni('uni-1', 'University of Cambridge', 'CAM', 'United Kingdom'), uni('uni-2', 'Metro Polytechnic', 'MPT', 'United States')],
      programs: [
        { id: 'prog-1', university_id: 'uni-1', name: 'Computer Science', code: 'CS', description: 'BA Computer Science', is_active: true, created_at: ago(90) },
        { id: 'prog-2', university_id: 'uni-1', name: 'Mathematics', code: 'MATH', description: 'BA Mathematics', is_active: true, created_at: ago(90) },
        { id: 'prog-3', university_id: 'uni-2', name: 'Mechanical Engineering', code: 'ME', description: 'BEng Mechanical Engineering', is_active: true, created_at: ago(90) },
      ],
      study_years: [
        { id: 'y-1', program_id: 'prog-1', name: 'Year 1', sort_order: 1, is_active: true, created_at: ago(90) },
        { id: 'y-2', program_id: 'prog-1', name: 'Year 2', sort_order: 2, is_active: true, created_at: ago(90) },
        { id: 'y-3', program_id: 'prog-1', name: 'Year 3', sort_order: 3, is_active: true, created_at: ago(90) },
        { id: 'y-4', program_id: 'prog-2', name: 'Year 1', sort_order: 1, is_active: true, created_at: ago(90) },
        { id: 'y-5', program_id: 'prog-3', name: 'Level 200', sort_order: 2, is_active: true, created_at: ago(90) },
      ],
      terms: [
        { id: 't-1', study_year_id: 'y-2', name: 'Michaelmas Term', kind: 'semester', sort_order: 1, is_active: true, created_at: ago(90) },
        { id: 't-2', study_year_id: 'y-2', name: 'Lent Term', kind: 'semester', sort_order: 2, is_active: true, created_at: ago(90) },
        { id: 't-3', study_year_id: 'y-1', name: 'Core bundle', kind: 'bundle', sort_order: 1, is_active: true, created_at: ago(90) },
      ],
      courses: [
        course('c-1', 'uni-1', 'prog-1', 'y-2', 't-1', 'CS201', 'Algorithms & Data Structures', 'Fundamental algorithms, complexity analysis and data structure design.', 12, '#8b5cf6'),
        course('c-2', 'uni-1', 'prog-1', 'y-2', 't-2', 'CS202', 'Operating Systems', 'Processes, memory management, file systems and concurrency.', 12, '#0ea5e9'),
        course('c-3', 'uni-1', 'prog-1', 'y-2', 't-2', 'CS203', 'Database Systems', 'Relational modelling, SQL, transactions and indexing.', 10, '#10b981'),
        course('c-4', 'uni-1', 'prog-1', 'y-1', 't-3', 'CS101', 'Introduction to Programming', 'First steps in programming with Python.', 10, '#f59e0b'),
        course('c-5', 'uni-1', 'prog-1', 'y-3', null, 'CS301', 'Distributed Systems', 'Consensus, replication and fault tolerance.', 12, '#ec4899'),
        course('c-6', 'uni-1', 'prog-2', 'y-4', null, 'MA110', 'Linear Algebra', 'Vector spaces, matrices, eigenvalues and linear maps.', 10, '#6366f1'),
        course('c-7', 'uni-2', 'prog-3', 'y-5', null, 'ME210', 'Thermodynamics', 'Energy, entropy and the laws of thermodynamics.', 8, '#ef4444'),
        course('c-8', 'uni-2', 'prog-3', null, null, 'ME220', 'Statics', 'Equilibrium of rigid bodies (applies to the whole program).', 8, '#14b8a6'),
      ],
      resources: [
        res('r-1', 'c-1', 'Big-O Cheat Sheet', 'link', 'Quick reference for common algorithm complexities.', 'https://www.bigocheatsheet.com/', 20),
        res('r-2', 'c-1', 'MIT 6.006 Lecture Videos', 'video', 'Introduction to Algorithms video lectures.', 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', 18),
        res('r-3', 'c-1', 'Sorting Algorithms — Lecture Notes', 'notes', 'Notes covering merge sort, quicksort and heapsort.', 'https://en.wikipedia.org/wiki/Sorting_algorithm', 15),
        res('r-4', 'c-1', 'Introduction to Algorithms (CLRS)', 'book', 'The standard textbook reference.', 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/', 25),
        res('r-5', 'c-2', 'OSTEP — Operating Systems: Three Easy Pieces', 'book', 'Free online textbook.', 'https://pages.cs.wisc.edu/~remzi/OSTEP/', 22),
        res('r-6', 'c-2', 'Process Scheduling Slides', 'slides', 'Lecture slides on CPU scheduling policies.', 'https://en.wikipedia.org/wiki/Scheduling_(computing)', 12),
        res('r-7', 'c-2', 'Virtual Memory Study Guide', 'guide', 'Paging, TLBs and page replacement explained.', 'https://en.wikipedia.org/wiki/Virtual_memory', 9),
        res('r-8', 'c-3', 'SQL Tutorial', 'link', 'Interactive SQL exercises.', 'https://sqlbolt.com/', 14),
        res('r-9', 'c-3', 'Database Normalisation Notes', 'notes', 'From 1NF to BCNF with examples.', 'https://en.wikipedia.org/wiki/Database_normalization', 10),
        res('r-10', 'c-4', 'Python Official Tutorial', 'guide', 'The official Python tutorial.', 'https://docs.python.org/3/tutorial/', 30),
        res('r-11', 'c-6', '3Blue1Brown — Essence of Linear Algebra', 'video', 'Visual intuition for linear algebra.', 'https://www.3blue1brown.com/topics/linear-algebra', 16),
        res('r-12', 'c-7', 'Thermodynamics Formula Sheet', 'pdf', 'Key equations and definitions.', 'https://en.wikipedia.org/wiki/Laws_of_thermodynamics', 8),
        res('r-13', 'c-5', 'Raft Consensus Visualisation', 'link', 'Interactive explanation of Raft.', 'https://raft.github.io/', 7),
      ],
      past_exams: [
        exam('ex-1', 'c-1', 'Algorithms Practice Set 1', 2024, 'practice', 'Michaelmas', true),
        exam('ex-2', 'c-1', 'Algorithms Final Examination', 2023, 'final', 'Michaelmas', true),
        exam('ex-3', 'c-2', 'Operating Systems Midterm', 2024, 'midterm', 'Lent', true),
        exam('ex-4', 'c-7', 'Thermodynamics Final', 2023, 'final', 'Spring', false),
        exam('ex-5', 'c-3', 'Databases Final Examination', 2022, 'final', 'Lent', false),
      ],
      questions: [
        q('q-1', 'c-1', 'ex-1', 'What is the time complexity of binary search on a sorted array of n elements?', opt('O(n)', 'O(log n)', 'O(n log n)', 'O(1)'), 'b', 'Each comparison halves the search space, giving O(log n).', 'easy', 2, 0),
        q('q-2', 'c-1', 'ex-1', 'Which data structure uses LIFO ordering?', opt('Queue', 'Stack', 'Linked list', 'Hash table'), 'b', 'A stack removes the most recently added element first.', 'easy', 2, 1),
        q('q-3', 'c-1', 'ex-1', 'What is the worst-case time complexity of quicksort?', opt('O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'), 'c', 'Bad pivots on every partition degrade quicksort to quadratic time.', 'medium', 3, 2),
        q('q-4', 'c-1', 'ex-1', 'Which traversal of a binary search tree visits nodes in sorted order?', opt('Pre-order', 'Post-order', 'In-order', 'Level-order'), 'c', 'In-order visits left subtree, node, then right subtree, which yields ascending keys in a BST.', 'medium', 3, 3),
        q('q-5', 'c-1', 'ex-2', 'Which algorithm finds shortest paths from one source in a graph with non-negative weights?', opt("Dijkstra's algorithm", 'Kruskal\'s algorithm', 'Depth-first search', 'Floyd–Warshall'), 'a', "Dijkstra's greedy relaxation is correct when no edge weights are negative.", 'medium', 3, 0),
        q('q-6', 'c-1', 'ex-2', 'What is the amortised cost of appending to a dynamic array?', opt('O(n)', 'O(log n)', 'O(1)', 'O(n^2)'), 'c', 'Occasional resizes are spread over many cheap appends.', 'hard', 4, 1),
        q('q-7', 'c-2', 'ex-3', 'Which of these is NOT a necessary condition for deadlock?', opt('Mutual exclusion', 'Hold and wait', 'Preemption', 'Circular wait'), 'c', 'Deadlock requires NO preemption; the ability to preempt breaks it.', 'medium', 3, 0),
        q('q-8', 'c-2', 'ex-3', 'What does a TLB cache?', opt('Disk blocks', 'Page table entries', 'CPU registers', 'File descriptors'), 'b', 'The translation lookaside buffer caches recent virtual-to-physical translations.', 'easy', 2, 1),
        q('q-9', 'c-2', 'ex-3', 'Which scheduling policy can cause starvation of long jobs?', opt('Round robin', 'FCFS', 'Shortest job first', 'Multilevel feedback with aging'), 'c', 'SJF keeps favouring short jobs, so long jobs may wait indefinitely.', 'medium', 3, 2),
        q('q-10', 'c-7', 'ex-4', 'The first law of thermodynamics is a statement of conservation of…', opt('Mass', 'Energy', 'Momentum', 'Entropy'), 'b', 'Energy cannot be created or destroyed, only transformed.', 'easy', 2, 0),
      ],

      attachments: [
        { id: 'at-1', name: 'Surgery', created_at: ago(70) }, { id: 'at-2', name: 'Internal Medicine', created_at: ago(70) },
        { id: 'at-3', name: 'Pediatrics', created_at: ago(70) }, { id: 'at-4', name: 'Obstetrics & Gynecology', created_at: ago(70) },
      ],
      subjects: [
        { id: 's-1', attachment_id: 'at-1', name: 'Acute abdomen', default_access: 'free', created_at: ago(65) },
        { id: 's-2', attachment_id: 'at-1', name: 'Hernias', default_access: 'free', created_at: ago(65) },
        { id: 's-3', attachment_id: 'at-2', name: 'Hypertension', default_access: 'free', created_at: ago(65) },
        { id: 's-4', attachment_id: 'at-2', name: 'Diabetes mellitus', default_access: 'free', created_at: ago(65) },
        { id: 's-5', attachment_id: 'at-3', name: 'Neonatal jaundice', default_access: 'free', created_at: ago(65) },
      ],
      topics: [
        { id: 'tp-1', subject_id: 's-1', name: 'Appendicitis', created_at: ago(60) }, { id: 'tp-2', subject_id: 's-1', name: 'Intestinal obstruction', created_at: ago(60) },
        { id: 'tp-3', subject_id: 's-2', name: 'Inguinal hernia', created_at: ago(60) }, { id: 'tp-4', subject_id: 's-3', name: 'Diagnosis & staging', created_at: ago(60) },
        { id: 'tp-5', subject_id: 's-4', name: 'Insulin therapy', created_at: ago(60) },
      ],
      authors: [
        { id: 'au-1', name: 'Dr. Najeeb', bio: null, avatar_url: null, created_at: ago(60) }, { id: 'au-2', name: 'Ninja Nerd', bio: null, avatar_url: null, created_at: ago(60) },
        { id: 'au-3', name: 'Osmosis', bio: null, avatar_url: null, created_at: ago(60) }, { id: 'au-4', name: 'Armando Hasudungan', bio: null, avatar_url: null, created_at: ago(60) },
        { id: 'au-5', name: 'Prof. A. Karim', bio: null, avatar_url: null, created_at: ago(60) }, { id: 'au-6', name: 'Bailey & Love', bio: null, avatar_url: null, created_at: ago(60) },
      ],
      content_items: [
        ci('ci-1', 'video', 'Appendicitis — Complete Lecture', 's-1', 'at-1', 'tp-1', 'au-1', 'premium', true, 12),
        ci('ci-2', 'video', 'Intestinal Obstruction Explained', 's-1', 'at-1', 'tp-2', 'au-2', 'free', true, 11),
        ci('ci-3', 'video', 'Inguinal Hernia Anatomy', 's-2', 'at-1', 'tp-3', 'au-1', 'premium', true, 10),
        ci('ci-4', 'video', 'Hypertension Made Simple', 's-3', 'at-2', 'tp-4', 'au-2', 'public', true, 9),
        ci('ci-5', 'video', 'Diabetes: Insulin Therapy', 's-4', 'at-2', 'tp-5', 'au-3', 'free', true, 8, 'uni-1'),
        ci('ci-6', 'video', 'Neonatal Jaundice Approach', 's-5', 'at-3', null, 'au-4', 'premium', false, 7),
        ci('ci-7', 'book', 'Bailey & Love — Short Practice of Surgery', 's-1', 'at-1', null, 'au-6', 'premium', true, 6),
        ci('ci-8', 'book', 'Oxford Handbook of Clinical Medicine', 's-3', 'at-2', null, 'au-5', 'free', true, 5),
        ci('ci-9', 'book', 'Surgery Quick Revision Notes', 's-2', 'at-1', null, 'au-5', 'public', true, 4),
        ci('ci-10', 'video', 'Acute Abdomen — Clinical Approach', 's-1', 'at-1', null, 'au-3', 'free', true, 3),
      ],
      content_assets: [
        asset('ci-1', 'https://www.youtube.com/results?search_query=Dr+Najeeb+appendicitis'), asset('ci-2', 'https://www.youtube.com/results?search_query=Ninja+Nerd+intestinal+obstruction'),
        asset('ci-3', 'https://www.youtube.com/results?search_query=Dr+Najeeb+inguinal+hernia'), asset('ci-4', 'https://www.youtube.com/results?search_query=Ninja+Nerd+hypertension'),
        asset('ci-5', 'https://www.youtube.com/results?search_query=Osmosis+insulin+therapy'), asset('ci-6', 'https://www.youtube.com/results?search_query=Armando+Hasudungan+neonatal+jaundice'),
        asset('ci-7', 'https://archive.org/search?query=bailey+love+short+practice+of+surgery'), asset('ci-8', 'https://drive.google.com/'),
        asset('ci-9', 'https://www.dropbox.com/'), asset('ci-10', 'https://vimeo.com/76979871'),
      ],
      profiles: [
        profile('u-student', 'student@demo.com', 'Sarah Chen', 'student', { university_id: 'uni-1', program_id: 'prog-1', study_year_id: 'y-2' }),
        profile('u-admin', 'admin@demo.com', 'Admin User', 'admin'),
        profile('u-marcus', 'marcus@demo.com', 'Marcus Johnson', 'student', { university_id: 'uni-2', program_id: 'prog-3', study_year_id: 'y-5' }),
      ],
      bookmarks: [
        { id: 'b-1', user_id: 'u-student', item_type: 'course', item_id: 'c-1', created_at: ago(5) },
        { id: 'b-2', user_id: 'u-student', item_type: 'resource', item_id: 'r-5', created_at: ago(4) },
      ],
      quiz_attempts: [
        { id: 'a-1', user_id: 'u-student', course_id: 'c-1', exam_id: 'ex-1', mode: 'practice', question_ids: ['q-1', 'q-2', 'q-3', 'q-4'], answers: { 'q-1': 'b', 'q-2': 'b', 'q-3': 'a', 'q-4': 'c' }, score: 7, total_points: 10, time_spent_seconds: 210, started_at: ago(2), completed_at: ago(2) },
      ],
      study_activity: [
        { id: 'sa-1', user_id: 'u-student', course_id: 'c-1', resource_id: 'r-1', action: 'opened', created_at: ago(0.1) },
        { id: 'sa-2', user_id: 'u-student', course_id: 'c-1', resource_id: 'r-1', action: 'completed', created_at: ago(0.5) },
        { id: 'sa-3', user_id: 'u-student', course_id: 'c-1', resource_id: null, action: 'quiz_attempted', created_at: ago(2) },
        { id: 'sa-4', user_id: 'u-student', course_id: 'c-2', resource_id: 'r-5', action: 'opened', created_at: ago(3) },
      ],
      resource_completions: [{ user_id: 'u-student', resource_id: 'r-1', course_id: 'c-1', completed_at: ago(0.5) }],
      learning_goals: [{ id: 'g-1', user_id: 'u-student', title: 'Complete 5 study materials', kind: 'resources', target: 5, due_date: null, is_done: false, created_at: ago(6) }],
    },
  };
}

// ----------------------------------------------------------------- storage of the db
let db: DB = (() => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as DB;
      const fresh = seed();
      Object.keys(fresh.tables).forEach(k => { if (!saved.tables[k]) saved.tables[k] = fresh.tables[k]; }); // tables added in later versions
      return saved;
    }
  } catch { /* fall through */ }
  return seed();
})();
const persist = () => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* quota */ } };
let sessionUid: string | null = (() => { try { return localStorage.getItem(SESSION_KEY); } catch { return null; } })();
const setSessionUid = (id: string | null) => { sessionUid = id; try { id ? localStorage.setItem(SESSION_KEY, id) : localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } };

export function resetMockDb() {
  db = seed(); persist(); setSessionUid(null); window.location.href = '/auth';
}

const me = () => sessionUid;
const isAdmin = () => db.tables.profiles.find(p => p.id === sessionUid)?.role === 'admin';
const USER_TABLES = new Set(['bookmarks', 'quiz_attempts', 'study_activity', 'resource_completions', 'learning_goals']);
const PUBLISHED_TABLES = new Set(['courses', 'resources', 'past_exams', 'questions', 'content_items']);
const ACTIVE_TABLES = new Set(['universities', 'programs', 'study_years', 'terms']);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());

const DEFAULTS: Record<string, Row> = {
  universities: { is_active: true }, programs: { is_active: true }, study_years: { is_active: true, sort_order: 0 }, terms: { is_active: true, sort_order: 0, kind: 'semester' },
  courses: { is_published: false, cover_color: '#8b5cf6' }, resources: { is_published: true, type: 'notes' },
  past_exams: { is_published: true, exam_type: 'final', has_answers: false, has_explanations: false },
  questions: { is_published: true, points: 1, order_index: 0, difficulty: 'medium' },
  content_items: { is_published: false, access: 'free' }, subjects: { default_access: 'free' }, learning_goals: { is_done: false, target: 1, kind: 'custom' },
};

const CHILDREN: Record<string, [string, string][]> = {
  universities: [['programs', 'university_id'], ['courses', 'university_id']], programs: [['study_years', 'program_id'], ['courses', 'program_id']],
  study_years: [['terms', 'study_year_id']], courses: [['resources', 'course_id'], ['past_exams', 'course_id'], ['questions', 'course_id']],
  resources: [['resource_completions', 'resource_id'], ['study_activity', 'resource_id']],
  attachments: [['subjects', 'attachment_id'], ['content_items', 'attachment_id']], subjects: [['topics', 'subject_id'], ['content_items', 'subject_id']],
  content_items: [['content_assets', 'item_id']],
};
function cascadeDelete(table: string, ids: string[]) {
  if (!ids.length) return;
  const idSet = new Set(ids);
  db.tables[table] = db.tables[table].filter(r => !idSet.has(r.id));
  (CHILDREN[table] ?? []).forEach(([child, fk]) => cascadeDelete(child, db.tables[child].filter(r => idSet.has(r[fk])).map(r => r.id ?? `${r.user_id}:${r.resource_id}`)));
}

function tableRows(name: string): Row[] {
  if (name === 'course_stats') {
    return db.tables.courses.map(c => ({
      course_id: c.id,
      resource_count: db.tables.resources.filter(r => r.course_id === c.id && r.is_published).length,
      exam_count: db.tables.past_exams.filter(e => e.course_id === c.id && e.is_published).length,
      question_count: db.tables.questions.filter(x => x.course_id === c.id && x.is_published).length,
    }));
  }
  if (!db.tables[name]) throw new Error(`Unknown table "${name}"`);
  return db.tables[name];
}

const cmp = (a: any, b: any) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)));

class Query implements PromiseLike<any> {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: ((r: Row) => boolean)[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private lim?: number;
  private payload: any;
  private cols = '*';
  private head = false;
  private wantCount = false;
  private returning = false;
  private mode: 'one' | 'maybe' | null = null;
  constructor(private table: string) {}

  select(cols = '*', o?: { count?: string; head?: boolean }) {
    this.cols = cols;
    if (this.op === 'select') { this.wantCount = !!o?.count; this.head = !!o?.head; } else this.returning = true;
    return this;
  }
  insert(p: any) { this.op = 'insert'; this.payload = p; return this; }
  update(p: any) { this.op = 'update'; this.payload = p; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c: string, v: any) { this.filters.push(r => r[c] === v); return this; }
  in(c: string, vs: any[]) { this.filters.push(r => vs.includes(r[c])); return this; }
  gte(c: string, v: any) { this.filters.push(r => r[c] >= v); return this; }
  not(c: string, _op: string, v: any) { this.filters.push(r => (v === null ? r[c] != null : r[c] !== v)); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orders.push({ col, asc: o?.ascending ?? true }); return this; }
  limit(n: number) { this.lim = n; return this; }
  single() { this.mode = 'one'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }
  then<A = any, B = never>(res?: ((v: any) => A | PromiseLike<A>) | null, rej?: ((e: any) => B | PromiseLike<B>) | null) {
    return Promise.resolve().then(() => this.exec()).then(res, rej);
  }

  private shape(rows: Row[]) {
    if (this.mode) {
      if (rows.length === 0) return this.mode === 'one' ? { data: null, error: { message: 'No rows found' } } : { data: null, error: null };
      if (rows.length > 1) return { data: null, error: { message: 'Multiple rows returned' } };
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null };
  }

  private embed(rows: Row[]) {
    const re = /(\w+):(\w+)\(([^)]*)\)/g;
    const embeds = [...this.cols.matchAll(re)];
    if (!embeds.length) return rows;
    return rows.map(r => {
      const out = { ...r };
      embeds.forEach(([, alias, table]) => { out[alias] = (db.tables[table] ?? []).find(x => x.id === r[`${alias}_id`]) ?? null; });
      return out;
    });
  }

  private exec(): any {
    try {
      const t = this.table;
      const admin = isAdmin();
      if (this.op === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const created: Row[] = [];
        for (const item of items) {
          const row: Row = { ...(DEFAULTS[t] ?? {}), ...item };
          if (t !== 'resource_completions' && !row.id) row.id = uuid();
          if (!row.created_at && t !== 'resource_completions') row.created_at = new Date().toISOString();
          if (USER_TABLES.has(t) && !row.user_id) row.user_id = me();
          if (t === 'quiz_attempts' && !row.completed_at) row.completed_at = new Date().toISOString();
          if (t === 'resource_completions' && !row.completed_at) row.completed_at = new Date().toISOString();
          const dup = (t === 'bookmarks' && db.tables.bookmarks.some(b => b.user_id === row.user_id && b.item_type === row.item_type && b.item_id === row.item_id))
            || (t === 'resource_completions' && db.tables.resource_completions.some(c => c.user_id === row.user_id && c.resource_id === row.resource_id));
          if (dup) return { data: null, error: { message: 'duplicate key value violates unique constraint' } };
          if (!admin && (PUBLISHED_TABLES.has(t) || ACTIVE_TABLES.has(t))) return { data: null, error: { message: 'new row violates row-level security policy' } };
          db.tables[t].push(row); created.push(row);
        }
        persist();
        return this.returning ? this.shape(this.embed(created)) : { data: null, error: null };
      }

      let rows = tableRows(t).filter(r => this.filters.every(f => f(r)));

      if (this.op === 'update') {
        if (!admin && t !== 'profiles' && !USER_TABLES.has(t)) return { data: null, error: { message: 'new row violates row-level security policy' } };
        if (t === 'profiles' && !admin) rows = rows.filter(r => r.id === me());
        if (USER_TABLES.has(t)) rows = rows.filter(r => r.user_id === me());
        const patch = { ...this.payload };
        if (t === 'profiles' && !admin) { delete patch.role; delete patch.is_active; delete patch.email; }
        rows.forEach(r => Object.assign(r, patch));
        persist();
        return this.returning ? this.shape(rows) : { data: null, error: null };
      }

      if (this.op === 'delete') {
        if (!admin && !USER_TABLES.has(t)) return { data: null, error: { message: 'permission denied' } };
        if (USER_TABLES.has(t)) rows = rows.filter(r => r.user_id === me());
        const key = (r: Row) => r.id ?? `${r.user_id}:${r.resource_id}`;
        if (CHILDREN[t]) cascadeDelete(t, rows.map(r => r.id));
        else { const ids = new Set(rows.map(key)); db.tables[t] = db.tables[t].filter(r => !ids.has(key(r))); }
        persist();
        return { data: null, error: null };
      }

      // ---- select with the same visibility rules RLS enforces in Supabase
      if (!admin) {
        if (PUBLISHED_TABLES.has(t)) rows = rows.filter(r => r.is_published !== false);
        if (ACTIVE_TABLES.has(t)) rows = rows.filter(r => r.is_active !== false);
        if (t === 'profiles') rows = rows.filter(r => r.id === me());
      }
      if (USER_TABLES.has(t) && !(admin && this.head)) rows = rows.filter(r => r.user_id === me());
      this.orders.slice().reverse().forEach(o => { rows = rows.slice().sort((a, b) => (o.asc ? 1 : -1) * cmp(a[o.col], b[o.col])); });
      const total = rows.length;
      if (this.lim !== undefined) rows = rows.slice(0, this.lim);
      if (this.head) return { data: null, count: total, error: null };
      const out: any = this.shape(this.embed(rows));
      if (this.wantCount) out.count = total;
      return out;
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }
}

// ----------------------------------------------------------------- auth
type Listener = (event: string, session: any) => void;
const listeners = new Set<Listener>();
const sessionFor = (uid: string | null) => {
  const u = db.auth.find(a => a.id === uid);
  return u ? { access_token: 'mock', user: { id: u.id, email: u.email } } : null;
};
const emit = (event: string) => listeners.forEach(cb => cb(event, sessionFor(sessionUid)));
const authError = (message: string) => ({ data: { user: null, session: null }, error: { message } });

const auth = {
  getSession: async () => ({ data: { session: sessionFor(sessionUid) }, error: null }),
  onAuthStateChange: (cb: Listener) => { listeners.add(cb); return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } }; },
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const u = db.auth.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (!u) return authError('Invalid login credentials');
    if (db.tables.profiles.find(p => p.id === u.id)?.is_active === false) return authError('This account has been suspended');
    setSessionUid(u.id); emit('SIGNED_IN');
    return { data: { user: { id: u.id, email: u.email }, session: sessionFor(u.id) }, error: null };
  },
  signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: Row } }) => {
    if (db.auth.some(a => a.email.toLowerCase() === email.toLowerCase())) return authError('User already registered');
    const id = uuid();
    db.auth.push({ id, email, password });
    db.tables.profiles.push({ id, email, full_name: options?.data?.full_name || email.split('@')[0], avatar_url: null, role: 'student', is_active: true, university_id: null, program_id: null, study_year_id: null, term_id: null, onboarding_complete: false, preferences: {}, created_at: new Date().toISOString() });
    persist(); setSessionUid(id); emit('SIGNED_IN');
    return { data: { user: { id, email }, session: sessionFor(id) }, error: null };
  },
  signOut: async () => { setSessionUid(null); emit('SIGNED_OUT'); return { error: null }; },
  resetPasswordForEmail: async (_email: string) => ({ data: {}, error: null }),
  updateUser: async ({ password }: { password?: string }) => {
    const u = db.auth.find(a => a.id === sessionUid);
    if (!u) return { data: { user: null }, error: { message: 'Not signed in' } };
    if (password) { u.password = password; persist(); }
    return { data: { user: { id: u.id, email: u.email } }, error: null };
  },
};

// ----------------------------------------------------------------- storage (in-memory; files don't survive a reload)
const blobs = new Map<string, { blob: Blob; dataUrl: string }>();
const readAsDataUrl = (f: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const storage = {
  from: (bucket: string) => ({
    upload: async (path: string, file: Blob) => {
      try { blobs.set(`${bucket}/${path}`, { blob: file, dataUrl: await readAsDataUrl(file) }); return { data: { path }, error: null }; }
      catch (e: any) { return { data: null, error: { message: e.message } }; }
    },
    createSignedUrl: async (path: string) => {
      const f = blobs.get(`${bucket}/${path}`);
      return f ? { data: { signedUrl: URL.createObjectURL(f.blob) }, error: null }
               : { data: null, error: { message: 'In demo mode, uploaded files are only available until you refresh the page.' } };
    },
    getPublicUrl: (path: string) => ({ data: { publicUrl: blobs.get(`${bucket}/${path}`)?.dataUrl ?? '' } }),
  }),
};

export function createMockClient() {
  return { from: (table: string) => new Query(table), auth, storage };
}
