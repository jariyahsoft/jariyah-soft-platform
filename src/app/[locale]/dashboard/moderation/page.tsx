'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, ChevronRight, Filter, ShieldCheck } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'submissions' | 'reports'>('submissions');
  const [reports, setReports] = useState<any[]>([]);

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
    } else {
      fetchReports();
    }
  }, [isAtLeast, typeFilter, assigneeFilter, dateFrom, dateTo, activeTab]);

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
      ) : (
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
      )}

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
