import type { Metadata } from 'next';
import { Briefcase, SlidersHorizontal, Plus } from 'lucide-react';
import { JobCard } from '@/components/jobs/JobCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { listPublicJobs } from '@/lib/jobs/data';
import { JOB_TYPES, WORK_MODES, JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/validators/job';
import type { JobType, WorkMode } from '@/lib/validators/job';

export const revalidate = 60;

interface JobsPageProps {
  params: Promise<{ locale: 'th' | 'en' }>;
  searchParams: Promise<{
    type?: string;
    mode?: string;
    skill?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Job Board | Jariyah Soft',
  description: 'Find your next career step or project contribution opportunity in the Thai developer ecosystem.',
};

function filterHref(next: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/jobs${query ? `?${query}` : ''}`;
}

export default async function JobsPage({ params, searchParams }: JobsPageProps) {
  const { locale } = await params;
  const sParams = await searchParams;
  const activeType = sParams.type;
  const activeMode = sParams.mode;
  const activeSkill = sParams.skill;

  const { jobs } = await listPublicJobs({
    jobType: activeType as JobType,
    workMode: activeMode as WorkMode,
    skills: activeSkill,
  });

  const translations = {
    title: locale === 'th' ? 'ค้นหาโอกาสในการทำงาน' : 'Find Developer Opportunities',
    description:
      locale === 'th'
        ? 'แหล่งรวมงานประจำ งานพาร์ทไทม์ และโปรเจกต์ฟรีแลนซ์สำหรับนักพัฒนา'
        : 'Discover jobs, freelance gigs, and project opportunities in the developer ecosystem.',
    postJob: locale === 'th' ? 'ลงประกาศรับสมัครงาน' : 'Post a Job',
    filters: locale === 'th' ? 'ตัวกรอง' : 'Filters',
    jobType: locale === 'th' ? 'ประเภทงาน' : 'Job Type',
    workMode: locale === 'th' ? 'รูปแบบการทำงาน' : 'Work Mode',
    allTypes: locale === 'th' ? 'ทุกประเภท' : 'All Types',
    allModes: locale === 'th' ? 'ทุกรูปแบบ' : 'All Modes',
    clearFilters: locale === 'th' ? 'ล้างตัวกรอง' : 'Clear Filters',
    resultsCount: locale === 'th' ? `พบประกาศงานทั้งหมด ${jobs.length} รายการ` : `Showing ${jobs.length} jobs available`,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,120,255,0.12),transparent_30rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Banner Section */}
        <section className="overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="info">Job Board</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{translations.title}</h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                {translations.description}
              </p>
            </div>
            <Link href="/dashboard/jobs/new">
              <Button variant="primary" className="font-semibold flex items-center gap-2 shadow-lg shrink-0">
                <Plus className="h-4 w-4" />
                {translations.postJob}
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
                {(activeType || activeMode || activeSkill) && (
                  <Link
                    href="/jobs"
                    className="text-xs text-accent hover:text-accent-hover font-semibold transition-colors"
                  >
                    {translations.clearFilters}
                  </Link>
                )}
              </div>

              <div className="space-y-6">
                {/* Job Type Filter */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {translations.jobType}
                  </h2>
                  <div className="mt-3 space-y-1">
                    <Link
                      href={filterHref({ mode: activeMode, skill: activeSkill })}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        !activeType ? 'bg-accent text-white' : 'hover:bg-bg-secondary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {translations.allTypes}
                    </Link>
                    {JOB_TYPES.map((type) => (
                      <Link
                        key={type}
                        href={filterHref({ type, mode: activeMode, skill: activeSkill })}
                        className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                          activeType === type
                            ? 'bg-accent text-white'
                            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                        }`}
                      >
                        {JOB_TYPE_LABELS[type]?.[locale] ?? type}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Work Mode Filter */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {translations.workMode}
                  </h2>
                  <div className="mt-3 space-y-1">
                    <Link
                      href={filterHref({ type: activeType, skill: activeSkill })}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        !activeMode ? 'bg-accent text-white' : 'hover:bg-bg-secondary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {translations.allModes}
                    </Link>
                    {WORK_MODES.map((mode) => (
                      <Link
                        key={mode}
                        href={filterHref({ type: activeType, mode, skill: activeSkill })}
                        className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                          activeMode === mode
                            ? 'bg-accent text-white'
                            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                        }`}
                      >
                        {WORK_MODE_LABELS[mode]?.[locale] ?? mode}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Jobs List Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">{translations.resultsCount}</p>
            </div>

            {jobs.length === 0 ? (
              <EmptyState
                title={locale === 'th' ? 'ไม่พบตำแหน่งงานตามเงื่อนไข' : 'No jobs found'}
                description={
                  locale === 'th'
                    ? 'ลองเปลี่ยนตัวเลือกประเภทหรือรูปแบบการทำงาน หรือล้างตัวกรองเพื่อค้นหาอีกครั้ง'
                    : 'Try changing your filter selections or clear filters to view all jobs.'
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} locale={locale} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
