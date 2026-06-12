import { expect, test } from '@playwright/test';
import {
  ensureUser,
  resetEmulators,
  seedPendingSoftware,
} from './helpers/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  const developer = await ensureUser({
    displayName: 'Pending Developer',
    email: 'pending-dev@example.com',
    password: 'Password123!',
    role: 'developer',
  });
  await ensureUser({
    displayName: 'Moderator Reviewer',
    email: 'moderator@example.com',
    password: 'Password123!',
    role: 'moderator',
  });

  await seedPendingSoftware({
    developerName: 'Pending Developer',
    name: 'Moderation Ready App',
    ownerId: developer.uid,
  });
});

test('moderator approves a pending submission and it becomes public', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/en/login');
  await page.getByLabel('Email').fill('moderator@example.com');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard/);

  await page.goto('/en/dashboard/moderation');
  await expect(page.getByText('Moderation Ready App')).toBeVisible();

  await page.getByRole('button', { name: 'Review' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard\/moderation\/software\/moderation-ready-app/);

  await page.getByRole('button', { name: 'Approve and publish' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard\/moderation/);

  await page.goto('/en/software/moderation-ready-app');
  await expect(page.getByRole('heading', { name: 'Moderation Ready App' })).toBeVisible();
  await expect(page.getByText('Published')).toBeVisible();
});
