import { expect, test } from '@playwright/test';
import { goToMembersPage } from './helpers';

// Lea is logged in automatically via playwright/.auth/user.json (chromium-user).

test.describe('Member details - authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await goToMembersPage(page);
    await page.getByText('Iron').first().click();
    await expect(page).toHaveURL(/\/members\/\d+$/);
  });

  // TC-MD1: the page displays the member tag
  test('TC-MD1: should display the member tag', async ({ page }) => {
    await expect(page.getByText('Iron').first()).toBeVisible();
  });

  // TC-MD2: the page displays the member speciality
  test('TC-MD2: should display the member speciality', async ({ page }) => {
    await expect(page.getByText('Gardien')).toBeVisible();
  });

  // TC-MD3: the page displays the team name
  test('TC-MD3: should display the team name', async ({ page }) => {
    await expect(page.getByText(/TEAM_/i).first()).toBeVisible();
  });

  // TC-MD4: the page displays the member creation date
  test('TC-MD4: should display the member creation date', async ({ page }) => {
    await expect(page.getByText(/membre depuis le/i)).toBeVisible();
  });

  // TC-MD5: clicking on the team name navigates to /teams/id
  test('TC-MD5: should navigate to team page when clicking team name', async ({ page }) => {
    await page.getByText(/TEAM_/i).first().click();
    await expect(page).toHaveURL(/\/teams\/\d+$/);
  });

  // TC-MD6: navigating to an invalid member id shows an error
  test('TC-MD6: should show an error for an invalid member id', async ({ page }) => {
    await page.goto('/members/abc');
    await expect(page.getByText(/identifiant de membre invalide/i)).toBeVisible();
  });

  // TC-MD7: navigating to a non-existent member id shows an error
  test('TC-MD7: should show an error for a non-existent member id', async ({ page }) => {
    await page.goto('/members/99999');
    await expect(page.getByText(/membre introuvable/i)).toBeVisible();
  });
});