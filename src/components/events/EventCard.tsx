import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import type { EventData, EventType } from '@/lib/validators/event';
import { TYPE_LABELS } from '@/lib/validators/event';

interface EventCardProps {
  event: EventData;
  locale: 'th' | 'en';
}

const TYPE_BADGE_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'elite'> = {
  webinar: 'info',
  workshop: 'success',
  meetup: 'warning',
  hackathon: 'elite',
  competition: 'elite',
};

export function EventCard({ event, locale }: EventCardProps) {
  const typeLabel = TYPE_LABELS[event.type as EventType]?.[locale] || event.type;
  const badgeVariant = TYPE_BADGE_VARIANT[event.type] || 'default';
  
  const startDate = new Date(event.startDate);
  const isPast = startDate < new Date();
  
  const dateStr = startDate.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = startDate.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const spotsRemaining = Math.max(0, event.capacity - event.registrationCount);
  const isFull = spotsRemaining === 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
        isPast ? 'opacity-70 grayscale-[0.2]' : ''
      }`}
    >
      <div className="space-y-4">
        {/* Type badge */}
        <div className="flex items-center justify-between">
          <Badge variant={badgeVariant} size="sm">
            {typeLabel}
          </Badge>
          {isPast ? (
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              {locale === 'th' ? 'จบแล้ว' : 'Past Event'}
            </span>
          ) : isFull ? (
            <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold text-warning border border-warning/15">
              {locale === 'th' ? 'เต็ม (ลงชื่อรอ)' : 'Full (Waitlist)'}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success border border-success/15">
              {locale === 'th' ? `ว่าง ${spotsRemaining} ที่` : `${spotsRemaining} spots left`}
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors duration-200 line-clamp-2">
            {event.title}
          </h3>
        </div>

        {/* Info list */}
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-accent/70" />
            <span>{dateStr} • {timeStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-accent/70" />
            <span className="truncate">
              {event.venueType === 'online' ? (locale === 'th' ? 'ออนไลน์' : 'Online') : event.venueDetails}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-accent/70" />
            <span>
              {event.registrationCount} / {event.capacity} {locale === 'th' ? 'คน' : 'Attendees'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
