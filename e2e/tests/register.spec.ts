import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { goToRegisterPage, registerWith } from './helpers';

test.describe('Register', () => {
  test.beforeEach(async ({ page }) => {
    await goToRegisterPage(page);
  });

  test('TC1.1: should register a new user when the form is valid', async ({
    page,
  }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `tag-${faker.string.alphanumeric(8)}`;
    const password = 'ValidPass123';

    await registerWith(page, {
      email,
      tag,
      password,
      specialty: 'Architecte',
    });

    await expect(
      page.getByText(/compte créé avec succes\. redirection vers la connexion/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC2.1: should show an error when the email is already used', async ({
    page,
  }) => {
    await registerWith(page, {
      email: 'lea@mail.com',
      tag: 'duplicate-lynx',
      password: 'ValidPass123',
      specialty: 'Architecte',
    });

    await expect(
      page.getByText(/cette adresse email existe deja\. veuillez en utiliser une autre\./i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});
