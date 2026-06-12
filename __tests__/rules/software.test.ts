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

describe('software rules', () => {
  it('allows guests to read published software only', async () => {
    const db = getGuestDb();

    await assertSucceeds(firestoreFns.getDoc(firestoreFns.doc(db, 'software/pub-1')));
    await assertFails(firestoreFns.getDoc(firestoreFns.doc(db, 'software/draft-1')));
  });

  it('allows owners to read their drafts and moderators to read all drafts', async () => {
    await assertSucceeds(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('dev-1', 'developer'), 'software/draft-1'))
    );
    await assertSucceeds(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('mod-1', 'moderator'), 'software/draft-1'))
    );
  });

  it('allows a developer to create their own draft software', async () => {
    const db = getAuthedDb('dev-2', 'developer');

    await assertSucceeds(
      firestoreFns.setDoc(firestoreFns.doc(db, 'software/new-draft'), {
        categoryId: 'developer-tools',
        description: 'A complete enough description for rules testing.',
        downloadURL: 'https://example.com/download',
        licenseId: 'MIT',
        name: 'Rules Test App',
        ownerId: 'dev-2',
        platforms: ['web'],
        shortDescription: 'A software draft created in a rules test.',
        slug: 'rules-test-app',
        status: 'draft',
      })
    );
  });

  it('denies draft creation for members or owner mismatches', async () => {
    await assertFails(
      firestoreFns.setDoc(firestoreFns.doc(getAuthedDb('member-1', 'member'), 'software/member-draft'), {
        name: 'Member Draft',
        ownerId: 'member-1',
        platforms: ['web'],
        shortDescription: 'A software draft created by a member.',
        status: 'draft',
      })
    );

    await assertFails(
      firestoreFns.setDoc(firestoreFns.doc(getAuthedDb('dev-2', 'developer'), 'software/wrong-owner'), {
        name: 'Wrong Owner Draft',
        ownerId: 'dev-1',
        platforms: ['web'],
        shortDescription: 'A software draft with a mismatched owner.',
        status: 'draft',
      })
    );
  });

  it('allows editing allowed draft fields but denies client-side status changes', async () => {
    const db = getAuthedDb('dev-1', 'developer');

    await assertSucceeds(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'software/draft-1'), {
        shortDescription: 'Draft software short description updated by the owner.',
        updatedAt: firestoreFns.serverTimestamp(),
      })
    );

    await assertFails(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'software/draft-1'), {
        status: 'published',
      })
    );
  });

  it('denies edits after content is pending or published', async () => {
    const db = getAuthedDb('dev-1', 'developer');

    await assertFails(
      firestoreFns.updateDoc(firestoreFns.doc(db, 'software/pub-1'), {
        shortDescription: 'Trying to edit published software.',
      })
    );
  });
});
