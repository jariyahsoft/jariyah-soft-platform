import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';
import type { LearningPath, UserPathProgress } from '@/lib/validators/learning';
import { LEVEL_LABELS, type LearningLevel } from '@/lib/validators/learning';

interface LearningPathCardProps {
  path: LearningPath;
  progress?: UserPathProgress | null;
  locale: 'th' | 'en';
}

const LEVEL_BADGE_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'elite'> = {
  'digital-citizen': 'info',
  'ai-user': 'warning',
  'software-user': 'default',
  'junior-developer': 'success',
  'senior-developer': 'elite',
  'open-source-maintainer': 'elite',
};

export function LearningPathCard({ path, progress, locale }: LearningPathCardProps) {
  const levelLabel = LEVEL_LABELS[path.level as LearningLevel]?.[locale] || path.level;
  const badgeVariant = LEVEL_BADGE_VARIANT[path.level] || 'default';
  const hasProgress = progress && progress.percentage > 0;
  const isCompleted = progress?.completedAt != null;

  return (
    <Link
      href={`/learn/${path.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Progress bar overlay at top */}
      {hasProgress && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-text-secondary/5">
          <div
            className={`h-full transition-all duration-500 rounded-r-full ${
              isCompleted
                ? 'bg-gradient-to-r from-success to-emerald-400'
                : 'bg-gradient-to-r from-accent to-sky-400'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Level badge */}
        <div className="flex items-center justify-between">
          <Badge variant={badgeVariant} size="sm">
            {levelLabel}
          </Badge>
          {isCompleted && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success border border-success/15">
              ✓ {locale === 'th' ? 'สำเร็จแล้ว' : 'Completed'}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors duration-200 line-clamp-2">
            {path.title}
          </h3>
          <p className="mt-2 text-sm text-text-secondary line-clamp-2 leading-relaxed">
            {path.description}
          </p>
        </div>
      </div>

      {/* Footer: stats */}
      <div className="mt-6 flex items-center justify-between border-t border-text-secondary/5 pt-4">
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {path.lessonCount} {locale === 'th' ? 'บทเรียน' : 'lessons'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {path.estimatedMinutes} {locale === 'th' ? 'นาที' : 'min'}
          </span>
        </div>

        {hasProgress && !isCompleted && (
          <span className="text-xs font-bold text-accent">
            {progress.percentage}%
          </span>
        )}

        <ChevronRight className="h-4 w-4 text-text-secondary/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </Link>
  );
}
