'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  Calendar,
  Hash,
  ShieldCheck,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Certificate {
  id: string;
  pathId: string;
  pathTitle: string;
  userName: string;
  certificateNumber: string;
  verificationCode: string;
  pdfPath: string;
  issuedAt: any;
  revokedAt: any;
}

export default function DashboardCertificatesPage() {
  const locale = useLocale() as 'th' | 'en';
  const { user, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const q = query(
          collection(db, 'certificates'),
          where('userId', '==', user.uid),
          orderBy('issuedAt', 'desc')
        );
        const snap = await getDocs(q);
        const certs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Certificate));
        setCertificates(certs);
      } catch (err) {
        console.error('Error loading certificates:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const copyShareLink = (cert: Certificate) => {
    const url = `${window.location.origin}/${locale}/certificates/verify?code=${cert.verificationCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'string'
      ? new Date(timestamp)
      : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-text-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-3" />
          <span className="text-sm">{locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Badge variant="success" size="md" className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Certificates
          </Badge>
          <h1 className="mt-2 text-3xl font-black text-text-primary">
            {locale === 'th' ? 'ใบประกาศนียบัตรของฉัน' : 'My Certificates'}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {locale === 'th'
              ? 'รวมใบประกาศนียบัตรจากการเรียนรู้สำเร็จทุกหลักสูตร'
              : 'Certificates earned from completed learning paths.'}
          </p>
        </div>

        {/* Certificate Cards */}
        {certificates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {locale === 'th' ? 'ยังไม่มีใบประกาศนียบัตร' : 'No certificates yet'}
              </h3>
              <p className="text-sm text-text-secondary max-w-sm">
                {locale === 'th'
                  ? 'สำเร็จหลักสูตรการเรียนรู้พร้อมแบบทดสอบเพื่อรับใบประกาศนียบัตร'
                  : 'Complete a learning path with its quiz to earn your first certificate.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {certificates.map((cert) => (
              <Card key={cert.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Top accent */}
                <div className="h-1.5 bg-gradient-to-r from-success via-emerald-400 to-teal-400" />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{cert.pathTitle}</CardTitle>
                        <p className="text-[10px] text-text-secondary mt-0.5 font-mono">
                          {cert.certificateNumber}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {locale === 'th' ? 'ผ่าน' : 'Valid'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Info row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-bg-secondary p-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-1">
                        <Calendar className="h-3 w-3" />
                        {locale === 'th' ? 'ออกเมื่อ' : 'Issued'}
                      </div>
                      <p className="text-xs font-bold text-text-primary">
                        {formatDate(cert.issuedAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-bg-secondary p-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-1">
                        <Hash className="h-3 w-3" />
                        {locale === 'th' ? 'รหัสยืนยัน' : 'Code'}
                      </div>
                      <p className="text-xs font-bold text-text-primary font-mono tracking-wider">
                        {cert.verificationCode}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyShareLink(cert)}
                    >
                      {copiedId === cert.id ? (
                        <>{locale === 'th' ? 'คัดลอกแล้ว!' : 'Copied!'}</>
                      ) : (
                        <>
                          <Share2 className="mr-1.5 h-3.5 w-3.5" />
                          {locale === 'th' ? 'แชร์' : 'Share'}
                        </>
                      )}
                    </Button>
                    <a
                      href={`/${locale}/certificates/verify?code=${cert.verificationCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
