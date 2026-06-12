import { expect, test } from '@playwright/test';
import { resetEmulators } from './helpers/emulator';

test.beforeAll(async () => {
  await resetEmulators();
});

test('user can sign up, see the verification prompt, and log in', async ({ page }) => {
  const email = `signup-${Date.now()}@example.com`;
  const password = 'Password123!';

  await page.goto('/en/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();

  await page.getByRole('link', { name: 'Proceed to Login' }).click();
  await expect(page).toHaveURL(/\/en\/login/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});
