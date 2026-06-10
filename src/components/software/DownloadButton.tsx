'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DownloadButtonProps {
  softwareId: string;
}

export function DownloadButton({ softwareId }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/software/${softwareId}/download-events`, {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Download could not be started.');
      }

      if (body?.data?.downloadURL) {
        window.location.href = body.data.downloadURL;
      }
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Download failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button size="lg" loading={loading} onClick={handleDownload} className="w-full sm:w-auto">
        <Download className="mr-2 h-5 w-5" />
        Download
      </Button>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
