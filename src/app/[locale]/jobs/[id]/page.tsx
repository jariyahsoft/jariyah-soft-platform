import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobCard } from '@/components/jobs/JobCard';
import { getJob, getRelatedJobs } from '@/lib/jobs/data';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/validators/job';
import type { JobType, WorkMode } from '@/lib/validators/job';
import { MapPin, Briefcase, Clock, ExternalLink, Calendar, Code } from 'lucide-react';

interface JobDetailPageProps {
  params: Promise<{
    locale: 'th' | 'en';
    id: string;
  }>;
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: 'Job Not Found | Jariyah Soft' };

  return {
    title: `${job.title} at ${job.organization} | Jariyah Soft`,
    description: job.description.substring(0, 160),
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { locale, id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  const relatedJobs = await getRelatedJobs(job.id, job.skills);

  const typeLabel = JOB_TYPE_LABELS[job.jobType as JobType]?.[locale] ?? job.jobType;
  const modeLabel = WORK_MODE_LABELS[job.workMode as WorkMode]?.[locale] ?? job.workMode;

  const expiresAt = new Date(job.expiresAt);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const translations = {
    applyNow: locale === 'th' ? 'สมัครงานนี้' : 'Apply Now',
    expiredOn: locale === 'th' ? 'หมดอายุวันที่' : 'Expires on',
    daysLeft: locale === 'th' ? `เหลือเวลาสมัครอีก ${daysLeft} วัน` : `${daysLeft} days left to apply`,
    jobOverview: locale === 'th' ? 'สรุปข้อมูลงาน' : 'Job Overview',
    jobDescription: locale === 'th' ? 'รายละเอียดงาน' : 'Job Description',
    requiredSkills: locale === 'th' ? 'ทักษะที่เกี่ยวข้อง' : 'Required Skills',
    location: locale === 'th' ? 'สถานที่ปฏิบัติงาน' : 'Location',
    salary: locale === 'th' ? 'อัตราเงินเดือน' : 'Salary',
    jobType: locale === 'th' ? 'ประเภทการจ้างงาน' : 'Employment Type',
    workMode: locale === 'th' ? 'รูปแบบการทำงาน' : 'Work Mode',
    relatedJobs: locale === 'th' ? 'งานแนะนำที่ใกล้เคียงกัน' : 'Related Opportunities',
    postedOn: locale === 'th' ? 'เผยแพร่เมื่อ' : 'Posted on',
    negotiable: locale === 'th' ? 'เจรจาต่อรองได้' : 'Negotiable',
    backToList: locale === 'th' ? 'กลับไปที่หน้ารายการงาน' : 'Back to jobs list',
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(0,120,255,0.08),transparent_24rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/jobs"
            className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            &larr; {translations.backToList}
          </Link>
        </div>

        {/* Job Header Card */}
        <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{typeLabel}</Badge>
                <Badge variant="info">{modeLabel}</Badge>
                {daysLeft <= 7 && daysLeft > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold text-warning border border-warning/15">
                    <Clock className="h-3 w-3" />
                    {translations.daysLeft}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-text-primary md:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-2 text-lg font-bold text-text-secondary">{job.organization}</p>
              </div>
            </div>

            <div className="shrink-0 pt-2">
              <a href={job.applicationURL} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="lg" className="w-full font-bold flex items-center justify-center gap-2 shadow-lg md:w-auto">
                  <span>{translations.applyNow}</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-6 border-t border-text-secondary/5 pt-6 grid gap-4 grid-cols-2 sm:grid-cols-4 text-sm text-text-secondary">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                {translations.jobType}
              </span>
              <span className="mt-1 block font-bold text-text-primary">{typeLabel}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                {translations.workMode}
              </span>
              <span className="mt-1 block font-bold text-text-primary">{modeLabel}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                {translations.salary}
              </span>
              <span className="mt-1 block font-bold text-text-primary">
                {job.salaryRange?.min
                  ? `${job.salaryRange.min.toLocaleString()} – ${job.salaryRange.max?.toLocaleString() ?? '?'} ${job.salaryRange.currency}`
                  : translations.negotiable}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                {translations.expiredOn}
              </span>
              <span className="mt-1 block font-bold text-text-primary">
                {expiresAt.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-8">
              <h2 className="text-lg font-bold text-text-primary border-b border-text-secondary/5 pb-3">
                {translations.jobDescription}
              </h2>
              <div className="mt-4 text-text-primary leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {job.description}
              </div>
            </section>
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-6">
            {/* Location & Details Card */}
            <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                {translations.jobOverview}
              </h3>

              <div className="space-y-4 text-sm">
                {job.location && (
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <span className="block font-bold text-text-primary">{translations.location}</span>
                      <span className="mt-0.5 block text-text-secondary">{job.location}</span>
                    </div>
                  </div>
                )}

                {job.publishedAt && (
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <span className="block font-bold text-text-primary">{translations.postedOn}</span>
                      <span className="mt-0.5 block text-text-secondary">
                        {new Date(job.publishedAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Skills Card */}
            {job.skills && job.skills.length > 0 && (
              <section className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Code className="h-4 w-4" />
                  {translations.requiredSkills}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
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
          </div>
        </div>

        {/* Related Jobs Section */}
        {relatedJobs && relatedJobs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary">{translations.relatedJobs}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedJobs.map((item) => (
                <JobCard key={item.id} job={item} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
