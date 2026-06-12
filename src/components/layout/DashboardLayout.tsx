'use client';

import React, { useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, User, Settings, FolderKanban, Menu, X, ArrowLeft } from 'lucide-react';

interface SidebarNavItem {
  href: string;
  label: { th: string; en: string };
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const currentLocale = useLocale() as 'th' | 'en';
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { isAtLeast } = useAuth();

  const baseNavItems: SidebarNavItem[] = [
    {
      href: '/dashboard',
      label: { th: 'ภาพรวมระบบ', en: 'Overview' },
      icon: <LayoutDashboard className="h-4.5 w-4.5" />,
    },
    {
      href: '/dashboard/software',
      label: { th: 'จัดการซอฟต์แวร์', en: 'Manage Software' },
      icon: <FolderKanban className="h-4.5 w-4.5" />,
    },
    {
      href: '/dashboard/profile',
      label: { th: 'แก้ไขโปรไฟล์', en: 'Edit Profile' },
      icon: <User className="h-4.5 w-4.5" />,
    },
    {
      href: '/dashboard/settings',
      label: { th: 'ตั้งค่าการใช้งาน', en: 'Settings' },
      icon: <Settings className="h-4.5 w-4.5" />,
    },
  ];

  const moderatorItems: SidebarNavItem[] = isAtLeast('moderator') ? [
    {
      href: '/dashboard/moderation',
      label: { th: 'ตรวจสอบผลงาน', en: 'Moderation' },
      icon: <LayoutDashboard className="h-4.5 w-4.5" />,
    }
  ] : [];

  const adminItems: SidebarNavItem[] = isAtLeast('admin') ? [
    {
      href: '/dashboard/admin/audit',
      label: { th: 'ประวัติการใช้งาน (Audit)', en: 'Audit Logs' },
      icon: <LayoutDashboard className="h-4.5 w-4.5" />,
    }
  ] : [];

  const navItems = [...baseNavItems, ...moderatorItems, ...adminItems];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-bg-card border-r border-text-secondary/10 w-64">
      {/* Top Header branding */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-text-secondary/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
            จ
          </span>
          <span className="font-bold text-text-primary text-base">
            {currentLocale === 'th' ? 'จริยะแดชบอร์ด' : 'Jariyah Dash'}
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-text-secondary/10"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav aria-label="Dashboard Sidebar Navigation" className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          // Dynamic matching of active path
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-accent text-white shadow-sm shadow-accent/15'
                  : 'text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary'
              }`}
            >
              {item.icon}
              <span>{item.label[currentLocale]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to Home CTA */}
      <div className="p-4 border-t border-text-secondary/10">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-text-secondary/10 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{currentLocale === 'th' ? 'กลับหน้าแรก' : 'Back to Home'}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block shrink-0 h-full">{sidebarContent}</aside>

      {/* Mobile drawer sidebar backdrop and container */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Slider box */}
          <div className="relative z-50 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main content body viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-text-secondary/10 bg-bg-card flex items-center justify-between px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary"
            aria-label="Open sidebar"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          <div className="text-sm font-semibold text-text-secondary">
            {currentLocale === 'th' ? 'ยินดีต้อนรับกลับมา' : 'Welcome back!'}
          </div>
        </header>

        {/* Scrollable container content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
