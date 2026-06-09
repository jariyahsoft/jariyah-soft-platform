import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { AuthProvider } from '@/lib/firebase/auth-context';

import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';

  return {
    title: {
      default: isEn
        ? 'JariyahSoft — Thai Software Platform'
        : 'จริยะซอฟต์ — แพลตฟอร์มซอฟต์แวร์ไทย',
      template: isEn ? '%s | JariyahSoft' : '%s | จริยะซอฟต์',
    },
    description: isEn
      ? 'Discover, download and share quality software from Thai developers.'
      : 'ค้นพบ ดาวน์โหลด และแชร์ซอฟต์แวร์คุณภาพจากนักพัฒนาไทย',
    alternates: {
      canonical: `/${locale}`,
      languages: {
        th: '/th',
        en: '/en',
      },
    },
    openGraph: {
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      alternateLocale: locale === 'th' ? 'en_US' : 'th_TH',
      siteName: isEn ? 'JariyahSoft' : 'จริยะซอฟต์',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale — triggers 404 for unknown locales
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Load all messages for the current locale
  const messages = await getMessages();

  return (
    <>
      {/* hreflang link tags for search engine locale discovery */}
      <link rel="alternate" hrefLang="th" href="/th" />
      <link rel="alternate" hrefLang="en" href="/en" />
      <link rel="alternate" hrefLang="x-default" href="/th" />
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </>
  );
}
