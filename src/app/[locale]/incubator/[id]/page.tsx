import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Link } from '@/i18n/routing';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getIncubatorProject, getProjectContributorApplications } from '@/lib/incubator/data';
import { STAGE_LABELS } from '@/lib/validators/incubator';
import type { IncubatorStage } from '@/lib/validators/incubator';
import { ApplyButton } from '@/components/incubator/ApplyButton';
import { ApplicationsManager } from '@/components/incubator/ApplicationsManager';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Folder, Users, Award, Code, Compass, Info } from 'lucide-react';

interface ProjectDetailPageProps {
  params: Promise<{
    locale: 'th' | 'en';
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getIncubatorProject(id);
  if (!project) return { title: 'Project Not Found | Jariyah Soft' };

  return {
    title: `${project.name} | Project Incubator`,
    description: project.description.substring(0, 160),
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { locale, id: projectId } = await params;
  const project = await getIncubatorProject(projectId);

  if (!project) {
    notFound();
  }

  // Get current session user ID
  let userId: string | null = null;
  const sessionCookie = (await cookies()).get('session')?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie);
      userId = decoded.uid;
    } catch (e) {
      // Ignored
    }
  }

  const isOwner = userId === project.ownerId;

  // Retrieve user application status if logged in and not owner
  let userApplicationStatus: 'pending' | 'accepted' | 'rejected' | null = null;
  if (userId && !isOwner) {
    const appDoc = await adminDb
      .collection('incubator_projects')
      .doc(projectId)
      .collection('applications')
      .doc(userId)
      .get();
    if (appDoc.exists) {
      userApplicationStatus = appDoc.data()?.status || 'pending';
    }
  }

  // If owner, fetch applications list
  const applications = isOwner ? await getProjectContributorApplications(projectId) : [];

  const stageLabel = STAGE_LABELS[project.stage as IncubatorStage]?.[locale] ?? project.stage;

  const translations = {
    backToList: locale === 'th' ? 'กลับหน้าบ่มเพาะโครงการ' : 'Back to incubator projects',
    details: locale === 'th' ? 'รายละเอียดโครงการ' : 'Project Details',
    stage: locale === 'th' ? 'ระดับโครงการ' : 'Project Stage',
    repository: locale === 'th' ? 'คลังรหัส (Repository)' : 'Code Repository',
    noRepository: locale === 'th' ? 'ไม่มีโปรเจกต์สาธารณะ' : 'No repository linked',
    skills: locale === 'th' ? 'ทักษะที่เกี่ยวข้อง' : 'Skills Required',
    team: locale === 'th' ? 'ทีมงานและที่ปรึกษา' : 'Team & Mentors',
    contributors: locale === 'th' ? 'ผู้ร่วมทีมพัฒนา' : 'Contributors',
    mentors: locale === 'th' ? 'อาจารย์ที่ปรึกษา' : 'Mentors',
    pendingLabel: locale === 'th' ? 'ส่งใบสมัครแล้ว (รอพิจารณา)' : 'Application Pending',
    acceptedLabel: locale === 'th' ? 'เข้าร่วมโครงการแล้ว' : 'Accepted to Team',
    rejectedLabel: locale === 'th' ? 'ถูกปฏิเสธสิทธิ์' : 'Application Declined',
    teamMembersCount: (count: number) => (locale === 'th' ? `${count} คน` : `${count} members`),
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,120,255,0.08),transparent_24rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/incubator"
            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            &larr; {translations.backToList}
          </Link>
        </div>

        {/* Project Header */}
        <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{stageLabel}</Badge>
                {project.repositoryURL && (
                  <a
                    href={project.repositoryURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    <span>GitHub</span>
                  </a>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-text-primary md:text-3xl">
                  {project.name}
                </h1>
              </div>
            </div>

            {/* Interaction Button / Badge based on Status */}
            <div className="shrink-0 pt-2">
              {isOwner ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent border border-accent/20">
                  <Compass className="h-4 w-4" />
                  {locale === 'th' ? 'เจ้าของโครงการ' : 'Your Project'}
                </span>
              ) : userApplicationStatus ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${
                    userApplicationStatus === 'accepted'
                      ? 'bg-success/10 text-success border-success/20'
                      : userApplicationStatus === 'rejected'
                        ? 'bg-danger/10 text-danger border-danger/20'
                        : 'bg-warning/10 text-warning border-warning/20'
                  }`}
                >
                  <Info className="h-4 w-4" />
                  {userApplicationStatus === 'accepted'
                    ? translations.acceptedLabel
                    : userApplicationStatus === 'rejected'
                      ? translations.rejectedLabel
                      : translations.pendingLabel}
                </span>
              ) : userId ? (
                <ApplyButton projectId={project.id} projectName={project.name} locale={locale} />
              ) : (
                <Link href="/login">
                  <Button variant="primary">
                    {locale === 'th' ? 'เข้าสู่ระบบเพื่อเข้าร่วมโครงการ' : 'Login to Join Project'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-8">
              <h2 className="text-lg font-bold text-text-primary border-b border-text-secondary/5 pb-3">
                {translations.details}
              </h2>
              <div className="mt-4 text-text-primary leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {project.description}
              </div>
            </section>

            {/* Owner Applications Manager Dashboard */}
            {isOwner && (
              <section className="space-y-4">
                <ApplicationsManager
                  projectId={project.id}
                  initialApplications={applications}
                  locale={locale}
                />
              </section>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Project Overview Card */}
            <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                {locale === 'th' ? 'ข้อมูลสรุป' : 'Project Overview'}
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <Folder className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <span className="block font-bold text-text-primary">{translations.stage}</span>
                    <span className="mt-0.5 block text-text-secondary">{stageLabel}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <svg className="h-5 w-5 text-accent shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  <div>
                    <span className="block font-bold text-text-primary">{translations.repository}</span>
                    {project.repositoryURL ? (
                      <a
                        href={project.repositoryURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block text-accent hover:underline truncate"
                      >
                        {project.repositoryURL}
                      </a>
                    ) : (
                      <span className="mt-0.5 block text-text-secondary">{translations.noRepository}</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Required Skills Card */}
            {project.skillNeeds && project.skillNeeds.length > 0 && (
              <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Code className="h-4 w-4" />
                  {translations.skills}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.skillNeeds.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-bg-secondary px-2.5 py-1 text-xs font-semibold text-text-primary border border-text-secondary/10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Team Stats */}
            <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                {translations.team}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <Users className="h-4 w-4 text-accent/70" />
                    {translations.contributors}
                  </span>
                  <span className="font-bold text-text-primary">
                    {translations.teamMembersCount(project.contributorIds?.length ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <Award className="h-4 w-4 text-badge-gold" />
                    {translations.mentors}
                  </span>
                  <span className="font-bold text-text-primary">
                    {translations.teamMembersCount(project.mentorIds?.length ?? 0)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
