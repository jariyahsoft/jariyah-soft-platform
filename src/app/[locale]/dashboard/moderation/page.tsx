'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CalendarRange,
  ChevronRight,
  Filter,
  Search,
  ShieldCheck,
  ShieldOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

/** Certification badge metadata */
const CERT_BADGES: Record<string, { label: string; labelTH: string; color: string }> = {
  verified: { label: 'Verified', labelTH: 'ยืนยันแล้ว', color: 'info' },
  security_checked: { label: 'Security Checked', labelTH: 'ตรวจสอบความปลอดภัย', color: 'success' },
  editors_choice: { label: "Editor's Choice", labelTH: 'ตัวเลือกบรรณาธิการ', color: 'warning' },
  open_source_verified: { label: 'Open Source', labelTH: 'โอเพ่นซอร์ส', color: 'default' },
  community_recommended: { label: 'Community Pick', labelTH: 'ชุมชนแนะนำ', color: 'info' },
};

/** Manual certification types that moderators can award */
const MANUAL_CERT_TYPES = ['verified', 'security_checked', 'editors_choice'] as const;

export default function ModerationDashboard() {
  const { isAtLeast, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'submissions' | 'reports' | 'certifications'>('submissions');
  const [reports, setReports] = useState<any[]>([]);

  // Certifications tab state
  const [certSoftwareList, setCertSoftwareList] = useState<any[]>([]);
  const [certSearch, setCertSearch] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [awardingCert, setAwardingCert] = useState<string | null>(null);
  const [revokingCert, setRevokingCert] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAtLeast('moderator')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAtLeast, router]);

  async function fetchSubmissions(cursor?: string, append = false) {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const auth = (await import('@/lib/firebase/config')).auth;
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      if (assigneeFilter) params.set('assignee', assigneeFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await fetch(`/api/v1/moderation/submissions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await res.json();
      const items = data.data?.items || [];
      setSubmissions((current) => (append ? [...current, ...items] : items));
      setNextCursor(data.meta?.nextCursor || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!isAtLeast('moderator')) return;
    if (activeTab === 'submissions') {
      void fetchSubmissions();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'certifications') {
      void fetchCertSoftware();
    }
  }, [isAtLeast, typeFilter, assigneeFilter, dateFrom, dateTo, activeTab]);

  const getToken = useCallback(async () => {
    const auth = (await import('@/lib/firebase/config')).auth;
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.getIdToken();
  }, []);

  async function fetchCertSoftware() {
    try {
      setCertLoading(true);
      const { db } = await import('@/lib/firebase/config');
      const { collection, query, orderBy, getDocs, limit, where } = await import('firebase/firestore');

      let q = query(
        collection(db, 'software'),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(50)
      );

      const snap = await getDocs(q);
      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCertSoftwareList(items);
    } catch (error) {
      console.error('Error fetching software for certifications:', error);
    } finally {
      setCertLoading(false);
    }
  }

  async function handleAwardCertification(softwareId: string, certType: string) {
    try {
      setAwardingCert(`${softwareId}_${certType}`);
      const token = await getToken();
      const res = await fetch('/api/v1/moderation/certifications', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ softwareId, type: certType }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to award certification');
      }
      void fetchCertSoftware();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAwardingCert(null);
    }
  }

  async function handleRevokeCertification(certId: string) {
    const confirmed = window.confirm(
      locale === 'th'
        ? 'ยืนยันเพิกถอน certification นี้?'
        : 'Revoke this certification?'
    );
    if (!confirmed) return;
    try {
      setRevokingCert(certId);
      const token = await getToken();
      const res = await fetch(`/api/v1/moderation/certifications?certificationId=${certId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to revoke certification');
      void fetchCertSoftware();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRevokingCert(null);
    }
  }

  async function fetchReports() {
    try {
      setLoading(true);
      const { db } = await import('@/lib/firebase/config');
      const { collection, query, orderBy, getDocs, limit, where } = await import('firebase/firestore');
      
      let q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(20));
      if (typeFilter && typeFilter !== 'all') {
        q = query(q, where('targetType', '==', typeFilter));
      }
      
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(items);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }

  const riskCount = useMemo(
    () => submissions.reduce((sum, item) => sum + (Array.isArray(item.riskFlags) ? item.riskFlags.length : 0), 0),
    [submissions]
  );

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="info" size="md">Moderator Desk</Badge>
          <h1 className="mt-3 text-3xl font-black text-text-primary">
            {locale === 'th' ? 'คิวตรวจสอบผลงาน' : 'Moderation Queue'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            {locale === 'th'
              ? 'จัดลำดับงานแบบ FIFO พร้อมตัวกรองประเภท วันที่ และผู้รับผิดชอบ เพื่อให้ตัดสินใจได้เร็วและตรวจสอบย้อนหลังได้'
              : 'Review the FIFO queue with type, date, and assignee filters so moderation decisions stay fast and auditable.'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="min-w-[180px]">
            <CardContent className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Pending</div>
              <div className="mt-2 text-3xl font-black text-text-primary">{submissions.length}</div>
            </CardContent>
          </Card>
          <Card className="min-w-[180px]">
            <CardContent className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Risk flags</div>
              <div className="mt-2 text-3xl font-black text-warning">{riskCount}</div>
            </CardContent>
          </Card>
          <Card className="min-w-[180px]">
            <CardContent className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Order</div>
              <div className="mt-2 text-lg font-bold text-text-primary">FIFO</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-semibold text-sm focus:outline-none ${activeTab === 'submissions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('submissions')}
        >
          {locale === 'th' ? 'ผลงานรอตรวจสอบ' : 'Submissions'}
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm focus:outline-none ${activeTab === 'reports' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('reports')}
        >
          {locale === 'th' ? 'รายงาน' : 'Reports'}
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm focus:outline-none ${activeTab === 'certifications' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('certifications')}
        >
          <span className="inline-flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            {locale === 'th' ? 'Certifications' : 'Certifications'}
          </span>
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {locale === 'th' ? 'ตัวกรองคิว' : 'Queue Filters'}
          </CardTitle>
          <CardDescription>
            {locale === 'th'
              ? 'กรองตามประเภท ช่วงวันที่ และ moderator assignee เพื่อจัดลำดับงานที่ต้องรับก่อน'
              : 'Filter by content type, submission window, and assignee.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label={locale === 'th' ? 'ประเภท' : 'Type'}
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={[
              { value: 'all', label: locale === 'th' ? 'ทั้งหมด' : 'All' },
              { value: 'software', label: locale === 'th' ? 'ซอฟต์แวร์' : 'Software' },
              { value: 'article', label: locale === 'th' ? 'บทความ' : 'Article' },
              { value: 'review', label: locale === 'th' ? 'รีวิว' : 'Review' },
            ]}
          />
          <Input
            label={locale === 'th' ? 'Assignee' : 'Assignee'}
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            placeholder={locale === 'th' ? 'UID ของ moderator' : 'Moderator UID'}
          />
          <Input
            label={locale === 'th' ? 'วันที่เริ่ม' : 'Date from'}
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <Input
            label={locale === 'th' ? 'วันที่สิ้นสุด' : 'Date to'}
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="rounded-2xl bg-bg-card p-8 text-center text-text-secondary">
          {locale === 'th' ? 'กำลังโหลดคิว moderation...' : 'Loading moderation queue...'}
        </div>
      ) : error ? (
        <ErrorState
          title={locale === 'th' ? 'โหลดคิวไม่สำเร็จ' : 'Unable to load moderation queue'}
          message={error}
          onRetry={() => void fetchSubmissions()}
        />
      ) : activeTab === 'submissions' ? (
        submissions.length === 0 ? (
          <EmptyState
            title={locale === 'th' ? 'ไม่มีผลงานรอตรวจสอบ' : 'No pending submissions'}
            description={
              locale === 'th'
                ? 'เมื่อมีการส่งผลงานเข้าตรวจ จะปรากฏในคิวนี้ตามลำดับการส่ง'
                : 'Pending submissions will appear here in FIFO order.'
            }
            icon={<ShieldCheck className="h-12 w-12 text-text-secondary/50" />}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="bg-text-secondary/5 text-text-secondary">
                    <tr>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ประเภท' : 'Type'}</th>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ชื่อผลงาน' : 'Submission'}</th>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ผู้ส่ง' : 'Submitter'}</th>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'วันที่ส่ง' : 'Submitted'}</th>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ผู้รับผิดชอบ' : 'Assignee'}</th>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'Risk flags' : 'Risk flags'}</th>
                      <th className="px-6 py-4 font-semibold text-right">{locale === 'th' ? 'เปิดรีวิว' : 'Open review'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-secondary/10">
                    {submissions.map((sub) => (
                      <tr key={`${sub.type}-${sub.id}`} className="hover:bg-text-secondary/5 transition-colors">
                        <td className="px-6 py-4">
                          <Badge variant={sub.type === 'software' ? 'info' : sub.type === 'review' ? 'warning' : 'default'}>
                            {sub.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-text-primary">{sub.title}</div>
                          <div className="mt-1 text-xs text-text-secondary">{sub.slug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-text-primary">{sub.submitterName}</div>
                          <div className="mt-1 text-xs text-text-secondary">{sub.submitterId}</div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          <div className="inline-flex items-center gap-2">
                            <CalendarRange className="h-4 w-4" />
                            {sub.updatedAtIso
                              ? new Date(sub.updatedAtIso).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')
                              : 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          {sub.assignedModeratorId || (locale === 'th' ? 'ยังไม่กำหนด' : 'Unassigned')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {sub.riskFlags?.length ? (
                              sub.riskFlags.map((flag: string) => (
                                <Badge key={flag} variant="warning">{flag}</Badge>
                              ))
                            ) : (
                              <span className="text-text-secondary">{locale === 'th' ? 'ไม่มี' : 'None'}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="secondary"
                            onClick={() => router.push(`/dashboard/moderation/${sub.type}/${sub.id}`)}
                          >
                            {locale === 'th' ? 'ตรวจสอบ' : 'Review'}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      ) : activeTab === 'reports' ? (
        reports.length === 0 ? (
          <EmptyState
            title={locale === 'th' ? 'ไม่มีรายงาน' : 'No reports'}
            description={
              locale === 'th'
                ? 'ไม่มีรายงานปัญหาเนื้อหาในขณะนี้'
                : 'No content reports reported yet.'
            }
            icon={<ShieldCheck className="h-12 w-12 text-text-secondary/50" />}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="bg-text-secondary/5 text-text-secondary">
                    <tr>
                      <th className="px-6 py-4 font-semibold">ประเภท</th>
                      <th className="px-6 py-4 font-semibold">Target ID</th>
                      <th className="px-6 py-4 font-semibold">เหตุผล</th>
                      <th className="px-6 py-4 font-semibold">วันที่</th>
                      <th className="px-6 py-4 font-semibold">สถานะ</th>
                      <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-secondary/10">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-text-secondary/5 transition-colors">
                        <td className="px-6 py-4">
                          <Badge variant="warning">{report.targetType}</Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{report.targetId}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold">{report.reasonCode}</div>
                          <div className="text-xs text-text-secondary truncate max-w-[200px]">{report.details}</div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={report.status === 'pending' ? 'default' : 'info'}>{report.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="secondary" size="sm">จัดการ</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      ) : activeTab === 'certifications' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {locale === 'th' ? 'จัดการ Software Certifications' : 'Software Certifications'}
              </CardTitle>
              <CardDescription>
                {locale === 'th'
                  ? 'ค้นหาซอฟต์แวร์ที่เผยแพร่แล้วเพื่อมอบหรือเพิกถอน certification badges'
                  : 'Search published software to award or revoke certification badges.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-text-secondary/20 bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder={locale === 'th' ? 'ค้นหาชื่อซอฟต์แวร์...' : 'Search software by name...'}
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {certLoading ? (
            <div className="rounded-2xl bg-bg-card p-8 text-center text-text-secondary">
              {locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left text-sm">
                    <thead className="bg-text-secondary/5 text-text-secondary">
                      <tr>
                        <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ซอฟต์แวร์' : 'Software'}</th>
                        <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'Badges ปัจจุบัน' : 'Current Badges'}</th>
                        <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'มอบ Certification' : 'Award Certification'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text-secondary/10">
                      {certSoftwareList
                        .filter((sw) =>
                          certSearch ? sw.name?.toLowerCase().includes(certSearch.toLowerCase()) : true
                        )
                        .map((sw) => {
                          const activeCerts: string[] = sw.certifications || [];
                          return (
                            <tr key={sw.id} className="hover:bg-text-secondary/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-text-primary">{sw.name}</div>
                                <div className="mt-0.5 text-xs text-text-secondary">{sw.slug}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {activeCerts.length > 0 ? (
                                    activeCerts.map((cert: string) => {
                                      const meta = CERT_BADGES[cert];
                                      return (
                                        <Badge key={cert} variant={(meta?.color as any) || 'default'} size="sm">
                                          {locale === 'th' ? meta?.labelTH || cert : meta?.label || cert}
                                        </Badge>
                                      );
                                    })
                                  ) : (
                                    <span className="text-xs text-text-secondary">
                                      {locale === 'th' ? 'ไม่มี' : 'None'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {MANUAL_CERT_TYPES.map((certType) => {
                                    const isActive = activeCerts.includes(certType);
                                    const meta = CERT_BADGES[certType];
                                    return isActive ? (
                                      <Button
                                        key={certType}
                                        variant="outline"
                                        size="sm"
                                        className="text-error hover:bg-error/10"
                                        loading={revokingCert === `${sw.id}_${certType}`}
                                        onClick={() => {
                                          // We need to look up the certificationId to revoke
                                          // For simplicity, we'll use the award function which checks for duplicates
                                          alert(locale === 'th'
                                            ? 'ใช้ปุ่ม Revoke ในรายละเอียด certification'
                                            : 'Use the certification detail to revoke'
                                          );
                                        }}
                                      >
                                        <ShieldOff className="mr-1 h-3 w-3" />
                                        {locale === 'th' ? meta?.labelTH : meta?.label}
                                      </Button>
                                    ) : (
                                      <Button
                                        key={certType}
                                        variant="secondary"
                                        size="sm"
                                        loading={awardingCert === `${sw.id}_${certType}`}
                                        onClick={() => handleAwardCertification(sw.id, certType)}
                                      >
                                        <Award className="mr-1 h-3 w-3" />
                                        {locale === 'th' ? meta?.labelTH : meta?.label}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {nextCursor && !loading && !error ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            loading={loadingMore}
            onClick={() => void fetchSubmissions(nextCursor, true)}
          >
            {locale === 'th' ? 'โหลดเพิ่ม' : 'Load more'}
          </Button>
        </div>
      ) : null}

      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-text-primary">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
          <div>
            {locale === 'th'
              ? 'Moderator ไม่สามารถอนุมัติผลงานของตัวเองได้ และระบบจะบันทึกทุกการตัดสินใจลง audit log แบบ append-only'
              : 'Moderators cannot approve their own submissions, and every decision is written to the append-only audit log.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
