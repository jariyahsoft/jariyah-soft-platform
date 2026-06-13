import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ChevronRight, BookOpen } from 'lucide-react';
import { getPathWithLessons, getLesson } from '@/lib/learning/data';
import { LessonNav } from '@/components/learning/LessonNav';
import { LessonContent } from './LessonContent';

export const revalidate = 60;

interface LessonPageProps {
  params: Promise<{ locale: string; id: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { locale, id: pathId, lessonId } = await params;

  // Fetch path + all lessons for nav, and the current lesson content
  const [pathData, lesson] = await Promise.all([
    getPathWithLessons(pathId),
    getLesson(pathId, lessonId),
  ]);

  if (!pathData || !lesson) notFound();

  const { path, lessons } = pathData;

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
          <Link href="/learn" className="hover:text-accent transition-colors">
            {locale === 'th' ? 'หลักสูตร' : 'Paths'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/learn/${pathId}`} className="hover:text-accent transition-colors truncate max-w-[200px]">
            {path.title}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-text-primary truncate">{lesson.title}</span>
        </nav>

        {/* Lesson Header */}
        <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
            <BookOpen className="h-4 w-4 text-accent" />
            <span>
              {locale === 'th' ? 'บทเรียนที่' : 'Lesson'} {lesson.order} / {lessons.length}
            </span>
            <span>•</span>
            <span>{lesson.estimatedMinutes} {locale === 'th' ? 'นาที' : 'min'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary md:text-3xl">
            {lesson.title}
          </h1>
        </div>

        {/* Lesson Content (client component with mark-complete button) */}
        <LessonContent
          pathId={pathId}
          lessonId={lessonId}
          content={lesson.content}
          locale={locale as 'th' | 'en'}
        />

        {/* Lesson Navigation */}
        <LessonNav
          pathId={pathId}
          lessons={lessons}
          currentLessonId={lessonId}
          completedLessonIds={[]} // Resolved client-side
          locale={locale as 'th' | 'en'}
        />
      </div>
    </main>
  );
}
