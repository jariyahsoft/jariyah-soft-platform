'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, Shield, UserRound } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

type AdminUser = {
  id: string;
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
};

function formatDate(value?: string, locale = 'th') {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US');
}

export default function AdminUsersPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, isAtLeast, loading: authLoading } = useAuth();
  const [searchType, setSearchType] = useState('name');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAtLeast('admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAtLeast, router]);

  const fetchUsers = useCallback(async () => {
    if (!user || !isAtLeast('admin')) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ type: searchType, limit: '50' });
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to load users');
      setUsers(body.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [user, isAtLeast, searchType, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-text-secondary">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!isAtLeast('admin')) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="elite" size="md">
              <Shield className="mr-1 h-3.5 w-3.5" />
              Admin only
            </Badge>
            <h1 className="mt-3 text-3xl font-black text-text-primary">
              {locale === 'th' ? 'จัดการผู้ใช้งาน' : 'User Management'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">
              {locale === 'th'
                ? 'ค้นหา ดูรายละเอียด และจัดการ role/status ของผู้ใช้งานผ่าน privileged API'
                : 'Search, inspect, and manage user roles and status through privileged APIs.'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'th' ? 'ค้นหาผู้ใช้งาน' : 'Search Users'}</CardTitle>
            <CardDescription>
              {locale === 'th'
                ? 'UID และ email ค้นหาแบบ exact match ส่วน display name ค้นหาแบบ prefix'
                : 'UID and email use exact matching; display name uses prefix matching.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[180px_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                void fetchUsers();
              }}
            >
              <Select
                label={locale === 'th' ? 'ชนิดการค้นหา' : 'Search by'}
                value={searchType}
                onChange={(event) => setSearchType(event.target.value)}
                options={[
                  { value: 'name', label: locale === 'th' ? 'ชื่อที่แสดง' : 'Display name' },
                  { value: 'email', label: 'Email' },
                  { value: 'uid', label: 'UID' },
                ]}
              />
              <Input
                label={locale === 'th' ? 'คำค้นหา' : 'Query'}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                iconLeft={<Search className="h-4 w-4" />}
                placeholder={searchType === 'uid' ? 'firebase uid' : searchType === 'email' ? 'user@example.com' : 'Display name'}
              />
              <div className="flex items-end">
                <Button type="submit" loading={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {locale === 'th' ? 'ค้นหา' : 'Search'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <ErrorState
            title={locale === 'th' ? 'โหลดรายชื่อไม่สำเร็จ' : 'Unable to load users'}
            message={error}
            onRetry={() => void fetchUsers()}
          />
        ) : loading ? (
          <div className="rounded-lg bg-bg-card p-8 text-center text-text-secondary">
            {locale === 'th' ? 'กำลังโหลดผู้ใช้งาน...' : 'Loading users...'}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title={locale === 'th' ? 'ไม่พบผู้ใช้งาน' : 'No users found'}
            description={locale === 'th' ? 'ลองเปลี่ยนประเภทการค้นหาหรือคำค้นหา' : 'Try a different search type or query.'}
            icon={<UserRound className="h-12 w-12 text-text-secondary/50" />}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-text-secondary/5 text-text-secondary">
                    <tr>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ผู้ใช้' : 'User'}</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'สร้างเมื่อ' : 'Created'}</th>
                      <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'เข้าใช้ล่าสุด' : 'Last login'}</th>
                      <th className="px-6 py-4 font-semibold text-right">{locale === 'th' ? 'จัดการ' : 'Manage'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-secondary/10">
                    {users.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-text-secondary/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={item.displayName || item.email || item.id} src={item.photoURL} />
                            <div>
                              <div className="font-semibold text-text-primary">{item.displayName || 'Unnamed user'}</div>
                              <div className="mt-1 max-w-[220px] truncate font-mono text-xs text-text-secondary">{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{item.email || '-'}</td>
                        <td className="px-6 py-4">
                          <Badge variant={item.role === 'admin' ? 'elite' : item.role === 'moderator' ? 'info' : 'default'}>
                            {item.role || 'member'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={item.status === 'suspended' ? 'danger' : item.status === 'deleted' ? 'warning' : 'success'}>
                            {item.status || 'active'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{formatDate(item.createdAt, locale)}</td>
                        <td className="px-6 py-4 text-text-secondary">{formatDate(item.lastLoginAt, locale)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/dashboard/admin/users/${item.id}`}>
                            <Button variant="secondary" size="sm">
                              {locale === 'th' ? 'เปิด' : 'Open'}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
