import { expect, test } from '@playwright/test';
import { goToTournamentsPage } from './helpers';

const tournamentCard = (page: import('@playwright/test').Page, name: string) =>
  page
    .locator('.MuiCard-root')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
    .first();

test.describe('Tournaments list - admin', () => {
  test.beforeEach(async ({ page }) => {
    await goToTournamentsPage(page);
  });

  // TC-TR3: create tournament button is visible for admins
  test('TC-TR3: should show create tournament button for admin', async ({
    page,
  }) => {
    const createButton = page.getByRole('button', { name: /créer un tournoi/i });
    await expect(createButton).toBeVisible();
  });

  // TC-TR3B: creation opens popup and closes ~3s after success
  test('TC-TR3B: should close create popup about 3 seconds after success for admin', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /créer un tournoi/i }).click();

    const dialog = page.getByRole('dialog', { name: /créer un tournoi/i });
    await expect(dialog).toBeVisible();

    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const tournamentName = `E2E Tournament ${uniqueSuffix}`;

    await dialog.getByRole('textbox', { name: /^nom$/i }).fill(tournamentName);
    await dialog.getByLabel(/nombre maximum de teams/i).fill('8');
    await dialog
      .getByRole('textbox', { name: /description/i })
      .fill('E2E tournament creation flow.');
    await dialog.getByLabel(/date début des inscriptions/i).fill('2099-01-01');
    await dialog.getByLabel(/date limite des inscriptions/i).fill('2099-01-10');
    await dialog.getByLabel(/date du début du tournoi/i).fill('2099-01-15');
    await dialog.getByLabel(/date de fin du tournoi/i).fill('2099-01-20');

    await dialog.getByRole('button', { name: /^créer$/i }).click();

    await expect(page.getByText(/tournoi créé avec succès\./i)).toBeVisible();
    await expect(dialog).toBeVisible();

    await page.waitForTimeout(2500);
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeHidden({ timeout: 4000 });
  });

  // TC-PL1: admin can see schedule generation button on a PLANIFIED tournament card
  test('TC-PL1: should show generate planning button for Elite Championship 2026', async ({
    page,
  }) => {
    const card = tournamentCard(page, 'Elite Championship 2026');
    await expect(card).toBeVisible();
    await expect(
      card.getByRole('button', { name: /générer planning/i }),
    ).toBeVisible();
  });

  // TC-PL2: generation is blocked when the tournament start date is already passed
  test('TC-PL2: should disable generate planning button when start date is passed', async ({
    page,
  }) => {
    const card = tournamentCard(page, 'Vinci Easter Cup 2026');
    const generateButton = card.getByRole('button', {
      name: /générer planning/i,
    });

    await expect(card).toBeVisible();
    await expect(generateButton).toBeDisabled();
  });

  // TC-PL3: admin can generate planning on an eligible tournament
  test('TC-PL3: should generate planning and show success message', async ({
    page,
  }) => {
    const card = tournamentCard(page, 'Elite Championship 2026');
    const generateButton = card.getByRole('button', {
      name: /générer planning/i,
    });

    await expect(card).toBeVisible();
    await expect(generateButton).toBeVisible();

    const isDisabled = await generateButton.isDisabled();
    test.skip(
      isDisabled,
      'Planning already generated or generation currently locked in this environment.',
    );

    await generateButton.click();
    await expect(page.getByText(/planning généré avec succès\./i)).toBeVisible();
    await expect(generateButton).toBeDisabled();
  });
});
