import { expect, test } from '@playwright/test';
import { goToMembersPage } from './helpers';

// Lea is logged in automatically via playwright/.auth/user.json (chromium-user).

test.describe('Members list', () => {
  test.beforeEach(async ({ page }) => {
    await goToMembersPage(page);
  });

  // TC-ML1: the page displays the title and the search field
  test('TC-ML1: should display the page title and search field', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /liste des membres/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/rechercher par tag/i)).toBeVisible();
  });

  // TC-ML2: the four seeded members appear on the page
  test('TC-ML2: should display the four seeded members', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Lynx' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rogue' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pulse' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Iron' }).first()).toBeVisible();
  });

  // TC-ML3: lea's card (Lynx) appears first because she is the current user
  test('TC-ML3: should show Lynx card first as the current user', async ({
    page,
  }) => {
    const cards = page.getByRole('article').or(page.locator('.MuiCard-root'));
    await expect(cards.first()).toContainText('Lynx');
  });

  // TC-ML4: searching "Ir" filters and shows only Iron (prefix search)
  test('TC-ML4: should filter members by tag prefix', async ({ page }) => {
    await page.getByLabel(/rechercher par tag/i).fill('Ir');
    await expect(
      page.getByRole('heading', { name: 'Iron', exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Lynx', exact: true }),
    ).not.toBeVisible();
    await expect(page.getByText('Rogue')).not.toBeVisible();
    await expect(page.getByText('Pulse')).not.toBeVisible();
  });

  // TC-ML5: clicking on Iron's card navigates to /members/:id
  test('TC-ML5: should navigate to member details when clicking a card', async ({
    page,
  }) => {
    await page
      .getByRole('heading', { name: 'Iron', exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/members\/\d+$/);
  });

  // TC-ML7: searching a tag that does not exist shows the empty state message
  test('TC-ML7: should show empty state when no member matches the search', async ({
    page,
  }) => {
    await page.getByLabel(/rechercher par tag/i).fill('zzz');
    await expect(page.getByText(/aucun membre trouvé/i)).toBeVisible();
  });
});
