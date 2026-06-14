import type { Metadata } from 'next';
import { Award, SlidersHorizontal } from 'lucide-react';
import { MentorCard } from '@/components/mentors/MentorCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { getMentors } from '@/lib/incubator/data';

export const revalidate = 60;

interface MentorsPageProps {
  params: Promise<{ locale: 'th' | 'en' }>;
  searchParams: Promise<{
    expertise?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Find Mentors | Jariyah Soft',
  description: 'Connect with experienced software engineers, designers, and product leaders to guide your project.',
};

export default async function MentorsPage({ params, searchParams }: MentorsPageProps) {
  const { locale } = await params;
  const sParams = await searchParams;
  const activeExpertise = sParams.expertise;

  const mentors = await getMentors({
    expertise: activeExpertise,
  });

  const translations = {
    title: locale === 'th' ? 'ค้นหาอาจารย์ที่ปรึกษา' : 'Connect with Mentors',
    description:
      locale === 'th'
        ? 'ขอคำแนะนำและการสนับสนุนพัฒนาโครงการจากผู้เชี่ยวชาญในวงการ'
        : 'Get guidance, review, and support for your project from seasoned professionals.',
    applyMentor: locale === 'th' ? 'สมัครเป็นอาจารย์ที่ปรึกษา' : 'Become a Mentor',
    filters: locale === 'th' ? 'ตัวกรอง' : 'Filters',
    expertise: locale === 'th' ? 'สาขาความชำนาญ' : 'Expertise',
    allExpertise: locale === 'th' ? 'ล้างตัวกรอง' : 'Clear Filters',
    resultsCount:
      locale === 'th'
        ? `พบอาจารย์ที่ปรึกษาที่พร้อมรับดูแล ${mentors.length} ท่าน`
        : `Showing ${mentors.length} mentors available`,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,120,255,0.12),transparent_30rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Banner Section */}
        <section className="overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="bronze">{translations.applyMentor}</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{translations.title}</h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                {translations.description}
              </p>
            </div>
            <Link href="/dashboard/mentor">
              <Button variant="primary" className="font-semibold flex items-center gap-2 shadow-lg shrink-0">
                <Award className="h-4 w-4" />
                {translations.applyMentor}
              </Button>
            </Link>
          </div>
        </section>

        {/* Filters and List Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Filters */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between font-bold text-text-primary">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-accent" />
                  {translations.filters}
                </span>
                {activeExpertise && (
                  <Link
                    href="/mentors"
                    className="text-xs text-accent hover:text-accent-hover font-semibold transition-colors"
                  >
                    {translations.allExpertise}
                  </Link>
                )}
              </div>

              {/* Quick instructions */}
              <div className="text-xs text-text-secondary leading-relaxed">
                {locale === 'th'
                  ? 'คุณสามารถกรองความเชี่ยวชาญของอาจารย์ที่ปรึกษาได้โดยคลิกป้ายทักษะในหน้าการ์ดของแต่ละท่าน'
                  : 'You can filter mentors by clicking on the expertise tags shown on their profile cards.'}
              </div>
            </div>
          </aside>

          {/* Mentors List Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">{translations.resultsCount}</p>
            </div>

            {mentors.length === 0 ? (
              <EmptyState
                title={locale === 'th' ? 'ไม่พบผู้เชี่ยวชาญตามเงื่อนไข' : 'No mentors found'}
                description={
                  locale === 'th'
                    ? 'ลองล้างการค้นหาหรือกลับมาตรวจสอบหน้าหลักใหม่อีกครั้งในภายหลัง'
                    : 'Try clearing the search filter or check back later.'
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {mentors.map((mentor) => (
                  <MentorCard key={mentor.uid} mentor={mentor} locale={locale} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
