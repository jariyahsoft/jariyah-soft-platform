import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export function Footer() {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const currentLocale = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-text-secondary/10 bg-bg-secondary/40 text-text-secondary mt-auto py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Branding block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
              จ
            </span>
            <span className="font-bold text-text-primary text-base">
              {currentLocale === 'th' ? 'จริยะซอฟต์' : 'JariyahSoft'}
            </span>
          </div>
          <p className="text-xs max-w-xs leading-relaxed">
            {currentLocale === 'th'
              ? 'แพลตฟอร์มสนับสนุนและจัดจำหน่ายซอฟต์แวร์ไทยเพื่อยกระดับทักษะเทคโนโลยีและอุตสาหกรรมในประเทศ'
              : 'Empowering Thai software developers and distributing top-tier local technical innovations.'}
          </p>
        </div>

        {/* Categories Link Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            {currentLocale === 'th' ? 'ลิงก์ยอดนิยม' : 'Quick Links'}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/software" className="hover:text-text-primary transition-colors duration-200">
                {t('software')}
              </Link>
            </li>
            <li>
              <Link href="/knowledge" className="hover:text-text-primary transition-colors duration-200">
                {t('knowledge')}
              </Link>
            </li>
            <li>
              <Link href="/developers" className="hover:text-text-primary transition-colors duration-200">
                {t('developers')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            {currentLocale === 'th' ? 'ทรัพยากร' : 'Resources'}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/events" className="hover:text-text-primary transition-colors duration-200">
                {t('events')}
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-text-primary transition-colors duration-200">
                {currentLocale === 'th' ? 'คู่มือสำหรับนักพัฒนา' : 'Developer Docs'}
              </a>
            </li>
          </ul>
        </div>

        {/* Social and Legals */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            {currentLocale === 'th' ? 'เชื่อมต่อกับเรา' : 'Socials'}
          </h4>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-bg-secondary hover:bg-text-secondary/10 text-text-secondary hover:text-text-primary rounded-lg transition-all duration-200 flex items-center justify-center"
              aria-label="GitHub Page"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-bg-secondary hover:bg-text-secondary/10 text-text-secondary hover:text-text-primary rounded-lg transition-all duration-200 flex items-center justify-center"
              aria-label="Twitter Page"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="#"
              className="p-2 bg-bg-secondary hover:bg-text-secondary/10 text-text-secondary hover:text-text-primary rounded-lg transition-all duration-200 flex items-center justify-center"
              aria-label="Website Link"
            >
              <Globe className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright row */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-text-secondary/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>© {currentYear} JariyahSoft. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-text-primary transition-colors duration-200">
            {tAuth('terms') || 'Terms of Service'}
          </a>
          <a href="#" className="hover:text-text-primary transition-colors duration-200">
            {tAuth('privacy') || 'Privacy Policy'}
          </a>
        </div>
      </div>
    </footer>
  );
}
