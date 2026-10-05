import { expect, test } from '@playwright/test';
import { goToMembersPage } from './helpers';

// These tests run without any stored session (chromium-public).

test.describe('Members list - unauthenticated', () => {
  // TC-ML6: the page is accessible without login and all seeded members are visible
  test('TC-ML6: should display members without being logged in', async ({
    page,
  }) => {
    await goToMembersPage(page);
    await expect(page.getByText('Lynx').first()).toBeVisible();
    await expect(page.getByText('Rogue').first()).toBeVisible();
    await expect(page.getByText('Pulse').first()).toBeVisible();
    await expect(page.getByText('Iron').first()).toBeVisible();
  });
});
