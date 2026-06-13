import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

// DELETE /api/v1/events/{id}/registrations/me — Cancel registration
export const DELETE = withRole('member', async (req: any, context: any) => {
  try {
    const { id: eventId } = await context.params;
    const uid = req.user.uid;

    const registrationRef = adminDb
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .doc(uid);

    const doc = await registrationRef.get();
    
    if (!doc.exists) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Registration not found', ApiErrors.NOT_FOUND.status);
    }

    // Delete the registration document
    // NOTE: This will trigger the `promoteWaitlist` Cloud Function!
    // The Cloud Function handles promoting the waitlist AND decrementing the event registrationCount.
    await registrationRef.delete();

    return successResponse({ message: 'Registration cancelled' });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to cancel registration', ApiErrors.INTERNAL_ERROR.status);
  }
});
