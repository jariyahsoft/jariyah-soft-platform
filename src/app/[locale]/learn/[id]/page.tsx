import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, Clock, Lock, CheckCircle2, Circle, ChevronRight, Award, AlertTriangle } from 'lucide-react';
import { getPathWithLessons, getUserProgress } from '@/lib/learning/data';
import { LEVEL_LABELS, type LearningLevel } from '@/lib/validators/learning';
import { adminDb } from '@/lib/firebase/admin';

export const revalidate = 60;

interface PathDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PathDetailPage({ params }: PathDetailPageProps) {
  const { locale, id: pathId } = await params;

  const result = await getPathWithLessons(pathId);
  if (!result) notFound();

  const { path, lessons } = result;
  const levelLabel = LEVEL_LABELS[path.level as LearningLevel]?.[locale as 'th' | 'en'] || path.level;

  // Check prerequisite
  let prerequisiteMet = true;
  let prerequisitePath: { id: string; title: string } | null = null;
  if (path.prerequisitePathId) {
    const prereqDoc = await adminDb
      .collection('learning_paths')
      .doc(path.prerequisitePathId)
      .get();
    if (prereqDoc.exists) {
      prerequisitePath = { id: prereqDoc.id, title: prereqDoc.data()!.title };
    }
    // In a real app we'd check user progress here — for SSR without auth,
    // the lock state is managed client-side. Here we just show the prerequisite info.
    prerequisiteMet = false; // Default locked for unauthenticated SSR
  }

  const completedLessons = 0; // Will be resolved client-side via progress API
  const progressPercentage = 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.06),transparent_35rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-text-secondary">
          <Link href="/learn" className="hover:text-accent transition-colors">
            {locale === 'th' ? 'หลักสูตร' : 'Paths'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-text-primary truncate">{path.title}</span>
        </nav>

        {/* Header Card */}
        <section className="overflow-hidden rounded-3xl border border-text-secondary/10 bg-bg-card shadow-sm">
          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-accent via-sky-400 to-indigo-500" />

          <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info" size="md">{levelLabel}</Badge>
              <Badge variant="default" size="sm" className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {path.lessonCount} {locale === 'th' ? 'บทเรียน' : 'lessons'}
              </Badge>
              <Badge variant="default" size="sm" className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {path.estimatedMinutes} {locale === 'th' ? 'นาที' : 'min'}
              </Badge>
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                {path.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-text-secondary">
                {path.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-secondary">
                  {locale === 'th' ? 'ความก้าวหน้า' : 'Progress'}
                </span>
                <span className="font-bold text-accent">{progressPercentage}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-text-secondary/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-sky-400 transition-all duration-700"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Prerequisite warning */}
            {prerequisitePath && !prerequisiteMet && (
              <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {locale === 'th' ? 'ต้องเรียนหลักสูตรก่อนหน้าก่อน' : 'Prerequisite Required'}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {locale === 'th'
                      ? `กรุณาสำเร็จหลักสูตร "${prerequisitePath.title}" ก่อนเริ่มเรียนหลักสูตรนี้`
                      : `Please complete "${prerequisitePath.title}" before starting this path.`}
                  </p>
                  <Link
                    href={`/learn/${prerequisitePath.id}`}
                    className="mt-2 inline-flex text-xs font-bold text-accent hover:underline"
                  >
                    {locale === 'th' ? 'ไปยังหลักสูตร →' : 'Go to path →'}
                  </Link>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3">
              {lessons.length > 0 && (
                <Link
                  href={`/learn/${pathId}/lesson/${lessons[0]!.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm shadow-accent/20 hover:shadow-md hover:shadow-accent/30 transition-all duration-200"
                >
                  {locale === 'th' ? 'เริ่มเรียน' : 'Start Learning'}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              {path.quizId && (
                <Link
                  href={`/learn/${pathId}/quiz`}
                  className="inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-6 py-3 text-sm font-bold text-accent hover:bg-accent/10 transition-all duration-200"
                >
                  <Award className="h-4 w-4" />
                  {locale === 'th' ? 'ทำแบบทดสอบ' : 'Take Quiz'}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Lesson List */}
        <section className="rounded-3xl border border-text-secondary/10 bg-bg-card shadow-sm overflow-hidden">
          <div className="border-b border-text-secondary/10 px-8 py-5">
            <h2 className="text-lg font-bold text-text-primary">
              {locale === 'th' ? 'รายการบทเรียน' : 'Lessons'}
            </h2>
          </div>

          <div className="divide-y divide-text-secondary/5">
            {lessons.map((lesson, idx) => {
              const isCompleted = false; // Resolved client-side
              const isAvailable = true;

              return (
                <Link
                  key={lesson.id}
                  href={`/learn/${pathId}/lesson/${lesson.id}`}
                  className="flex items-center gap-4 px-8 py-5 hover:bg-text-secondary/[0.03] transition-colors group"
                >
                  {/* Status icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-text-secondary/10 bg-bg-secondary text-sm font-bold text-text-secondary group-hover:border-accent/30 group-hover:text-accent transition-all">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : !isAvailable ? (
                      <Lock className="h-4 w-4 text-text-secondary/40" />
                    ) : (
                      <span>{lesson.order}</span>
                    )}
                  </div>

                  {/* Lesson info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {lesson.estimatedMinutes} {locale === 'th' ? 'นาที' : 'min'}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-text-secondary/30 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
