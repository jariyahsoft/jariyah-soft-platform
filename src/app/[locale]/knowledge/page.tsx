import type { Metadata } from 'next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { listPublishedArticles } from '@/lib/articles/data';
import { ARTICLE_CATEGORIES } from '@/lib/articles/types';

export const revalidate = 60;

interface KnowledgeListPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    language?: string;
    sort?: string;
    cursor?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Knowledge Hub | Jariyah Soft',
  description: 'Discover articles, tutorials, and best practices from Thai and regional developers.',
  openGraph: {
    title: 'Knowledge Hub | Jariyah Soft',
    description: 'Discover articles, tutorials, and best practices from Thai and regional developers.',
    images: ['/opengraph-image.png'],
  },
};

function filterHref(next: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/knowledge${query ? `?${query}` : ''}`;
}

export default async function KnowledgeListPage({ searchParams }: KnowledgeListPageProps) {
  const params = await searchParams;
  const activeCategory = params.category;
  const activeTag = params.tag;
  const activeLanguage = params.language;
  const activeSort = params.sort ?? 'relevance';

  const { items, source } = await listPublishedArticles({
    category: activeCategory,
    tag: activeTag,
    language: activeLanguage,
    sort: activeSort,
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_bottom_right,rgba(0,120,255,0.14),transparent_34rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="info">Knowledge Hub</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Learn from trusted articles.
              </h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                Browse published articles by category, tag, and language. Filters stay in the URL so sharing a search is delightfully boring.
              </p>
            </div>
            <div className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4 text-sm text-text-secondary">
              <Search className="mb-3 h-5 w-5 text-accent" />
              Search service fallback is ready; current view uses {source === 'firestore' ? 'Firestore' : 'sample'} data.
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
              <div className="mb-4 flex items-center gap-2 font-bold">
                <SlidersHorizontal className="h-5 w-5 text-accent" />
                Filters
              </div>
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                    Category
                  </h2>
                  <div className="mt-3 space-y-2">
                    <Link
                      href={filterHref({ tag: activeTag, language: activeLanguage, sort: activeSort })}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold ${
                        !activeCategory ? 'bg-accent text-white' : 'hover:bg-bg-secondary'
                      }`}
                    >
                      All categories
                    </Link>
                    {ARTICLE_CATEGORIES.map((category) => (
                      <Link
                        key={category.id}
                        href={filterHref({
                          category: category.id,
                          tag: activeTag,
                          language: activeLanguage,
                          sort: activeSort,
                        })}
                        className={`block rounded-xl px-3 py-2 text-sm font-semibold ${
                          activeCategory === category.id
                            ? 'bg-accent text-white'
                            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                        }`}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                    Language
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ['th', 'ไทย'],
                      ['en', 'English'],
                    ].map(([value, label]) => (
                      <Link
                        key={value}
                        href={filterHref({
                          category: activeCategory,
                          tag: activeTag,
                          language: activeLanguage === value ? undefined : value,
                          sort: activeSort,
                        })}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          activeLanguage === value
                            ? 'bg-accent text-white'
                            : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                    Tags
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['digital-literacy', 'ai', 'thai', 'tutorial'].map((tag) => (
                      <Link
                        key={tag}
                        href={filterHref({
                          category: activeCategory,
                          tag: activeTag === tag ? undefined : tag,
                          language: activeLanguage,
                          sort: activeSort,
                        })}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          activeTag === tag
                            ? 'bg-accent text-white'
                            : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-text-secondary">{items.length} published articles</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['relevance', 'Relevance'],
                  ['recency', 'Recency'],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={filterHref({
                      category: activeCategory,
                      tag: activeTag,
                      language: activeLanguage,
                      sort: value,
                    })}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      activeSort === value
                        ? 'bg-accent text-white'
                        : 'bg-bg-card text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {items.length === 0 ? (
              <EmptyState
                title="No articles matched these filters"
                description="Try another category, tag, or language, or check back after more articles are published."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}