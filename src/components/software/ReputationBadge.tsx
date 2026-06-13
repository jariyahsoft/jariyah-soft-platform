import React from 'react';
import { Award, Shield, Medal, Crown, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useLocale } from 'next-intl';

export function getLevel(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'elite' {
  if (score >= 5000) return 'elite';
  if (score >= 2000) return 'platinum';
  if (score >= 1000) return 'gold';
  if (score >= 500) return 'silver';
  return 'bronze';
}

export const LEVEL_LABELS = {
  th: {
    bronze: 'ทองแดง (Bronze)',
    silver: 'เงิน (Silver)',
    gold: 'ทอง (Gold)',
    platinum: 'แพลตตินัม (Platinum)',
    elite: 'อีลิท (Elite)',
  },
  en: {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    elite: 'Elite',
  },
};

interface ReputationBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ReputationBadge({ score, showLabel = true, size = 'sm' }: ReputationBadgeProps) {
  const locale = useLocale() as 'th' | 'en';
  const level = getLevel(score);
  const label = LEVEL_LABELS[locale === 'en' ? 'en' : 'th'][level];

  const iconMap = {
    bronze: Award,
    silver: Shield,
    gold: Medal,
    platinum: Crown,
    elite: Trophy,
  };

  const Icon = iconMap[level];
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <Badge variant={level} size={size} className="inline-flex items-center gap-1">
      <Icon className={iconSize} />
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}
