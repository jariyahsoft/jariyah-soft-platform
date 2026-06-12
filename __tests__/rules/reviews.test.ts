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

describe('reviews rules', () => {
  it('allows public reads for approved reviews and denies pending review reads', async () => {
    const db = getGuestDb();

    await assertSucceeds(firestoreFns.getDoc(firestoreFns.doc(db, 'reviews/approved-1')));
    await assertFails(firestoreFns.getDoc(firestoreFns.doc(db, 'reviews/pending-1')));
  });

  it('allows signed-in members to create valid pending reviews', async () => {
    const db = getAuthedDb('member-2', 'member');

    await assertSucceeds(
      firestoreFns.setDoc(firestoreFns.doc(db, 'reviews/new-review'), {
        body: 'This review body is valid and detailed enough.',
        rating: 5,
        softwareId: 'pub-1',
        status: 'pending',
        userId: 'member-2',
      })
    );
  });

  it('denies invalid ratings, user spoofing, and self-reviews', async () => {
    const memberDb = getAuthedDb('member-2', 'member');
    const ownerDb = getAuthedDb('dev-1', 'developer');

    await assertFails(
      firestoreFns.setDoc(firestoreFns.doc(memberDb, 'reviews/invalid-rating'), {
        body: 'This review has an invalid rating.',
        rating: 6,
        softwareId: 'pub-1',
        status: 'pending',
        userId: 'member-2',
      })
    );

    await assertFails(
      firestoreFns.setDoc(firestoreFns.doc(memberDb, 'reviews/spoofed-user'), {
        body: 'This review spoofs another user id.',
        rating: 4,
        softwareId: 'pub-1',
        status: 'pending',
        userId: 'member-1',
      })
    );

    await assertFails(
      firestoreFns.setDoc(firestoreFns.doc(ownerDb, 'reviews/self-review'), {
        body: 'The owner should not be able to review their own software.',
        rating: 5,
        softwareId: 'pub-1',
        status: 'pending',
        userId: 'dev-1',
      })
    );
  });

  it('allows owners to update their own pending review only with valid ratings', async () => {
    const db = getAuthedDb('member-1', 'member');

    await assertSucceeds(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'reviews/pending-1'), {
        body: 'Updated pending review body.',
        rating: 3,
      })
    );

    await assertFails(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'reviews/pending-1'), {
        rating: 0,
      })
    );
  });
});
