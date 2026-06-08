import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

/**
 * Proxy (formerly middleware) — handles locale detection and routing.
 * Redirects bare paths like `/` → `/th/` based on Accept-Language / cookie.
 */
export function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  // Match all paths except Next.js internals and static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)',
  ],
};
