'use client';

import { Link } from '@/i18n/routing';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Award, BookOpen, MessageSquare } from 'lucide-react';
import type { MentorProfileData, MentorAvailability } from '@/lib/validators/incubator';
import { AVAILABILITY_LABELS } from '@/lib/validators/incubator';

interface MentorCardProps {
  mentor: MentorProfileData;
  locale: 'th' | 'en';
}

const AVAILABILITY_BADGE: Record<MentorAvailability, 'success' | 'warning' | 'danger'> = {
  available: 'success',
  limited: 'warning',
  unavailable: 'danger',
};

export function MentorCard({ mentor, locale }: MentorCardProps) {
  const availabilityLabel =
    AVAILABILITY_LABELS[mentor.availability as MentorAvailability]?.[locale] ?? mentor.availability;
  const availabilityBadge = AVAILABILITY_BADGE[mentor.availability] ?? 'warning';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Gradient glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-accent/5 to-transparent" />

      <div className="space-y-4">
        {/* Availability Badge */}
        <div className="flex justify-end">
          <Badge variant={availabilityBadge} size="sm">
            {availabilityLabel}
          </Badge>
        </div>

        {/* Profile Info */}
        <div className="flex items-start gap-4">
          <Avatar name={mentor.displayName || 'Mentor'} size="lg" className="shrink-0" />
          <div className="space-y-1 min-w-0">
            <h4 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors duration-200 truncate">
              {mentor.displayName || (locale === 'th' ? 'ผู้ใช้รอนิรนาม' : 'Anonymous User')}
            </h4>
            <span className="text-[11px] text-text-secondary/70 flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-badge-gold" />
              {locale === 'th' ? 'อาจารย์ที่ปรึกษา' : 'Incubator Mentor'}
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
          {mentor.bio || (locale === 'th' ? 'ไม่มีคำแนะนำตัว' : 'No bio provided')}
        </p>

        {/* Expertise tags */}
        {mentor.expertise && mentor.expertise.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary/70 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {locale === 'th' ? 'ความเชี่ยวชาญ' : 'Expertise'}
            </span>
            <div className="flex flex-wrap gap-1">
              {mentor.expertise.slice(0, 3).map((exp, idx) => (
                <span
                  key={idx}
                  className="rounded bg-accent/5 px-2 py-0.5 text-[10px] font-semibold text-accent border border-accent/10"
                >
                  {exp}
                </span>
              ))}
              {mentor.expertise.length > 3 && (
                <span className="rounded bg-text-secondary/5 px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                  +{mentor.expertise.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer stats and link */}
      <div className="mt-6 pt-4 border-t border-text-secondary/5 flex items-center justify-between">
        <div className="text-xs text-text-secondary space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-text-primary">
              {mentor.activeProjectCount ?? 0}
            </span>
            <span>/ {mentor.maxProjects ?? 3} {locale === 'th' ? 'โครงการที่ดูแล' : 'projects'}</span>
          </div>
        </div>

        <Link
          href={`/developers/${mentor.uid}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-hover transition-colors"
        >
          <span>{locale === 'th' ? 'ดูโปรไฟล์' : 'View Profile'}</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
