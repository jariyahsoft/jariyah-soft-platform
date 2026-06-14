'use client';

import React, { useState, useMemo } from 'react';
import { Search, Trophy, ShieldCheck, ListFilter } from 'lucide-react';
import { DeveloperCard } from './DeveloperCard';
import { getLevel } from '@/components/software/ReputationBadge';

interface DeveloperData {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  skills: string[];
  followerCount: number;
  reputationScore: number;
  verificationStatus: string;
  softwareCount: number;
}

interface DeveloperDirectoryClientProps {
  initialDevelopers: DeveloperData[];
  locale: string;
}

export function DeveloperDirectoryClient({ initialDevelopers, locale }: DeveloperDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('reputation');

  // Filter & sort logic
  const filteredAndSortedDevelopers = useMemo(() => {
    let result = [...initialDevelopers];

    // 1. Search Query (name or skills tag)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (dev) =>
          dev.displayName.toLowerCase().includes(query) ||
          dev.skills.some((skill) => skill.toLowerCase().includes(query))
      );
    }

    // 2. Verified Status Filter
    if (verifiedFilter === 'verified') {
      result = result.filter((dev) => dev.verificationStatus === 'verified');
    } else if (verifiedFilter === 'unverified') {
      result = result.filter((dev) => dev.verificationStatus !== 'verified');
    }

    // 3. Level Filter
    if (levelFilter !== 'all') {
      result = result.filter((dev) => getLevel(dev.reputationScore) === levelFilter);
    }

    // 4. Sort By
    result.sort((a, b) => {
      if (sortBy === 'followers') {
        return b.followerCount - a.followerCount;
      }
      if (sortBy === 'softwareCount') {
        return b.softwareCount - a.softwareCount;
      }
      // default: reputation
      return b.reputationScore - a.reputationScore;
    });

    return result;
  }, [initialDevelopers, searchQuery, levelFilter, verifiedFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              placeholder={locale === 'th' ? 'ค้นหาด้วยชื่อ หรือทักษะ (เช่น React, Go)...' : 'Search by name or skills (e.g. React, Go)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-secondary text-text-primary border border-text-secondary/10 rounded-xl pl-10 pr-4 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-secondary font-semibold whitespace-nowrap">
              {locale === 'th' ? 'จัดเรียงตาม:' : 'Sort by:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg-secondary text-text-primary text-xs border border-text-secondary/10 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            >
              <option value="reputation">{locale === 'th' ? 'Reputation (สูงสุด)' : 'Reputation (Highest)'}</option>
              <option value="followers">{locale === 'th' ? 'ผู้ติดตาม (สูงสุด)' : 'Followers (Highest)'}</option>
              <option value="softwareCount">{locale === 'th' ? 'จำนวนผลงาน (สูงสุด)' : 'Software Count (Highest)'}</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Toggle Selectors */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-text-secondary/5 text-xs">
          {/* Verified filter */}
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-text-secondary" />
            <span className="font-semibold text-text-secondary mr-1">
              {locale === 'th' ? 'การยืนยัน:' : 'Verification:'}
            </span>
            <div className="flex rounded-md bg-bg-secondary p-0.5 border border-text-secondary/10">
              <button
                onClick={() => setVerifiedFilter('all')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  verifiedFilter === 'all' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {locale === 'th' ? 'ทั้งหมด' : 'All'}
              </button>
              <button
                onClick={() => setVerifiedFilter('verified')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  verifiedFilter === 'verified' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {locale === 'th' ? 'ยืนยันแล้ว' : 'Verified'}
              </button>
            </div>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-text-secondary" />
            <span className="font-semibold text-text-secondary mr-1">
              {locale === 'th' ? 'ระดับนักพัฒนา:' : 'Level:'}
            </span>
            <div className="flex flex-wrap rounded-md bg-bg-secondary p-0.5 border border-text-secondary/10">
              {['all', 'bronze', 'silver', 'gold', 'platinum', 'elite'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors capitalize ${
                    levelFilter === lvl ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lvl === 'all' ? (locale === 'th' ? 'ทั้งหมด' : 'All') : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid count display */}
      <div className="text-xs text-text-secondary font-medium">
        {locale === 'th'
          ? `พบนักพัฒนาทั้งหมด ${filteredAndSortedDevelopers.length} คน`
          : `Showing ${filteredAndSortedDevelopers.length} developers`}
      </div>

      {/* Developers List/Grid */}
      {filteredAndSortedDevelopers.length === 0 ? (
        <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-16 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-text-secondary/10 text-text-secondary">
            <ListFilter className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">
            {locale === 'th' ? 'ไม่พบข้อมูลตามเงื่อนไข' : 'No Developers Found'}
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
            {locale === 'th'
              ? 'ลองปรับคำค้นหาหรือตัวกรองเพื่อเรียกดูข้อมูลนักพัฒนาใหม่อีกครั้ง'
              : 'Try clearing some filters or search query to list developers.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedDevelopers.map((dev) => (
            <DeveloperCard key={dev.id} developer={dev} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
