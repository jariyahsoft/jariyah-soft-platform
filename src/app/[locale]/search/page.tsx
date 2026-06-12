import type { Metadata } from 'next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { SOFTWARE_CATEGORIES } from '@/lib/software/types';
import { ARTICLE_CATEGORIES } from '@/lib/articles/types';

export const dynamic = 'force-dynamic';

interface SearchResultsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    platforms?: string;
    license?: string;
    language?: string;
    type?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchResultsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q ?? '';

  return {
    title: `Search: ${q} | Jariyah Soft`,
    description: `Search results for "${q}" on Jariyah Soft`,
  };
}

function filterHref(base: Record<string, string | undefined>, next: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...base, ...next })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/search?q=${params.get('q') || ''}${query ? `&${query}` : ''}`;
}

export default async function SearchResultsPage({ searchParams }: SearchResultsPageProps) {
  const params = await searchParams;
  const q = params.q ?? '';
  const activeType = params.type ?? 'all';
  const activeCategory = params.category;
  const activeLanguage = params.language;
  const activeSort = params.sort ?? 'relevance';

  let items: any[] = [];
  let error: string | null = null;

  if (q) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/v1/search?q=${encodeURIComponent(q)}&limit=30`);
      if (response.ok) {
        const data = await response.json();
        items = data.data?.items ?? [];
      }
    } catch (e) {
      error = 'Search unavailable';
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_center,rgba(0,120,255,0.14),transparent_34rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="info">Search</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Search results</h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                {q ? `Results for "${q}"` : 'Enter a search query to begin'}
              </p>
            </div>
            {error && (
              <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                Search service is currently unavailable. Showing fallback results.
              </div>
            )}
          </div>
        </section>

        {q ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
                <div className="mb-4 flex items-center gap-2 font-bold">
                  <SlidersHorizontal className="h-5 w-5 text-accent" />
                  Filters
                </div>
                <div className="space-y-5">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                      Content Type
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['all', 'software', 'articles'].map((type) => (
                        <Link
                          key={type}
                          href={filterHref({ type })}
                        >
                          <button
                            type="button"
                            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                              activeType === type ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {type === 'all' ? 'All' : type === 'software' ? 'Software' : 'Articles'}
                          </button>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                      Category
                    </h2>
                    <div className="mt-3 space-y-2">
                      {SOFTWARE_CATEGORIES.map((category) => (
                        <Link key={category.id} href={filterHref({ category: activeCategory === category.id ? undefined : category.id })}>
                          <button
                            type="button"
                            className={`block rounded-xl px-3 py-2 text-sm font-semibold text-left ${
                              activeCategory === category.id
                                ? 'bg-accent text-white'
                                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                            }`}
                          >
                            {category.name}
                          </button>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                      Language
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['th', 'en'].map((value) => (
                        <Link key={value} href={filterHref({ language: activeLanguage === value ? undefined : value })}>
                          <button
                            type="button"
                            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                              activeLanguage === value
                                ? 'bg-accent text-white'
                                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {value === 'th' ? 'ไทย' : 'EN'}
                          </button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-text-secondary">{items.length} results</p>
                <div className="flex flex-wrap gap-2">
                  {['relevance', 'recency', 'popularity'].map((value) => (
                    <Link key={value} href={filterHref({ sort: value })}>
                      <button
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          activeSort === value
                            ? 'bg-accent text-white'
                            : 'bg-bg-card text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {value === 'relevance' ? 'Relevance' : value === 'recency' ? 'Recency' : 'Popularity'}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>

              {items.length === 0 ? (
                <EmptyState
                  title="No results found"
                  description={`Try different keywords or filters. Search service is ${error ? 'unavailable' : 'working'}.`}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <Link key={`${item.type}-${item.id}`} href={`/${item.type === 'software' ? 'software' : 'knowledge'}/${item.id}`}>
                      <div className="rounded-xl border border-text-secondary/10 bg-bg-card p-5 hover:border-accent/30 transition-all duration-200">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="info">{item.type === 'software' ? 'Software' : 'Article'}</Badge>
                          {item.categoryName && <Badge variant="default" size="sm">{item.categoryName}</Badge>}
                        </div>
                        <h3 className="font-bold text-text-primary">{item.title ?? item.name}</h3>
                        <p className="mt-2 text-sm text-text-secondary line-clamp-2">{item.excerpt ?? item.shortDescription}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="Start searching"
              description="Enter keywords to find software, articles, and developers."
            />
          </div>
        )}
      </div>
    </main>
  );
}