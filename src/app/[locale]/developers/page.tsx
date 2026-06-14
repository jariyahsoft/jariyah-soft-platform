import React from 'react';
import { getTranslations } from 'next-intl/server';
import { adminDb } from '@/lib/firebase/admin';
import { Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DeveloperDirectoryClient } from '@/components/developers/DeveloperDirectoryClient';

interface DevelopersPageProps {
  params: Promise<{ locale: string }>;
}

export const revalidate = 600; // Cache for 10 minutes

export default async function DevelopersDirectoryPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  // 1. Fetch developers sorted by reputationScore desc
  const devSnap = await adminDb.collection('developers')
    .orderBy('reputationScore', 'desc')
    .limit(100)
    .get();

  // 2. Fetch all published software to map softwareCount to ownerId
  const softwareSnap = await adminDb.collection('software')
    .where('status', '==', 'published')
    .get();

  const softwareCounts: Record<string, number> = {};
  softwareSnap.docs.forEach((doc) => {
    const data = doc.data();
    const ownerId = data.ownerId;
    if (ownerId) {
      softwareCounts[ownerId] = (softwareCounts[ownerId] || 0) + 1;
    }
  });

  const developers = devSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: data.slug || doc.id,
      displayName: data.displayName || 'Independent Developer',
      bio: data.bio || '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      followerCount: Number(data.followerCount ?? 0),
      reputationScore: Number(data.reputationScore ?? 0),
      verificationStatus: data.verificationStatus || 'unverified',
      softwareCount: softwareCounts[doc.id] || 0
    };
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent_35rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Page Header */}
        <section className="space-y-2 border-b border-text-secondary/10 pb-6">
          <Badge variant="info" size="md" className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            <span>{locale === 'th' ? 'ทำเนียบอันดับ' : 'Leaderboard'}</span>
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

        {/* Client-Side Interactive List */}
        <DeveloperDirectoryClient initialDevelopers={developers} locale={locale} />

      </div>
    </main>
  );
}
