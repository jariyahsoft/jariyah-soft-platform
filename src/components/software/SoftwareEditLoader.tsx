'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { db } from '@/lib/firebase/config';
import { SoftwareItem } from '@/lib/software/types';
import { SoftwareSubmissionForm } from '@/components/software/SoftwareSubmissionForm';

interface SoftwareEditLoaderProps {
  softwareId: string;
}

function toSoftwareItem(id: string, data: Record<string, any>): SoftwareItem {
  const updatedAt = data.updatedAt?.toDate?.()?.toISOString?.();
  return {
    id,
    ownerId: data.ownerId,
    name: data.name ?? '',
    slug: data.slug ?? '',
    developerName: data.developerName ?? 'You',
    shortDescription: data.shortDescription ?? '',
    description: data.description ?? '',
    categoryId: data.categoryId ?? 'productivity',
    categoryName: data.categoryName ?? data.categoryId ?? 'Productivity',
    tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
    platforms: Array.isArray(data.platforms) ? data.platforms : ['web'],
    licenseId: data.licenseId ?? 'MIT',
    licenseName: data.licenseName ?? data.licenseId ?? 'MIT',
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

export function SoftwareEditLoader({ softwareId }: SoftwareEditLoaderProps) {
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [software, setSoftware] = useState<SoftwareItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const snapshot = await getDoc(doc(db, 'software', softwareId));
        if (!snapshot.exists()) {
          setError('Software draft not found.');
          return;
        }
        setSoftware(toSoftwareItem(snapshot.id, snapshot.data()));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load software.');
      } finally {
        setLoading(false);
      }
    }

    if (authorized) void load();
  }, [authorized, softwareId]);

  if (guardLoading || loading) return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Loading software draft...</div>;
  if (!authorized) return <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">Developer role is required.</div>;
  if (error || !software) return <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">{error ?? 'Software not found.'}</div>;

  return <SoftwareSubmissionForm mode="edit" initialSoftware={software} />;
}
