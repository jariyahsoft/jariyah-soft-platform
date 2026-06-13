import { z } from 'zod';

export const EVENT_TYPES = ['webinar', 'workshop', 'meetup', 'hackathon', 'competition'] as const;
export const EVENT_STATUSES = ['active', 'cancelled', 'completed'] as const;
export const VENUE_TYPES = ['online', 'offline', 'hybrid'] as const;

export type EventType = typeof EVENT_TYPES[number];
export type EventStatus = typeof EVENT_STATUSES[number];
export type VenueType = typeof VENUE_TYPES[number];

export const TYPE_LABELS: Record<EventType, { th: string; en: string }> = {
  webinar: { th: 'สัมมนาออนไลน์', en: 'Webinar' },
  workshop: { th: 'เชิงปฏิบัติการ', en: 'Workshop' },
  meetup: { th: 'พบปะสังสรรค์', en: 'Meetup' },
  hackathon: { th: 'แฮกกาธอน', en: 'Hackathon' },
  competition: { th: 'การแข่งขัน', en: 'Competition' },
};

export const createEventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  type: z.enum(EVENT_TYPES),
  venueType: z.enum(VENUE_TYPES),
  venueDetails: z.string().min(5, 'Venue details must be at least 5 characters'),
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  endDate: z.string().datetime({ message: 'Invalid end date' }),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(10000, 'Capacity too large'),
  registrationDeadline: z.string().datetime({ message: 'Invalid registration deadline' }),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine(data => new Date(data.registrationDeadline) < new Date(data.startDate), {
  message: 'Registration deadline must be before start date',
  path: ['registrationDeadline'],
});

export interface EventData {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  venueType: VenueType;
  venueDetails: string;
  startDate: string; // ISO string in API, Firestore Timestamp in DB
  endDate: string;
  capacity: number;
  registrationCount: number;
  registrationDeadline: string;
  organizerId: string;
  createdAt: any;
  updatedAt: any;
}

export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | 'attended';

export interface RegistrationData {
  userId: string;
  status: RegistrationStatus;
  registeredAt: any;
}
