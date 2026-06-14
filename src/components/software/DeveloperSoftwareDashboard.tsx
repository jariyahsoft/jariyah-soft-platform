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
import { AppealSubmissionButton } from '@/components/moderation/AppealSubmissionButton';
import { SoftwareItem, SoftwareStatus } from '@/lib/software/types';

const statusTabs: Array<'all' | SoftwareStatus> = ['all', 'draft', 'pending', 'published', 'rejected'];

function statusVariant(status: SoftwareStatus) {
  if (status === 'published') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected') return 'danger';
  return 'default';
}

function toSoftwareItem(id: string, data: Record<string, any>): SoftwareItem {
  const updatedAt = data.updatedAt?.toDate?.()?.toISOString?.();
  return {
    id,
    ownerId: data.ownerId,
    name: data.name ?? 'Untitled software',
    slug: data.slug ?? id,
    developerName: data.developerName ?? 'You',
    shortDescription: data.shortDescription ?? '',
    description: data.description ?? '',
    categoryId: data.categoryId ?? '',
    categoryName: data.categoryName ?? data.categoryId ?? 'General',
    tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
    platforms: Array.isArray(data.platforms) ? data.platforms : [],
    licenseId: data.licenseId ?? '',
    licenseName: data.licenseName ?? data.licenseId ?? 'Other',
    logoPath: data.logoPath,
    screenshotPaths: Array.isArray(data.screenshotPaths) ? data.screenshotPaths : [],
    repositoryURL: data.repositoryURL,
    websiteURL: data.websiteURL,
    downloadURL: data.downloadURL,
    fileSize: data.fileSize,
    status: data.status ?? 'draft',
    ratingAverage: Number(data.ratingAverage ?? 0),
    ratingCount: Number(data.ratingCount ?? 0),
    downloadCount: Number(data.downloadCount ?? 0),
    updatedAt,
    rejectionReason: data.rejectionReason,
    etag: data.updatedAt?.toMillis ? `"${data.updatedAt.toMillis()}"` : '*',
  };
}

export function DeveloperSoftwareDashboard() {
  const { user } = useAuth();
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [items, setItems] = useState<SoftwareItem[]>([]);
  const [activeStatus, setActiveStatus] = useState<'all' | SoftwareStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadSoftware() {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(query(collection(db, 'software'), where('ownerId', '==', user.uid)));
      const nextItems = snapshot.docs
        .map((doc) => toSoftwareItem(doc.id, doc.data()))
        .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
      setItems(nextItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load software.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void loadSoftware();
  }, [user]);

  async function submitForReview(id: string) {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/v1/software/${id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? 'Unable to submit software.');
    }

    await loadSoftware();
  }

  if (guardLoading || loading) {
    return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Loading your software...</div>;
  }

  if (!authorized) {
    return <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">Developer role is required.</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">
        {error}
        <div className="mt-4">
          <Button variant="danger" onClick={loadSoftware}>Retry</Button>
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
          <h1 className="mt-3 text-3xl font-black">Your software</h1>
          <p className="mt-2 text-text-secondary">Track drafts, submissions, published releases, and rejected items.</p>
        </div>
        <Link
          href="/dashboard/software/new"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/10 transition hover:bg-accent-hover"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          New software
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
          title="No software here yet"
          description="Create a draft and your submissions will show up here."
        />
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{item.name}</h2>
                    <Badge variant={statusVariant(item.status)}>{item.status === 'pending' ? 'submitted' : item.status}</Badge>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-text-secondary">{item.shortDescription || 'No description yet.'}</p>
                  {item.rejectionReason && <p className="mt-2 text-sm text-danger">Reason: {item.rejectionReason}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(item.status === 'draft' || item.status === 'rejected') && (
                    <Link
                      href={`/dashboard/software/${item.id}/edit`}
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
                            setError(submitError instanceof Error ? submitError.message : 'Unable to submit software.');
                          }
                        })
                      }
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </Button>
                  )}
                  {item.status === 'rejected' && (
                    <AppealSubmissionButton resourceType="software" resourceId={item.id} onSubmitted={loadSoftware} />
                  )}
                  {item.status === 'published' && (
                    <Link
                      href={`/software/${item.slug}`}
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
