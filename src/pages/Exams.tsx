import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, SearchInput, Select, Button, EmptyState, ProgressBar } from '../components/ui/Primitives';
import { courses, pastExams, quizQuestions } from '../data/mockData';
import { FileText, Search, Filter, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Flag, Clock, Award, RotateCcw, ChevronRight } from 'lucide-react';

export default function PastExams() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = pastExams.filter(e => e.is_published);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q));
    }
    if (courseFilter !== 'all') result = result.filter(e => e.course_id === courseFilter);
    if (yearFilter !== 'all') result = result.filter(e => e.year.toString() === yearFilter);
    if (typeFilter !== 'all') result = result.filter(e => e.exam_type === typeFilter);
    return result;
  }, [search, courseFilter, yearFilter, typeFilter]);

  const courseOptions = [{ value: 'all', label: 'All Courses' }, ...courses.map(c => ({ value: c.id, label: c.code }))];
  const yearOptions = [{ value: 'all', label: 'All Years' }, { value: '2024', label: '2024' }, { value: '2023', label: '2023' }];
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'midterm', label: 'Midterm' },
    { value: 'final', label: 'Final' },
    { value: 'practice', label: 'Practice' },
    { value: 'quiz', label: 'Quiz' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Past Examinations</h1>
        <p className="text-[var(--text-tertiary)]">Search the examination archive. Practice with digitized questions where available.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search exams..." className="flex-1" />
        <Select label="" options={courseOptions} value={courseFilter} onChange={setCourseFilter} className="sm:w-44" />
        <Select label="" options={yearOptions} value={yearFilter} onChange={setYearFilter} className="sm:w-36" />
        <Select label="" options={typeOptions} value={typeFilter} onChange={setTypeFilter} className="sm:w-40" />
      </div>

      <p className="text-sm text-[var(--text-tertiary)] mb-4">{filtered.length} examinations found</p>

      <div className="space-y-3">
        {filtered.map(exam => {
          const course = courses.find(c => c.id === exam.course_id);
          const hasQuestions = quizQuestions.some(q => q.exam_id === exam.id);
          return (
            <Card key={exam.id} hover className="p-5" onClick={() => hasQuestions ? navigate(`/quiz/${exam.course_id}`) : undefined}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: course?.cover_color }}>
                  {exam.year.toString().slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{exam.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={exam.exam_type === 'final' ? 'accent' : 'info'}>{exam.exam_type}</Badge>
                    <span className="text-xs text-[var(--text-tertiary)]">{course?.code}</span>
                    {exam.semester && <span className="text-xs text-[var(--text-tertiary)]">· {exam.semester}</span>}
                    {exam.has_answers && <Badge variant="success">Answers available</Badge>}
                    {exam.has_explanations && <Badge variant="success">Explanations</Badge>}
                    {hasQuestions && <Badge variant="accent">Interactive</Badge>}
                  </div>
                </div>
                {hasQuestions && (
                  <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="No examinations found" description="Try adjusting your search or filters." />
      )}
    </div>
  );
}

export function QuizEngine() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addProgress } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const questions = useMemo(() => {
    return quizQuestions.filter(q => q.course_id === courseId).sort((a, b) => a.order_index - b.order_index);
  }, [courseId]);

  const course = courses.find(c => c.id === courseId);
  const currentQuestion = questions[currentIndex];
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((sum, q) => {
      return sum + (answers[q.id] === q.correct_option_id ? q.points : 0);
    }, 0);
  }, [submitted, answers, questions]);

  const handleAnswer = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (courseId) {
      addProgress(courseId, 'quiz_attempted', undefined, Math.round((score / totalPoints) * 100));
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setFlagged(new Set());
    setSubmitted(false);
    setShowReview(false);
  };

  if (!course) return <div className="p-8 text-center">Course not found</div>;
  if (questions.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <EmptyState icon={<FileText className="w-8 h-8" />} title="No questions available" description="This course doesn't have practice questions yet." action={<Button onClick={() => navigate(-1)}>Go Back</Button>} />
    </div>
  );

  // Results screen
  if (submitted && !showReview) {
    const pct = Math.round((score / totalPoints) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${pct >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/30' : pct >= 50 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
            <Award className={`w-10 h-10 ${pct >= 70 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`} />
          </div>
          <h2 className="font-display text-3xl text-[var(--text-primary)] mb-2">Quiz Complete</h2>
          <p className="text-[var(--text-tertiary)] mb-6">{course.title}</p>
          
          <div className="flex items-center justify-center gap-8 mb-8">
            <div>
              <p className="text-4xl font-bold text-[var(--text-primary)]">{score}/{totalPoints}</p>
              <p className="text-sm text-[var(--text-tertiary)]">Points</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[var(--text-primary)]">{pct}%</p>
              <p className="text-sm text-[var(--text-tertiary)]">Score</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[var(--text-primary)]">{answeredCount}/{questions.length}</p>
              <p className="text-sm text-[var(--text-tertiary)]">Answered</p>
            </div>
          </div>

          <ProgressBar value={pct} className="mb-8" color={pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e'} />

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowReview(true)}>Review Answers</Button>
            <Button onClick={handleRestart}>Try Again</Button>
            <Button variant="ghost" onClick={() => navigate(`/course/${courseId}`)}>Back to Course</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Review mode
  if (showReview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-[var(--text-primary)]">Answer Review</h2>
          <Button variant="secondary" onClick={() => setShowReview(false)}>Back to Results</Button>
        </div>
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_option_id;
            return (
              <Card key={q.id} className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-sm font-mono text-[var(--text-tertiary)]">Q{idx + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{q.question_text}</p>
                  </div>
                  {submitted && (
                    <div className={`p-1.5 rounded-full ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                      {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  {q.options.map(opt => {
                    const isUserChoice = userAnswer === opt.id;
                    const isCorrectOpt = opt.id === q.correct_option_id;
                    let optClass = 'border-[var(--border-primary)] bg-[var(--bg-secondary)]';
                    if (submitted) {
                      if (isCorrectOpt) optClass = 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700';
                      else if (isUserChoice && !isCorrectOpt) optClass = 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700';
                    } else if (isUserChoice) {
                      optClass = 'border-[var(--accent)] bg-[var(--accent-subtle)]';
                    }
                    return (
                      <div key={opt.id} className={`p-3 rounded-lg border ${optClass} flex items-center gap-3`}>
                        <span className="text-sm text-[var(--text-primary)] flex-1">{opt.text}</span>
                        {submitted && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {submitted && isUserChoice && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <p className="text-sm text-[var(--text-secondary)]"><strong>Explanation:</strong> {q.explanation}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz active
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Quiz header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{course.code}</p>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Practice Quiz</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-tertiary)]">{answeredCount}/{questions.length} answered</span>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/course/${courseId}`)}>Exit</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`flex-1 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-[var(--accent)]' : answers[q.id] ? 'bg-[var(--accent)]/40' : flagged.has(q.id) ? 'bg-amber-400' : 'bg-[var(--bg-tertiary)]'}`}
          />
        ))}
      </div>

      {/* Question */}
      <Card className="p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <span className="text-sm font-mono text-[var(--text-tertiary)]">Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-2">
            <Badge>{currentQuestion.points} pts</Badge>
            <Badge variant={currentQuestion.difficulty === 'hard' ? 'danger' : currentQuestion.difficulty === 'medium' ? 'warning' : 'success'}>{currentQuestion.difficulty}</Badge>
          </div>
        </div>

        <p className="text-lg text-[var(--text-primary)] font-medium mb-8 leading-relaxed">{currentQuestion.question_text}</p>

        <div className="space-y-3">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = answers[currentQuestion.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                    isSelected ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border-secondary)] text-[var(--text-tertiary)]'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[var(--text-primary)]">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)}>
          <ArrowLeft className="w-4 h-4" /> Previous
        </Button>
        <button
          onClick={() => {
            if (flagged.has(currentQuestion.id)) {
              setFlagged(prev => { const n = new Set(prev); n.delete(currentQuestion.id); return n; });
            } else {
              setFlagged(prev => new Set(prev).add(currentQuestion.id));
            }
          }}
          className={`p-2.5 rounded-lg transition-colors ${flagged.has(currentQuestion.id) ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}
        >
          <Flag className="w-4 h-4" />
        </button>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex(i => i + 1)}>
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={answeredCount === 0}>
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
