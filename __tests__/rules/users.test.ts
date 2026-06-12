import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  cleanupRulesTestEnvironment,
  firestoreFns,
  getAuthedDb,
  getGuestDb,
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

describe('users rules', () => {
  it('denies guest reads', async () => {
    await assertFails(firestoreFns.getDoc(firestoreFns.doc(getGuestDb(), 'users/member-1')));
  });

  it('allows a member to create their own active member profile', async () => {
    const db = getAuthedDb('member-2', 'member');

    await assertSucceeds(
      firestoreFns.setDoc(firestoreFns.doc(db, 'users/member-2'), {
        displayName: 'Member Two',
        locale: 'en',
        notificationPreferences: { email: true },
        role: 'member',
        status: 'active',
      })
    );
  });

  it('denies creating a profile for another user id', async () => {
    const db = getAuthedDb('member-2', 'member');

    await assertFails(
      firestoreFns.setDoc(firestoreFns.doc(db, 'users/member-3'), {
        displayName: 'Wrong Owner',
        role: 'member',
        status: 'active',
      })
    );
  });

  it('allows reading your own profile but denies reading another user profile', async () => {
    const db = getAuthedDb('member-1', 'member');

    await assertSucceeds(firestoreFns.getDoc(firestoreFns.doc(db, 'users/member-1')));
    await assertFails(firestoreFns.getDoc(firestoreFns.doc(db, 'users/dev-1')));
  });

  it('allows admin reads across users', async () => {
    const db = getAuthedDb('admin-1', 'admin');

    await assertSucceeds(firestoreFns.getDoc(firestoreFns.doc(db, 'users/dev-1')));
  });

  it('allows safe profile field updates only', async () => {
    const db = getAuthedDb('member-1', 'member');

    await assertSucceeds(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'users/member-1'), {
        displayName: 'Member One Updated',
        updatedAt: firestoreFns.serverTimestamp(),
      })
    );
  });

  it('denies updating restricted fields like role', async () => {
    const db = getAuthedDb('member-1', 'member');

    await assertFails(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'users/member-1'), {
        role: 'admin',
      })
    );
  });
});
