import { expect, test } from '@playwright/test';
import { goToHomePage } from './helpers';

test.describe('Home page - unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // ← force no session

  test('TC-H1: should display welcome message without tag', async ({ page }) => {
    await goToHomePage(page);
    await expect(
      page.getByText(/bienvenu sur le site officiel de/i),
    ).toBeVisible();
  });

  test('TC-H2: should not display personalized greeting', async ({ page }) => {
    await goToHomePage(page);
    await expect(
      page.getByText(/bienvenue .+ sur le site officiel de/i),
    ).not.toBeVisible();
  });

  test('TC-H3: should display only PLANIFIED or ONGOING tournaments', async ({ page }) => {
    await goToHomePage(page);
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/spring arena cup 2025/i)).not.toBeVisible();
    await expect(page.getByText(/spring battle series 2026/i)).toBeVisible();
    await expect(page.getByText(/vinci easter cup 2026/i)).not.toBeVisible();
    await expect(page.getByText(/elite championship 2026/i)).toBeVisible();
  });
});

test.describe('Home page - authenticated', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('TC-H4: should display personalized greeting with user tag', async ({ page }) => {
    await goToHomePage(page);
    await expect(
      page.getByText(/bienvenue lynx sur le site officiel de/i),
    ).toBeVisible();
  });
});