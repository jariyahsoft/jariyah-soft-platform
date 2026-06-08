import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Callable function to set a user's role.
 * Only accessible by administrators.
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to perform this action.'
    );
  }

  // 2. Verify Authorization (Caller must be an admin)
  const callerRole = context.auth.token.role;
  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to assign roles. Admin access required.'
    );
  }

  // 3. Validate Input Data
  const { targetUid, newRole } = data;
  if (!targetUid || typeof targetUid !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'The "targetUid" must be a string.');
  }

  const validRoles = ['member', 'developer', 'moderator', 'admin'];
  if (!newRole || !validRoles.includes(newRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `The "newRole" must be one of: ${validRoles.join(', ')}.`
    );
  }

  // Prevent admin from downgrading themselves (safety mechanism)
  if (targetUid === context.auth.uid && newRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You cannot downgrade your own admin privileges.'
    );
  }

  try {
    // 4. Update Custom Claims
    await admin.auth().setCustomUserClaims(targetUid, { role: newRole });
    functions.logger.info(`Custom claims for ${targetUid} updated to ${newRole} by ${context.auth.uid}`);

    // 5. Update Firestore `users` Document
    const userRef = admin.firestore().collection('users').doc(targetUid);
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update({
      role: newRole,
      updatedAt: serverTimestamp,
    });
    functions.logger.info(`Firestore user document ${targetUid} role updated.`);

    // 6. Create Audit Log
    const auditLogRef = admin.firestore().collection('audit_logs').doc();
    await auditLogRef.set({
      actorId: context.auth.uid,
      action: 'UPDATE_ROLE',
      resourceType: 'user',
      resourceId: targetUid,
      details: {
        newRole: newRole
      },
      createdAt: serverTimestamp,
    });

    return { success: true, message: `Role successfully updated to ${newRole}` };
  } catch (error: unknown) {
    functions.logger.error(`Failed to update role for ${targetUid}`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', `Error updating role: ${errorMessage}`);
  }
});
