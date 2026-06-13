import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withRole } from '@/lib/api/withRole';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

// POST /api/v1/events/{id}/registrations — Register for an event
export const POST = withRateLimit(
  { max: 5, windowMs: 60000 },
  withRole('member', async (req: any, context: any) => {
    try {
      const { id: eventId } = await context.params;
      const uid = req.user.uid;

      const eventRef = adminDb.collection('events').doc(eventId);
      const registrationRef = eventRef.collection('registrations').doc(uid);

      let finalStatus = '';

      // Run a transaction to ensure capacity is not exceeded
      await adminDb.runTransaction(async (tx) => {
        const [eventDoc, regDoc] = await Promise.all([
          tx.get(eventRef),
          tx.get(registrationRef),
        ]);

        if (!eventDoc.exists) {
          throw new Error('Event not found');
        }

        const eventData = eventDoc.data()!;
        
        // Check if event is active
        if (eventData.status !== 'active') {
          throw new Error('Event is not active');
        }

        // Check deadline
        const deadline = eventData.registrationDeadline.toDate();
        if (new Date() > deadline) {
          throw new Error('Registration deadline has passed');
        }

        // Idempotency: if already registered/waitlisted, return existing status
        if (regDoc.exists) {
          finalStatus = regDoc.data()!.status;
          return;
        }

        // Calculate capacity and waitlist
        const capacity = eventData.capacity;
        const currentCount = eventData.registrationCount || 0;

        if (currentCount < capacity) {
          // Spot available
          finalStatus = 'registered';
          tx.set(registrationRef, {
            userId: uid,
            status: finalStatus,
            registeredAt: FieldValue.serverTimestamp(),
          });
          tx.update(eventRef, {
            registrationCount: FieldValue.increment(1),
          });
        } else {
          // Full -> waitlist
          finalStatus = 'waitlisted';
          tx.set(registrationRef, {
            userId: uid,
            status: finalStatus,
            registeredAt: FieldValue.serverTimestamp(),
          });
          // Do not increment registrationCount for waitlist
        }
      });

      return successResponse({ status: finalStatus }, {}, 200);
    } catch (error: any) {
      console.error('Error registering for event:', error);
      
      const message = error.message;
      if (['Event not found', 'Event is not active', 'Registration deadline has passed'].includes(message)) {
        return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, message, ApiErrors.BUSINESS_RULE_VIOLATION.status);
      }

      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to register', ApiErrors.INTERNAL_ERROR.status);
    }
  })
);
