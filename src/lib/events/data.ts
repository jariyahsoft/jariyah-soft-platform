import { adminDb } from '@/lib/firebase/admin';
import type { EventData, RegistrationData, EventStatus, EventType } from '@/lib/validators/event';

export async function getEvent(eventId: string): Promise<EventData | null> {
  const doc = await adminDb.collection('events').doc(eventId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    ...data,
    id: doc.id,
    startDate: data.startDate.toDate().toISOString(),
    endDate: data.endDate.toDate().toISOString(),
    registrationDeadline: data.registrationDeadline.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  } as EventData;
}

export async function listPublicEvents(options?: {
  limit?: number;
  type?: EventType;
}): Promise<EventData[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection('events')
    .where('status', '==', 'active')
    .orderBy('startDate', 'asc');

  if (options?.type) {
    query = query.where('type', '==', options.type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const snap = await query.get();
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      startDate: data.startDate.toDate().toISOString(),
      endDate: data.endDate.toDate().toISOString(),
      registrationDeadline: data.registrationDeadline.toDate().toISOString(),
    } as EventData;
  });
}

export async function getUserRegistrationStatus(eventId: string, uid: string): Promise<RegistrationData | null> {
  const doc = await adminDb
    .collection('events')
    .doc(eventId)
    .collection('registrations')
    .doc(uid)
    .get();

  if (!doc.exists) return null;
  
  const data = doc.data()!;
  return {
    userId: data.userId,
    status: data.status,
    registeredAt: data.registeredAt?.toDate?.()?.toISOString() || data.registeredAt,
  } as RegistrationData;
}

export async function getEventsByOrganizer(organizerId: string): Promise<EventData[]> {
  const snap = await adminDb
    .collection('events')
    .where('organizerId', '==', organizerId)
    .orderBy('createdAt', 'desc')
    .get();
    
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      startDate: data.startDate.toDate().toISOString(),
      endDate: data.endDate.toDate().toISOString(),
      registrationDeadline: data.registrationDeadline.toDate().toISOString(),
    } as EventData;
  });
}
