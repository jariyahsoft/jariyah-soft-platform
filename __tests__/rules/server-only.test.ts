import { assertFails } from '@firebase/rules-unit-testing';
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

describe('server-only collections rules', () => {
  it('denies all reads to audit logs and system settings for guests and admins alike', async () => {
    await assertFails(firestoreFns.getDoc(firestoreFns.doc(getGuestDb(), 'audit_logs/log-1')));
    await assertFails(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('admin-1', 'admin'), 'audit_logs/log-1'))
    );
    await assertFails(
      firestoreFns.getDoc(firestoreFns.doc(getAuthedDb('admin-1', 'admin'), 'system_settings/main'))
    );
  });
});
