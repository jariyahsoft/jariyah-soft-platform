import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { adminDb } from '@/lib/firebase/admin';
import { Users, ChevronRight, Award, Trophy, ShieldAlert } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ReputationBadge } from '@/components/software/ReputationBadge';

interface DevelopersPageProps {
  params: Promise<{ locale: string }>;
}

export const revalidate = 60; // Cache for 60 seconds

export default async function DevelopersLeaderboardPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  // Fetch developers sorted by reputationScore desc
  const devSnap = await adminDb.collection('developers')
    .orderBy('reputationScore', 'desc')
    .limit(50)
    .get();

  const developers = devSnap.docs.map((doc, index) => {
    const data = doc.data();
    return {
      id: doc.id,
      rank: index + 1,
      displayName: data.displayName || 'Independent Developer',
      bio: data.bio || '',
      followerCount: Number(data.followerCount ?? 0),
      reputationScore: Number(data.reputationScore ?? 0),
      verificationStatus: data.verificationStatus || 'unverified'
    };
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent_35rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Page Header */}
        <section className="space-y-2 border-b border-text-secondary/10 pb-6">
          <Badge variant="info" size="md" className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            <span>Leaderboard</span>
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-text-primary md:text-5xl">
            {locale === 'th' ? 'ทำเนียบนักพัฒนา' : 'Developer Directory'}
          </h1>
          <p className="max-w-2xl text-sm text-text-secondary">
            {locale === 'th'
              ? 'พบกับเหล่านักพัฒนาที่ร่วมเผยแพร่ซอฟต์แวร์และส่งเสริมชุมชนดิจิทัล จัดลำดับความกระตือรือร้นด้วยคะแนน Reputation'
              : 'Meet our active developers sharing software and contributing knowledge, ranked by reputation points.'}
          </p>
        </section>

        {/* Developers List/Grid */}
        {developers.length === 0 ? (
          <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-16 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-text-secondary/10 text-text-secondary">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">
              {locale === 'th' ? 'ไม่พบข้อมูลนักพัฒนา' : 'No Developers Found'}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              {locale === 'th'
                ? 'ยังไม่มีนักพัฒนาที่ลงทะเบียนในระบบ หรือระบบประมวลผลข้อมูลกำลังเริ่มการทำดัชนี'
                : 'No developer profiles have been index yet. Try onboarding a new developer account.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {developers.map((dev) => {
              const rankColor = dev.rank === 1 
                ? 'border-warning/30 ring-1 ring-warning/10'
                : dev.rank === 2 
                ? 'border-slate-400/30'
                : dev.rank === 3 
                ? 'border-amber-600/30'
                : 'border-text-secondary/10';

              const medalColor = dev.rank === 1
                ? 'text-warning'
                : dev.rank === 2
                ? 'text-slate-400'
                : dev.rank === 3
                ? 'text-amber-700'
                : 'text-text-secondary';

              return (
                <div 
                  key={dev.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-bg-card p-5 hover:border-accent/20 hover:shadow-lg transition-all duration-300 ${rankColor}`}
                >
                  {/* Rank Spotlight */}
                  <div className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg bg-bg-secondary text-xs font-black shadow-sm">
                    <span className={medalColor}>#{dev.rank}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={dev.displayName} size="md" className="rounded-xl" />
                      <div>
                        <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors duration-200 line-clamp-1">
                          {dev.displayName}
                        </h3>
                        <div className="mt-1">
                          <ReputationBadge score={dev.reputationScore} showLabel={false} />
                        </div>
                      </div>
                    </div>

                    {dev.bio && (
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {dev.bio}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-text-secondary/5 pt-4 text-xs">
                    <div className="flex gap-4 text-text-secondary font-medium">
                      <span>{dev.followerCount.toLocaleString()} {locale === 'th' ? 'ผู้ติดตาม' : 'followers'}</span>
                      <span>{dev.reputationScore.toLocaleString()} {locale === 'th' ? 'คะแนน' : 'points'}</span>
                    </div>

                    <Link href={`/developers/${dev.id}`} className="inline-flex items-center font-bold text-accent group-hover:translate-x-0.5 transition-transform duration-200">
                      {locale === 'th' ? 'ดูโปรไฟล์' : 'View profile'}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
