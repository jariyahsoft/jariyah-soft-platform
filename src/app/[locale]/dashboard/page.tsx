'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useLocale } from 'next-intl';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Link } from '@/i18n/routing';
import { 
  PlusCircle, FileText, User, Star, Download, Users, 
  Clock, AlertCircle, Bell, ArrowRight, ShieldCheck, Key, LogOut 
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ReputationBadge } from '@/components/software/ReputationBadge';
import { useToast } from '@/components/ui/Toast';

export default function DashboardHomePage() {
  const locale = useLocale();
  const { toast } = useToast();
  
  // Guard the route - require user to be logged in
  const { loading: guardLoading, isAuthenticated } = useAuthGuard();
  const { user, role, signOut } = useAuth();

  // Profile data
  const [developerData, setDeveloperData] = useState<any>(null);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [newFollowersCount, setNewFollowersCount] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);

  // Loading states
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardStats = async () => {
      try {
        setIsDataLoading(true);
        const uid = user.uid;

        // 1. Fetch Developer document
        const devDocs = await getDocs(query(collection(db, 'developers'), where('slug', '>=', '')));
        // Find specifically for current developer
        const currentDevDoc = devDocs.docs.find(doc => doc.id === uid);
        const devData = currentDevDoc ? currentDevDoc.data() : null;
        setDeveloperData(devData);

        // 2. Fetch Software to calculate downloads and pending items
        const softwareSnap = await getDocs(query(collection(db, 'software'), where('ownerId', '==', uid)));
        let downloadsSum = 0;
        let pendingSoftCount = 0;

        softwareSnap.docs.forEach((doc) => {
          const data = doc.data();
          downloadsSum += Number(data.downloadCount ?? 0);
          if (data.status === 'pending' || data.status === 'moderation') {
            pendingSoftCount++;
          }
        });
        setTotalDownloads(downloadsSum);

        // 3. Fetch Articles to calculate pending items
        const articlesSnap = await getDocs(query(collection(db, 'articles'), where('authorId', '==', uid)));
        let pendingArtCount = 0;
        articlesSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'pending' || data.status === 'moderation') {
            pendingArtCount++;
          }
        });
        setPendingSubmissions(pendingSoftCount + pendingArtCount);

        // 4. Fetch Follows to calculate new followers this week
        const followsSnap = await getDocs(query(collection(db, 'follows'), where('targetId', '==', uid), where('targetType', '==', 'developer')));
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentFollowers = followsSnap.docs.filter((doc) => {
          const data = doc.data();
          const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          return date.getTime() >= oneWeekAgo;
        }).length;
        setNewFollowersCount(recentFollowers);

        // 5. Fetch Recent Activities / Notifications (limit 5)
        const notificationsSnap = await getDocs(
          query(
            collection(db, 'notifications'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(5)
          )
        );
        const notifs = notificationsSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            body: data.body || '',
            readAt: data.readAt || null,
            createdAtIso: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          };
        });
        setActivities(notifs);

      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
        // Silently catch query indexes errors or initialization errors
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast(locale === 'th' ? 'ออกจากระบบสำเร็จ' : 'Logged out successfully', 'success');
    } catch (_) {
      toast(locale === 'th' ? 'เกิดข้อผิดพลาดในการออกจากระบบ' : 'Failed to sign out', 'error');
    }
  };

  if (guardLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  const isDeveloper = role === 'developer' || role === 'moderator' || role === 'admin';
  const displayName = developerData?.displayName || user?.displayName || user?.email || 'Developer';
  const reputationScore = Number(developerData?.reputationScore ?? 0);
  const isVerified = developerData?.verificationStatus === 'verified';
  const devSlug = developerData?.slug || '';

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Top Header Card */}
        <section className="relative overflow-hidden rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
          {/* subtle decorative background gradient */}
          <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent/5 blur-3xl" />

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={displayName} src={user?.photoURL || undefined} size="lg" className="rounded-xl border border-text-secondary/5" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-text-primary">
                    {locale === 'th' ? `สวัสดี, ${displayName}` : `Welcome back, ${displayName}`}
                  </h1>
                  {isVerified && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white" title="Verified Developer">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant={role === 'admin' ? 'elite' : role === 'developer' ? 'gold' : 'default'} size="sm">
                    {role}
                  </Badge>
                  {isDeveloper && <ReputationBadge score={reputationScore} size="sm" />}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center self-start md:self-center px-4 py-2 border border-text-secondary/10 rounded-xl shadow-sm text-xs font-semibold text-danger bg-bg-secondary hover:bg-danger/5 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              {locale === 'th' ? 'ออกจากระบบ' : 'Sign Out'}
            </button>
          </div>
        </section>

        {/* Quick Action Buttons Grid */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Link href="/dashboard/software/new" className="group flex items-center justify-between p-4 rounded-xl border border-text-secondary/10 bg-bg-card hover:border-accent/30 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/5 text-accent group-hover:scale-105 transition-transform">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-text-primary">{locale === 'th' ? 'เพิ่มผลงานใหม่' : 'Add Software'}</span>
                <span className="text-[11px] text-text-secondary">{locale === 'th' ? 'เผยแพร่โปรแกรมของคุณ' : 'Publish a new tool'}</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link href="/dashboard/articles/new" className="group flex items-center justify-between p-4 rounded-xl border border-text-secondary/10 bg-bg-card hover:border-accent/30 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-warning/5 text-warning group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-text-primary">{locale === 'th' ? 'เขียนบทความใหม่' : 'Write Article'}</span>
                <span className="text-[11px] text-text-secondary">{locale === 'th' ? 'แชร์ความรู้ให้ชุมชน' : 'Write knowledge base'}</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {isDeveloper && devSlug ? (
            <Link href={`/developers/${devSlug}`} className="group flex items-center justify-between p-4 rounded-xl border border-text-secondary/10 bg-bg-card hover:border-accent/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-success/5 text-success group-hover:scale-105 transition-transform">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-text-primary">{locale === 'th' ? 'ดูโปรไฟล์สาธารณะ' : 'View Public Profile'}</span>
                  <span className="text-[11px] text-text-secondary">{locale === 'th' ? 'เปิดดูหน้ารายละเอียดของคุณ' : 'Check developer page'}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ) : (
            <Link href="/dashboard/profile" className="group flex items-center justify-between p-4 rounded-xl border border-text-secondary/10 bg-bg-card hover:border-accent/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-success/5 text-success group-hover:scale-105 transition-transform">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-text-primary">{locale === 'th' ? 'ตั้งค่าโปรไฟล์นักพัฒนา' : 'Onboard Profile'}</span>
                  <span className="text-[11px] text-text-secondary">{locale === 'th' ? 'กรอกข้อมูลสลักและทักษะ' : 'Create public slug/skills'}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
        </section>

        {/* Developer Stats Row */}
        {isDeveloper && (
          <section className="grid gap-4 sm:grid-cols-3">
            {/* Total Downloads */}
            <div className="rounded-xl border border-text-secondary/10 bg-bg-card p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">{locale === 'th' ? 'ดาวน์โหลดทั้งหมด' : 'Total Downloads'}</span>
                <span className="block mt-1 text-2xl font-black text-text-primary">{totalDownloads.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-accent/5 text-accent">
                <Download className="h-6 w-6" />
              </div>
            </div>

            {/* Followers this week */}
            <div className="rounded-xl border border-text-secondary/10 bg-bg-card p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">{locale === 'th' ? 'ผู้ติดตามใหม่สัปดาห์นี้' : 'New Followers This Week'}</span>
                <span className="block mt-1 text-2xl font-black text-text-primary">+{newFollowersCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-pink-500/5 text-pink-500">
                <Users className="h-6 w-6" />
              </div>
            </div>

            {/* Pending submissions */}
            <div className="rounded-xl border border-text-secondary/10 bg-bg-card p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">{locale === 'th' ? 'อยู่ระหว่างตรวจสอบ' : 'Pending Submissions'}</span>
                <span className="block mt-1 text-2xl font-black text-text-primary">{pendingSubmissions}</span>
              </div>
              <div className="p-3 rounded-xl bg-warning/5 text-warning">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </section>
        )}

        {/* Lower Content Columns */}
        <section className="grid gap-6 md:grid-cols-3">
          
          {/* Activity / Notification Feed (Span 2) */}
          <div className="md:col-span-2 rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-text-secondary/5 pb-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                {locale === 'th' ? 'กิจกรรมล่าสุดและการแจ้งเตือน' : 'Recent Activity & Notifications'}
              </h2>
              <Link href="/dashboard/notifications" className="text-xs font-bold text-accent hover:text-accent-hover transition-colors">
                {locale === 'th' ? 'ดูทั้งหมด' : 'View All'}
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-secondary">
                {locale === 'th' ? 'ไม่มีกิจกรรมการแจ้งเตือนในขณะนี้' : 'No recent activities or notifications.'}
              </div>
            ) : (
              <div className="divide-y divide-text-secondary/5">
                {activities.map((item) => (
                  <div key={item.id} className={`py-3 flex items-start justify-between gap-3 ${!item.readAt ? 'font-semibold' : ''}`}>
                    <div className="space-y-1">
                      <p className="text-sm text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-secondary font-normal">{item.body}</p>
                      <p className="text-[10px] text-text-secondary/60 font-normal">
                        {new Date(item.createdAtIso).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}
                      </p>
                    </div>
                    {!item.readAt && (
                      <span className="h-2.5 w-2.5 rounded-full bg-accent mt-1.5 shrink-0" title="Unread" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Menu Navigation */}
          <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-text-primary">
              {locale === 'th' ? 'เมนูควบคุมแดชบอร์ด' : 'Dashboard Menu'}
            </h2>
            
            <nav aria-label="Dashboard Side Navigation" className="flex flex-col gap-2.5 text-sm font-semibold text-text-secondary">
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-text-secondary/5 hover:text-text-primary transition-all">
                <User className="h-4.5 w-4.5" />
                <span>{locale === 'th' ? 'จัดการโปรไฟล์นักพัฒนา' : 'Developer Profile Settings'}</span>
              </Link>
              
              <Link href="/dashboard/api-keys" className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-text-secondary/5 hover:text-text-primary transition-all">
                <Key className="h-4.5 w-4.5" />
                <span>{locale === 'th' ? 'การตั้งค่า API Keys' : 'API Key Management'}</span>
              </Link>

              {role === 'moderator' || role === 'admin' ? (
                <Link href="/dashboard/moderation" className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-text-secondary/5 hover:text-text-primary transition-all">
                  <ShieldCheck className="h-4.5 w-4.5 text-accent" />
                  <span>{locale === 'th' ? 'โต๊ะพิจารณาผลงาน (Moderation)' : 'Moderation Desk'}</span>
                </Link>
              ) : null}
            </nav>
          </div>

        </section>

      </div>
    </main>
  );
}
