'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { CheckCircle2, ChevronRight, Download, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ReputationBadge, getLevel } from '@/components/software/ReputationBadge';
import { FollowButton } from '@/components/social/FollowButton';

interface DeveloperCardProps {
  developer: {
    id: string;
    slug: string;
    displayName: string;
    bio: string;
    skills: string[];
    followerCount: number;
    reputationScore: number;
    verificationStatus: string;
    softwareCount: number;
  };
  locale: string;
}

export function DeveloperCard({ developer, locale }: DeveloperCardProps) {
  const isVerified = developer.verificationStatus === 'verified';
  const level = getLevel(developer.reputationScore);

  // Take top 3 skills
  const topSkills = developer.skills.slice(0, 3);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-text-secondary/10 bg-bg-card p-5 hover:border-accent/20 hover:shadow-lg transition-all duration-300">
      {/* Visual background decoration */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-accent/5 to-transparent" />
      
      <div className="space-y-4">
        {/* Header: Avatar, Name, Verification status & Reputation Level */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar name={developer.displayName} size="md" className="rounded-xl" />
              {isVerified && (
                <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-white border border-bg-card shadow-sm" title="Verified Developer">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors duration-200 line-clamp-1">
                {developer.displayName}
              </h3>
              <div className="mt-1 flex items-center gap-1">
                <ReputationBadge score={developer.reputationScore} showLabel={false} size="sm" />
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                  {level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {developer.bio && (
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {developer.bio}
          </p>
        )}

        {/* Top Skills Tag Chips */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topSkills.map((skill) => (
              <Badge key={skill} variant="default" size="sm" className="text-[10px] py-0.5 px-1.5">
                {skill}
              </Badge>
            ))}
            {developer.skills.length > 3 && (
              <span className="text-[9px] font-semibold text-text-secondary self-center px-1">
                +{developer.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer stats & interactive elements */}
      <div className="mt-5 space-y-4 pt-4 border-t border-text-secondary/5">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <div className="flex gap-4 font-medium">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {developer.followerCount.toLocaleString()} {locale === 'th' ? 'ผู้ติดตาม' : 'followers'}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {developer.softwareCount} {locale === 'th' ? 'ผลงาน' : 'software'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <FollowButton targetType="developer" targetId={developer.id} initialFollowCount={developer.followerCount} />
          
          <Link
            href={`/developers/${developer.slug}`}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform duration-200"
          >
            {locale === 'th' ? 'ดูโปรไฟล์' : 'View profile'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
