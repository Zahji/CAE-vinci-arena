import { expect, test } from '@playwright/test';
import { goToMembersPage } from './helpers';

// These tests run without any stored session (chromium-public).

test.describe('Member details - unauthenticated', () => {
  // TC-MD8: the page is accessible without login and shows member info
  test('TC-MD8: should display member details without being logged in', async ({ page }) => {
    await goToMembersPage(page);
    await page.getByText('Iron').first().click();
    await expect(page).toHaveURL(/\/members\/\d+$/);

    await expect(page.getByText('Iron').first()).toBeVisible();
    await expect(page.getByText('Gardien')).toBeVisible();
    await expect(page.getByText(/TEAM_/i).first()).toBeVisible();
    await expect(page.getByText(/membre depuis le/i)).toBeVisible();
  });
});