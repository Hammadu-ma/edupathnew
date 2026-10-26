import { University, Program, StudyYear, Semester, Course, LearningResource, PastExam, QuizQuestion, User } from '../types';

export const mockUser: User = {
  id: 'user-1',
  email: 'sarah.chen@university.edu',
  full_name: 'Sarah Chen',
  role: 'student',
  university_id: 'uni-1',
  program_id: 'prog-1',
  study_year_id: 'year-2',
  semester_id: 'sem-3',
  onboarding_complete: true,
  created_at: '2024-09-01T00:00:00Z',
};

export const mockAdminUser: User = {
  id: 'admin-1',
  email: 'admin@bloom.edu',
  full_name: 'Dr. James Mitchell',
  role: 'admin',
  onboarding_complete: true,
  created_at: '2024-01-01T00:00:00Z',
};

export const universities: University[] = [
  { id: 'uni-1', name: 'University of Cambridge', code: 'CAM', country: 'United Kingdom', is_active: true },
  { id: 'uni-2', name: 'Stanford University', code: 'STAN', country: 'United States', is_active: true },
  { id: 'uni-3', name: 'ETH Zurich', code: 'ETH', country: 'Switzerland', is_active: true },
  { id: 'uni-4', name: 'University of Toronto', code: 'UT', country: 'Canada', is_active: true },
  { id: 'uni-5', name: 'National University of Singapore', code: 'NUS', country: 'Singapore', is_active: true },
];

export const programs: Program[] = [
  { id: 'prog-1', university_id: 'uni-1', name: 'Computer Science', code: 'CS', description: 'Bachelor of Arts in Computer Science', is_active: true },
  { id: 'prog-2', university_id: 'uni-1', name: 'Mathematics', code: 'MATH', description: 'Bachelor of Science in Mathematics', is_active: true },
  { id: 'prog-3', university_id: 'uni-1', name: 'Engineering', code: 'ENG', description: 'Master of Engineering', is_active: true },
  { id: 'prog-4', university_id: 'uni-2', name: 'Computer Science', code: 'CS', description: 'BS in Computer Science', is_active: true },
  { id: 'prog-5', university_id: 'uni-2', name: 'Data Science', code: 'DS', description: 'MS in Data Science', is_active: true },
];

export const studyYears: StudyYear[] = [
  { id: 'year-1', program_id: 'prog-1', name: 'First Year', year_number: 1, is_active: true },
  { id: 'year-2', program_id: 'prog-1', name: 'Second Year', year_number: 2, is_active: true },
  { id: 'year-3', program_id: 'prog-1', name: 'Third Year', year_number: 3, is_active: true },
  { id: 'year-4', program_id: 'prog-2', name: 'First Year', year_number: 1, is_active: true },
  { id: 'year-5', program_id: 'prog-2', name: 'Second Year', year_number: 2, is_active: true },
];

export const semesters: Semester[] = [
  { id: 'sem-1', study_year_id: 'year-1', name: 'Michaelmas Term', semester_number: 1, is_active: true },
  { id: 'sem-2', study_year_id: 'year-1', name: 'Lent Term', semester_number: 2, is_active: true },
  { id: 'sem-3', study_year_id: 'year-2', name: 'Michaelmas Term', semester_number: 1, is_active: true },
  { id: 'sem-4', study_year_id: 'year-2', name: 'Lent Term', semester_number: 2, is_active: true },
  { id: 'sem-5', study_year_id: 'year-3', name: 'Michaelmas Term', semester_number: 1, is_active: true },
];

const coverColors = ['#8b5cf6', '#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];
const coverPatterns = ['gradient', 'dots', 'lines', 'mesh', 'waves', 'circles', 'grid', 'organic'];

export const courses: Course[] = [
  { id: 'course-1', code: 'CS201', title: 'Algorithms & Data Structures', description: 'A comprehensive study of fundamental algorithms, complexity analysis, and data structure design. Covers sorting, searching, graph algorithms, dynamic programming, and advanced tree structures.', credits: 12, university_id: 'uni-1', program_id: 'prog-1', study_year_id: 'year-2', semester_id: 'sem-3', cover_color: coverColors[0], cover_pattern: coverPatterns[0], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 24, exam_count: 8 },
  { id: 'course-2', code: 'CS202', title: 'Operating Systems', description: 'Principles of operating system design including process management, memory management, file systems, and distributed computing concepts.', credits: 12, university_id: 'uni-1', program_id: 'prog-1', study_year_id: 'year-2', semester_id: 'sem-3', cover_color: coverColors[1], cover_pattern: coverPatterns[1], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 18, exam_count: 5 },
  { id: 'course-3', code: 'CS203', title: 'Machine Learning Foundations', description: 'Introduction to machine learning theory and practice. Supervised and unsupervised learning, neural networks, and practical applications.', credits: 12, university_id: 'uni-1', program_id: 'prog-1', study_year_id: 'year-2', semester_id: 'sem-4', cover_color: coverColors[2], cover_pattern: coverPatterns[2], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 31, exam_count: 6 },
  { id: 'course-4', code: 'MATH201', title: 'Linear Algebra', description: 'Vector spaces, linear transformations, eigenvalues and eigenvectors, inner product spaces, and applications to data science.', credits: 8, university_id: 'uni-1', program_id: 'prog-2', study_year_id: 'year-4', cover_color: coverColors[3], cover_pattern: coverPatterns[3], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 15, exam_count: 4 },
  { id: 'course-5', code: 'CS301', title: 'Distributed Systems', description: 'Advanced topics in distributed computing including consensus protocols, replication, fault tolerance, and modern cloud architectures.', credits: 12, university_id: 'uni-1', program_id: 'prog-1', study_year_id: 'year-3', cover_color: coverColors[4], cover_pattern: coverPatterns[4], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 20, exam_count: 7 },
  { id: 'course-6', code: 'CS204', title: 'Computer Networks', description: 'Network architecture, protocols, routing algorithms, transport layer mechanisms, and network security fundamentals.', credits: 10, university_id: 'uni-1', program_id: 'prog-1', study_year_id: 'year-2', semester_id: 'sem-4', cover_color: coverColors[5], cover_pattern: coverPatterns[5], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 16, exam_count: 5 },
  { id: 'course-7', code: 'CS205', title: 'Database Systems', description: 'Relational database design, SQL, query optimization, transaction management, and introduction to NoSQL databases.', credits: 10, university_id: 'uni-1', program_id: 'prog-1', study_year_id: 'year-2', semester_id: 'sem-3', cover_color: coverColors[6], cover_pattern: coverPatterns[6], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 22, exam_count: 6 },
  { id: 'course-8', code: 'MATH202', title: 'Probability & Statistics', description: 'Probability theory, random variables, distributions, hypothesis testing, regression analysis, and Bayesian inference.', credits: 8, university_id: 'uni-1', program_id: 'prog-2', study_year_id: 'year-5', cover_color: coverColors[7], cover_pattern: coverPatterns[7], is_published: true, created_at: '2024-09-01T00:00:00Z', resource_count: 19, exam_count: 5 },
];

export const resources: LearningResource[] = [
  { id: 'res-1', course_id: 'course-1', title: 'Introduction to Algorithm Analysis', description: 'Comprehensive notes on time and space complexity, Big-O notation, and amortized analysis.', type: 'notes', is_published: true, created_at: '2024-09-15T00:00:00Z', file_size: 2400000 },
  { id: 'res-2', course_id: 'course-1', title: 'Sorting Algorithms Deep Dive', description: 'Detailed comparison of sorting algorithms with implementations and complexity proofs.', type: 'pdf', is_published: true, created_at: '2024-09-20T00:00:00Z', file_size: 5100000 },
  { id: 'res-3', course_id: 'course-1', title: 'Graph Algorithms Lecture Series', description: 'Video lectures covering BFS, DFS, Dijkstra, and minimum spanning trees.', type: 'video', is_published: true, created_at: '2024-10-01T00:00:00Z' },
  { id: 'res-4', course_id: 'course-1', title: 'Dynamic Programming Study Guide', description: 'Curated collection of DP problems with step-by-step solutions.', type: 'guide', is_published: true, created_at: '2024-10-10T00:00:00Z', file_size: 3200000 },
  { id: 'res-5', course_id: 'course-1', title: 'CLRS Textbook Chapters 10-15', description: 'Required reading from Introduction to Algorithms covering trees and graphs.', type: 'textbook', is_published: true, created_at: '2024-09-05T00:00:00Z', file_size: 12000000 },
  { id: 'res-6', course_id: 'course-2', title: 'Process Synchronization Notes', description: 'Lecture notes on mutexes, semaphores, monitors, and deadlock prevention.', type: 'notes', is_published: true, created_at: '2024-09-18T00:00:00Z', file_size: 1800000 },
  { id: 'res-7', course_id: 'course-2', title: 'Memory Management Systems', description: 'Comprehensive guide to virtual memory, paging, and segmentation.', type: 'pdf', is_published: true, created_at: '2024-09-25T00:00:00Z', file_size: 4500000 },
  { id: 'res-8', course_id: 'course-3', title: 'Neural Networks Introduction', description: 'Video course on perceptrons, backpropagation, and activation functions.', type: 'video', is_published: true, created_at: '2024-10-05T00:00:00Z' },
  { id: 'res-9', course_id: 'course-3', title: 'ML Mathematics Refresher', description: 'Linear algebra and calculus prerequisites for machine learning.', type: 'guide', is_published: true, created_at: '2024-10-08T00:00:00Z', file_size: 2800000 },
  { id: 'res-10', course_id: 'course-5', title: 'Distributed Consensus Protocols', description: 'In-depth analysis of Paxos, Raft, and Byzantine fault tolerance.', type: 'pdf', is_published: true, created_at: '2024-10-12T00:00:00Z', file_size: 6200000 },
  { id: 'res-11', course_id: 'course-7', title: 'SQL Mastery Guide', description: 'From basic queries to advanced window functions and query optimization.', type: 'guide', is_published: true, created_at: '2024-09-22T00:00:00Z', file_size: 3500000 },
  { id: 'res-12', course_id: 'course-4', title: 'Vector Spaces Visual Guide', description: 'Interactive visual explanations of vector space concepts.', type: 'link', external_url: 'https://example.com/linalg', is_published: true, created_at: '2024-09-10T00:00:00Z' },
];

export const pastExams: PastExam[] = [
  { id: 'exam-1', course_id: 'course-1', title: 'Algorithms Midterm Examination', year: 2024, semester: 'Michaelmas', exam_type: 'midterm', has_answers: true, has_explanations: true, is_published: true, created_at: '2024-10-15T00:00:00Z' },
  { id: 'exam-2', course_id: 'course-1', title: 'Algorithms Final Examination', year: 2024, semester: 'Lent', exam_type: 'final', has_answers: true, has_explanations: true, is_published: true, created_at: '2024-12-20T00:00:00Z' },
  { id: 'exam-3', course_id: 'course-1', title: 'Algorithms Final Examination', year: 2023, semester: 'Lent', exam_type: 'final', has_answers: true, has_explanations: false, is_published: true, created_at: '2023-12-18T00:00:00Z' },
  { id: 'exam-4', course_id: 'course-1', title: 'Algorithms Practice Set 1', year: 2024, exam_type: 'practice', has_answers: true, has_explanations: true, is_published: true, created_at: '2024-11-01T00:00:00Z' },
  { id: 'exam-5', course_id: 'course-2', title: 'Operating Systems Midterm', year: 2024, semester: 'Michaelmas', exam_type: 'midterm', has_answers: true, has_explanations: true, is_published: true, created_at: '2024-10-20T00:00:00Z' },
  { id: 'exam-6', course_id: 'course-2', title: 'Operating Systems Final', year: 2023, semester: 'Lent', exam_type: 'final', has_answers: true, has_explanations: false, is_published: true, created_at: '2023-12-22T00:00:00Z' },
  { id: 'exam-7', course_id: 'course-3', title: 'Machine Learning Midterm', year: 2024, semester: 'Lent', exam_type: 'midterm', has_answers: true, has_explanations: true, is_published: true, created_at: '2024-11-15T00:00:00Z' },
  { id: 'exam-8', course_id: 'course-5', title: 'Distributed Systems Final', year: 2024, exam_type: 'final', has_answers: false, has_explanations: false, is_published: true, created_at: '2024-12-15T00:00:00Z' },
  { id: 'exam-9', course_id: 'course-7', title: 'Database Systems Midterm', year: 2024, semester: 'Michaelmas', exam_type: 'midterm', has_answers: true, has_explanations: true, is_published: true, created_at: '2024-10-25T00:00:00Z' },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q-1', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: [
      { id: 'q1-a', text: 'O(n)', is_correct: false },
      { id: 'q1-b', text: 'O(log n)', is_correct: true },
      { id: 'q1-c', text: 'O(n log n)', is_correct: false },
      { id: 'q1-d', text: 'O(1)', is_correct: false },
    ],
    correct_option_id: 'q1-b',
    explanation: 'Binary search divides the search space in half with each comparison, resulting in logarithmic time complexity O(log n).',
    difficulty: 'easy', points: 2, order_index: 0,
  },
  {
    id: 'q-2', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'Which data structure uses LIFO (Last In, First Out) ordering?',
    options: [
      { id: 'q2-a', text: 'Queue', is_correct: false },
      { id: 'q2-b', text: 'Stack', is_correct: true },
      { id: 'q2-c', text: 'Linked List', is_correct: false },
      { id: 'q2-d', text: 'Hash Table', is_correct: false },
    ],
    correct_option_id: 'q2-b',
    explanation: 'A stack follows LIFO ordering — the last element added is the first one removed. Think of a stack of plates.',
    difficulty: 'easy', points: 2, order_index: 1,
  },
  {
    id: 'q-3', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'What is the worst-case time complexity of quicksort?',
    options: [
      { id: 'q3-a', text: 'O(n)', is_correct: false },
      { id: 'q3-b', text: 'O(n log n)', is_correct: false },
      { id: 'q3-c', text: 'O(n²)', is_correct: true },
      { id: 'q3-d', text: 'O(log n)', is_correct: false },
    ],
    correct_option_id: 'q3-c',
    explanation: 'Quicksort\'s worst case is O(n²), which occurs when the pivot consistently divides the array into highly unbalanced partitions (e.g., already sorted array with last-element pivot).',
    difficulty: 'medium', points: 3, order_index: 2,
  },
  {
    id: 'q-4', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'In a balanced binary search tree with n nodes, what is the height?',
    options: [
      { id: 'q4-a', text: 'O(n)', is_correct: false },
      { id: 'q4-b', text: 'O(log n)', is_correct: true },
      { id: 'q4-c', text: 'O(n log n)', is_correct: false },
      { id: 'q4-d', text: 'O(√n)', is_correct: false },
    ],
    correct_option_id: 'q4-b',
    explanation: 'A balanced BST maintains O(log n) height by ensuring roughly equal numbers of nodes in left and right subtrees at each level.',
    difficulty: 'medium', points: 3, order_index: 3,
  },
  {
    id: 'q-5', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'Which algorithm is most efficient for finding the shortest path in a weighted graph with non-negative edges?',
    options: [
      { id: 'q5-a', text: 'Bellman-Ford', is_correct: false },
      { id: 'q5-b', text: 'Depth-First Search', is_correct: false },
      { id: 'q5-c', text: 'Dijkstra\'s Algorithm', is_correct: true },
      { id: 'q5-d', text: 'Floyd-Warshall', is_correct: false },
    ],
    correct_option_id: 'q5-c',
    explanation: 'Dijkstra\'s algorithm is optimal for single-source shortest path with non-negative weights, running in O((V + E) log V) with a priority queue.',
    difficulty: 'medium', points: 3, order_index: 4,
  },
  {
    id: 'q-6', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'What technique does dynamic programming primarily use to avoid redundant computation?',
    options: [
      { id: 'q6-a', text: 'Greedy selection', is_correct: false },
      { id: 'q6-b', text: 'Memoization / overlapping subproblems', is_correct: true },
      { id: 'q6-c', text: 'Random sampling', is_correct: false },
      { id: 'q6-d', text: 'Brute force enumeration', is_correct: false },
    ],
    correct_option_id: 'q6-b',
    explanation: 'Dynamic programming solves each subproblem once and stores the result (memoization), avoiding recomputation of overlapping subproblems.',
    difficulty: 'medium', points: 3, order_index: 5,
  },
  {
    id: 'q-7', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'What is the space complexity of merge sort?',
    options: [
      { id: 'q7-a', text: 'O(1)', is_correct: false },
      { id: 'q7-b', text: 'O(log n)', is_correct: false },
      { id: 'q7-c', text: 'O(n)', is_correct: true },
      { id: 'q7-d', text: 'O(n²)', is_correct: false },
    ],
    correct_option_id: 'q7-c',
    explanation: 'Merge sort requires O(n) additional space for the temporary arrays used during the merge step.',
    difficulty: 'easy', points: 2, order_index: 6,
  },
  {
    id: 'q-8', exam_id: 'exam-4', course_id: 'course-1',
    question_text: 'Which traversal of a binary search tree produces elements in sorted order?',
    options: [
      { id: 'q8-a', text: 'Pre-order', is_correct: false },
      { id: 'q8-b', text: 'Post-order', is_correct: false },
      { id: 'q8-c', text: 'In-order', is_correct: true },
      { id: 'q8-d', text: 'Level-order', is_correct: false },
    ],
    correct_option_id: 'q8-c',
    explanation: 'In-order traversal (left, root, right) visits BST nodes in ascending order due to the BST property.',
    difficulty: 'easy', points: 2, order_index: 7,
  },
];
