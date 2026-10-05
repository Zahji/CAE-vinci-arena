import { expect, test } from '@playwright/test';
import { goToTournamentsPage } from './helpers';

const tournamentCard = (page: import('@playwright/test').Page, name: string) =>
  page
    .locator('.MuiCard-root')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
    .first();

// 4 — Création (IN_PREPARATION) → modification → publication

test.describe('Tournament admin flows', () => {
  test('TC-ADM-F1: should create, edit description, then publish tournament', async ({
    page,
  }) => {
    await goToTournamentsPage(page);

    await page.getByRole('button', { name: /créer un tournoi/i }).click();
    const createDialog = page.getByRole('dialog', { name: /créer un tournoi/i });
    await expect(createDialog).toBeVisible();

    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const tournamentName = `E2E Flow ${uniqueSuffix}`;

    await createDialog.getByRole('textbox', { name: /^nom$/i }).fill(tournamentName);
    await createDialog.getByLabel(/nombre maximum de teams/i).fill('8');
    await createDialog
      .getByRole('textbox', { name: /description/i })
      .fill('Description initiale.');
    await createDialog.getByLabel(/date début des inscriptions/i).fill('2099-02-01');
    await createDialog.getByLabel(/date limite des inscriptions/i).fill('2099-02-10');
    await createDialog.getByLabel(/date du début du tournoi/i).fill('2099-02-15');
    await createDialog.getByLabel(/date de fin du tournoi/i).fill('2099-02-20');
    await createDialog.getByRole('button', { name: /^créer$/i }).click();

    await expect(page.getByText(/tournoi créé avec succès/i)).toBeVisible({
      timeout: 20000,
    });
    await expect(createDialog).toBeHidden({ timeout: 5000 });

    const card = tournamentCard(page, tournamentName);
    await expect(card).toBeVisible({ timeout: 15000 });

    await card.getByRole('button', { name: /^modifier$/i }).click();
    const editDialog = page.getByRole('dialog', { name: /modifier le tournoi/i });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel(/^description$/i).fill('Description mise à jour pour E2E.');
    await editDialog.getByRole('button', { name: /^modifier$/i }).click();
    await expect(page.getByText(/tournoi modifié avec succès/i)).toBeVisible({
      timeout: 20000,
    });
    await expect(editDialog).toBeHidden({ timeout: 5000 });

    const cardAgain = tournamentCard(page, tournamentName);
    await cardAgain.getByRole('button', { name: /^publier$/i }).click();
    const publishDialog = page.getByRole('dialog', {
      name: /confirmer la publication/i,
    });
    await expect(publishDialog).toBeVisible();
    await publishDialog.getByRole('button', { name: /^publier$/i }).click();
    await expect(page.getByText(/tournoi publié avec succès/i)).toBeVisible({
      timeout: 20000,
    });
    await expect(publishDialog).toBeHidden({ timeout: 5000 });
  });
});
