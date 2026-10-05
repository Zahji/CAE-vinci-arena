import { expect, test } from '@playwright/test';
import { goToTeamDetailsPage } from './helpers';

// Lea is logged in automatically via playwright/.auth/user.json (chromium-user).

test.describe('Team details', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-user',
      'Team details authenticated tests use the Lea user state.',
    );
  });

  // TC-TDTE1: the page displays the team title and members table columns
  test('TC-TDTE1: should display team header and members table columns', async ({
    page,
  }) => {
    await goToTeamDetailsPage(page, 1);

    await expect(
      page.getByRole('heading', { name: /membres de la team\s*:\s*team_alpha/i }),
    ).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tag' })).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /spécialité/i }),
    ).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /rôle/i })).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /actions/i }),
    ).toBeVisible();
  });

  // TC-TDTE2: as main manager, Lea cannot leave before designating
  // a second manager
  test('TC-TDTE2: should disable leave button for primary manager without second manager', async ({
    page,
  }) => {
    await goToTeamDetailsPage(page, 1);

    await expect(
      page.getByText(/désignez d'abord un second responsable/i),
    ).toBeVisible();

    const leaveButton = page.getByRole('button', { name: /quitter la team/i });
    await expect(leaveButton).toBeVisible();
    await expect(leaveButton).toBeDisabled();
  });

  // TC-TDTE3: the activity block displays past/ongoing/future sections
  test('TC-TDTE3: should display the three activity sections', async ({ page }) => {
    await goToTeamDetailsPage(page, 1);

    await expect(
      page.getByRole('heading', { name: /activité de la team/i }),
    ).toBeVisible();
    await expect(page.getByText('Passés')).toBeVisible();
    await expect(page.getByText('En cours')).toBeVisible();
    await expect(page.getByText('Futurs')).toBeVisible();
  });

  // TC-TDTE4: clicking on another member's tag navigates to their member details page
  // (clicking Lynx = Lea herself would redirect to /profile)
  test('TC-TDTE4: should navigate to member details when clicking Rogue', async ({
    page,
  }) => {
    await goToTeamDetailsPage(page, 1);

    const rogueRow = page.getByRole('row').filter({ hasText: 'Rogue' });
    await rogueRow.getByText('Rogue').click();
    await expect(page).toHaveURL(/\/members\/\d+$/);
  });
});
