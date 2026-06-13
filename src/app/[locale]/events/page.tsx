import type { Metadata } from 'next';
import { CalendarDays, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { EventCard } from '@/components/events/EventCard';
import { listPublicEvents } from '@/lib/events/data';
import { EVENT_TYPES, TYPE_LABELS, type EventType } from '@/lib/validators/event';

export const revalidate = 60;

interface EventsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}

export const metadata: Metadata = {
  title: 'Events | Jariyah Soft',
  description: 'Join technical events, webinars, workshops, and hackathons.',
};

function filterHref(type?: string) {
  if (!type) return '/events';
  return `/events?type=${type}`;
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { locale } = await params;
  const { type: activeType } = await searchParams;

  const events = await listPublicEvents(activeType ? { type: activeType as EventType } : undefined);

  // Split into upcoming and past
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.startDate) >= now);
  const pastEvents = events.filter(e => new Date(e.startDate) < now).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.05),transparent_40rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Section */}
        <section className="overflow-hidden rounded-[2rem] border border-text-secondary/10 bg-bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="info" size="md" className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Events
              </Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-text-primary md:text-5xl">
                {locale === 'th' ? 'กิจกรรม' : 'Events'}
              </h1>
              <p className="mt-4 text-lg leading-8 text-text-secondary">
                {locale === 'th'
                  ? 'เข้าร่วมกิจกรรม สัมมนา เวิร์กช็อป และการแข่งขันสำหรับนักพัฒนาและผู้ใช้เทคโนโลยี'
                  : 'Join webinars, workshops, meetups, and hackathons for developers and tech users.'}
              </p>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Filters */}
          <aside>
            <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5 sticky top-24">
              <div className="mb-4 flex items-center gap-2 font-bold text-text-primary">
                <SlidersHorizontal className="h-5 w-5 text-accent" />
                {locale === 'th' ? 'กรองประเภท' : 'Filter by Type'}
              </div>

              <div className="space-y-2">
                <Link
                  href="/events"
                  className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    !activeType
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  }`}
                >
                  {locale === 'th' ? 'ทั้งหมด' : 'All Events'}
                </Link>
                {EVENT_TYPES.map((type) => (
                  <Link
                    key={type}
                    href={filterHref(type)}
                    className={`block rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      activeType === type
                        ? 'bg-accent text-white'
                        : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                    }`}
                  >
                    {TYPE_LABELS[type][locale as 'th' | 'en']}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Events Lists */}
          <section className="space-y-12">
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-6">
                {locale === 'th' ? 'กิจกรรมที่กำลังจะมาถึง' : 'Upcoming Events'}
              </h2>
              {upcomingEvents.length === 0 ? (
                <EmptyState
                  title={locale === 'th' ? 'ไม่มีกิจกรรมเร็วๆ นี้' : 'No upcoming events'}
                  description={
                    locale === 'th'
                      ? 'ลองปรับตัวกรอง หรือกลับมาดูใหม่ภายหลัง'
                      : 'Try adjusting filters or check back later.'
                  }
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} locale={locale as 'th' | 'en'} />
                  ))}
                </div>
              )}
            </div>

            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-6 opacity-80">
                  {locale === 'th' ? 'กิจกรรมที่จบลงแล้ว' : 'Past Events'}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 opacity-80 hover:opacity-100 transition-opacity">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} locale={locale as 'th' | 'en'} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
