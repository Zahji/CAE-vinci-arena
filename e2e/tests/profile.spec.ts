import { expect, test } from '@playwright/test';
import { goToProfilePage } from './helpers';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await goToProfilePage(page);
  });

  // TC-P1: Page loads with user info
  test('TC-P1: should display profile sections and user info', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mes informations de profil/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /mes informations privées/i })).toBeVisible();
    await expect(page.getByText(/lea@mail\.com/i)).toBeVisible();
  });

  test.describe('Change password', () => {
    test.beforeEach(async ({ page }) => {
      // Open the password dialog via the "Modifier" button next to "Mot de passe"
      await page.getByText(/mot de passe/i).locator('..').getByRole('button', { name: /modifier/i }).click();
      await expect(page.getByRole('dialog', { name: /modifier le mot de passe/i })).toBeVisible();
    });

    // TC-P2a: Mismatched passwords
    test('TC-P2a: should show error when passwords do not match', async ({ page }) => {
      await page.getByLabel(/ancien mot de passe/i).fill('password');
      await page.getByLabel(/nouveau mot de passe/i).fill('NewPass123');
      await page.getByLabel(/confirmer/i).fill('DifferentPass123');
      await page.getByRole('button', { name: /confirmer/i }).click();
      await expect(page.getByText(/les mots de passe ne correspondent pas/i)).toBeVisible();
    });

    // TC-P2b: Weak password
    test('TC-P2b: should show error when new password is too weak', async ({ page }) => {
      await page.getByLabel(/ancien mot de passe/i).fill('password');
      await page.getByLabel(/nouveau mot de passe/i).fill('weak');
      await page.getByLabel(/confirmer/i).fill('weak');
      await page.getByRole('button', { name: /confirmer/i }).click();
      await expect(
        page.getByText(/le mot de passe doit contenir au moins 8 caractères/i),
      ).toBeVisible();
    });

    // TC-P3: Wrong old password
    test('TC-P3: should show error when old password is incorrect', async ({ page }) => {
      await page.getByLabel(/ancien mot de passe/i).fill('wrongpassword');
      await page.getByLabel(/nouveau mot de passe/i).fill('NewPass123');
      await page.getByLabel(/confirmer/i).fill('NewPass123');
      await page.getByRole('button', { name: /confirmer/i }).click();
      await expect(page.getByText(/ancien mot de passe incorrect/i)).toBeVisible();
    });
  });

  test.describe('Change speciality', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByText(/spécialité/i).locator('..').getByRole('button', { name: /modifier/i }).click();
      await expect(page.getByRole('dialog', { name: /modifier la spécialité/i })).toBeVisible();
    });

    // TC-P4: No speciality selected
    test('TC-P4: should show error when no speciality is selected', async ({ page }) => {
      await page.getByRole('button', { name: /confirmer/i }).click();
      await expect(page.getByText(/veuillez choisir une spécialité/i)).toBeVisible();
    });

    // TC-P5: Success
    test('TC-P5: should update speciality successfully', async ({ page }) => {
      const combobox = page.getByRole('combobox', { name: /spécialité/i });
      await combobox.click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: /confirmer/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Change profile picture', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByText(/photo/i).locator('..').getByRole('button', { name: /modifier/i }).click();
      await expect(page.getByRole('dialog', { name: /modifier la photo de profil/i })).toBeVisible();
    });

    // TC-P6: No picture selected
    test('TC-P6: should show error when no picture is selected', async ({ page }) => {
      await page.getByRole('button', { name: /confirmer/i }).click();
      await expect(page.getByText(/veuillez choisir une photo/i)).toBeVisible();
    });
  });

  test.describe('Add unavailability', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /ajouter/i }).click();
      await expect(page.getByRole('dialog', { name: /ajouter une indisponibilité/i })).toBeVisible();
    });

    // TC-P7a: Empty dates
    test('TC-P7a: should show error when dates are empty', async ({ page }) => {
      await page.getByRole('button', { name: /ajouter/i }).last().click();
      await expect(page.getByText(/veuillez remplir les deux dates/i)).toBeVisible();
    });

    // TC-P7b: End date before start date
    test('TC-P7b: should show error when end date is before start date', async ({ page }) => {
      await page.getByLabel(/date de début/i).fill('2027-06-10');
      await page.getByLabel(/date de fin/i).fill('2027-06-01');
      await page.getByRole('button', { name: /ajouter/i }).last().click();
      await expect(page.getByText(/la date de fin doit être après la date de début/i)).toBeVisible();
    });
  });

    // TC-P9: Activity section is visible
    test('TC-P9: should display the activity section', async ({ page }) => {
    await expect(page.getByText(/mon activité/i)).toBeVisible();
  });
});

