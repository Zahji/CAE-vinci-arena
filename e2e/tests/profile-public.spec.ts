import { expect, test } from '@playwright/test';

test.describe('Profile - unauthenticated', () => {
  test('TC-P8: should show message or redirect when not logged in', async ({ page }) => {
    await page.goto('/profile');
    const isRedirected = page.url().includes('/login');
    const hasMessage = await page.getByText(/vous devez être connecté/i).isVisible();
    expect(isRedirected || hasMessage).toBeTruthy();
  });
});
