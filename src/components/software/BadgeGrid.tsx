import React from 'react';
import { Sparkles, GitBranch, PenTool, Cpu, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useLocale } from 'next-intl';

export interface EarnedBadge {
  badgeId: string;
  awardedAt?: string | { toDate: () => Date } | any;
}

interface BadgeGridProps {
  earnedBadges: EarnedBadge[];
}

const ALL_BADGES = [
  {
    slug: 'first_software',
    aliases: ['first-software'],
    icon: Sparkles,
    colorClass: 'text-success bg-success/10 border-success/20',
    name: { th: 'ซอฟต์แวร์แรก', en: 'First Software' },
    description: { th: 'เผยแพร่ซอฟต์แวร์ชิ้นแรกสำเร็จ', en: 'Published your first software successfully' }
  },
  {
    slug: 'open_source_contributor',
    aliases: ['open-source-contributor'],
    icon: GitBranch,
    colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    name: { th: 'ผู้สนับสนุนโอเพนซอร์ส', en: 'Open Source Contributor' },
    description: { th: 'มีส่วนร่วมในโครงการโอเพนซอร์ส 3 โครงการขึ้นไป', en: 'Contributed to 3 or more incubator projects' }
  },
  {
    slug: 'top_author',
    aliases: ['top-author'],
    icon: PenTool,
    colorClass: 'text-warning bg-warning/10 border-warning/20',
    name: { th: 'นักเขียนยอดนิยม', en: 'Top Author' },
    description: { th: 'เขียนบทความความรู้เผยแพร่ 10 บทความขึ้นไป', en: 'Published 10 or more articles' }
  },
  {
    slug: 'top_developer',
    aliases: ['top-developer'],
    icon: Cpu,
    colorClass: 'text-danger bg-danger/10 border-danger/20',
    name: { th: 'นักพัฒนายอดเยี่ยม', en: 'Top Developer' },
    description: { th: 'เผยแพร่ซอฟต์แวร์สู่ระบบ 5 ชิ้นขึ้นไป', en: 'Published 5 or more software products' }
  },
  {
    slug: 'community_helper',
    aliases: ['community-helper'],
    icon: HeartHandshake,
    colorClass: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    name: { th: 'ผู้ช่วยเหลือชุมชน', en: 'Community Helper' },
    description: { th: 'ได้รับการอนุมัติรีวิว 50 รายการขึ้นไป', en: 'Had 50 or more reviews approved' }
  },
  {
    slug: 'verified_developer',
    aliases: ['verified-developer'],
    icon: ShieldCheck,
    colorClass: 'text-accent bg-accent/10 border-accent/20',
    name: { th: 'นักพัฒนาที่ยืนยันแล้ว', en: 'Verified Developer' },
    description: { th: 'ผ่านการยืนยันตัวตนระดับสูงจากผู้ดูแลระบบ', en: 'Manually verified by an administrator' }
  }
];

export function BadgeGrid({ earnedBadges }: BadgeGridProps) {
  const locale = useLocale() as 'th' | 'en';

  const getAwardedDate = (badgeSlug: string) => {
    // Normalise slugs to compare (handles dashes vs underscores)
    const earned = earnedBadges.find(b => {
      const slugClean = b.badgeId.toLowerCase().replace(/_/g, '-');
      const targetClean = badgeSlug.toLowerCase().replace(/_/g, '-');
      return slugClean === targetClean;
    });

    if (!earned) return null;
    
    if (earned.awardedAt) {
      if (typeof earned.awardedAt.toDate === 'function') {
        return earned.awardedAt.toDate().toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US');
      }
      return new Date(earned.awardedAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US');
    }
    return 'Awarded';
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {ALL_BADGES.map((badge) => {
        const awardedDate = getAwardedDate(badge.slug);
        const isEarned = !!awardedDate;
        const Icon = badge.icon;

        return (
          <div
            key={badge.slug}
            className={`relative group flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300 ${
              isEarned
                ? `${badge.colorClass} hover:shadow-lg hover:-translate-y-1`
                : 'bg-bg-secondary/40 border-text-secondary/5 opacity-40 grayscale'
            }`}
          >
            <div className={`p-3 rounded-xl border ${isEarned ? 'bg-bg-card border-current/10' : 'bg-bg-secondary border-text-secondary/10'}`}>
              <Icon className="h-8 w-8" />
            </div>
            
            <h4 className="mt-3 text-xs font-bold text-text-primary tracking-tight">
              {badge.name[locale === 'en' ? 'en' : 'th']}
            </h4>
            
            <p className="mt-1 text-[10px] text-text-secondary font-medium">
              {isEarned 
                ? (locale === 'th' ? 'ได้รับแล้ว' : 'Unlocked') 
                : (locale === 'th' ? 'ยังไม่ได้ล็อก' : 'Locked')}
            </p>

            {/* Premium CSS Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 p-3 bg-bg-card border border-text-secondary/15 rounded-xl shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-left">
              <h5 className="text-xs font-bold text-text-primary">
                {badge.name[locale === 'en' ? 'en' : 'th']}
              </h5>
              <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">
                {badge.description[locale === 'en' ? 'en' : 'th']}
              </p>
              {isEarned && (
                <p className="mt-2 text-[10px] font-bold text-accent">
                  {locale === 'th' ? `ได้รับเมื่อ: ${awardedDate}` : `Awarded on: ${awardedDate}`}
                </p>
              )}
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-bg-card border-r border-b border-text-secondary/15 rotate-45 -translate-y-[5px]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
