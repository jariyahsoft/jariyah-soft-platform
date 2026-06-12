import { expect, test } from '@playwright/test';
import { ensureUser, resetEmulators } from './helpers/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  await ensureUser({
    displayName: 'Developer Submitter',
    email: 'developer-submit@example.com',
    password: 'Password123!',
    role: 'developer',
  });
});

test('developer creates and submits software successfully', async ({ page }) => {
  await page.goto('/en/login');
  await page.getByLabel('Email').fill('developer-submit@example.com');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/);

  await page.goto('/en/dashboard/software/new');
  await expect(page.getByRole('heading', { name: 'Submit software' })).toBeVisible();

  await page.getByLabel('Name').fill('Developer Submission App');
  await page.getByLabel('Short description').fill(
    'A submission created by Playwright to verify the developer flow works end to end.'
  );
  await page.getByLabel('Description (Markdown)').fill(
    'This is a long enough Markdown description to satisfy the submission requirements.'
  );
  await page.getByLabel('Category').selectOption('developer-tools');
  await page.getByLabel('License').selectOption('MIT');
  await page.getByLabel('Repository URL').fill('https://github.com/example/developer-submission-app');
  await page.getByLabel('Download URL').fill('https://example.com/developer-submission-app.zip');

  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard\/software/);
  await expect(page.getByText('Developer Submission App')).toBeVisible();
  await expect(page.getByText('submitted')).toBeVisible();
});
