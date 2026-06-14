import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { Link } from '@/i18n/routing';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { FollowButton } from '@/components/social/FollowButton';
import { ReputationBadge } from '@/components/software/ReputationBadge';
import { BadgeGrid } from '@/components/software/BadgeGrid';
import { SoftwareCard } from '@/components/software/SoftwareCard';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { fetchGithubProfile } from '@/lib/github/profile';
import { SoftwareItem } from '@/lib/software/types';

interface DeveloperProfilePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

interface DeveloperDocData {
  displayName?: string;
  slug?: string;
  bio?: string;
  skills?: string[];
  githubUsername?: string;
  githubProfile?: Awaited<ReturnType<typeof fetchGithubProfile>> | null;
  websiteURL?: string;
  followerCount?: number;
  reputationScore?: number;
  verificationStatus?: string;
  coverURL?: string;
  socialLinks?: Record<string, string | null | undefined>;
}

interface DeveloperProfileData {
  id: string;
  locale: string;
  slug: string;
  displayName: string;
  bio: string;
  skills: string[];
  githubUsername: string;
  githubProfile: Awaited<ReturnType<typeof fetchGithubProfile>> | null;
  websiteURL: string;
  followerCount: number;
  reputationScore: number;
  verificationStatus: string;
  coverURL: string;
  avatarURL: string;
  socialLinks: {
    linkedin?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    youtube?: string | null;
  };
  badges: Array<{
    badgeId: string;
    awardedAt: string | null;
  }>;
  software: SoftwareItem[];
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    publishedAtIso: string | null;
  }>;
  totals: {
    downloads: number;
    software: number;
    articles: number;
  };
}

export const revalidate = 600;

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://jariyahsoft.com').replace(/\/$/, '');
}

function toIsoTimestamp(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

async function loadDeveloperProfile(locale: string, slug: string): Promise<DeveloperProfileData> {
  let developerId = '';
  let developerData: DeveloperDocData | null = null;

  const developerQuery = await adminDb
    .collection('developers')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (!developerQuery.empty) {
    const matchedDoc = developerQuery.docs[0];
    if (!matchedDoc) {
      notFound();
    }

    developerId = matchedDoc.id;
    developerData = matchedDoc.data() as DeveloperDocData;
  } else {
    const developerDoc = await adminDb.collection('developers').doc(slug).get();
    if (developerDoc.exists) {
      const data = (developerDoc.data() || {}) as DeveloperDocData;
      if (data.slug) {
        permanentRedirect(`/${locale}/developers/${data.slug}`);
      }

      developerId = developerDoc.id;
      developerData = data;
    } else {
      const redirectDoc = await adminDb.collection('developer_slug_redirects').doc(slug).get();
      if (redirectDoc.exists) {
        const redirectData = redirectDoc.data();
        if (redirectData?.newSlug) {
          permanentRedirect(`/${locale}/developers/${redirectData.newSlug}`);
        }
      }

      notFound();
    }
  }

  const userDoc = await adminDb.collection('users').doc(developerId).get();
  const userData = userDoc.data() || {};

  const displayName = developerData?.displayName || userData.displayName || 'Developer';
  const bio = developerData?.bio || '';
  const skills = Array.isArray(developerData?.skills) ? developerData.skills : [];
  const githubUsername = developerData?.githubUsername || '';
  const githubProfile = githubUsername && developerData?.githubProfile ? developerData.githubProfile : null;
  const websiteURL = developerData?.websiteURL || '';
  const followerCount = Number(developerData?.followerCount ?? 0);
  const reputationScore = Number(developerData?.reputationScore ?? 0);
  const verificationStatus = developerData?.verificationStatus || 'unverified';
  const socialLinks = developerData?.socialLinks || {};

  const [badgesSnap, softwareSnap, articlesSnap] = await Promise.all([
    adminDb.collection('developer_badges').where('developerId', '==', developerId).get(),
    adminDb
      .collection('software')
      .where('ownerId', '==', developerId)
      .where('status', '==', 'published')
      .get(),
    adminDb
      .collection('articles')
      .where('authorId', '==', developerId)
      .where('status', '==', 'published')
      .get(),
  ]);

  const badges = badgesSnap.docs.map((doc) => ({
    badgeId: String(doc.data().badgeId || ''),
    awardedAt: toIsoTimestamp(doc.data().awardedAt),
  }));

  const software = softwareSnap.docs.map((doc) => {
    const sw = doc.data();
    return {
      id: doc.id,
      ownerId: developerId,
      name: sw.name || 'Untitled software',
      slug: sw.slug || doc.id,
      developerName: displayName,
      shortDescription: sw.shortDescription || '',
      description: sw.description || '',
      categoryId: sw.categoryId || 'productivity',
      categoryName: sw.categoryName || 'General',
      tagIds: Array.isArray(sw.tagIds) ? sw.tagIds : [],
      platforms: Array.isArray(sw.platforms) ? sw.platforms : ['web'],
      licenseId: sw.licenseId || 'MIT',
      licenseName: sw.licenseName || 'MIT',
      logoPath: sw.logoPath || '',
      screenshotPaths: Array.isArray(sw.screenshotPaths) ? sw.screenshotPaths : [],
      repositoryURL: sw.repositoryURL || '',
      websiteURL: sw.websiteURL || '',
      downloadURL: sw.downloadURL || '',
      fileSize: sw.fileSize || '',
      latestVersion: sw.latestVersion || '',
      releaseNotes: sw.releaseNotes || '',
      status: sw.status || 'published',
      ratingAverage: Number(sw.ratingAverage ?? 0),
      ratingCount: Number(sw.ratingCount ?? 0),
      downloadCount: Number(sw.downloadCount ?? 0),
      certifications: Array.isArray(sw.certifications) ? sw.certifications : [],
      license: sw.license || sw.licenseName || 'MIT',
      publishedAt: toIsoTimestamp(sw.publishedAt) || undefined,
      updatedAt: toIsoTimestamp(sw.updatedAt) || undefined,
      rejectionReason: sw.rejectionReason || '',
      etag: sw.etag || '',
    } satisfies SoftwareItem;
  });

  const articles = articlesSnap.docs.map((doc) => {
    const article = doc.data();
    return {
      id: doc.id,
      title: article.title || 'Untitled article',
      slug: article.slug || doc.id,
      excerpt: article.excerpt || '',
      publishedAtIso: toIsoTimestamp(article.publishedAt),
    };
  });

  const totals = {
    software: software.length,
    articles: articles.length,
    downloads: software.reduce((sum, item) => sum + Number(item.downloadCount ?? 0), 0),
  };

  return {
    id: developerId,
    locale,
    slug: developerData?.slug || slug,
    displayName,
    bio,
    skills,
    githubUsername,
    githubProfile,
    websiteURL,
    followerCount,
    reputationScore,
    verificationStatus,
    coverURL: developerData?.coverURL || '',
    avatarURL: userData.photoURL || '',
    socialLinks: {
      linkedin: socialLinks.linkedin || null,
      twitter: socialLinks.twitter || null,
      facebook: socialLinks.facebook || null,
      youtube: socialLinks.youtube || null,
    },
    badges,
    software,
    articles,
    totals,
  };
}

export async function generateMetadata({ params }: DeveloperProfilePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const profile = await loadDeveloperProfile(locale, slug);
  const isEnglish = locale === 'en';
  const title = `${profile.displayName}${profile.githubUsername ? ` (@${profile.githubUsername})` : ''}`;
  const description =
    profile.bio ||
    (isEnglish
      ? `${profile.displayName}'s public developer profile on JariyahSoft.`
      : `โปรไฟล์นักพัฒนาสาธารณะของ ${profile.displayName} บน JariyahSoft`);

  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    alternates: {
      canonical: `/${locale}/developers/${profile.slug}`,
    },
    openGraph: {
      type: 'profile',
      url: `/${locale}/developers/${profile.slug}`,
      title,
      description,
      images: profile.coverURL ? [{ url: profile.coverURL }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function DeveloperProfilePage({ params }: DeveloperProfilePageProps) {
  const { locale, slug } = await params;
  const profile = await loadDeveloperProfile(locale, slug);
  const isVerified = profile.verificationStatus === 'verified';
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.displayName,
    description: profile.bio || undefined,
    url: `${siteUrl()}/${locale}/developers/${profile.slug}`,
    image: profile.avatarURL || undefined,
    knowsAbout: profile.skills.length > 0 ? profile.skills : undefined,
    sameAs: [
      profile.githubUsername ? `https://github.com/${profile.githubUsername}` : null,
      profile.websiteURL ? profile.websiteURL : null,
      profile.socialLinks.linkedin,
      profile.socialLinks.twitter,
      profile.socialLinks.facebook,
      profile.socialLinks.youtube,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema).replace(/</g, '\\u003c'),
        }}
      />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_32rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-text-secondary/10 bg-bg-card shadow-sm">
            <div className="relative h-44 w-full overflow-hidden sm:h-56">
              {profile.coverURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.coverURL} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 opacity-80" />
              )}
            </div>

            <div className="relative px-6 pb-6 pt-16 md:px-8 md:pb-8">
              <div className="absolute -top-16 left-6 shrink-0 sm:-top-20 sm:left-8">
                <div className="relative shrink-0">
                  <Avatar
                    name={profile.displayName}
                    src={profile.avatarURL || undefined}
                    size="xl"
                    className="h-28 w-28 rounded-2xl bg-bg-card shadow-md ring-4 ring-bg-card"
                  />
                  {isVerified && (
                    <span
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg-card bg-accent text-white shadow-sm"
                      title="Verified Developer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-black tracking-tight text-text-primary">
                        {profile.displayName}
                      </h1>
                      <ReputationBadge score={profile.reputationScore} size="md" />
                    </div>

                    <p className="text-sm font-mono text-text-secondary">@{profile.slug}</p>
                  </div>

                  {profile.bio && (
                    <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                    {profile.githubUsername && (
                      <a
                        href={`https://github.com/${profile.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:text-text-primary"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        github.com/{profile.githubUsername}
                      </a>
                    )}
                    {profile.websiteURL && (
                      <a
                        href={profile.websiteURL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:text-accent"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {profile.websiteURL.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                    )}

                    {profile.socialLinks.linkedin && (
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:text-blue-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                    {profile.socialLinks.twitter && (
                      <a
                        href={profile.socialLinks.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:text-sky-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Twitter/X
                      </a>
                    )}
                    {profile.socialLinks.facebook && (
                      <a
                        href={profile.socialLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:text-blue-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Facebook
                      </a>
                    )}
                    {profile.socialLinks.youtube && (
                      <a
                        href={profile.socialLinks.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:text-red-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        YouTube
                      </a>
                    )}
                  </div>

                  {profile.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                      {profile.skills.map((skill: string) => (
                        <Badge key={skill} variant="default" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-row items-center justify-center gap-5 border-t border-text-secondary/5 pt-6 md:flex-col md:items-end md:border-t-0 md:pt-0">
                  <div className="flex items-center gap-6 text-center md:text-right">
                    <div>
                      <div className="text-2xl font-black text-text-primary">
                        {profile.reputationScore.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Reputation
                      </div>
                    </div>
                    <div className="h-8 w-px bg-text-secondary/15" />
                    <div>
                      <div className="text-2xl font-black text-text-primary">
                        {profile.followerCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Followers
                      </div>
                    </div>
                  </div>

                  <FollowButton
                    targetType="developer"
                    targetId={profile.id}
                    initialFollowCount={profile.followerCount}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <span className="block text-2xl font-black text-text-primary">
                {profile.totals.software}
              </span>
              <span className="text-xs text-text-secondary">
                {locale === 'th' ? 'ผลงานซอฟต์แวร์' : 'Software Products'}
              </span>
            </div>
            <div className="text-center sm:border-l sm:border-r sm:border-text-secondary/10">
              <span className="block text-2xl font-black text-text-primary">
                {profile.totals.articles}
              </span>
              <span className="text-xs text-text-secondary">
                {locale === 'th' ? 'บทความที่เขียน' : 'Articles Published'}
              </span>
            </div>
            <div className="text-center lg:border-r lg:border-text-secondary/10">
              <span className="block text-2xl font-black text-text-primary">
                {profile.totals.downloads.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary">
                {locale === 'th' ? 'ยอดดาวน์โหลดรวม' : 'Total Downloads'}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black text-text-primary">
                {profile.githubProfile?.followers?.toLocaleString() ?? '-'}
              </span>
              <span className="text-xs text-text-secondary">
                {locale === 'th' ? 'ผู้ติดตามบน GitHub' : 'GitHub Followers'}
              </span>
            </div>
          </section>

          {profile.githubProfile && (
            <section className="space-y-4 rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    {locale === 'th' ? 'GitHub Connector' : 'GitHub Connector'}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {locale === 'th'
                      ? 'ข้อมูลสาธารณะจาก GitHub API ที่ยืนยันแล้ว'
                      : 'Verified public data from the GitHub API.'}
                  </p>
                </div>
                <Badge variant="success" size="md">
                  Verified
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-wider text-text-secondary">Repos</p>
                  <p className="mt-2 text-2xl font-black text-text-primary">
                    {profile.githubProfile.publicRepos.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-wider text-text-secondary">Followers</p>
                  <p className="mt-2 text-2xl font-black text-text-primary">
                    {profile.githubProfile.followers.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-wider text-text-secondary">Following</p>
                  <p className="mt-2 text-2xl font-black text-text-primary">
                    {profile.githubProfile.following.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-wider text-text-secondary">Verified at</p>
                  <p className="mt-2 text-xs font-semibold text-text-primary">
                    {new Date(profile.githubProfile.verifiedAt).toLocaleString(
                      locale === 'th' ? 'th-TH' : 'en-US'
                    )}
                  </p>
                </div>
              </div>

              {profile.githubProfile.repositories.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-text-primary">
                    {locale === 'th' ? 'Repository suggestions' : 'Repository suggestions'}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {profile.githubProfile.repositories.map((repo) => (
                      <a
                        key={repo.htmlUrl}
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4 transition-all hover:border-accent/25 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-text-primary">{repo.name}</p>
                          <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                              {repo.description
                                ? repo.description
                                : locale === 'th'
                                  ? 'ไม่มีคำอธิบาย'
                                  : 'No description provided'}
                          </p>
                        </div>
                          <ExternalLink className="h-4 w-4 shrink-0 text-text-secondary" />
                        </div>
                        {repo.language && (
                          <p className="mt-3 text-[11px] uppercase tracking-wider text-text-secondary">
                            {repo.language}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {locale === 'th' ? 'เหรียญรางวัลนักพัฒนา' : 'Developer Badges'}
              </h2>
              <p className="text-xs text-text-secondary">
                {locale === 'th'
                  ? 'เหรียญรางวัลพิเศษที่ได้รับจากการร่วมสร้างและเผยแพร่ผลงาน'
                  : 'Badges earned through community and content contributions.'}
              </p>
            </div>
            <BadgeGrid earnedBadges={profile.badges} />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {locale === 'th' ? 'ผลงานซอฟต์แวร์' : 'Published Software'}
              </h2>
              <p className="text-xs text-text-secondary">
                {locale === 'th'
                  ? `ซอฟต์แวร์ที่พัฒนาโดย ${profile.displayName}`
                  : `Software published by ${profile.displayName}`}
              </p>
            </div>

            {profile.software.length === 0 ? (
              <div className="rounded-2xl border border-text-secondary/5 bg-bg-card/50 p-12 text-center text-sm text-text-secondary">
                {locale === 'th'
                  ? 'ยังไม่มีผลงานซอฟต์แวร์ที่เผยแพร่'
                  : 'No published software products yet.'}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {profile.software.map((software) => (
                  <SoftwareCard key={software.id} software={software} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {locale === 'th' ? 'บทความและองค์ความรู้' : 'Articles & Contributions'}
              </h2>
              <p className="text-xs text-text-secondary">
                {locale === 'th'
                  ? `บทความที่เขียนและเผยแพร่โดย ${profile.displayName}`
                  : `Knowledge base articles published by ${profile.displayName}`}
              </p>
            </div>

            {profile.articles.length === 0 ? (
              <div className="rounded-2xl border border-text-secondary/5 bg-bg-card/50 p-12 text-center text-sm text-text-secondary">
                {locale === 'th' ? 'ยังไม่มีบทความที่เผยแพร่' : 'No published articles yet.'}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.articles.map((article) => (
                  <div
                    key={article.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-text-secondary/10 bg-bg-card p-5 transition-all duration-300 hover:border-accent/20 hover:shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-medium text-text-secondary">
                        <BookOpen className="h-3.5 w-3.5 text-accent" />
                        {article.publishedAtIso
                          ? new Date(article.publishedAtIso).toLocaleDateString(
                              locale === 'th' ? 'th-TH' : 'en-US'
                            )
                          : 'Draft'}
                      </div>

                      <h3 className="font-bold text-text-primary transition-colors duration-200 group-hover:text-accent line-clamp-1">
                        <Link href={`/knowledge/${article.slug}`}>{article.title}</Link>
                      </h3>
                      <p className="text-xs leading-relaxed text-text-secondary line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
