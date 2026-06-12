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

describe('articles rules', () => {
  it('allows guests to read published articles only', async () => {
    const db = getGuestDb();

    await assertSucceeds(firestoreFns.getDoc(firestoreFns.doc(db, 'articles/pub-1')));
    await assertFails(firestoreFns.getDoc(firestoreFns.doc(db, 'articles/draft-1')));
  });

  it('allows authors and moderators to read draft articles', async () => {
    await assertSucceeds(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('dev-1', 'developer'), 'articles/draft-1'))
    );
    await assertSucceeds(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('mod-1', 'moderator'), 'articles/draft-1'))
    );
  });

  it('allows developers to create their own draft articles', async () => {
    const db = getAuthedDb('dev-2', 'developer');

    await assertSucceeds(
      firestoreFns.setDoc(firestoreFns.doc(db, 'articles/new-draft'), {
        authorId: 'dev-2',
        body: 'This article body is intentionally long enough to satisfy validation rules for articles.',
        categoryId: 'tutorials',
        excerpt: 'This article excerpt is long enough to pass the rules test.',
        language: 'en',
        slug: 'new-article-draft',
        status: 'draft',
        title: 'A Fresh Draft Article',
      })
    );
  });

  it('denies article creation for members and denies direct client updates', async () => {
    await assertFails(
      firestoreFns.setDoc(firestoreFns.doc(getAuthedDb('member-1', 'member'), 'articles/member-draft'), {
        authorId: 'member-1',
        body: 'This should not be allowed for a member user.',
        categoryId: 'tutorials',
        excerpt: 'Member article excerpt content.',
        language: 'en',
        status: 'draft',
        title: 'Member Article',
      })
    );

    await assertFails(
      firestoreFns.updateDoc(firestoreFns.doc(getAuthedDb('dev-1', 'developer'), 'articles/draft-1'), {
        title: 'Client-side update should be denied',
      })
    );
  });
});
