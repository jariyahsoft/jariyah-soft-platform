'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function SoftwareListError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <ErrorState title="Software could not load" message="Please retry the software hub request." onRetry={reset} />
    </main>
  );
}
