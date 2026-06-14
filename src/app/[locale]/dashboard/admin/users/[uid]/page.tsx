'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Save, ShieldBan } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

type UserDetail = Record<string, unknown> & {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  status?: string;
};

type AuditLog = {
  id: string;
  timestamp?: string;
  actorId?: string;
  action?: string;
  reason?: string;
};

function formatDate(value?: string, locale = 'th') {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US');
}

export default function AdminUserDetailPage() {
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const locale = useLocale();
  const router = useRouter();
  const { user: actor, isAtLeast, loading: authLoading } = useAuth();

  const [targetUser, setTargetUser] = useState<UserDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('member');
  const [roleReason, setRoleReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const isSelf = actor?.uid === uid;

  useEffect(() => {
    if (!authLoading && !isAtLeast('admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAtLeast, router]);

  const loadUser = useCallback(async () => {
    if (!actor || !isAtLeast('admin')) return;
    setLoading(true);
    setError(null);
    try {
      const token = await actor.getIdToken();
      const res = await fetch(`/api/v1/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to load user');
      setTargetUser(body.data?.user || null);
      setAuditLogs(body.data?.auditLogs || []);
      setRole(body.data?.user?.role || 'member');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [actor, isAtLeast, uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUser();
  }, [loadUser]);

  const visibleFields = useMemo(() => {
    if (!targetUser) return [];
    return Object.entries(targetUser).sort(([a], [b]) => a.localeCompare(b));
  }, [targetUser]);

  async function callMutation(path: string, body: Record<string, unknown>) {
    if (!actor) return;
    const token = await actor.getIdToken();
    const res = await fetch(path, {
      method: path.endsWith('/role') ? 'POST' : 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error?.message || 'Request failed');
  }

  async function changeRole() {
    setSavingRole(true);
    try {
      await callMutation(`/api/v1/admin/users/${uid}/role`, { role, reason: roleReason });
      setRoleReason('');
      await loadUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Role change failed');
    } finally {
      setSavingRole(false);
    }
  }

  async function updateStatus(action: 'suspend' | 'reactivate') {
    setSavingStatus(true);
    try {
      await callMutation(`/api/v1/admin/users/${uid}/status`, {
        action,
        reason: suspendReason,
        durationDays: durationDays ? Number(durationDays) : null,
      });
      setSuspendReason('');
      setDurationDays('');
      await loadUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setSavingStatus(false);
    }
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[360px] items-center justify-center text-text-secondary">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          {locale === 'th' ? 'กำลังโหลดข้อมูลผู้ใช้...' : 'Loading user...'}
        </div>
      </DashboardLayout>
    );
  }

  if (!isAtLeast('admin')) return null;

  if (error || !targetUser) {
    return (
      <DashboardLayout>
        <ErrorState
          title={locale === 'th' ? 'เปิดรายละเอียดผู้ใช้ไม่สำเร็จ' : 'Unable to open user'}
          message={error || 'User not found'}
          onRetry={() => void loadUser()}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={targetUser.displayName || targetUser.email || uid} src={targetUser.photoURL} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-text-primary">{targetUser.displayName || 'Unnamed user'}</h1>
                <Badge variant={targetUser.role === 'admin' ? 'elite' : 'default'}>{targetUser.role || 'member'}</Badge>
                <Badge variant={targetUser.status === 'suspended' ? 'danger' : 'success'}>{targetUser.status || 'active'}</Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-text-secondary">{uid}</p>
              <p className="mt-1 text-sm text-text-secondary">{targetUser.email || '-'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard/admin/users')}>
            {locale === 'th' ? 'กลับรายชื่อ' : 'Back to users'}
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'ข้อมูลผู้ใช้ทั้งหมด' : 'User Fields'}</CardTitle>
                <CardDescription>
                  {locale === 'th' ? 'ข้อมูลจากเอกสาร users/{uid}' : 'Data from users/{uid}.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleFields.map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-text-secondary/10 bg-bg-secondary p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{key}</div>
                      <div className="mt-1 break-words text-sm text-text-primary">
                        {typeof value === 'object' && value !== null ? (
                          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          String(value ?? '-')
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'กิจกรรมล่าสุด' : 'Recent Activity'}</CardTitle>
                <CardDescription>{locale === 'th' ? 'Audit log ที่เกี่ยวข้องกับผู้ใช้นี้' : 'Audit entries for this user.'}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-text-secondary/5 text-text-secondary">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Time</th>
                        <th className="px-6 py-4 font-semibold">Actor</th>
                        <th className="px-6 py-4 font-semibold">Action</th>
                        <th className="px-6 py-4 font-semibold">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text-secondary/10">
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 text-text-secondary">{formatDate(log.timestamp, locale)}</td>
                          <td className="px-6 py-4 font-mono text-xs">{log.actorId || '-'}</td>
                          <td className="px-6 py-4">{log.action}</td>
                          <td className="px-6 py-4 text-text-secondary">{log.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'เปลี่ยน Role' : 'Change Role'}</CardTitle>
                <CardDescription>
                  {locale === 'th'
                    ? 'อัปเดต Auth custom claims และ Firestore พร้อม reconciliation flag'
                    : 'Updates Auth custom claims and Firestore with reconciliation tracking.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  options={[
                    { value: 'member', label: 'member' },
                    { value: 'developer', label: 'developer' },
                    { value: 'moderator', label: 'moderator' },
                    { value: 'admin', label: 'admin' },
                  ]}
                />
                <Input
                  label={locale === 'th' ? 'เหตุผล' : 'Reason'}
                  value={roleReason}
                  onChange={(event) => setRoleReason(event.target.value)}
                />
                <Button loading={savingRole} onClick={changeRole}>
                  <Save className="mr-2 h-4 w-4" />
                  {locale === 'th' ? 'บันทึก Role' : 'Save Role'}
                </Button>
                <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-text-secondary">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>
                    {locale === 'th'
                      ? 'Role ใหม่มีผลหลัง token refresh หรือภายในประมาณ 5 นาที'
                      : 'New roles take effect after token refresh or within about 5 minutes.'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'สถานะบัญชี' : 'Account Status'}</CardTitle>
                <CardDescription>
                  {isSelf
                    ? locale === 'th'
                      ? 'บัญชีนี้คือคุณ จึงไม่สามารถระงับจากหน้านี้'
                      : 'This is your account, so self-suspension is blocked.'
                    : locale === 'th'
                      ? 'Suspend จะ revoke refresh token ทันที'
                      : 'Suspend immediately revokes refresh tokens.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label={locale === 'th' ? 'เหตุผลการระงับ' : 'Suspend reason'}
                  value={suspendReason}
                  onChange={(event) => setSuspendReason(event.target.value)}
                  disabled={isSelf}
                />
                <Input
                  label={locale === 'th' ? 'ระยะเวลา (วัน)' : 'Duration (days)'}
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  disabled={isSelf}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="danger"
                    loading={savingStatus}
                    disabled={isSelf || targetUser.status === 'suspended'}
                    onClick={() => void updateStatus('suspend')}
                  >
                    <ShieldBan className="mr-2 h-4 w-4" />
                    {locale === 'th' ? 'ระงับ' : 'Suspend'}
                  </Button>
                  <Button
                    variant="secondary"
                    loading={savingStatus}
                    disabled={targetUser.status !== 'suspended'}
                    onClick={() => void updateStatus('reactivate')}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {locale === 'th' ? 'เปิดใช้งานใหม่' : 'Reactivate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
