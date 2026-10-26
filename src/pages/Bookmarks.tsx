import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, EmptyState, Button } from '../components/ui/Primitives';
import { courses, resources, pastExams } from '../data/mockData';
import { Bookmark, BookOpen, FileText, Library, Trash2, ArrowRight } from 'lucide-react';

export default function Bookmarks() {
  const { bookmarks, removeBookmark } = useApp();
  const navigate = useNavigate();

  const getBookmarkDetails = (bookmark: typeof bookmarks[0]) => {
    if (bookmark.resource_type === 'course') {
      const course = courses.find(c => c.id === bookmark.resource_id);
      return course ? { title: course.title, subtitle: course.code, icon: BookOpen, color: course.cover_color, type: 'Course' } : null;
    }
    if (bookmark.resource_type === 'resource') {
      const res = resources.find(r => r.id === bookmark.resource_id);
      const course = res ? courses.find(c => c.id === res.course_id) : null;
      return res ? { title: res.title, subtitle: course?.code || '', icon: Library, color: course?.cover_color || '#8b5cf6', type: res.type } : null;
    }
    if (bookmark.resource_type === 'exam') {
      const exam = pastExams.find(e => e.id === bookmark.resource_id);
      const course = exam ? courses.find(c => c.id === exam.course_id) : null;
      return exam ? { title: exam.title, subtitle: course?.code || '', icon: FileText, color: course?.cover_color || '#8b5cf6', type: exam.exam_type } : null;
    }
    return null;
  };

  const handleClick = (bookmark: typeof bookmarks[0]) => {
    if (bookmark.resource_type === 'course') navigate(`/course/${bookmark.resource_id}`);
    else if (bookmark.resource_type === 'resource') navigate('/resources');
    else if (bookmark.resource_type === 'exam') navigate('/exams');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-2">Saved Items</h1>
        <p className="text-[var(--text-tertiary)]">Your bookmarked courses, resources, and examinations.</p>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8" />}
          title="No saved items yet"
          description="Bookmark courses, resources, and exams to quickly access them here."
          action={<Button onClick={() => navigate('/studies')}>Browse Courses</Button>}
        />
      ) : (
        <div className="space-y-3">
          {bookmarks.map(bm => {
            const details = getBookmarkDetails(bm);
            if (!details) return null;
            return (
              <Card key={bm.id} hover className="p-4 flex items-center gap-4" onClick={() => handleClick(bm)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: details.color + '20' }}>
                  <details.icon className="w-5 h-5" style={{ color: details.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--text-primary)] truncate">{details.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-tertiary)]">{details.subtitle}</span>
                    <Badge>{details.type}</Badge>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeBookmark(bm.resource_type, bm.resource_id); }}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
