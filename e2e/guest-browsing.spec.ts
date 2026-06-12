import { expect, test } from '@playwright/test';
import { ensureUser, resetEmulators, seedPublishedArticle, seedPublishedSoftware } from './helpers/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  const developer = await ensureUser({
    displayName: 'Guest Browse Dev',
    email: 'guest-browse-dev@example.com',
    password: 'Password123!',
    role: 'developer',
  });

  await seedPublishedSoftware({
    developerName: 'Guest Browse Dev',
    name: 'Public Discovery App',
    ownerId: developer.uid,
  });
  await seedPublishedArticle({
    authorId: developer.uid,
    authorName: 'Guest Browse Dev',
    title: 'Public Discovery Knowledge',
  });
});

test('guest can browse the landing page, search, and open software detail', async ({ page }) => {
  await page.goto('/en');

  await expect(page.getByRole('heading', { name: 'Thai software platform' })).toBeVisible();
  await expect(page.getByText('Trending software')).toBeVisible();
  await expect(page.getByText('Recent articles')).toBeVisible();

  await page.getByPlaceholder('Search software, articles, and developers').fill('Public Discovery');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/search\?q=Public%20Discovery/);

  await page.goto('/en/software/public-discovery-app');
  await expect(page.getByRole('heading', { name: 'Public Discovery App' })).toBeVisible();
  await expect(page.getByText('Seeded public software entry for Playwright coverage.')).toBeVisible();
});
