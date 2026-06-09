'use client';

import React, { useState } from 'react';
import { Filter, ChevronRight, X } from 'lucide-react';
import { useLocale } from 'next-intl';

interface CategoryItem {
  id: string;
  name: { th: string; en: string };
}

interface SidebarProps {
  categories?: CategoryItem[];
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
  title?: string;
}

const defaultCategories: CategoryItem[] = [
  { id: 'all', name: { th: 'ทั้งหมด', en: 'All' } },
  { id: 'utilities', name: { th: 'ยูทิลิตี้', en: 'Utilities' } },
  { id: 'developer-tools', name: { th: 'เครื่องมือนักพัฒนา', en: 'Developer Tools' } },
  { id: 'productivity', name: { th: 'เพิ่มประสิทธิภาพ', en: 'Productivity' } },
  { id: 'education', name: { th: 'การศึกษา', en: 'Education' } },
  { id: 'entertainment', name: { th: 'ความบันเทิง', en: 'Entertainment' } },
];

export function Sidebar({
  categories = defaultCategories,
  selectedCategory = 'all',
  onSelectCategory,
  title,
}: SidebarProps) {
  const currentLocale = useLocale() as 'th' | 'en';
  const [isOpen, setIsOpen] = useState(false);

  const sidebarTitle = title || (currentLocale === 'th' ? 'หมวดหมู่' : 'Categories');

  const handleSelect = (id: string) => {
    if (onSelectCategory) {
      onSelectCategory(id);
    }
    setIsOpen(false); // Close mobile menu drawer when item selected
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 pb-2 border-b border-text-secondary/10">
        <Filter className="h-4.5 w-4.5 text-accent" />
        <h3 className="font-semibold text-text-primary text-sm tracking-wide uppercase">
          {sidebarTitle}
        </h3>
      </div>
      <nav aria-label="Category Navigation" className="flex flex-col gap-1">
        {categories.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 text-left ${
                isActive
                  ? 'bg-accent text-white shadow-sm shadow-accent/15'
                  : 'text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary'
              }`}
            >
              <span>{category.name[currentLocale]}</span>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle float button */}
      <div className="block lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-secondary text-text-primary border border-text-secondary/10 rounded-lg text-sm font-semibold hover:bg-text-secondary/10 active:scale-95 transition-all duration-200"
        >
          <Filter className="h-4 w-4" />
          <span>{sidebarTitle}</span>
        </button>
      </div>

      {/* Desktop Sidebar view */}
      <aside className="hidden lg:block w-64 shrink-0 bg-bg-card border border-text-secondary/10 rounded-xl p-5 shadow-sm h-fit sticky top-20">
        {content}
      </aside>

      {/* Mobile Drawer view */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          {/* Drawer sheet */}
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-[280px] bg-bg-card p-6 border-r border-text-secondary/10 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary"
                aria-label="Close categories menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
