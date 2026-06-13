import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CalendarDays, Plus, MapPin, Users, Settings } from 'lucide-react';
import { getEventsByOrganizer } from '@/lib/events/data';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardEventsPage() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) redirect('/login');

  const decoded = await adminAuth.verifySessionCookie(sessionCookie);
  if (decoded.role === 'member' || decoded.role === 'guest') {
    redirect('/dashboard');
  }

  const events = await getEventsByOrganizer(decoded.uid);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="info" size="md" className="inline-flex items-center gap-1.5 mb-2">
              <CalendarDays className="h-3.5 w-3.5" />
              Organizer
            </Badge>
            <h1 className="text-3xl font-black text-text-primary">
              My Events
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your organized events, view attendees, and check-in users.
            </p>
          </div>
          <Link href="/dashboard/events/new">
            <Button variant="primary" size="md">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-text-secondary/20 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary text-text-secondary mb-4">
              <CalendarDays className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              No events yet
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              Create your first event to start accepting registrations and building your community.
            </p>
            <Link href="/dashboard/events/new">
              <Button variant="outline">Create Event</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {events.map((event) => {
              const startDate = new Date(event.startDate);
              const percentageFilled = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

              return (
                <div key={event.id} className="flex flex-col sm:flex-row gap-6 rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-text-primary">{event.title}</h3>
                      <Badge variant={event.status === 'active' ? 'success' : 'default'} size="sm">
                        {event.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-accent" />
                        {startDate.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-accent" />
                        {event.venueType}
                      </div>
                    </div>
                  </div>

                  <div className="sm:w-64 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-bold text-text-primary">
                        <Users className="h-4 w-4 text-accent" />
                        Attendees
                      </span>
                      <span className="text-text-secondary">{event.registrationCount} / {event.capacity}</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${percentageFilled}%` }}
                      />
                    </div>
                    <div className="pt-2">
                      <Link href={`/dashboard/events/${event.id}/manage`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="mr-2 h-3.5 w-3.5" />
                          Manage Event
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
