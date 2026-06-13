import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ChevronRight, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getEvent, getUserRegistrationStatus } from '@/lib/events/data';
import { TYPE_LABELS, type EventType } from '@/lib/validators/event';
import { RegistrationButton } from '@/components/events/RegistrationButton';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export const revalidate = 60;

interface EventDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { locale, id: eventId } = await params;

  const event = await getEvent(eventId);
  if (!event) notFound();

  // Try to get user status if logged in via session cookie (SSR best effort, fallback handled client-side if needed)
  let userStatus = null;
  const sessionCookie = (await cookies()).get('session')?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie);
      userStatus = await getUserRegistrationStatus(eventId, decoded.uid);
    } catch (e) {
      // Ignored
    }
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const deadline = new Date(event.registrationDeadline);
  const now = new Date();

  const isPast = endDate < now;
  const deadlinePassed = deadline < now;
  const isFull = event.registrationCount >= event.capacity;
  const percentageFilled = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-text-secondary">
          <Link href="/events" className="hover:text-accent transition-colors">
            {locale === 'th' ? 'กิจกรรม' : 'Events'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-text-primary truncate">{event.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <Badge variant="info" size="md">
                {TYPE_LABELS[event.type as EventType]?.[locale as 'th' | 'en'] || event.type}
              </Badge>
              <h1 className="text-3xl font-black tracking-tight text-text-primary md:text-5xl">
                {event.title}
              </h1>
            </div>

            <article className="prose prose-lg dark:prose-invert max-w-none text-text-secondary">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {event.description}
              </ReactMarkdown>
            </article>
          </div>

          {/* Sidebar */}
          <div>
            <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm sticky top-24 space-y-6">
              {/* Registration Status & Button */}
              <div>
                <RegistrationButton
                  eventId={eventId}
                  isFull={isFull}
                  isPast={isPast}
                  deadlinePassed={deadlinePassed}
                  initialStatus={userStatus}
                  locale={locale as 'th' | 'en'}
                />
              </div>

              <div className="h-px w-full bg-text-secondary/10" />

              {/* Event Details */}
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="font-bold text-text-primary">{locale === 'th' ? 'วันและเวลา' : 'Date & Time'}</p>
                    <p className="text-text-secondary">
                      {startDate.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium' })}
                      <br />
                      {startDate.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', { timeStyle: 'short' })} -{' '}
                      {endDate.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', { timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="font-bold text-text-primary">{locale === 'th' ? 'สถานที่' : 'Location'}</p>
                    <p className="text-text-secondary">
                      {event.venueType === 'online' ? (locale === 'th' ? 'ออนไลน์' : 'Online') : event.venueDetails}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-accent shrink-0" />
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-text-primary">{locale === 'th' ? 'ที่นั่ง (Capacity)' : 'Capacity'}</p>
                      <span className="text-xs font-semibold text-text-secondary">{event.registrationCount} / {event.capacity}</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isFull ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${percentageFilled}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="font-bold text-text-primary">{locale === 'th' ? 'ปิดรับสมัคร' : 'Registration Deadline'}</p>
                    <p className="text-text-secondary">
                      {deadline.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
