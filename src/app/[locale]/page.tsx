import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  ChartColumnBig,
  Download,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { LandingCarousel } from '@/components/landing/LandingCarousel';
import { LandingCounter } from '@/components/landing/LandingCounters';
import { SoftwareCard } from '@/components/software/SoftwareCard';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Link } from '@/i18n/routing';
import { getLandingData } from '@/lib/landing/data';

export const revalidate = 60;

interface LandingPageProps {
  params: Promise<{ locale: 'th' | 'en' }>;
}

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const landing = await getTranslations({ locale, namespace: 'landing' });
  const canonical = `/${locale}`;
  const ogImagePath = `/${locale}/opengraph-image`;

  return {
    metadataBase: new URL('https://jariyah.dev'),
    title: landing('meta.title'),
    description: landing('meta.description'),
    alternates: {
      canonical,
      languages: {
        th: '/th',
        en: '/en',
      },
    },
    openGraph: {
      title: landing('meta.title'),
      description: landing('meta.description'),
      url: `https://jariyah.dev${canonical}`,
      siteName: landing('meta.siteName'),
      type: 'website',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      alternateLocale: locale === 'th' ? 'en_US' : 'th_TH',
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: landing('meta.title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: landing('meta.title'),
      description: landing('meta.description'),
      images: [ogImagePath],
    },
    other: {
      'theme-color': '#0ea5e9',
    },
  };
}

function JsonLd({ locale }: { locale: 'th' | 'en' }) {
  const isEn = locale === 'en';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: isEn ? 'JariyahSoft' : 'จริยะซอฟต์',
    url: `https://jariyah.dev/${locale}`,
    description: isEn
      ? 'Discover trusted Thai software and knowledge.'
      : 'ค้นพบซอฟต์แวร์ไทยและองค์ความรู้ที่เชื่อถือได้',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://jariyah.dev/{locale}/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
  );
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const landing = await getTranslations({ locale, namespace: 'landing' });
  const { stats, trendingSoftware, recentArticles } = await getLandingData();

  const statCards = [
    {
      icon: <Download className="h-5 w-5" />,
      label: landing('stats.software'),
      value: stats.softwareCount,
      suffix: '+',
      accent: 'from-sky-500/20 to-cyan-400/10',
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: landing('stats.developers'),
      value: stats.developerCount,
      suffix: '+',
      accent: 'from-emerald-500/20 to-lime-400/10',
    },
    {
      icon: <BookOpenText className="h-5 w-5" />,
      label: landing('stats.articles'),
      value: stats.articleCount,
      suffix: '+',
      accent: 'from-amber-500/20 to-orange-400/10',
    },
    {
      icon: <ChartColumnBig className="h-5 w-5" />,
      label: landing('stats.downloads'),
      value: stats.downloadCount,
      suffix: '+',
      accent: 'from-violet-500/20 to-fuchsia-400/10',
    },
  ];

  return (
    <main className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_22rem)]">
      <JsonLd locale={locale} />

      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[640px] pointer-events-none bg-[linear-gradient(180deg,rgba(8,15,26,0.92),rgba(8,15,26,0.65),transparent)]" />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-text-secondary/10 bg-bg-card/85 px-6 py-10 shadow-2xl shadow-black/10 backdrop-blur md:px-10 md:py-14">
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
              <Sparkles className="h-4 w-4" />
              {landing('badge')}
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-text-primary md:text-6xl">
              {landing('headline')}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-text-secondary md:text-xl">
              {landing('subheadline')}
            </p>

            <div className="mx-auto mt-8 max-w-3xl">
              <SearchBar placeholder={landing('searchPlaceholder')} className="w-full" />
            </div>

            <div className="mx-auto mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/software"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-hover"
              >
                {landing('primaryCta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-text-secondary/20 bg-bg-secondary/60 px-6 py-3 text-sm font-bold text-text-primary transition hover:border-accent/30 hover:bg-accent/5"
              >
                {landing('secondaryCta')}
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-3xl border border-text-secondary/10 bg-gradient-to-br ${card.accent} bg-bg-card/85 p-5 shadow-sm backdrop-blur`}
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl border border-text-secondary/10 bg-bg-primary/70 p-3 text-accent">
                  {card.icon}
                </div>
                <BadgeCheck className="h-5 w-5 text-success" />
              </div>
              <div className="mt-5 text-3xl font-black text-text-primary md:text-4xl">
                <LandingCounter value={card.value} suffix={card.suffix} locale={locale} />
              </div>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                {card.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Badge variant="info">{landing('trending.eyebrow')}</Badge>
              <h2 className="mt-3 text-3xl font-black text-text-primary">{landing('trending.title')}</h2>
            </div>
            <Link href="/software" className="hidden text-sm font-semibold text-accent hover:underline sm:inline-flex">
              {landing('trending.viewAll')}
            </Link>
          </div>

          <div className="mt-6">
            <LandingCarousel className="pb-2">
              {trendingSoftware.map((software) => (
                <div key={software.id} className="w-[320px] sm:w-[360px]">
                  <SoftwareCard software={software} />
                </div>
              ))}
            </LandingCarousel>
          </div>

          <div className="mt-4 sm:hidden">
            <Link href="/software" className="inline-flex items-center text-sm font-semibold text-accent">
              {landing('trending.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Badge variant="info">{landing('articles.eyebrow')}</Badge>
              <h2 className="mt-3 text-3xl font-black text-text-primary">{landing('articles.title')}</h2>
            </div>
            <Link href="/knowledge" className="hidden text-sm font-semibold text-accent hover:underline sm:inline-flex">
              {landing('articles.viewAll')}
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          <div className="mt-4 sm:hidden">
            <Link href="/knowledge" className="inline-flex items-center text-sm font-semibold text-accent">
              {landing('articles.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(16,185,129,0.1),rgba(245,158,11,0.12))] p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Badge variant="success">{landing('cta.eyebrow')}</Badge>
              <h2 className="mt-4 text-3xl font-black text-text-primary md:text-4xl">{landing('cta.title')}</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-text-secondary">
                {landing('cta.description')}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-text-primary">
                {landing.raw('cta.benefits').map((item: string) => (
                  <li key={item} className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-text-primary px-6 py-3 text-sm font-bold text-bg-primary transition hover:bg-white"
                >
                  {landing('cta.primaryCta')}
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
            <div className="rounded-3xl border border-white/20 bg-bg-card/80 p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <SearchIcon className="h-5 w-5 text-accent" />
                  <h3 className="font-bold text-text-primary">{landing('cta.fastDiscoveryTitle')}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {landing('cta.fastDiscoveryDescription')}
                </p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-bg-card/80 p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-success" />
                  <h3 className="font-bold text-text-primary">{landing('cta.moderationTitle')}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {landing('cta.moderationDescription')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
