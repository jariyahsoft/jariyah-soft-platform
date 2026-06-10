import { Skeleton } from '@/components/ui/Skeleton';

export default function SoftwareListLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-56 rounded-[2rem]" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-72 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
