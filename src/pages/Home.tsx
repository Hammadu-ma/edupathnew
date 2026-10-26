import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, ProgressBar } from '../components/ui/Primitives';
import { courses, pastExams, resources } from '../data/mockData';
import { BookOpen, FileText, Clock, ArrowRight, TrendingUp, Sparkles, ChevronRight, Play, Library } from 'lucide-react';

export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();

  const myCourses = courses.filter(c => c.program_id === user?.program_id && c.study_year_id === user?.study_year_id);
  const recentResources = resources.slice(0, 4);
  const upcomingExams = pastExams.filter(e => e.course_id === myCourses[0]?.id).slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Editorial Hero */}
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-[var(--accent)] mb-2 tracking-wide uppercase">{greeting}</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[var(--text-primary)] leading-[1.1] mb-3">
              {user?.full_name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-lg text-[var(--text-tertiary)] max-w-lg">
              You have {myCourses.length} active courses this term. Let's make today count.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/studies')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:brightness-110 transition-all shadow-sm"
            >
              <Play className="w-4 h-4" /> Continue Learning
            </button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Courses', value: myCourses.length, icon: BookOpen, color: 'text-lilac-500' },
            { label: 'Resources Saved', value: 12, icon: Library, color: 'text-sky-500' },
            { label: 'Exams Available', value: pastExams.length, icon: FileText, color: 'text-emerald-500' },
            { label: 'Study Hours', value: '24h', icon: Clock, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Continue Learning - Featured Course */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-[var(--text-primary)]">Continue Learning</h2>
          <button onClick={() => navigate('/studies')} className="text-sm text-[var(--accent)] font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {myCourses[0] && (
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row">
              <div
                className="md:w-72 h-48 md:h-auto relative flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${myCourses[0].cover_color}, ${myCourses[0].cover_color}dd)` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/90">
                    <p className="text-4xl font-display opacity-30">{myCourses[0].code}</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge variant="accent" className="bg-white/20 text-white backdrop-blur">In Progress</Badge>
                </div>
              </div>
              <div className="flex-1 p-6">
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{myCourses[0].code}</p>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{myCourses[0].title}</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4 line-clamp-2">{myCourses[0].description}</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs text-[var(--text-tertiary)]">{myCourses[0].resource_count} resources</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{myCourses[0].exam_count} exams</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{myCourses[0].credits} credits</span>
                </div>
                <ProgressBar value={35} className="mb-4" />
                <p className="text-xs text-[var(--text-tertiary)] mb-4">35% complete · Last accessed 2 hours ago</p>
                <button
                  onClick={() => navigate(`/course/${myCourses[0].id}`)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:gap-3 transition-all"
                >
                  Resume studying <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Two-column editorial layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Active courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Your Courses</h2>
            <button onClick={() => navigate('/studies')} className="text-sm text-[var(--accent)] font-medium flex items-center gap-1">
              All courses <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myCourses.slice(0, 4).map(course => (
              <Card key={course.id} hover onClick={() => navigate(`/course/${course.id}`)} className="overflow-hidden group">
                <div className="h-2" style={{ backgroundColor: course.cover_color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">{course.code}</span>
                    <Badge>{course.credits} cr</Badge>
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors">{course.title}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">{course.description}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.resource_count}</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{course.exam_count}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <h2 className="font-display text-2xl text-[var(--text-primary)] mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {recentResources.map(res => (
              <Card key={res.id} hover className="p-4" onClick={() => navigate('/resources')}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    {res.type === 'video' ? <Play className="w-4 h-4 text-[var(--text-tertiary)]" /> : <BookOpen className="w-4 h-4 text-[var(--text-tertiary)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{res.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{res.type} · {new Date(res.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="font-display text-xl text-[var(--text-primary)] mb-4">Upcoming Exams</h3>
            <div className="space-y-3">
              {upcomingExams.map(exam => {
                const course = courses.find(c => c.id === exam.course_id);
                return (
                  <Card key={exam.id} hover className="p-4" onClick={() => navigate('/exams')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: course?.cover_color }}>
                        {exam.year.toString().slice(-2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{exam.title}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{course?.code} · {exam.exam_type}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial quote / motivation section */}
      <section className="mb-12">
        <div className="rounded-2xl bg-gradient-to-br from-midnight-800 to-midnight-900 p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lilac-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Sparkles className="w-6 h-6 text-lilac-300 mb-4" />
            <blockquote className="font-display text-2xl lg:text-3xl text-white leading-relaxed mb-4 max-w-2xl">
              "The beautiful thing about learning is that no one can take it away from you."
            </blockquote>
            <p className="text-white/50 text-sm">— B.B. King</p>
          </div>
        </div>
      </section>

      {/* Recommended resources */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-[var(--text-primary)]">Recommended for You</h2>
          <button onClick={() => navigate('/resources')} className="text-sm text-[var(--accent)] font-medium flex items-center gap-1">
            Browse all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.slice(0, 3).map(res => {
            const course = courses.find(c => c.id === res.course_id);
            return (
              <Card key={res.id} hover className="p-5" onClick={() => navigate('/resources')}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="info">{res.type}</Badge>
                  {res.file_size && <span className="text-xs text-[var(--text-tertiary)]">{(res.file_size / 1000000).toFixed(1)} MB</span>}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">{res.title}</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-3 line-clamp-2">{res.description}</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: course?.cover_color }} />
                  <span className="text-xs text-[var(--text-tertiary)]">{course?.code}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
