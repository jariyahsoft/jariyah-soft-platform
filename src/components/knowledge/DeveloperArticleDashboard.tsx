'use client';

import { useEffect, useState, useTransition } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ExternalLink, FilePlus2, Pencil, Send } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { db } from '@/lib/firebase/config';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArticleItem, ArticleStatus } from '@/lib/articles/types';

const statusTabs: Array<'all' | ArticleStatus> = ['all', 'draft', 'pending', 'published', 'rejected'];

function statusVariant(status: ArticleStatus) {
  if (status === 'published') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected') return 'danger';
  return 'default';
}

function toArticleItem(id: string, data: Record<string, any>):ArticleItem {
  const updatedAt = data.updatedAt?.toDate?.()?.toISOString?.();
  return {
    id,
    authorId: data.authorId,
    title: data.title ?? 'Untitled article',
    slug: data.slug ?? id,
    excerpt: data.excerpt ?? '',
    body: data.body ?? '',
    contentType: data.contentType ?? 'markdown',
    categoryId: data.categoryId ?? '',
    categoryName: data.categoryName ?? data.categoryId ?? 'General',
    tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
    tagNames: Array.isArray(data.tagNames) ? data.tagNames : [],
    language: data.language ?? 'th',
    coverPath: data.coverPath,
    status: data.status ?? 'draft',
    viewCount: Number(data.viewCount ?? 0),
    authorName: data.authorName ?? 'You',
    authorPhotoURL: data.authorPhotoURL,
    updatedAt,
    publishedAt: data.publishedAt?.toDate?.()?.toISOString?.(),
    readingTimeMinutes: data.readingTimeMinutes ?? Math.ceil((data.body?.length ?? 0) / 1000),
    rejectionReason: data.rejectionReason,
    etag: data.updatedAt?.toMillis ? `"${data.updatedAt.toMillis()}"` : '*',
  };
}

export function DeveloperArticleDashboard() {
  const { user } = useAuth();
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [activeStatus, setActiveStatus] = useState<'all' | ArticleStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadArticles() {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(query(collection(db, 'articles'), where('authorId', '==', user.uid)));
      const nextItems = snapshot.docs
        .map((doc) => toArticleItem(doc.id, doc.data()))
        .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
      setItems(nextItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load articles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void loadArticles();
  }, [user]);

  async function submitForReview(id: string) {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/v1/articles/${id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? 'Unable to submit article.');
    }

    await loadArticles();
  }

  if (guardLoading || loading) {
    return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Loading your articles...</div>;
  }

  if (!authorized) {
    return <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">Developer role is required.</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">
        {error}
        <div className="mt-4">
          <Button variant="danger" onClick={loadArticles}>Retry</Button>
        </div>
      </div>
    );
  }

  const filteredItems = activeStatus === 'all' ? items : items.filter((item) => item.status === activeStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Badge variant="info">Developer Hub</Badge>
          <h1 className="mt-3 text-3xl font-black">Your articles</h1>
          <p className="mt-2 text-text-secondary">Track drafts, submissions, published articles, and rejected items.</p>
        </div>
        <Link
          href="/dashboard/articles/new"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/10 transition hover:bg-accent-hover"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          New article
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveStatus(status)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              activeStatus === status ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary hover:text-text-primary'
            }`}
          >
            {status === 'pending' ? 'Submitted' : status}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No articles here yet"
          description="Create a draft and your submissions will show up here."
        />
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{item.title}</h2>
                    <Badge variant={statusVariant(item.status)}>{item.status === 'pending' ? 'submitted' : item.status}</Badge>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-text-secondary">{item.excerpt || 'No excerpt yet.'}</p>
                  {item.rejectionReason && <p className="mt-2 text-sm text-danger">Reason: {item.rejectionReason}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(item.status === 'draft' || item.status === 'rejected') && (
                    <Link
                      href={`/dashboard/articles/${item.id}/edit`}
                      className="inline-flex items-center rounded-lg border border-text-secondary/20 px-3 py-2 text-sm font-semibold hover:bg-bg-secondary"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  )}
                  {(item.status === 'draft' || item.status === 'rejected') && (
                    <Button
                      variant="secondary"
                      loading={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          try {
                            await submitForReview(item.id);
                          } catch (submitError) {
                            setError(submitError instanceof Error ? submitError.message : 'Unable to submit article.');
                          }
                        })
                      }
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </Button>
                  )}
                  {item.status === 'published' && (
                    <Link
                      href={`/knowledge/${item.slug}`}
                      className="inline-flex items-center rounded-lg border border-text-secondary/20 px-3 py-2 text-sm font-semibold hover:bg-bg-secondary"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}