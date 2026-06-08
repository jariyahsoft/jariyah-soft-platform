import { useTranslations } from 'next-intl';

export default function LocalePage() {
  const t = useTranslations();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {t('meta.siteName')}
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        {t('meta.tagline')}
      </p>
    </main>
  );
}
