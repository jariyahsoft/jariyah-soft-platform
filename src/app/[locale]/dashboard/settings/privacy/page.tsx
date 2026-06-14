'use client';

import React, { useState } from 'react';
import { Download, ShieldAlert, Trash2 } from 'lucide-react';
import { GithubAuthProvider, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function PrivacySettingsPage() {
  const locale = useLocale();
  const { user } = useAuth();
  const { loading } = useAuthGuard();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reauthenticated, setReauthenticated] = useState(false);

  async function submitRequest(type: 'export' | 'deletion') {
    if (!user) return;
    setMessage(null);
    if (type === 'export') {
      setExporting(true);
    } else {
      setDeleting(true);
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/v1/privacy/requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          locale,
          reauthConfirmed: type === 'deletion' ? reauthenticated : false,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Request failed');
      setMessage(
        type === 'export'
          ? locale === 'th'
            ? 'ส่งคำขอ export แล้ว ระบบจะส่งลิงก์ดาวน์โหลดเมื่อประมวลผลเสร็จ'
            : 'Export request queued. We will send the download link when it is ready.'
          : locale === 'th'
            ? 'ส่งคำขอลบบัญชีแล้ว ระบบจะดำเนิน workflow การ anonymize'
            : 'Deletion request queued. The anonymization workflow will process it.'
      );
      setConfirmDelete(false);
      setReauthenticated(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setExporting(false);
      setDeleting(false);
    }
  }

  async function reauthenticate() {
    if (!user) return;
    const providerId = user.providerData[0]?.providerId;
    const provider = providerId === 'github.com' ? new GithubAuthProvider() : new GoogleAuthProvider();
    await reauthenticateWithPopup(user, provider);
    setReauthenticated(true);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-text-secondary">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Badge variant="info" size="md">PDPA</Badge>
          <h1 className="mt-3 text-3xl font-black text-text-primary">
            {locale === 'th' ? 'ความเป็นส่วนตัวและข้อมูลส่วนบุคคล' : 'Privacy and Personal Data'}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {locale === 'th'
              ? 'ส่งคำขอรับสำเนาข้อมูลหรือขอลบบัญชีตาม workflow PDPA'
              : 'Request a copy of your data or queue account deletion through the PDPA workflow.'}
          </p>
        </div>

        {message ? (
          <div className="rounded-lg border border-accent/20 bg-accent/10 p-4 text-sm font-semibold text-text-primary">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-accent" />
                {locale === 'th' ? 'Data Export' : 'Data Export'}
              </CardTitle>
              <CardDescription>
                {locale === 'th'
                  ? 'ระบบจะรวบรวมข้อมูลของคุณ สร้างไฟล์ JSON/CSV และออกลิงก์ส่วนตัวหมดอายุ 7 วัน'
                  : 'We collect your records, generate JSON/CSV, and issue a private 7-day download link.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button loading={exporting} onClick={() => void submitRequest('export')}>
                <Download className="mr-2 h-4 w-4" />
                {locale === 'th' ? 'ขอ Export ข้อมูล' : 'Request Export'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-danger/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-danger" />
                {locale === 'th' ? 'Data Deletion' : 'Data Deletion'}
              </CardTitle>
              <CardDescription>
                {locale === 'th'
                  ? 'ระบบจะ anonymize โปรไฟล์และผลงานที่ระบุตัวตนได้ แต่เก็บ audit logs ตามข้อกำหนดทางกฎหมาย'
                  : 'We anonymize identifying profile/content data while retaining audit logs for legal retention.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-text-primary">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={confirmDelete}
                  onChange={(event) => setConfirmDelete(event.target.checked)}
                />
                <span>
                  {locale === 'th'
                    ? 'ฉันเข้าใจว่าคำขอนี้จะระงับ session ทั้งหมดและปิดบัญชีหลัง anonymization'
                    : 'I understand this request revokes all sessions and disables the account after anonymization.'}
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" disabled={!confirmDelete || reauthenticated} onClick={() => void reauthenticate()}>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {reauthenticated ? (locale === 'th' ? 'ยืนยันตัวตนแล้ว' : 'Re-authenticated') : locale === 'th' ? 'ยืนยันตัวตนอีกครั้ง' : 'Re-authenticate'}
                </Button>
                <Button
                  variant="danger"
                  loading={deleting}
                  disabled={!confirmDelete || !reauthenticated}
                  onClick={() => void submitRequest('deletion')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {locale === 'th' ? 'ส่งคำขอลบข้อมูล' : 'Request Deletion'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
