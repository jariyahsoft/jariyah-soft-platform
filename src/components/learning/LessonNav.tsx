import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Lesson } from '@/lib/validators/learning';

interface LessonNavProps {
  pathId: string;
  lessons: Lesson[];
  currentLessonId: string;
  completedLessonIds: string[];
  locale: 'th' | 'en';
}

export function LessonNav({
  pathId,
  lessons,
  currentLessonId,
  completedLessonIds,
  locale,
}: LessonNavProps) {
  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous */}
      {prevLesson ? (
        <Link
          href={`/learn/${pathId}/lesson/${prevLesson.id}`}
          className="flex items-center gap-2 rounded-xl border border-text-secondary/10 bg-bg-card px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all duration-200 max-w-[45%]"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <div className="truncate text-left">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/60">
              {locale === 'th' ? 'ก่อนหน้า' : 'Previous'}
            </div>
            <div className="truncate">{prevLesson.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {/* Progress indicator */}
      <div className="hidden sm:flex items-center gap-1.5">
        {lessons.map((lesson) => {
          const isCurrent = lesson.id === currentLessonId;
          const isCompleted = completedLessonIds.includes(lesson.id);
          return (
            <Link
              key={lesson.id}
              href={`/learn/${pathId}/lesson/${lesson.id}`}
              title={lesson.title}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200 ${
                isCurrent
                  ? 'bg-accent text-white ring-2 ring-accent/30 scale-110'
                  : isCompleted
                  ? 'bg-success/15 text-success border border-success/20'
                  : 'bg-bg-secondary text-text-secondary/50 hover:text-text-secondary'
              }`}
            >
              {isCompleted ? <Check className="h-3 w-3" /> : lesson.order}
            </Link>
          );
        })}
      </div>

      {/* Next */}
      {nextLesson ? (
        <Link
          href={`/learn/${pathId}/lesson/${nextLesson.id}`}
          className="flex items-center gap-2 rounded-xl border border-text-secondary/10 bg-bg-card px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all duration-200 max-w-[45%]"
        >
          <div className="truncate text-right">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/60">
              {locale === 'th' ? 'ถัดไป' : 'Next'}
            </div>
            <div className="truncate">{nextLesson.title}</div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
      ) : (
        <Link
          href={`/learn/${pathId}/quiz`}
          className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-bold text-accent hover:bg-accent/10 transition-all duration-200"
        >
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-accent/60">
              {locale === 'th' ? 'ทำแบบทดสอบ' : 'Take Quiz'}
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
