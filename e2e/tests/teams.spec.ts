import { expect, test } from '@playwright/test';
import { createTeamWith, goToTeamsListPage } from './helpers';

// Lea is logged in automatically via playwright/.auth/user.json (chromium-user).
// She is the manager of TEAM_ALPHA and already has a team.

test.describe('Teams list', () => {
  test.beforeEach(async ({ page }) => {
    await goToTeamsListPage(page);
  });

  // TC-TL1: the page displays the title and the table columns
  test('TC-TL1: should display the page title and table columns', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /liste des teams/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Nom', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /nombre de membres/i }),
    ).toBeVisible();
  });

  // TC-TL2: the two seeded teams appear in the table
  test('TC-TL2: should display TEAM_ALPHA and TEAM_OMEGA', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'TEAM_ALPHA' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TEAM_OMEGA' })).toBeVisible();
  });

  // TC-TL3: clicking on TEAM_ALPHA navigates to /teams/:id
  test('TC-TL3: should navigate to team details when clicking TEAM_ALPHA', async ({
    page,
  }) => {
    await page.getByRole('row').filter({ hasText: 'TEAM_ALPHA' }).getByRole('cell').first().click();
    await expect(page).toHaveURL(/\/teams\/\d+$/);
  });

  // TC-TL4: the join column and the create form are visible for any
  // authenticated user, even lea who already has a team
  test('TC-TL4: should show join column and create form for authenticated user', async ({
    page,
  }) => {
    await expect(
      page.getByRole('columnheader', { name: /demande d'adhésion/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /nom de la team/i }),
    ).toBeVisible();
  });

  // TC-TL5: TEAM_ALPHA appears first in the list and shows "Ma team"
  // because lea is its manager
  test('TC-TL5: should show TEAM_ALPHA first with "Ma team"', async ({
    page,
  }) => {
    const firstDataRow = page.getByRole('row').nth(1);
    await expect(firstDataRow).toContainText('TEAM_ALPHA');
    await expect(firstDataRow).toContainText('Ma team');
  });

  // TC-TL6: the Rejoindre buttons of other teams are disabled for lea
  // because she already belongs to a team
  test('TC-TL6: should show disabled Indisponible buttons for lea', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /indisponible/i }).first(),
    ).toBeDisabled();
  });

  // TC-TL7: the extended help text is shown because lea has a team
  test('TC-TL7: should show extended help text for user with a team', async ({
    page,
  }) => {
    await expect(
      page.getByText(/sur votre team, vous pouvez également/i),
    ).toBeVisible();
  });

  // TC-TL12: lea submits the create form → error because she already has a team
  test('TC-TL12: should show error when lea tries to create a team', async ({
    page,
  }) => {
    await createTeamWith(page, 'MA_NOUVELLE_TEAM');
    await expect(
      page.getByText(/impossible de créer une nouvelle team/i),
    ).toBeVisible();
  });
});
