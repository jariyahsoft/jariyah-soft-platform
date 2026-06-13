'use client';

import React, { useEffect, useState, use } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, FileClock, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';

export default function ReviewDetailPage({ params }: { params: Promise<{ locale: string; type: string; id: string }> }) {
  const { type, id } = use(params);
  const { isAtLeast, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonCode, setRejectReasonCode] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAtLeast('moderator')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAtLeast, router]);

  useEffect(() => {
    if (!isAtLeast('moderator')) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const auth = (await import('@/lib/firebase/config')).auth;
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const token = await currentUser.getIdToken();
        const res = await fetch(`/api/v1/moderation/${type}/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          throw new Error(errorBody?.error?.message || 'Not found');
        }

        const body = await res.json();
        setData(body.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isAtLeast, type, id]);

  const handleApprove = async () => {
    if (!confirm(locale === 'th' ? 'ยืนยันการอนุมัติ?' : 'Confirm approval?')) return;
    setActionLoading(true);
    try {
      const auth = (await import('@/lib/firebase/config')).auth;
      const token = await auth.currentUser?.getIdToken();
      
      const res = await fetch(`/api/v1/moderation/${type}/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to approve');
      }
      
      alert(locale === 'th' ? 'อนุมัติสำเร็จ' : 'Approved successfully');
      router.push('/dashboard/moderation');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReasonCode || !rejectNote) {
      alert(locale === 'th' ? 'กรุณาระบุเหตุผล' : 'Please provide a reason');
      return;
    }
    setActionLoading(true);
    try {
      const auth = (await import('@/lib/firebase/config')).auth;
      const token = await auth.currentUser?.getIdToken();
      
      const res = await fetch(`/api/v1/moderation/${type}/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reasonCode: rejectReasonCode, note: rejectNote })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to reject');
      }
      
      alert(locale === 'th' ? 'ปฏิเสธสำเร็จ' : 'Rejected successfully');
      router.push('/dashboard/moderation');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Loading review detail...</div>
      </DashboardLayout>
    );
  }
  if (error) {
    return (
      <DashboardLayout>
        <ErrorState
          title={locale === 'th' ? 'เปิดรายละเอียดไม่สำเร็จ' : 'Unable to load review detail'}
          message={error}
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }
  if (!data) {
    return (
      <DashboardLayout>
        <ErrorState title={locale === 'th' ? 'ไม่พบรายการ' : 'Submission not found'} />
      </DashboardLayout>
    );
  }

  const ownerId = data.submitterId;
  const isOwnSubmission = user?.uid === ownerId;
  const automatedChecks = Array.isArray(data.automatedChecks) ? data.automatedChecks : [];
  const revisionHistory = Array.isArray(data.revisionHistory) ? data.revisionHistory : [];

  const content = (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="info" size="md">{type}</Badge>
          <h1 className="mt-3 text-3xl font-black text-text-primary">
            {locale === 'th' ? 'ตรวจสอบผลงาน' : 'Review Submission'}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {locale === 'th'
              ? 'ตรวจสอบเนื้อหา ประวัติ revision และผลตรวจอัตโนมัติก่อนตัดสินใจ'
              : 'Review submission content, revision history, and automated checks before deciding.'}
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push('/dashboard/moderation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'th' ? 'กลับ' : 'Back'}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{data.title}</CardTitle>
              <CardDescription>
                {locale === 'th' ? 'ส่งโดย' : 'Submitted by'} {data.submitterName} ({ownerId})
                {data.submitterEmail ? ` • ${data.submitterEmail}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-text-secondary/10 bg-bg-secondary/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Type</div>
                  <div className="mt-2 text-lg font-bold text-text-primary">{type}</div>
                </div>
                <div className="rounded-xl border border-text-secondary/10 bg-bg-secondary/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Status</div>
                  <div className="mt-2 text-lg font-bold text-text-primary">{data.status}</div>
                </div>
                <div className="rounded-xl border border-text-secondary/10 bg-bg-secondary/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Published</div>
                  <div className="mt-2 text-lg font-bold text-text-primary">
                    {data.publishedAtIso ? new Date(data.publishedAtIso).toLocaleString() : 'Not yet'}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  {locale === 'th' ? 'เนื้อหา' : 'Content'}
                </h2>
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-text-secondary/10 bg-bg-primary p-4 text-sm leading-7 text-text-primary">
                  {data.description}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                    {locale === 'th' ? 'ลิงก์สาธารณะ' : 'Public links'}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {data.links?.length ? (
                      data.links.map((link: { label: string; url: string }) => (
                        <a
                          key={`${link.label}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-text-secondary/10 bg-bg-secondary/40 px-4 py-3 text-sm text-text-primary transition hover:border-accent/30 hover:bg-accent/5"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="h-4 w-4 text-text-secondary" />
                        </a>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-text-secondary/20 p-4 text-sm text-text-secondary">
                        {locale === 'th' ? 'ไม่มีลิงก์แนบมา' : 'No links attached.'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                    {locale === 'th' ? 'ไฟล์ภาพและหลักฐาน' : 'Assets and evidence'}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {data.screenshots?.length ? (
                      data.screenshots.map((src: string, index: number) => (
                        <div
                          key={`${src}-${index}`}
                          className="rounded-xl border border-text-secondary/10 bg-bg-secondary/40 px-4 py-3 text-sm text-text-primary"
                        >
                          {src}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-text-secondary/20 p-4 text-sm text-text-secondary">
                        {locale === 'th' ? 'ไม่มี screenshot หรือ cover path' : 'No screenshot or cover path found.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileClock className="h-4 w-4" />
                {locale === 'th' ? 'ประวัติ revision และการตัดสินใจ' : 'Revision and decision history'}
              </CardTitle>
              <CardDescription>
                {locale === 'th'
                  ? 'รวมการ submit ครั้งก่อน ประวัติ rejection และ audit event ล่าสุด'
                  : 'Includes prior submissions, rejection history, and recent audit events.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {revisionHistory.length ? (
                revisionHistory.map((entry: any) => (
                  <div key={entry.id} className="rounded-xl border border-text-secondary/10 bg-bg-secondary/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            entry.status === 'approve' || entry.status === 'approved'
                              ? 'success'
                              : entry.status === 'reject' || entry.status === 'rejected'
                                ? 'danger'
                                : entry.status === 'pending'
                                  ? 'warning'
                                  : 'default'
                          }
                        >
                          {entry.status}
                        </Badge>
                        <span className="font-semibold text-text-primary">{entry.label}</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {entry.timestampIso ? new Date(entry.timestampIso).toLocaleString() : 'Unknown'}
                      </span>
                    </div>
                    {(entry.reason || entry.note || entry.actorId) && (
                      <div className="mt-3 space-y-1 text-sm text-text-secondary">
                        {entry.actorId ? <div>Actor: {entry.actorId}</div> : null}
                        {entry.reason ? <div>Reason: {entry.reason}</div> : null}
                        {entry.note ? <div>Note: {entry.note}</div> : null}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-text-secondary/20 p-4 text-sm text-text-secondary">
                  {locale === 'th' ? 'ยังไม่มีประวัติเพิ่มเติม' : 'No revision history available yet.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                {locale === 'th' ? 'ผลตรวจอัตโนมัติ' : 'Automated checks'}
              </CardTitle>
              <CardDescription>
                {locale === 'th'
                  ? 'ใช้เป็นข้อมูลประกอบก่อน moderator ตัดสินใจ ไม่แทนที่การตรวจโดยคน'
                  : 'These checks inform moderation, but do not replace human review.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {automatedChecks.map((check: any) => (
                <div key={check.id} className="rounded-xl border border-text-secondary/10 bg-bg-secondary/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-text-primary">{check.label}</span>
                    <Badge
                      variant={
                        check.status === 'pass'
                          ? 'success'
                          : check.status === 'fail'
                            ? 'danger'
                            : check.status === 'warn'
                              ? 'warning'
                              : 'default'
                      }
                    >
                      {check.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{check.details}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {data.moderationReason ? (
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'เหตุผลการปฏิเสธล่าสุด' : 'Latest rejection reason'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-text-primary">
                <div>Code: {data.moderationReason.reasonCode || 'N/A'}</div>
                <div>Note: {data.moderationReason.note || 'N/A'}</div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{locale === 'th' ? 'การตัดสินใจ' : 'Decision'}</CardTitle>
              <CardDescription>
                {locale === 'th'
                  ? 'การอนุมัติจะเผยแพร่รายการสู่ public list และการปฏิเสธต้องระบุ reason code พร้อม note'
                  : 'Approvals publish to the public list. Rejections require a reason code and note.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={handleApprove}
                disabled={actionLoading || isOwnSubmission}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {type === 'review'
                  ? locale === 'th'
                    ? 'อนุมัติรีวิว'
                    : 'Approve review'
                  : locale === 'th'
                    ? 'อนุมัติและเผยแพร่'
                    : 'Approve and publish'}
              </Button>
              <Button
                className="w-full"
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading || isOwnSubmission}
              >
                {locale === 'th' ? 'ปฏิเสธพร้อมเหตุผล' : 'Reject with reason'}
              </Button>
              {isOwnSubmission ? (
                <div className="flex items-start gap-2 rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <span>
                    {locale === 'th'
                      ? 'คุณไม่สามารถอนุมัติหรือปฏิเสธผลงานของตัวเองได้'
                      : 'You cannot approve or reject your own submission.'}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );

  return (
    <DashboardLayout>
      {content}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={locale === 'th' ? 'เหตุผลการปฏิเสธ' : 'Rejection reason'}
      >
        <div className="space-y-4">
          <Select
            label="Reason code"
            value={rejectReasonCode}
            onChange={(e) => setRejectReasonCode(e.target.value)}
            options={[
              { value: '', label: '-- Select --' },
              { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
              { value: 'BROKEN_LINKS', label: 'Broken links or unreachable' },
              { value: 'MALWARE', label: 'Malware or security risk' },
              { value: 'MISSING_INFO', label: 'Missing required information' },
              { value: 'SPAM', label: 'Spam or low quality' },
            ]}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80">
              {locale === 'th' ? 'โน้ตถึงผู้พัฒนา' : 'Note to developer'}
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="min-h-28 w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder={locale === 'th' ? 'อธิบายสิ่งที่ต้องแก้ไข' : 'Explain what needs to be fixed'}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleReject}>
              {locale === 'th' ? 'ยืนยันการปฏิเสธ' : 'Confirm rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
