'use client';

import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Briefcase, Clock, Code2 } from 'lucide-react';
import type { JobData, JobType, WorkMode } from '@/lib/validators/job';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/validators/job';

interface JobCardProps {
  job: JobData;
  locale: 'th' | 'en';
}

const JOB_TYPE_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'elite'> = {
  full_time: 'success',
  part_time: 'info',
  freelance: 'warning',
  internship: 'elite',
};

const WORK_MODE_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'elite'> = {
  remote: 'info',
  onsite: 'default',
  hybrid: 'success',
};

export function JobCard({ job, locale }: JobCardProps) {
  const typeLabel = JOB_TYPE_LABELS[job.jobType as JobType]?.[locale] ?? job.jobType;
  const modeLabel = WORK_MODE_LABELS[job.workMode as WorkMode]?.[locale] ?? job.workMode;
  const typeBadge = JOB_TYPE_BADGE[job.jobType] ?? 'default';
  const modeBadge = WORK_MODE_BADGE[job.workMode] ?? 'default';

  const expiresAt = new Date(job.expiresAt);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 7;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Gradient glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-accent/5 to-transparent" />

      <div className="space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={typeBadge} size="sm">{typeLabel}</Badge>
          <Badge variant={modeBadge} size="sm">{modeLabel}</Badge>
          {isExpiringSoon && (
            <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold text-warning border border-warning/15">
              <Clock className="h-3 w-3" />
              {locale === 'th' ? `เหลือ ${daysLeft} วัน` : `${daysLeft}d left`}
            </span>
          )}
        </div>

        {/* Title & Org */}
        <div>
          <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors duration-200 line-clamp-2">
            {job.title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{job.organization}</p>
        </div>

        {/* Meta info */}
        <div className="space-y-2 text-sm text-text-secondary">
          {job.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-accent/70" />
              <span className="truncate">{job.location}</span>
            </div>
          )}
          {job.salaryRange && (job.salaryRange.min || job.salaryRange.max) && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 shrink-0 text-accent/70" />
              <span>
                {job.salaryRange.min
                  ? `${job.salaryRange.min.toLocaleString()} – ${job.salaryRange.max?.toLocaleString() ?? '?'} ${job.salaryRange.currency}`
                  : `${locale === 'th' ? 'เจรจาได้' : 'Negotiable'}`}
              </span>
            </div>
          )}
          {job.skills.slice(0, 3).length > 0 && (
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 shrink-0 text-accent/70" />
              <span className="truncate">{job.skills.slice(0, 3).join(' · ')}{job.skills.length > 3 ? ` +${job.skills.length - 3}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expiry hint */}
      <p className="mt-4 text-[11px] text-text-secondary/70">
        {locale === 'th' ? 'หมดอายุ' : 'Expires'}{' '}
        {expiresAt.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </Link>
  );
}
