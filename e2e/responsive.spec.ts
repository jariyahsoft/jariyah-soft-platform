import { expect, test } from '@playwright/test';
import { ensureUser, resetEmulators, seedPublishedArticle, seedPublishedSoftware } from './helpers/emulator';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeAll(async () => {
  await resetEmulators();
  const developer = await ensureUser({
    displayName: 'Responsive Dev',
    email: 'responsive-dev@example.com',
    password: 'Password123!',
    role: 'developer',
  });
  await seedPublishedSoftware({
    developerName: 'Responsive Dev',
    name: 'Responsive Ready App',
    ownerId: developer.uid,
  });
  await seedPublishedArticle({
    authorId: developer.uid,
    authorName: 'Responsive Dev',
    title: 'Responsive Layout Article',
  });
});

test('key public pages stay usable on a mobile viewport', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: 'Thai software platform' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Become a developer' })).toBeVisible();

  await page.goto('/en/software');
  await expect(page.getByRole('heading', { name: 'Find software worth trusting.' })).toBeVisible();
  await expect(page.getByText('Responsive Ready App')).toBeVisible();

  await page.goto('/en/search?q=responsive');
  await expect(page.getByRole('heading', { name: 'Search results' })).toBeVisible();
});
