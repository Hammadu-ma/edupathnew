import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, SearchInput, Tabs, ProgressBar, Button, EmptyState } from '../components/ui/Primitives';
import { courses, resources, pastExams, quizQuestions } from '../data/mockData';
import { BookOpen, FileText, Search, Filter, Grid3X3, List, ArrowLeft, Bookmark, BookmarkCheck, Play, Download, ExternalLink, Clock, ChevronRight } from 'lucide-react';

export function MyStudies() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');

  const myCourses = useMemo(() => {
    return courses.filter(c => c.is_published && (c.program_id === user?.program_id || !user?.program_id));
  }, [user]);

  const filtered = useMemo(() => {
    let result = myCourses;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    if (activeTab === 'year2') result = result.filter(c => c.study_year_id === 'year-2');
    if (activeTab === 'year3') result = result.filter(c => c.study_year_id === 'year-3');
    return result;
  }, [myCourses, search, activeTab]);

  const tabs = [
    { id: 'all', label: 'All Courses', count: myCourses.length },
    { id: 'year2', label: 'Second Year', count: myCourses.filter(c => c.study_year_id === 'year-2').length },
    { id: 'year3', label: 'Third Year', count: myCourses.filter(c => c.study_year_id === 'year-3').length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">My Studies</h1>
        <p className="text-[var(--text-tertiary)]">Your academic workspace — courses, resources, and assessments.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search courses..." className="flex-1" />
        <div className="flex items-center gap-2">
          <button onClick={() => setView('grid')} className={`p-2.5 rounded-lg border transition-colors ${view === 'grid' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-2.5 rounded-lg border transition-colors ${view === 'list' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Course grid */}
      <div className={`mt-6 ${view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}`}>
        {filtered.map(course => (
          view === 'grid' ? (
            <Card key={course.id} hover onClick={() => navigate(`/course/${course.id}`)} className="overflow-hidden group">
              <div className="h-32 relative" style={{ background: `linear-gradient(135deg, ${course.cover_color}ee, ${course.cover_color}88)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-display text-white/20">{course.code}</span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-white/20 text-white backdrop-blur">{course.credits} credits</Badge>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-mono font-medium text-[var(--text-tertiary)] mb-1">{course.code}</p>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors">{course.title}</h3>
                <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.resource_count}</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{course.exam_count}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
                </div>
              </div>
            </Card>
          ) : (
            <Card key={course.id} hover onClick={() => navigate(`/course/${course.id}`)} className="p-4 flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: course.cover_color }}>
                {course.code.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">{course.code}</span>
                  <Badge>{course.credits} cr</Badge>
                </div>
                <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{course.title}</h3>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                <span>{course.resource_count} resources</span>
                <span>{course.exam_count} exams</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)]" />
            </Card>
          )
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState icon={<Search className="w-8 h-8" />} title="No courses found" description="Try adjusting your search or filters." />
      )}
    </div>
  );
}

export function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isBookmarked, addBookmark, removeBookmark, addProgress } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const course = courses.find(c => c.id === id);
  if (!course) return <div className="p-8 text-center text-[var(--text-tertiary)]">Course not found</div>;

  const courseResources = resources.filter(r => r.course_id === id);
  const courseExams = pastExams.filter(e => e.course_id === id);
  const bookmarked = isBookmarked('course', course.id);

  const toggleBookmark = () => {
    if (bookmarked) removeBookmark('course', course.id);
    else addBookmark('course', course.id);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'resources', label: 'Resources', count: courseResources.length },
    { id: 'exams', label: 'Past Exams', count: courseExams.length },
    { id: 'practice', label: 'Practice' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative h-48 sm:h-64 overflow-hidden" style={{ background: `linear-gradient(135deg, ${course.cover_color}, ${course.cover_color}bb)` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl font-display text-white/10">{course.code}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <button onClick={() => navigate('/studies')} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Studies
          </button>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-mono text-white/60 mb-1">{course.code} · {course.credits} credits</p>
              <h1 className="font-display text-3xl sm:text-4xl text-white">{course.title}</h1>
            </div>
            <button onClick={toggleBookmark} className="p-2.5 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 transition-colors">
              {bookmarked ? <BookmarkCheck className="w-5 h-5 text-white" /> : <Bookmark className="w-5 h-5 text-white/70" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="font-display text-2xl text-[var(--text-primary)] mb-4">About this Course</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">{course.description}</p>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                  This course provides a comprehensive foundation in the subject matter, combining theoretical concepts with practical applications. 
                  Students will engage with lectures, readings, problem sets, and examinations designed to build deep understanding.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    <BookOpen className="w-5 h-5 text-[var(--accent)] mb-2" />
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{course.resource_count}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Resources</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    <FileText className="w-5 h-5 text-[var(--accent)] mb-2" />
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{course.exam_count}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Examinations</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    <Clock className="w-5 h-5 text-[var(--accent)] mb-2" />
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{course.credits}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Credits</p>
                  </div>
                </div>
              </div>
              <div>
                <Card className="p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="secondary" className="w-full justify-start" onClick={() => setActiveTab('resources')}>
                      <BookOpen className="w-4 h-4" /> Browse Resources
                    </Button>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => setActiveTab('exams')}>
                      <FileText className="w-4 h-4" /> View Past Exams
                    </Button>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => setActiveTab('practice')}>
                      <Play className="w-4 h-4" /> Start Practice Quiz
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-3">
              {courseResources.map(res => (
                <Card key={res.id} hover className="p-5 flex items-center gap-4" onClick={() => { addProgress(course.id, 'opened', res.id); navigate('/resources'); }}>
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    {res.type === 'video' ? <Play className="w-4 h-4 text-[var(--text-tertiary)]" /> : res.type === 'link' ? <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)]" /> : <Download className="w-4 h-4 text-[var(--text-tertiary)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--text-primary)] text-sm">{res.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge>{res.type}</Badge>
                      {res.file_size && <span className="text-xs text-[var(--text-tertiary)]">{(res.file_size / 1000000).toFixed(1)} MB</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                </Card>
              ))}
              {courseResources.length === 0 && (
                <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No resources yet" description="Resources for this course will appear here." />
              )}
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-3">
              {courseExams.map(exam => (
                <Card key={exam.id} hover className="p-5" onClick={() => navigate('/exams')}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: course.cover_color }}>
                      {exam.year.toString().slice(-2)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--text-primary)]">{exam.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={exam.exam_type === 'final' ? 'accent' : 'info'}>{exam.exam_type}</Badge>
                        {exam.has_answers && <Badge variant="success">Answers</Badge>}
                        {exam.has_explanations && <Badge variant="success">Explanations</Badge>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </div>
                </Card>
              ))}
              {courseExams.length === 0 && (
                <EmptyState icon={<FileText className="w-8 h-8" />} title="No exams available" description="Past examinations will appear here when published." />
              )}
            </div>
          )}

          {activeTab === 'practice' && (
            <div>
              <Card className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-4">
                  <Play className="w-7 h-7 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Practice Quiz</h3>
                <p className="text-[var(--text-tertiary)] mb-6 max-w-md mx-auto">
                  Test your knowledge with {quizQuestions.filter(q => q.course_id === course.id).length} practice questions from past examinations.
                </p>
                <Button onClick={() => navigate(`/quiz/${course.id}`)}>Start Practice Quiz</Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
