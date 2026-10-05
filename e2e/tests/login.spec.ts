import { expect, test } from '@playwright/test';
import { goToLoginPage, loginWith } from './helpers';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoginPage(page);
  });

  test('TC3.1: should log in with seeded credentials', async ({ page }) => {
    await loginWith(page, {
      email: 'lea@mail.com',
      password: 'password',
    });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(/bienvenue lynx/i)).toBeVisible();
  });

  test('TC4.1: should show an error when credentials are invalid', async ({
    page,
  }) => {
    await loginWith(page, {
      email: 'lea@mail.com',
      password: 'WrongPass123',
    });

    await expect(
      page.getByText(/echec de connexion\. verifiez l'email et le mot de passe\./i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
