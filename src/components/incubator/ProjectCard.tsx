'use client';

import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { Layers, Users, Award, Code2 } from 'lucide-react';
import type { IncubatorProjectData, IncubatorStage } from '@/lib/validators/incubator';
import { STAGE_LABELS } from '@/lib/validators/incubator';

interface ProjectCardProps {
  project: IncubatorProjectData;
  locale: 'th' | 'en';
}

const STAGE_BADGE: Record<IncubatorStage, 'default' | 'info' | 'success' | 'warning' | 'elite'> = {
  idea: 'default',
  prototype: 'info',
  beta: 'warning',
  stable: 'success',
  mature: 'elite',
};

export function ProjectCard({ project, locale }: ProjectCardProps) {
  const stageLabel = STAGE_LABELS[project.stage as IncubatorStage]?.[locale] ?? project.stage;
  const stageBadge = STAGE_BADGE[project.stage] ?? 'default';

  const contributorsCount = project.contributorIds?.length ?? 0;
  const mentorsCount = project.mentorIds?.length ?? 0;

  return (
    <Link
      href={`/incubator/${project.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Gradient glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-accent/5 to-transparent" />

      <div className="space-y-4">
        {/* Stage and Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={stageBadge} size="sm">
            {stageLabel}
          </Badge>
          {project.repositoryURL && (
            <a
              href={project.repositoryURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-accent transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
          )}
        </div>

        {/* Project Name & Description */}
        <div>
          <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors duration-200 line-clamp-1">
            {project.name}
          </h3>
          <p className="mt-2 text-sm text-text-secondary line-clamp-3 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Skill Needs */}
        {project.skillNeeds && project.skillNeeds.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary/70 flex items-center gap-1">
              <Code2 className="h-3 w-3" />
              {locale === 'th' ? 'ต้องการทักษะ' : 'Skills Needed'}
            </span>
            <div className="flex flex-wrap gap-1">
              {project.skillNeeds.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded bg-text-secondary/5 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
                >
                  {skill}
                </span>
              ))}
              {project.skillNeeds.length > 3 && (
                <span className="rounded bg-text-secondary/5 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                  +{project.skillNeeds.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer statistics */}
      <div className="mt-6 pt-4 border-t border-text-secondary/5 flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1" title={locale === 'th' ? 'ผู้ร่วมทีม' : 'Contributors'}>
            <Users className="h-3.5 w-3.5 text-accent/70" />
            {contributorsCount}
          </span>
          <span className="flex items-center gap-1" title={locale === 'th' ? 'อาจารย์ที่ปรึกษา' : 'Mentors'}>
            <Award className="h-3.5 w-3.5 text-accent/70" />
            {mentorsCount}
          </span>
        </div>
        <span className="text-[11px] text-text-secondary/60">
          {locale === 'th' ? 'ดูรายละเอียด' : 'Details'} &rarr;
        </span>
      </div>
    </Link>
  );
}
