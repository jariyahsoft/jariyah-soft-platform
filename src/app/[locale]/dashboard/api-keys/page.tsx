'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Plus,
  ShieldAlert,
  Trash2,
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

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  status: 'active' | 'revoked';
  rateLimitTier: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string | null;
  revokedAt: string | null;
}

export default function ApiKeysPage() {
  const { user, isAtLeast, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create key form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [creating, setCreating] = useState(false);

  // Newly created key display
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showFullKey, setShowFullKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Revoke
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAtLeast('developer')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAtLeast, router]);

  const getToken = useCallback(async () => {
    const auth = (await import('@/lib/firebase/config')).auth;
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.getIdToken();
  }, []);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const res = await fetch('/api/v1/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch API keys');
      const data = await res.json();
      setKeys(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!authLoading && isAtLeast('developer')) {
      void fetchKeys();
    }
  }, [authLoading, isAtLeast, fetchKeys]);

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      const token = await getToken();
      const body: Record<string, any> = { name: newKeyName.trim() };
      if (newKeyExpiry) {
        body.expiresInDays = parseInt(newKeyExpiry, 10);
      }

      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to create API key');
      }

      const data = await res.json();
      setNewlyCreatedKey(data.data.apiKey);
      setShowCreateForm(false);
      setNewKeyName('');
      setNewKeyExpiry('');
      void fetchKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    const confirmed = window.confirm(
      locale === 'th'
        ? 'ยืนยันเพิกถอน API key นี้? การกระทำนี้ไม่สามารถย้อนกลับได้'
        : 'Are you sure you want to revoke this API key? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setRevoking(keyId);
      const token = await getToken();
      const res = await fetch(`/api/v1/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to revoke key');
      void fetchKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRevoking(null);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy');
    }
  }

  const activeKeys = keys.filter((k) => k.status === 'active');

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="info" size="md">
            {locale === 'th' ? 'นักพัฒนา' : 'Developer'}
          </Badge>
          <h1 className="mt-3 text-3xl font-black text-text-primary">
            {locale === 'th' ? 'จัดการ API Keys' : 'API Keys Management'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            {locale === 'th'
              ? 'สร้างและจัดการ API keys สำหรับเข้าถึง Jariyah Soft Public API อย่างปลอดภัย'
              : 'Create and manage API keys for secure access to the Jariyah Soft Public API.'}
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(true);
            setNewlyCreatedKey(null);
          }}
          disabled={activeKeys.length >= 5}
        >
          <Plus className="mr-2 h-4 w-4" />
          {locale === 'th' ? 'สร้าง Key ใหม่' : 'Create New Key'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {locale === 'th' ? 'Keys ที่ใช้งานได้' : 'Active Keys'}
            </div>
            <div className="mt-2 text-3xl font-black text-text-primary">
              {activeKeys.length}
              <span className="ml-1 text-base font-normal text-text-secondary">/ 5</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {locale === 'th' ? 'ถูกเพิกถอน' : 'Revoked'}
            </div>
            <div className="mt-2 text-3xl font-black text-warning">
              {keys.filter((k) => k.status === 'revoked').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {locale === 'th' ? 'ระดับ Rate Limit' : 'Rate Limit Tier'}
            </div>
            <div className="mt-2 text-lg font-bold text-accent">Free — 60 req/min</div>
          </CardContent>
        </Card>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-success">
              <Key className="h-5 w-5" />
              {locale === 'th' ? 'API Key สร้างสำเร็จ!' : 'API Key Created Successfully!'}
            </div>
            <p className="mb-3 text-xs text-text-secondary">
              {locale === 'th'
                ? '⚠️ คัดลอก key นี้เดี๋ยวนี้ — จะไม่แสดงอีกครั้ง'
                : '⚠️ Copy this key now — it will NOT be shown again.'}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-bg-secondary px-4 py-2.5 font-mono text-sm text-text-primary">
                {showFullKey ? newlyCreatedKey : `${newlyCreatedKey.substring(0, 12)}${'•'.repeat(28)}`}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullKey((v) => !v)}
                title={showFullKey ? 'Hide' : 'Show'}
              >
                {showFullKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(newlyCreatedKey)}
              >
                {copied ? (
                  <Check className="mr-1 h-4 w-4 text-success" />
                ) : (
                  <Copy className="mr-1 h-4 w-4" />
                )}
                {copied ? (locale === 'th' ? 'คัดลอกแล้ว' : 'Copied') : (locale === 'th' ? 'คัดลอก' : 'Copy')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Key Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'th' ? 'สร้าง API Key ใหม่' : 'Create New API Key'}
            </CardTitle>
            <CardDescription>
              {locale === 'th'
                ? 'ตั้งชื่อ Key เพื่อให้จำแยกได้ง่าย และระบุวันหมดอายุ (ถ้าต้องการ)'
                : 'Give your key a memorable name and optionally set an expiration period.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label={locale === 'th' ? 'ชื่อ Key' : 'Key Name'}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder={locale === 'th' ? 'เช่น Production App' : 'e.g. Production App'}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="w-40">
                <Input
                  label={locale === 'th' ? 'หมดอายุ (วัน)' : 'Expires in (days)'}
                  type="number"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  placeholder="∞"
                  min={1}
                  max={365}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={creating}>
                  {locale === 'th' ? 'สร้าง Key' : 'Generate Key'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                  {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Key List */}
      {loading ? (
        <div className="rounded-2xl bg-bg-card p-8 text-center text-text-secondary">
          {locale === 'th' ? 'กำลังโหลด API Keys...' : 'Loading API Keys...'}
        </div>
      ) : error ? (
        <ErrorState
          title={locale === 'th' ? 'โหลด API Keys ไม่สำเร็จ' : 'Unable to load API keys'}
          message={error}
          onRetry={() => void fetchKeys()}
        />
      ) : keys.length === 0 ? (
        <EmptyState
          title={locale === 'th' ? 'ยังไม่มี API Keys' : 'No API Keys Yet'}
          description={
            locale === 'th'
              ? 'สร้าง API Key แรกเพื่อเริ่มต้นเข้าถึง Jariyah Soft API'
              : 'Create your first API key to start using the Jariyah Soft API.'
          }
          icon={<Key className="h-12 w-12 text-text-secondary/50" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-text-secondary/5 text-text-secondary">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ชื่อ' : 'Name'}</th>
                    <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'Key Prefix' : 'Key Prefix'}</th>
                    <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'สถานะ' : 'Status'}</th>
                    <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'สร้างเมื่อ' : 'Created'}</th>
                    <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'ใช้ล่าสุด' : 'Last Used'}</th>
                    <th className="px-6 py-4 font-semibold">{locale === 'th' ? 'หมดอายุ' : 'Expires'}</th>
                    <th className="px-6 py-4 font-semibold text-right">{locale === 'th' ? 'จัดการ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text-secondary/10">
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className={`transition-colors ${key.status === 'revoked' ? 'opacity-50' : 'hover:bg-text-secondary/5'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{key.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-bg-secondary px-2 py-1 text-xs font-mono">
                          {key.keyPrefix}••••
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={key.status === 'active' ? 'success' : 'warning'}>
                          {key.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {key.createdAt
                          ? new Date(key.createdAt).toLocaleDateString(
                              locale === 'th' ? 'th-TH' : 'en-US'
                            )
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleDateString(
                              locale === 'th' ? 'th-TH' : 'en-US'
                            )
                          : locale === 'th' ? 'ยังไม่ได้ใช้' : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {key.expiresAt
                          ? new Date(key.expiresAt).toLocaleDateString(
                              locale === 'th' ? 'th-TH' : 'en-US'
                            )
                          : '∞'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {key.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={revoking === key.id}
                            onClick={() => handleRevoke(key.id)}
                            className="text-error hover:bg-error/10"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {locale === 'th' ? 'เพิกถอน' : 'Revoke'}
                          </Button>
                        ) : (
                          <span className="text-xs text-text-secondary">
                            {key.revokedAt
                              ? new Date(key.revokedAt).toLocaleDateString(
                                  locale === 'th' ? 'th-TH' : 'en-US'
                                )
                              : locale === 'th' ? 'เพิกถอนแล้ว' : 'Revoked'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-text-primary">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            {locale === 'th'
              ? 'API Keys เป็นความลับ — ห้ามแชร์ ห้ามฝังในโค้ดฝั่ง client หากสงสัยว่ารั่วไหล ให้เพิกถอนทันทีและสร้างใหม่'
              : 'API Keys are secrets — never share them or embed in client-side code. If you suspect a key has been compromised, revoke it immediately and generate a new one.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
