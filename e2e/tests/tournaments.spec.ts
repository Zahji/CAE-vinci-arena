import { expect, Page, test } from '@playwright/test';
import { goToTournamentsPage } from './helpers';

// Lea is logged in automatically via playwright/.auth/user.json (chromium-user).

const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const openFilterSelect = async (
  page: Page,
  label: string,
) => {
  await page.locator('div[role="combobox"]', { hasText: label }).first().click();
};

const selectVisibleOption = async (
  page: Page,
  options: { name?: string; value?: string },
) => {
  const listbox = page.locator('ul[role="listbox"]:visible').last();

  if (options.value) {
    await listbox.locator(`li[role="option"][data-value="${options.value}"]`).click();
    return;
  }

  if (options.name) {
    await listbox.getByRole('option', { name: options.name, exact: true }).click();
  }
};

const tournamentHeading = (page: Page, name: string) =>
  page.getByRole('heading', { name, exact: true });

test.describe('Tournaments list', () => {
  test.beforeEach(async ({ page }) => {
    await goToTournamentsPage(page);
  });

  // TC-TR1: the page displays the title, filters and seeded tournament cards
  test('TC-TR1: should display title, filters and tournament cards', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: /tournois/i })).toBeVisible();
    await expect(page.getByLabel(/nom du tournoi/i)).toBeVisible();
    await expect(page.getByLabel(/nom de team participante/i)).toBeVisible();
    await expect(page.getByLabel(/tag d'un joueur inscrit/i)).toBeVisible();
    await expect(page.locator('div[role="combobox"]', { hasText: 'État' })).toBeVisible();
    await expect(page.locator('div[role="combobox"]', { hasText: 'Disponibilité' })).toBeVisible();
    await expect(page.locator('div[role="combobox"]', { hasText: 'Jour' })).toBeVisible();
    await expect(page.locator('div[role="combobox"]', { hasText: 'Mois' })).toBeVisible();
    await expect(page.getByLabel(/année/i)).toBeVisible();
    await expect(page.locator('div[role="combobox"]', { hasText: 'Durée' })).toBeVisible();
    await expect(page.getByRole('button', { name: /période/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /réinitialiser/i })).toBeVisible();

    await expect(tournamentHeading(page, 'Elite Championship 2026')).toBeVisible();
    await expect(page.getByText(/début des inscriptions : 11\/04\/2026/i)).toBeVisible();
    await expect(page.getByText(/fin des inscriptions : 13\/05\/2026/i)).toBeVisible();
    await expect(page.getByText('Teams inscrites : 9/10').first()).toBeVisible();
  });

  // TC-TR2: seeded tournaments are listed and the user can open one
  test('TC-TR2: should navigate to tournament details when clicking a row', async ({
    page,
  }) => {
    await expect(tournamentHeading(page, 'Elite Championship 2026')).toBeVisible();
    await tournamentHeading(page, 'Elite Championship 2026').click();
    await expect(page).toHaveURL(/\/tournaments\/\d+$/);
  });

  // TC-TR4: filtering by tournament name keeps the searched tournament visible
  test('TC-TR4: should keep searched tournament visible with name filter', async ({
    page,
  }) => {
    await page.getByLabel(/nom du tournoi/i).fill('Elite Championship 2026');
    await expect(tournamentHeading(page, 'Elite Championship 2026')).toBeVisible();
    await expect(tournamentHeading(page, 'Spring Arena Cup 2025')).toHaveCount(0);
  });

  // TC-TR5: filtering by state keeps only the matching state entries
  test('TC-TR5: should filter tournaments by state', async ({ page }) => {
    await openFilterSelect(page, 'État');
    await selectVisibleOption(page, { name: 'Terminé' });

    await expect(
      tournamentHeading(page, 'Spring Arena Cup 2025'),
    ).toBeVisible();
    await expect(tournamentHeading(page, 'Elite Championship 2026')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /réinitialiser/i })).toBeEnabled();
  });

  // TC-TR6: duration filter can isolate a seeded tournament
  test('TC-TR6: should filter tournaments by duration', async ({ page }) => {
    await openFilterSelect(page, 'Durée');
    await selectVisibleOption(page, { value: '9' });

    await expect(
      tournamentHeading(page, 'Spring Battle Series 2026'),
    ).toBeVisible();
    await expect(tournamentHeading(page, 'Elite Championship 2026')).toHaveCount(0);
  });

  // TC-TR7: period filter can exclude all current seeded tournaments
  test('TC-TR7: should apply period filter from popover', async ({ page }) => {
    await page.getByRole('button', { name: 'Période' }).click();
    const periodPopover = page.locator('.MuiPopover-root:visible');
    await periodPopover.locator('input[type="date"]').first().fill('2100-01-01');
    await periodPopover.getByRole('button', { name: /^OK$/ }).click();

    await expect(page.getByText(/0\/\d+ tournoi/i)).toBeVisible();
  });

  // TC-TR8: advanced filters can all be set and then reset
  test('TC-TR8: should set all remaining filters and reset them', async ({ page }) => {
    const currentYear = new Date().getFullYear();
    const currentMonthLabel = MONTHS_FR[new Date().getMonth()];

    await page.getByLabel(/nom du tournoi/i).fill('Spring');
    await page.getByLabel(/nom de team participante/i).fill('Alpha');
    await page.getByLabel(/tag d'un joueur inscrit/i).fill('lea');

    await openFilterSelect(page, 'État');
    await selectVisibleOption(page, { name: 'Planifié' });

    await openFilterSelect(page, 'Disponibilité');
    await selectVisibleOption(page, { name: 'Complet' });

    await openFilterSelect(page, 'Jour');
    await selectVisibleOption(page, { name: 'Lundi' });

    await openFilterSelect(page, 'Mois');
    await selectVisibleOption(page, { name: currentMonthLabel });

    await page.getByLabel(/année/i).fill(String(currentYear));

    await expect(page.getByRole('button', { name: /^Nom : Spring$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Planifié$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Complet$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Lundi$/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: new RegExp(`^${currentMonthLabel}$`) }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: new RegExp(`^${currentYear}$`) }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Team : Alpha$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Joueur : lea$/ })).toBeVisible();

    const resetButton = page.getByRole('button', { name: /réinitialiser/i });
    await expect(resetButton).toBeEnabled();
    await resetButton.click();

    await expect(page.getByLabel(/nom du tournoi/i)).toHaveValue('');
    await expect(page.getByLabel(/nom de team participante/i)).toHaveValue('');
    await expect(page.getByLabel(/tag d'un joueur inscrit/i)).toHaveValue('');
    await expect(page.getByLabel(/année/i)).toHaveValue('');
    await expect(resetButton).toBeDisabled();
  });

  // TC-TR9: filter then reset and open a tournament card
  test('TC-TR9: should reset filters after search then open a tournament card', async ({
    page,
  }) => {
    await page.getByLabel(/nom du tournoi/i).fill('Elite Championship');
    await expect(tournamentHeading(page, 'Elite Championship 2026')).toBeVisible();
    await expect(tournamentHeading(page, 'Spring Battle Series 2026')).toHaveCount(0);

    const resetButton = page.getByRole('button', { name: /réinitialiser/i });
    await expect(resetButton).toBeEnabled();
    await resetButton.click();

    await expect(page.getByLabel(/nom du tournoi/i)).toHaveValue('');
    await expect(tournamentHeading(page, 'Elite Championship 2026')).toBeVisible();

    await tournamentHeading(page, 'Elite Championship 2026').click();
    await expect(page).toHaveURL(/\/tournaments\/\d+$/);
  });
});
