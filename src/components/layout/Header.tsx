'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/layout/ThemeProvider';
import { Menu, X, Sun, Moon, Globe, Search, User, LogOut, ChevronDown, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('actions');
  const tStates = useTranslations('states');
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const { user, isAuthenticated, signOut, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageToggle = () => {
    const nextLocale = currentLocale === 'th' ? 'en' : 'th';
    router.replace(pathname, { locale: nextLocale });
    toast(nextLocale === 'th' ? 'เปลี่ยนภาษาเป็น ไทย สำเร็จ' : 'Language changed to English', 'success');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast(currentLocale === 'th' ? 'ออกจากระบบสำเร็จ' : 'Logged out successfully', 'success');
      setUserDropdownOpen(false);
    } catch (_) {
      toast(tStates('error'), 'error');
    }
  };

  const navLinks = [
    { href: '/software', label: t('software') },
    { href: '/knowledge', label: t('knowledge') },
    { href: '/developers', label: t('developers') },
    { href: '/events', label: t('events') },
  ];

  return (
    <>
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-accent text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-accent/10"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 w-full border-b border-text-secondary/10 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group select-none">
            <span className="h-9 w-9 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-accent/20 group-hover:scale-105 transition-all duration-200">
              จ
            </span>
            <span className="font-bold text-lg tracking-tight text-text-primary group-hover:text-accent transition-colors duration-200">
              {currentLocale === 'th' ? 'จริยะซอฟต์' : 'JariyahSoft'}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search, Action Buttons & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Search Input (Hidden on mobile) */}
            <div className="relative hidden md:block w-48 lg:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder={t('search')}
                className="w-full bg-bg-secondary text-text-primary border border-text-secondary/10 rounded-lg pl-9 pr-3 py-1.5 text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </div>

            {/* Language Switcher */}
            <button
              onClick={handleLanguageToggle}
              className="p-2 rounded-lg text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Toggle language"
            >
              <Globe className="h-4.5 w-4.5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Auth section */}
            <div className="relative" ref={dropdownRef}>
              {isAuthenticated ? (
                /* User profile menu dropdown */
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-text-secondary/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <Avatar name={user?.displayName || user?.email || 'User'} size="sm" />
                  <ChevronDown className="h-4 w-4 text-text-secondary hidden sm:block" />
                </button>
              ) : (
                /* Login / Signup CTA */
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="primary" size="sm">
                      {t('signup')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* User Dropdown overlay */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-56 rounded-xl bg-bg-card border border-text-secondary/10 p-1.5 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-text-secondary/5 mb-1.5">
                    <p className="text-xs font-semibold text-text-secondary truncate">
                      {user?.email}
                    </p>
                    {role && (
                      <Badge variant={role === 'admin' ? 'elite' : role === 'developer' ? 'gold' : 'default'} size="sm" className="mt-1">
                        {role}
                      </Badge>
                    )}
                  </div>
                  
                  <Link href="/dashboard" onClick={() => setUserDropdownOpen(false)}>
                    <button className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-text-secondary/10 rounded-lg transition-colors duration-200">
                      <Award className="h-4.5 w-4.5 text-text-secondary" />
                      {t('dashboard')}
                    </button>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation side drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer content */}
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[280px] bg-bg-card p-6 border-l border-text-secondary/10 shadow-xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-text-secondary/5 pb-4">
                <span className="font-bold text-text-primary">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Search input */}
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder={t('search')}
                  className="w-full bg-bg-secondary text-text-primary border border-text-secondary/10 rounded-lg pl-9 pr-3 py-1.8 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>

              {/* Mobile Links */}
              <nav aria-label="Mobile Navigation" className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-semibold text-text-secondary hover:text-text-primary transition-colors duration-200 py-1.5"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile login CTAs */}
            {!isAuthenticated && (
              <div className="flex flex-col gap-2.5 pt-6 border-t border-text-secondary/5">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    {t('signup')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
