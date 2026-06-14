'use client';

import { useState, useTransition } from 'react';
import { Scale } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface AppealSubmissionButtonProps {
  resourceType: 'software' | 'article';
  resourceId: string;
  onSubmitted?: () => void;
}

export function AppealSubmissionButton({ resourceType, resourceId, onSubmitted }: AppealSubmissionButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitAppeal() {
    if (!user) return;
    const token = await user.getIdToken();
    const attachmentList = attachments
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch('/api/v1/appeals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceType,
        resourceId,
        reason,
        attachments: attachmentList,
      }),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error?.message ?? 'Unable to submit appeal.');
    }

    setMessage('Appeal submitted. A different moderator will review it.');
    setReason('');
    setAttachments('');
    onSubmitted?.();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Scale className="mr-2 h-4 w-4" />
        Appeal
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Submit appeal">
        <div className="space-y-4">
          {message ? <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-sm text-success">{message}</div> : null}
          {error ? <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">{error}</div> : null}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor={`appeal-${resourceId}`}>
              Reason
            </label>
            <textarea
              id={`appeal-${resourceId}`}
              value={reason}
              maxLength={2000}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-36 w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Explain why this moderation decision should be reviewed."
            />
            <div className="text-right text-xs text-text-secondary">{reason.length}/2000</div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor={`appeal-attachments-${resourceId}`}>
              Attachment URLs
            </label>
            <textarea
              id={`appeal-attachments-${resourceId}`}
              value={attachments}
              onChange={(event) => setAttachments(event.target.value)}
              className="min-h-20 w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Optional evidence links, one per line"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isPending}
              disabled={reason.trim().length < 20}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setError(null);
                    await submitAppeal();
                  } catch (submitError) {
                    setError(submitError instanceof Error ? submitError.message : 'Unable to submit appeal.');
                  }
                })
              }
            >
              Submit appeal
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
