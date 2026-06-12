import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  cleanupRulesTestEnvironment,
  firestoreFns,
  getAuthedDb,
  resetRulesTestData,
  setupRulesTestEnvironment,
} from './testEnvironment';

beforeAll(async () => {
  await setupRulesTestEnvironment();
});

beforeEach(async () => {
  await resetRulesTestData();
});

afterAll(async () => {
  await cleanupRulesTestEnvironment();
});

describe('notifications rules', () => {
  it('allows users to read only their own notifications', async () => {
    await assertSucceeds(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('member-1', 'member'), 'notifications/notif-1'))
    );
    await assertFails(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('member-2', 'member'), 'notifications/notif-1'))
    );
  });

  it('allows updating readAt only and denies any other notification changes', async () => {
    const db = getAuthedDb('member-1', 'member');

    await assertSucceeds(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'notifications/notif-1'), {
        readAt: firestoreFns.serverTimestamp(),
      })
    );

    await assertFails(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'notifications/notif-1'), {
        message: 'tampered',
      })
    );
  });
});
