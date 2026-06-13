'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Loader2, Ticket, X, Clock, AlertCircle } from 'lucide-react';
import type { RegistrationData } from '@/lib/validators/event';
import { useRouter } from '@/i18n/routing';

interface RegistrationButtonProps {
  eventId: string;
  isFull: boolean;
  isPast: boolean;
  deadlinePassed: boolean;
  initialStatus: RegistrationData | null;
  locale: 'th' | 'en';
}

export function RegistrationButton({
  eventId,
  isFull,
  isPast,
  deadlinePassed,
  initialStatus,
  locale,
}: RegistrationButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<RegistrationData | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to register');

      setStatus({ userId: user.uid, status: data.data.status, registeredAt: new Date().toISOString() });
      router.refresh(); // Refresh page to update capacity numbers
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user || !confirm(locale === 'th' ? 'แน่ใจหรือไม่ว่าต้องการยกเลิกการลงทะเบียน?' : 'Are you sure you want to cancel?')) return;
    setLoading(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/events/${eventId}/registrations/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to cancel');

      setStatus(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isPast) {
    return (
      <Button disabled variant="outline" className="w-full">
        {locale === 'th' ? 'กิจกรรมจบลงแล้ว' : 'Event has ended'}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {status?.status === 'registered' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-bold text-success border border-success/20">
            <Ticket className="h-5 w-5" />
            {locale === 'th' ? 'ลงทะเบียนเรียบร้อยแล้ว' : 'You are registered'}
          </div>
          <Button onClick={handleCancel} disabled={loading} variant="outline" className="w-full text-danger hover:bg-danger/5 hover:text-danger hover:border-danger/30">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            {locale === 'th' ? 'ยกเลิกการลงทะเบียน' : 'Cancel Registration'}
          </Button>
        </div>
      ) : status?.status === 'waitlisted' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm font-bold text-warning border border-warning/20">
            <Clock className="h-5 w-5" />
            {locale === 'th' ? 'อยู่ในรายชื่อรอ (Waitlist)' : 'You are on the Waitlist'}
          </div>
          <Button onClick={handleCancel} disabled={loading} variant="outline" className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {locale === 'th' ? 'ยกเลิกรายชื่อรอ' : 'Leave Waitlist'}
          </Button>
        </div>
      ) : deadlinePassed ? (
        <Button disabled variant="outline" className="w-full">
          {locale === 'th' ? 'หมดเขตลงทะเบียนแล้ว' : 'Registration Closed'}
        </Button>
      ) : (
        <Button onClick={handleRegister} disabled={loading} variant={isFull ? 'outline' : 'primary'} className="w-full shadow-md">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isFull ? (
            <Clock className="mr-2 h-4 w-4" />
          ) : (
            <Ticket className="mr-2 h-4 w-4" />
          )}
          {isFull
            ? (locale === 'th' ? 'ลงชื่อรอ (Waitlist)' : 'Join Waitlist')
            : (locale === 'th' ? 'ลงทะเบียนเข้าร่วม' : 'Register Now')}
        </Button>
      )}

      {error && (
        <p className="flex items-center justify-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
