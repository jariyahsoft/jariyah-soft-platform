'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Layers, Merge, Plus, Save, Settings2, Tag, TicketCheck } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

type MasterKey = 'categories' | 'tags' | 'badges' | 'licenses' | 'system-settings';

type MasterItem = Record<string, unknown> & {
  id: string;
  name?: string;
  slug?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  version?: number;
};

type MasterDraft = {
  name?: string;
  slug?: string;
  code?: string;
  description?: string;
  value?: string;
  criteria?: string;
  isActive?: boolean;
  version?: number;
};

const tabs: Array<{ key: MasterKey; icon: React.ReactNode; labelTH: string; labelEN: string }> = [
  { key: 'categories', icon: <Layers className="h-4 w-4" />, labelTH: 'Categories', labelEN: 'Categories' },
  { key: 'tags', icon: <Tag className="h-4 w-4" />, labelTH: 'Tags', labelEN: 'Tags' },
  { key: 'badges', icon: <Award className="h-4 w-4" />, labelTH: 'Badges', labelEN: 'Badges' },
  { key: 'licenses', icon: <TicketCheck className="h-4 w-4" />, labelTH: 'Licenses', labelEN: 'Licenses' },
  { key: 'system-settings', icon: <Settings2 className="h-4 w-4" />, labelTH: 'System Settings', labelEN: 'System Settings' },
];

function emptyDraft(key: MasterKey) {
  return {
    name: '',
    slug: key === 'licenses' || key === 'system-settings' ? undefined : '',
    code: key === 'licenses' || key === 'system-settings' ? '' : undefined,
    description: '',
    value: key === 'system-settings' ? '{}' : undefined,
    isActive: true,
  };
}

export default function AdminSettingsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, isAtLeast, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<MasterKey>('categories');
  const [items, setItems] = useState<MasterItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MasterDraft>(emptyDraft('categories'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');
  const [awardUid, setAwardUid] = useState('');

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || null, [items, selectedId]);

  useEffect(() => {
    if (!authLoading && !isAtLeast('admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAtLeast, router]);

  const loadItems = useCallback(async () => {
    if (!user || !isAtLeast('admin')) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/admin/master-data/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to load settings');
      setItems(body.data?.items || []);
      setSelectedId(null);
      setDraft(emptyDraft(activeTab));
      setMergeTarget('');
      setAwardUid('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user, isAtLeast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems]);

  function selectItem(item: MasterItem) {
    setSelectedId(item.id);
    setDraft({
      name: item.name || '',
      slug: item.slug || '',
      code: item.code || '',
      description: item.description || '',
      value: typeof item.value === 'object' ? JSON.stringify(item.value, null, 2) : String(item.value || ''),
      criteria: typeof item.criteria === 'object' ? JSON.stringify(item.criteria, null, 2) : String(item.criteria || ''),
      isActive: item.isActive !== false,
      version: Number(item.version || 1),
    });
  }

  function resetForm() {
    setSelectedId(null);
    setDraft(emptyDraft(activeTab));
    setMergeTarget('');
    setAwardUid('');
  }

  async function saveItem(action?: 'merge') {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const isEdit = Boolean(selectedId);
      const parsedValue =
        activeTab === 'system-settings' && draft.value
          ? JSON.parse(draft.value)
          : draft.value;
      const parsedCriteria =
        activeTab === 'badges' && draft.criteria
          ? JSON.parse(draft.criteria)
          : draft.criteria;

      const payload = {
        ...draft,
        value: parsedValue,
        criteria: parsedCriteria,
        action,
        mergedInto: action === 'merge' ? mergeTarget : undefined,
      };

      const res = await fetch(
        isEdit ? `/api/v1/admin/master-data/${activeTab}/${selectedId}` : `/api/v1/admin/master-data/${activeTab}`,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Save failed');
      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function awardBadge() {
    if (!user || !selectedId || !awardUid.trim()) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/admin/master-data/badges/${selectedId}/award`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: awardUid.trim(), reason: 'Manual admin award' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Award failed');
      setAwardUid('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Award failed');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-text-secondary">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!isAtLeast('admin')) return null;

  const labels = {
    title: locale === 'th' ? 'ตั้งค่าระบบและ Master Data' : 'System Settings and Master Data',
    desc:
      locale === 'th'
        ? 'จัดการ categories, tags, badges, licenses และค่าระบบด้วย optimistic concurrency'
        : 'Manage categories, tags, badges, licenses, and platform settings with optimistic concurrency.',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Badge variant="elite" size="md">Admin Control</Badge>
          <h1 className="mt-3 text-3xl font-black text-text-primary">{labels.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">{labels.desc}</p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-text-secondary/10 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-accent text-white'
                  : 'bg-bg-card text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary'
              }`}
            >
              {tab.icon}
              {locale === 'th' ? tab.labelTH : tab.labelEN}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorState
            title={locale === 'th' ? 'โหลดข้อมูลไม่สำเร็จ' : 'Unable to load data'}
            message={error}
            onRetry={() => void loadItems()}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'รายการ' : 'Items'}</CardTitle>
                <CardDescription>{activeTab}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-text-secondary">Loading...</div>
                ) : items.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title={locale === 'th' ? 'ยังไม่มีรายการ' : 'No items yet'}
                      description={locale === 'th' ? 'เพิ่มรายการแรกจากฟอร์มด้านขวา' : 'Create the first item from the form.'}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-text-secondary/5 text-text-secondary">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Name</th>
                          <th className="px-6 py-4 font-semibold">Slug/Code</th>
                          <th className="px-6 py-4 font-semibold">Version</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold text-right">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-text-secondary/10">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-text-secondary/5">
                            <td className="px-6 py-4 font-semibold text-text-primary">{item.name || item.id}</td>
                            <td className="px-6 py-4 font-mono text-xs text-text-secondary">{item.slug || item.code || '-'}</td>
                            <td className="px-6 py-4 text-text-secondary">{item.version || 1}</td>
                            <td className="px-6 py-4">
                              <Badge variant={item.isActive === false ? 'warning' : 'success'}>
                                {item.isActive === false ? 'inactive' : 'active'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="secondary" size="sm" onClick={() => selectItem(item)}>
                                {locale === 'th' ? 'แก้ไข' : 'Edit'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{selected ? (locale === 'th' ? 'แก้ไขรายการ' : 'Edit Item') : locale === 'th' ? 'เพิ่มรายการ' : 'New Item'}</CardTitle>
                    <CardDescription>
                      {selected ? `ID: ${selected.id}` : activeTab}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    <Plus className="mr-1 h-4 w-4" />
                    {locale === 'th' ? 'ใหม่' : 'New'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Name" value={draft.name || ''} onChange={(event) => setDraft((cur) => ({ ...cur, name: event.target.value }))} />
                {activeTab === 'licenses' || activeTab === 'system-settings' ? (
                  <Input label="Code" value={draft.code || ''} onChange={(event) => setDraft((cur) => ({ ...cur, code: event.target.value }))} />
                ) : (
                  <Input label="Slug" value={draft.slug || ''} onChange={(event) => setDraft((cur) => ({ ...cur, slug: event.target.value }))} />
                )}
                <Input
                  label="Description"
                  value={draft.description || ''}
                  onChange={(event) => setDraft((cur) => ({ ...cur, description: event.target.value }))}
                />
                {activeTab === 'system-settings' ? (
                  <textarea
                    className="min-h-28 w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                    value={draft.value || ''}
                    onChange={(event) => setDraft((cur) => ({ ...cur, value: event.target.value }))}
                    aria-label="Setting value JSON"
                  />
                ) : null}
                {activeTab === 'badges' ? (
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                    value={draft.criteria || ''}
                    onChange={(event) => setDraft((cur) => ({ ...cur, criteria: event.target.value }))}
                    aria-label="Badge criteria JSON"
                    placeholder='{"minReputation":100}'
                  />
                ) : null}
                <Select
                  label="Status"
                  value={draft.isActive === false ? 'inactive' : 'active'}
                  onChange={(event) => setDraft((cur) => ({ ...cur, isActive: event.target.value === 'active' }))}
                  options={[
                    { value: 'active', label: 'active' },
                    { value: 'inactive', label: 'inactive' },
                  ]}
                />
                {selected ? (
                  <Input label="Version" type="number" value={draft.version || 1} onChange={(event) => setDraft((cur) => ({ ...cur, version: Number(event.target.value) }))} />
                ) : null}
                <Button loading={saving} onClick={() => void saveItem()}>
                  <Save className="mr-2 h-4 w-4" />
                  {locale === 'th' ? 'บันทึก' : 'Save'}
                </Button>

                {activeTab === 'tags' && selected ? (
                  <div className="space-y-3 rounded-lg border border-text-secondary/10 bg-bg-secondary p-3">
                    <Input label="Merge into tag ID" value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} />
                    <Button variant="secondary" loading={saving} disabled={!mergeTarget} onClick={() => void saveItem('merge')}>
                      <Merge className="mr-2 h-4 w-4" />
                      {locale === 'th' ? 'Merge และปิดใช้งาน' : 'Merge and deactivate'}
                    </Button>
                  </div>
                ) : null}

                {activeTab === 'badges' && selected ? (
                  <div className="space-y-3 rounded-lg border border-text-secondary/10 bg-bg-secondary p-3">
                    <Input label="Award to UID" value={awardUid} onChange={(event) => setAwardUid(event.target.value)} />
                    <Button variant="secondary" loading={saving} disabled={!awardUid.trim()} onClick={() => void awardBadge()}>
                      <Award className="mr-2 h-4 w-4" />
                      {locale === 'th' ? 'มอบ Badge' : 'Award badge'}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
