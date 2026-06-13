'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Search, XCircle, Award, Calendar, Hash, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface CertificateData {
  id: string;
  userName: string;
  pathTitle: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: any;
  revokedAt: any;
}

export default function CertificateVerifyPage() {
  const locale = useLocale() as 'th' | 'en';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setCertificate(null);
    setNotFound(false);
    setSearched(true);

    try {
      const q = query(
        collection(db, 'certificates'),
        where('verificationCode', '==', code.trim().toUpperCase())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setNotFound(true);
      } else {
        const doc = snap.docs[0]!;
        setCertificate({ id: doc.id, ...doc.data() } as CertificateData);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const isRevoked = certificate?.revokedAt != null;
  const issuedDate = certificate?.issuedAt
    ? (typeof certificate.issuedAt === 'string'
        ? new Date(certificate.issuedAt)
        : certificate.issuedAt.toDate?.() || new Date(certificate.issuedAt)
      ).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.05),transparent_35rem)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success border border-success/15">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">
            {locale === 'th' ? 'ตรวจสอบใบประกาศนียบัตร' : 'Verify Certificate'}
          </h1>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            {locale === 'th'
              ? 'ป้อนรหัสยืนยันที่อยู่บนใบประกาศนียบัตรเพื่อตรวจสอบความถูกต้อง'
              : 'Enter the verification code printed on the certificate to verify its authenticity.'}
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleVerify}
          className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm"
        >
          <label className="block text-sm font-bold text-text-primary mb-2">
            {locale === 'th' ? 'รหัสยืนยัน (Verification Code)' : 'Verification Code'}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              maxLength={8}
              className="flex-1 rounded-xl border border-text-secondary/15 bg-bg-primary px-4 py-3 text-sm font-mono font-bold tracking-widest text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none transition-all"
            />
            <Button type="submit" variant="primary" disabled={loading || !code.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Result: Found */}
        {certificate && !isRevoked && (
          <div className="rounded-3xl border-2 border-success/20 bg-bg-card p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-bold text-success border border-success/15">
                <ShieldCheck className="h-4 w-4" />
                {locale === 'th' ? 'ใบประกาศนียบัตรนี้ถูกต้อง' : 'Certificate is Valid'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-bg-secondary p-4">
                <Award className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="text-xs text-text-secondary">{locale === 'th' ? 'ผู้ได้รับ' : 'Recipient'}</p>
                  <p className="text-sm font-bold text-text-primary">{certificate.userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-bg-secondary p-4">
                <Badge variant="info" size="sm" className="shrink-0">Path</Badge>
                <div>
                  <p className="text-xs text-text-secondary">{locale === 'th' ? 'หลักสูตร' : 'Learning Path'}</p>
                  <p className="text-sm font-bold text-text-primary">{certificate.pathTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-bg-secondary p-4">
                  <Hash className="h-4 w-4 text-text-secondary shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">{locale === 'th' ? 'หมายเลข' : 'Number'}</p>
                    <p className="text-xs font-bold text-text-primary font-mono">{certificate.certificateNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-bg-secondary p-4">
                  <Calendar className="h-4 w-4 text-text-secondary shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">{locale === 'th' ? 'ออกเมื่อ' : 'Issued'}</p>
                    <p className="text-xs font-bold text-text-primary">{issuedDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result: Revoked */}
        {certificate && isRevoked && (
          <div className="rounded-3xl border-2 border-danger/20 bg-bg-card p-8 shadow-sm text-center space-y-3 animate-in fade-in duration-500">
            <XCircle className="h-12 w-12 text-danger mx-auto" />
            <p className="text-sm font-bold text-danger">
              {locale === 'th' ? 'ใบประกาศนียบัตรนี้ถูกเพิกถอนแล้ว' : 'This certificate has been revoked'}
            </p>
          </div>
        )}

        {/* Result: Not Found */}
        {notFound && searched && (
          <div className="rounded-3xl border border-warning/20 bg-bg-card p-8 shadow-sm text-center space-y-3 animate-in fade-in duration-500">
            <XCircle className="h-12 w-12 text-warning mx-auto" />
            <p className="text-sm font-bold text-text-primary">
              {locale === 'th' ? 'ไม่พบใบประกาศนียบัตร' : 'Certificate Not Found'}
            </p>
            <p className="text-xs text-text-secondary">
              {locale === 'th'
                ? 'กรุณาตรวจสอบรหัสยืนยันอีกครั้ง'
                : 'Please double-check the verification code and try again.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
