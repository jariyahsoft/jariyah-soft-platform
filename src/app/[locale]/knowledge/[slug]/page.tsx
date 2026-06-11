import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clock, Share2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/knowledge/MarkdownRenderer';
import { Badge } from '@/components/ui/Badge';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { getPublishedArticleBySlug, listPublishedArticles } from '@/lib/articles/data';
import { ArticleItem } from '@/lib/articles/types';

export const revalidate = 300;

interface KnowledgeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: KnowledgeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article not found | Jariyah Soft',
    };
  }

  return {
    title: `${article.title} | Jariyah Soft`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      images: article.coverPath ? [article.coverPath] : ['/opengraph-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
  };
}

function generateHeadingId(text: string, index: number): string {
  return `${text.toLowerCase().replace(/[^\w]+/g, '-')}-${index}`;
}

function extractHeadings(content: string): Array<{ id: string; text: string; level: number }> {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const lines = content.split('\n');
  let h1Index = 0;
  let h2Index = 0;
  let h3Index = 0;

  lines.forEach((line) => {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match?.[1]) {
      headings.push({ id: `h1-${h1Index++}`, text: h1Match[1], level: 1 });
    } else if (h2Match?.[1]) {
      headings.push({ id: `h2-${h2Index++}`, text: h2Match[1], level: 2 });
    } else if (h3Match?.[1]) {
      headings.push({ id: `h3-${h3Index++}`, text: h3Match[1], level: 3 });
    }
  });

  return headings;
}

async function getRelatedArticles(currentArticle: ArticleItem, currentSlug: string) {
  const { items } = await listPublishedArticles({
    category: currentArticle.categoryId,
    limit: 3,
  });
  return items.filter((item) => item.slug !== currentSlug);
}

export default async function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) notFound();

  const headings = extractHeadings(article.body);
  const relatedArticles = await getRelatedArticles(article, slug);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    author: {
      '@type': 'Person',
      name: article.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Jariyah Soft',
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    articleSection: article.categoryName,
    keywords: article.tagNames.join(', '),
    image: article.coverPath,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,120,255,0.16),transparent_34rem)] px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-4xl">
        <article className="rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 md:p-8">
          <Badge variant="info">{article.categoryName}</Badge>

          {article.coverPath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverPath}
              alt=""
              className="mt-6 w-full rounded-xl object-cover max-h-96"
            />
          )}

          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">{article.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{article.readingTimeMinutes ?? Math.ceil(article.body.length / 1000)} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recently published'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {article.tagNames.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-text-secondary/10 pt-6">
            <MarkdownRenderer content={article.body} />
          </div>
        </article>

        {headings.length > 0 && (
          <nav className="mt-8 rounded-2xl border border-text-secondary/10 bg-bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">
              Table of Contents
            </h2>
            <ul className="space-y-1 text-sm">
              {headings.map((heading, index) => (
                <li key={`${heading.id}-${index}`} style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}>
                  <a href={`#${heading.id}`} className="text-text-secondary hover:text-accent transition-colors">
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-5">Related Articles</h2>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}