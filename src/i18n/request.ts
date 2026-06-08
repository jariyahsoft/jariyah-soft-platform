import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` resolves to the locale from the URL segment (may be undefined)
  const awaitedLocale = await requestLocale;

  // Ensure locale is always a non-empty string; fall back to default
  const locale: string =
    awaitedLocale && routing.locales.includes(awaitedLocale as 'th' | 'en')
      ? awaitedLocale
      : routing.defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`../locales/${locale}/common.json`)).default,
      software: (await import(`../locales/${locale}/software.json`)).default,
      knowledge: (await import(`../locales/${locale}/knowledge.json`)).default,
      errors: (await import(`../locales/${locale}/errors.json`)).default,
    },
  };
});
