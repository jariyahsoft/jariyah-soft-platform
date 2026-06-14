import type { Metadata } from 'next';
import { Layers, SlidersHorizontal, Plus } from 'lucide-react';
import { ProjectCard } from '@/components/incubator/ProjectCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { listPublicProjects } from '@/lib/incubator/data';
import { INCUBATOR_STAGES, STAGE_LABELS } from '@/lib/validators/incubator';
import type { IncubatorStage } from '@/lib/validators/incubator';

export const revalidate = 60;

interface IncubatorPageProps {
  params: Promise<{ locale: 'th' | 'en' }>;
  searchParams: Promise<{
    stage?: string;
    skill?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Project Incubator | Jariyah Soft',
  description: 'Collaborate on open-source prototypes, beta tools, and mature software built by local developers.',
};

function filterHref(next: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/incubator${query ? `?${query}` : ''}`;
}

export default async function IncubatorPage({ params, searchParams }: IncubatorPageProps) {
  const { locale } = await params;
  const sParams = await searchParams;
  const activeStage = sParams.stage;
  const activeSkill = sParams.skill;

  const { projects } = await listPublicProjects({
    stage: activeStage as IncubatorStage,
    skill: activeSkill,
  });

  const translations = {
    title: locale === 'th' ? 'บ่มเพาะโครงการพัฒนา' : 'Project Incubator',
    description:
      locale === 'th'
        ? 'ร่วมมือพัฒนาโปรเจกต์โอเพนซอร์ส ต้นแบบ และซอฟต์แวร์จากนักพัฒนาในชุมชน'
        : 'Collaborate on open-source tools, prototype systems, and real-world software.',
    startProject: locale === 'th' ? 'เสนอโครงการใหม่' : 'Launch a Project',
    filters: locale === 'th' ? 'ตัวกรอง' : 'Filters',
    stage: locale === 'th' ? 'ระดับโครงการ' : 'Project Stage',
    allStages: locale === 'th' ? 'ทุกระดับ' : 'All Stages',
    clearFilters: locale === 'th' ? 'ล้างตัวกรอง' : 'Clear Filters',
    resultsCount:
      locale === 'th'
        ? `พบโครงการทั้งหมด ${projects.length} โครงการ`
        : `Showing ${projects.length} incubator projects`,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,120,255,0.12),transparent_30rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Banner Section */}
        <section className="overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="info">Incubator</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{translations.title}</h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                {translations.description}
              </p>
            </div>
            <Link href="/dashboard/incubator/new">
              <Button variant="primary" className="font-semibold flex items-center gap-2 shadow-lg shrink-0">
                <Plus className="h-4 w-4" />
                {translations.startProject}
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
                {(activeStage || activeSkill) && (
                  <Link
                    href="/incubator"
                    className="text-xs text-accent hover:text-accent-hover font-semibold transition-colors"
                  >
                    {translations.clearFilters}
                  </Link>
                )}
              </div>

              <div className="space-y-6">
                {/* Project Stage Filter */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {translations.stage}
                  </h2>
                  <div className="mt-3 space-y-1">
                    <Link
                      href={filterHref({ skill: activeSkill })}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        !activeStage ? 'bg-accent text-white' : 'hover:bg-bg-secondary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {translations.allStages}
                    </Link>
                    {INCUBATOR_STAGES.map((stage) => (
                      <Link
                        key={stage}
                        href={filterHref({ stage, skill: activeSkill })}
                        className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                          activeStage === stage
                            ? 'bg-accent text-white'
                            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                        }`}
                      >
                        {STAGE_LABELS[stage]?.[locale] ?? stage}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Projects List Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">{translations.resultsCount}</p>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                title={locale === 'th' ? 'ไม่พบโครงการบ่มเพาะตามเงื่อนไข' : 'No projects found'}
                description={
                  locale === 'th'
                    ? 'ลองเปลี่ยนตัวเลือกการกรอง หรือเสนอโครงการใหม่ของคุณขึ้นระบบ'
                    : 'Try changing your filter selections or submit a new project to start.'
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} locale={locale} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
