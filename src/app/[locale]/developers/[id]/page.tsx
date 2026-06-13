import React from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { adminDb } from '@/lib/firebase/admin';
import { Globe, Star, Download, Users, Mail, CheckCircle2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { FollowButton } from '@/components/social/FollowButton';
import { ReputationBadge } from '@/components/software/ReputationBadge';
import { BadgeGrid } from '@/components/software/BadgeGrid';

interface DeveloperProfilePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export const revalidate = 60; // Cache for 60 seconds

export default async function DeveloperProfilePage({ params }: DeveloperProfilePageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const tSoftware = await getTranslations({ locale, namespace: 'software' });

  // 1. Fetch Developer document
  const devDoc = await adminDb.collection('developers').doc(id).get();
  const devData = devDoc.data();

  // 2. Fetch User document (fallback / main user metadata)
  const userDoc = await adminDb.collection('users').doc(id).get();
  if (!userDoc.exists && !devDoc.exists) {
    notFound();
  }
  const userData = userDoc.data() || {};

  // Extract profiles fields
  const displayName = devData?.displayName || userData.displayName || 'User';
  const bio = devData?.bio || '';
  const skills = Array.isArray(devData?.skills) ? devData.skills : [];
  const githubUsername = devData?.githubUsername || '';
  const websiteURL = devData?.websiteURL || '';
  const followerCount = Number(devData?.followerCount ?? 0);
  const reputationScore = Number(devData?.reputationScore ?? 0);
  const isVerified = devData?.verificationStatus === 'verified';

  // 3. Fetch Earned Badges
  const badgesSnap = await adminDb.collection('developer_badges')
    .where('developerId', '==', id)
    .get();
  
  const earnedBadges = badgesSnap.docs.map(doc => ({
    badgeId: doc.data().badgeId,
    awardedAt: doc.data().awardedAt
  }));

  // 4. Fetch Published Software
  const softwareSnap = await adminDb.collection('software')
    .where('ownerId', '==', id)
    .where('status', '==', 'published')
    .get();

  const softwareList = softwareSnap.docs.map(doc => {
    const sw = doc.data();
    return {
      id: doc.id,
      name: sw.name || 'Untitled software',
      slug: sw.slug || doc.id,
      shortDescription: sw.shortDescription || '',
      logoPath: sw.logoPath || '',
      categoryName: sw.categoryName || 'General',
      ratingAverage: Number(sw.ratingAverage ?? 0),
      ratingCount: Number(sw.ratingCount ?? 0),
      downloadCount: Number(sw.downloadCount ?? 0)
    };
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_32rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Developer Header Profile Card */}
        <section className="relative overflow-hidden rounded-3xl border border-text-secondary/10 bg-bg-card p-6 md:p-8 shadow-sm">
          {/* Subtle background decoration */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <Avatar 
                  name={displayName} 
                  src={userData.photoURL || undefined}
                  size="xl" 
                  className="h-24 w-24 rounded-2xl ring-4 ring-bg-secondary" 
                />
                {isVerified && (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white border-2 border-bg-card shadow-sm" title="Verified Developer">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                )}
              </div>
              
              <div className="text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-3xl font-black tracking-tight text-text-primary">
                    {displayName}
                  </h1>
                  <ReputationBadge score={reputationScore} size="md" />
                </div>
                
                {bio && (
                  <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
                    {bio}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-text-secondary">
                  {userData.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {userData.email}
                    </span>
                  )}
                  {githubUsername && (
                    <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-text-primary transition-colors">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                      github.com/{githubUsername}
                    </a>
                  )}
                  {websiteURL && (
                    <a href={websiteURL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent transition-colors">
                      <Globe className="h-3.5 w-3.5" />
                      {websiteURL.replace(/(^\w+:|^)\/\//, '')}
                    </a>
                  )}
                </div>

                {/* Skills tags */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="default" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Follow/Reputation Quick Stats */}
            <div className="flex flex-row md:flex-col items-center justify-center md:items-end gap-5 border-t border-text-secondary/5 pt-6 md:border-t-0 md:pt-0">
              <div className="flex items-center gap-6 text-center md:text-right">
                <div>
                  <div className="text-2xl font-black text-text-primary">{reputationScore.toLocaleString()}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Reputation</div>
                </div>
                <div className="h-8 w-px bg-text-secondary/15 md:hidden" />
                <div>
                  <div className="text-2xl font-black text-text-primary">{followerCount.toLocaleString()}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Followers</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FollowButton targetType="developer" targetId={id} initialFollowCount={followerCount} />
              </div>
            </div>
          </div>
        </section>

        {/* Badges Earned Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {locale === 'th' ? 'เหรียญรางวัลนักพัฒนา' : 'Developer Badges'}
            </h2>
            <p className="text-xs text-text-secondary">
              {locale === 'th' ? 'เหรียญรางวัลพิเศษที่ได้รับจากการร่วมสร้างและเผยแพร่ผลงาน' : 'Badges earned through community and content contributions.'}
            </p>
          </div>
          <BadgeGrid earnedBadges={earnedBadges} />
        </section>

        {/* Published Software Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {locale === 'th' ? 'ผลงานซอฟต์แวร์' : 'Published Software'}
            </h2>
            <p className="text-xs text-text-secondary">
              {locale === 'th' ? `ซอฟต์แวร์ที่พัฒนาโดย ${displayName}` : `Software published by ${displayName}`}
            </p>
          </div>

          {softwareList.length === 0 ? (
            <div className="rounded-2xl border border-text-secondary/5 bg-bg-card/50 p-12 text-center text-sm text-text-secondary">
              {locale === 'th' ? 'ยังไม่มีผลงานซอฟต์แวร์ที่เผยแพร่' : 'No published software products yet.'}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {softwareList.map((sw) => (
                <div key={sw.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-text-secondary/10 bg-bg-card p-5 hover:border-accent/20 hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/10 bg-accent/5 text-lg font-black text-accent group-hover:scale-105 transition-transform duration-200">
                        {sw.logoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sw.logoPath} alt="" className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          sw.name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <Badge variant="info">{sw.categoryName}</Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors duration-200 line-clamp-1">
                        <Link href={`/software/${sw.slug}`}>{sw.name}</Link>
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {sw.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-text-secondary/5 pt-4 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {sw.ratingAverage.toFixed(1)} ({sw.ratingCount})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {sw.downloadCount.toLocaleString()} {tSoftware('detail.visitWebsite') ? 'DL' : 'downloads'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
