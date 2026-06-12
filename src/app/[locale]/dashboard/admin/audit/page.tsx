'use client';

import React, { useEffect, useState } from 'react';
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

export default function AdminAuditLogsPage() {
  const { isAtLeast, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAtLeast('admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAtLeast, router]);

  const fetchLogs = async (cursor?: string, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const auth = (await import('@/lib/firebase/config')).auth;
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      
      const queryParams = new URLSearchParams();
      if (actor) queryParams.append('actor', actor);
      if (action) queryParams.append('action', action);
      if (resourceType) queryParams.append('resourceType', resourceType);
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);
      if (cursor) queryParams.append('cursor', cursor);
      
      const res = await fetch(`/api/v1/admin/audit-logs?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await res.json();
      const items = data.data?.items || [];
      setLogs((current) => (append ? [...current, ...items] : items));
      setNextCursor(data.meta?.nextCursor || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isAtLeast('admin')) return;
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAtLeast, actor, action, resourceType, dateFrom, dateTo]);

  if (authLoading) return <DashboardLayout><div className="p-8 text-center">Loading...</div></DashboardLayout>;
  if (!isAtLeast('admin')) return null;

  const content = (
    <div className="space-y-6">
      <div>
        <Badge variant="info" size="md">Admin only</Badge>
        <h1 className="mt-3 text-3xl font-black text-text-primary">
          {locale === 'th' ? 'ประวัติการใช้งาน (Audit Logs)' : 'Audit Logs'}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {locale === 'th'
            ? 'หน้า read-only สำหรับตรวจสอบทุก moderation decision แบบ append-only พร้อม filter และ cursor pagination'
            : 'Read-only, append-only moderation audit history with filtering and cursor pagination.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === 'th' ? 'ตัวกรอง' : 'Filters'}</CardTitle>
          <CardDescription>
            {locale === 'th' ? 'กรองตาม actor, action, resource type และช่วงวันที่' : 'Filter by actor, action, resource type, and date range.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Actor"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="UID"
          />
          <Select
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            options={[
              { value: '', label: 'All actions' },
              { value: 'approve', label: 'Approve' },
              { value: 'reject', label: 'Reject' },
            ]}
          />
          <Select
            label="Resource type"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            options={[
              { value: '', label: 'All types' },
              { value: 'software', label: 'Software' },
              { value: 'article', label: 'Article' },
            ]}
          />
          <Input
            label={locale === 'th' ? 'วันที่เริ่ม' : 'Date from'}
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label={locale === 'th' ? 'วันที่สิ้นสุด' : 'Date to'}
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-8 text-center text-text-secondary">Loading logs...</div>
      ) : error ? (
        <ErrorState
          title={locale === 'th' ? 'โหลด audit log ไม่สำเร็จ' : 'Unable to load audit logs'}
          message={error}
          onRetry={() => void fetchLogs()}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          title={locale === 'th' ? 'ไม่พบ audit log' : 'No audit logs found'}
          description={locale === 'th' ? 'ลองปรับตัวกรองหรือช่วงวันที่' : 'Try adjusting the filters or date range.'}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-text-secondary/5 text-text-secondary">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Timestamp</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Actor</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Action</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Resource type</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Resource ID</th>
                    <th className="px-6 py-4 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text-secondary/10">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-text-secondary/5 transition-colors">
                      <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp._seconds * 1000).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US') : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{log.actorId || log.moderatorId}</td>
                      <td className="px-6 py-4">
                        <Badge variant={log.action === 'approve' ? 'success' : log.action === 'reject' ? 'danger' : 'default'}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{log.resourceType}</td>
                      <td className="px-6 py-4 font-mono text-xs">{log.resourceId}</td>
                      <td className="px-6 py-4 text-text-secondary max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {nextCursor && !loading && !error ? (
        <div className="flex justify-center">
          <Button variant="outline" loading={loadingMore} onClick={() => void fetchLogs(nextCursor, true)}>
            {locale === 'th' ? 'โหลดเพิ่ม' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
