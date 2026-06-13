import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BookOpen, GraduationCap, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { LearningPathCard } from '@/components/learning/LearningPathCard';
import { listPublishedPaths } from '@/lib/learning/data';
import { LEARNING_LEVELS, LEVEL_LABELS, type LearningLevel } from '@/lib/validators/learning';

export const revalidate = 60;

interface LearnPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string }>;
}

export const metadata: Metadata = {
  title: 'Learning Paths | Jariyah Soft',
  description: 'เรียนรู้ทักษะดิจิทัลผ่านหลักสูตรที่ออกแบบมาเพื่อนักพัฒนาไทย ตั้งแต่พลเมืองดิจิทัลไปจนถึง Open Source Maintainer',
  openGraph: {
    title: 'Learning Paths | Jariyah Soft',
    description: 'เรียนรู้ทักษะดิจิทัลผ่านหลักสูตรที่ออกแบบมาเพื่อนักพัฒนาไทย',
    images: ['/opengraph-image.png'],
  },
};

function filterHref(level?: string) {
  if (!level) return '/learn';
  return `/learn?level=${level}`;
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
  const { locale } = await params;
  const { level: activeLevel } = await searchParams;

  const paths = await listPublishedPaths(activeLevel ? { level: activeLevel } : undefined);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_35rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Section */}
        <section className="overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="info" size="md" className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Learning Paths
              </Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-text-primary md:text-5xl">
                {locale === 'th'
                  ? 'เส้นทางการเรียนรู้'
                  : 'Learning Paths'}
              </h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                {locale === 'th'
                  ? 'เรียนรู้ทักษะดิจิทัลตั้งแต่ระดับเริ่มต้นจนถึงระดับสูง แต่ละหลักสูตรประกอบด้วยบทเรียน แบบทดสอบ และใบประกาศนียบัตรเมื่อสำเร็จ'
                  : 'Learn digital skills from beginner to advanced. Each path includes lessons, a quiz, and a certificate upon completion.'}
              </p>
            </div>
            <div className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4 text-sm text-text-secondary">
              <BookOpen className="mb-3 h-5 w-5 text-accent" />
              {paths.length} {locale === 'th' ? 'หลักสูตรเปิดสอน' : 'paths available'}
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Filters */}
          <aside>
            <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5 sticky top-24">
              <div className="mb-4 flex items-center gap-2 font-bold text-text-primary">
                <SlidersHorizontal className="h-5 w-5 text-accent" />
                {locale === 'th' ? 'กรอง' : 'Filters'}
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                  {locale === 'th' ? 'ระดับ' : 'Level'}
                </h2>
                <div className="mt-3 space-y-2">
                  <Link
                    href="/learn"
                    className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      !activeLevel
                        ? 'bg-accent text-white'
                        : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                    }`}
                  >
                    {locale === 'th' ? 'ทุกระดับ' : 'All Levels'}
                  </Link>
                  {LEARNING_LEVELS.map((level) => (
                    <Link
                      key={level}
                      href={filterHref(level)}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        activeLevel === level
                          ? 'bg-accent text-white'
                          : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                      }`}
                    >
                      {LEVEL_LABELS[level][locale as 'th' | 'en']}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Path Grid */}
          <section>
            <div className="mb-5">
              <p className="text-sm text-text-secondary">
                {paths.length} {locale === 'th' ? 'หลักสูตร' : 'paths'}
                {activeLevel && ` • ${LEVEL_LABELS[activeLevel as LearningLevel]?.[locale as 'th' | 'en'] || activeLevel}`}
              </p>
            </div>

            {paths.length === 0 ? (
              <EmptyState
                title={locale === 'th' ? 'ไม่พบหลักสูตร' : 'No paths found'}
                description={
                  locale === 'th'
                    ? 'ลองเลือกระดับอื่น หรือกลับมาตรวจสอบอีกครั้งภายหลัง'
                    : 'Try a different level filter or check back later.'
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paths.map((path) => (
                  <LearningPathCard
                    key={path.id}
                    path={path}
                    locale={locale as 'th' | 'en'}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
