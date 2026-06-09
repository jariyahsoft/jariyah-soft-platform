import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'thai' as any],
});

export const metadata: Metadata = {
  title: {
    default: 'จริยะซอฟต์ — แพลตฟอร์มซอฟต์แวร์ไทย',
    template: '%s | จริยะซอฟต์',
  },
  description: 'ค้นพบ ดาวน์โหลด และแชร์ซอฟต์แวร์คุณภาพจากนักพัฒนาไทย',
  robots: { index: true, follow: true },
};

/**
 * Root layout — shell only.
 * The `lang` attribute and locale-specific metadata are handled by
 * `src/app/[locale]/layout.tsx` via Next.js metadata API.
 * The `<html>` element's lang is updated by the locale layout's
 * generateMetadata which sets `alternates.languages`.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Default lang="th" (Thai); actual per-locale lang is controlled
  // via the [locale] segment and hreflang in generateMetadata.
  return (
    <html lang="th" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                if (theme === 'dark' || (!theme && !prefersLight)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
