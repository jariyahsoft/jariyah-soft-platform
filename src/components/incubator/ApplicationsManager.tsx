'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Check, X, FileText, Code } from 'lucide-react';
import type { ContributorApplicationData } from '@/lib/validators/incubator';

interface ApplicationsManagerProps {
  projectId: string;
  initialApplications: ContributorApplicationData[];
  locale: 'th' | 'en';
}

export function ApplicationsManager({ projectId, initialApplications, locale }: ApplicationsManagerProps) {
  const [applications, setApplications] = useState<ContributorApplicationData[]>(initialApplications);
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDecision = async (applicantUid: string, status: 'accepted' | 'rejected') => {
    setProcessingUid(applicantUid);

    try {
      const res = await fetch(`/api/v1/incubator/${projectId}/applications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicantUid, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update application');
      }

      toast(
        status === 'accepted'
          ? locale === 'th'
            ? 'ตอบรับเข้าร่วมทีมเรียบร้อยแล้ว!'
            : 'Contributor accepted successfully!'
          : locale === 'th'
            ? 'ปฏิเสธใบสมัครเรียบร้อยแล้ว'
            : 'Application rejected',
        'success'
      );

      // Update state
      setApplications((prev) =>
        prev.map((app) => (app.uid === applicantUid ? { ...app, status } : app))
      );
    } catch (err: any) {
      toast(err.message || 'An error occurred', 'error');
    } finally {
      setProcessingUid(null);
    }
  };

  const translations = {
    title: locale === 'th' ? 'จัดการใบสมัครเข้าร่วมทีม' : 'Review Applications',
    noApps: locale === 'th' ? 'ยังไม่มีผู้ยื่นใบสมัคร' : 'No applications received yet',
    message: locale === 'th' ? 'ข้อความแนะนำตัว' : 'Message',
    skills: locale === 'th' ? 'ทักษะความเชี่ยวชาญ' : 'Skills offered',
    accept: locale === 'th' ? 'ตอบรับ' : 'Accept',
    reject: locale === 'th' ? 'ปฏิเสธ' : 'Reject',
    pending: locale === 'th' ? 'รอการพิจารณา' : 'Pending',
    accepted: locale === 'th' ? 'เข้าร่วมแล้ว' : 'Accepted',
    rejected: locale === 'th' ? 'ปฏิเสธแล้ว' : 'Rejected',
  };

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 text-center text-text-secondary text-sm">
        {translations.noApps}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-text-primary">{translations.title}</h3>
      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.uid}
            className="rounded-2xl border border-text-secondary/10 bg-bg-card p-5 space-y-4 shadow-sm"
          >
            {/* Applicant header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={app.displayName || 'Applicant'} size="md" />
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {app.displayName || (locale === 'th' ? 'ผู้ใช้นิรนาม' : 'Anonymous User')}
                  </h4>
                  <span className="text-[10px] text-text-secondary/70">
                    {new Date(app.appliedAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {app.status !== 'pending' ? (
                <Badge variant={app.status === 'accepted' ? 'success' : 'danger'}>
                  {app.status === 'accepted' ? translations.accepted : translations.rejected}
                </Badge>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-warning/80 bg-warning/5 border border-warning/10 rounded-full px-2 py-0.5">
                  {translations.pending}
                </span>
              )}
            </div>

            {/* Content info */}
            <div className="space-y-3 text-xs text-text-secondary pl-1">
              <div className="space-y-1">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-accent/70" />
                  {translations.message}
                </span>
                <p className="bg-bg-secondary/40 p-3 rounded-lg leading-relaxed text-text-primary whitespace-pre-wrap">
                  {app.message}
                </p>
              </div>

              {app.skills && app.skills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5 text-accent/70" />
                    {translations.skills}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {app.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-bg-secondary px-2 py-0.5 font-semibold text-text-secondary border border-text-secondary/5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for pending applications */}
            {app.status === 'pending' && (
              <div className="flex justify-end gap-2 pt-3 border-t border-text-secondary/5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/10 font-bold"
                  loading={processingUid === app.uid}
                  onClick={() => handleDecision(app.uid, 'rejected')}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  {translations.reject}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="font-bold bg-success hover:bg-success/90"
                  loading={processingUid === app.uid}
                  onClick={() => handleDecision(app.uid, 'accepted')}
                >
                  <Check className="h-3.5 w-3.5 mr-1 text-white" />
                  {translations.accept}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
