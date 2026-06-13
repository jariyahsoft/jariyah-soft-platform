'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft, Download, Users, Clock } from 'lucide-react';
import { collection, query, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Link } from '@/i18n/routing';

export default function ManageEventPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [eventId, setEventId] = useState('');
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { id } = await paramsPromise;
      setEventId(id);

      try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (!eventDoc.exists() || eventDoc.data()?.organizerId !== user.uid) {
          router.push('/dashboard/events');
          return;
        }
        setEvent(eventDoc.data());

        const q = query(
          collection(db, `events/${id}/registrations`),
          orderBy('registeredAt', 'asc')
        );
        const snap = await getDocs(q);
        
        // Fetch user profiles for display (mocked email/names since user profiles aren't public fully)
        // In a real app, we'd use a Cloud Function to fetch user details or store them in registration.
        const regs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAttendees(regs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, paramsPromise, router]);

  const exportCSV = () => {
    const headers = ['User ID', 'Status', 'Registered At'];
    const rows = attendees.map(a => [
      a.userId,
      a.status,
      a.registeredAt?.toDate?.()?.toISOString() || a.registeredAt
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event_${eventId}_attendees.csv`;
    link.click();
  };

  const markAttended = async (uid: string) => {
    if (!confirm('Mark as attended?')) return;
    try {
      await updateDoc(doc(db, `events/${eventId}/registrations`, uid), {
        status: 'attended'
      });
      setAttendees(prev => prev.map(a => a.id === uid ? { ...a, status: 'attended' } : a));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      </DashboardLayout>
    );
  }

  const registered = attendees.filter(a => a.status === 'registered' || a.status === 'attended');
  const waitlisted = attendees.filter(a => a.status === 'waitlisted');

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-text-primary">{event.title}</h1>
            <p className="text-sm text-text-secondary">Manage Attendees</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 text-success mb-2">
              <Users className="h-5 w-5" />
              <span className="font-bold">Registered</span>
            </div>
            <div className="text-3xl font-black text-text-primary">{registered.length}</div>
          </div>
          <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 text-warning mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-bold">Waitlisted</span>
            </div>
            <div className="text-3xl font-black text-text-primary">{waitlisted.length}</div>
          </div>
          <div className="flex flex-col justify-center">
            <Button onClick={exportCSV} variant="outline" className="w-full h-14">
              <Download className="mr-2 h-5 w-5" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-text-secondary/10 bg-bg-card shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-secondary text-text-secondary">
              <tr>
                <th className="px-6 py-4 font-bold">User ID</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Registered At</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-text-secondary/10">
              {attendees.map(a => (
                <tr key={a.id} className="hover:bg-text-secondary/5">
                  <td className="px-6 py-4 font-mono text-xs">{a.userId}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      a.status === 'registered' ? 'bg-success/10 text-success' :
                      a.status === 'waitlisted' ? 'bg-warning/10 text-warning' :
                      a.status === 'attended' ? 'bg-accent/10 text-accent' :
                      'bg-text-secondary/10 text-text-secondary'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(a.registeredAt?.toDate?.() || a.registeredAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {a.status === 'registered' && (
                      <Button onClick={() => markAttended(a.id)} variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                        Check-in
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">No attendees yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
