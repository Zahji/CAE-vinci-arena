import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import {
  createTeamWith,
  goToRegisterPage,
  goToTeamsListPage,
  joinTeamByName,
  loginWith,
  registerWith,
} from './helpers';

// These tests run without any stored session (chromium-public).
// Tests that need a user without a team create a new user with faker,
// register them, log in, then perform the action.

test.describe('Teams list - unauthenticated or new user', () => {
  // TC-TL11: unauthenticated user does not see the join column nor the create form
  test('TC-TL11: should hide join column and create form for unauthenticated user', async ({
    page,
  }) => {
    await goToTeamsListPage(page);
    await expect(
      page.getByRole('columnheader', { name: /demande d'adhésion/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /nom de la team/i }),
    ).not.toBeVisible();
  });

  // TC-TL8: a new user without a team can create a team with a unique name
  // → the team appears in the list afterwards
  test('TC-TL8: should create a team successfully with a unique name', async ({
    page,
  }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `tag-${faker.string.alphanumeric(8)}`;
    const password = 'ValidPass123';
    const teamName = `TEAM-${faker.string.alphanumeric(6).toUpperCase()}`;

    await goToRegisterPage(page);
    await registerWith(page, { email, tag, password, specialty: 'Architecte' });
    await page.waitForURL(/\/login$/);
    await loginWith(page, { email, password });
    await page.waitForURL(/\/$/);

    await goToTeamsListPage(page);
    await createTeamWith(page, teamName);

    await expect(page.getByRole('cell', { name: teamName })).toBeVisible();
  });

  // TC-TL9: a new user without a team clicks Rejoindre on TEAM_ALPHA
  // → the button changes to "Demande en attente"
  test('TC-TL9: should show pending status after joining a team', async ({
    page,
  }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `tag-${faker.string.alphanumeric(8)}`;
    const password = 'ValidPass123';

    await goToRegisterPage(page);
    await registerWith(page, { email, tag, password, specialty: 'Architecte' });
    await page.waitForURL(/\/login$/);
    await loginWith(page, { email, password });
    await page.waitForURL(/\/$/);

    await goToTeamsListPage(page);
    await joinTeamByName(page, 'TEAM_ALPHA');

    await expect(page.getByText(/demande en attente/i)).toBeVisible();
  });

  // TC-TL13: creating a team named "TEAM_ALPHA" (exact case) → error
  // because that name already exists
  test('TC-TL13: should show error when creating a team named TEAM_ALPHA', async ({
    page,
  }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `tag-${faker.string.alphanumeric(8)}`;
    const password = 'ValidPass123';

    await goToRegisterPage(page);
    await registerWith(page, { email, tag, password, specialty: 'Architecte' });
    await page.waitForURL(/\/login$/);
    await loginWith(page, { email, password });
    await page.waitForURL(/\/$/);

    await goToTeamsListPage(page);
    await createTeamWith(page, 'TEAM_ALPHA');

    await expect(
      page.getByText(/impossible de créer une nouvelle team/i),
    ).toBeVisible();
  });

  // TC-TL14: creating a team named "team_alpha" (lowercase) → same error
  // because the name check is case-insensitive on the backend
  test('TC-TL14: should show error when creating a team named team_alpha (lowercase)', async ({
    page,
  }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `tag-${faker.string.alphanumeric(8)}`;
    const password = 'ValidPass123';

    await goToRegisterPage(page);
    await registerWith(page, { email, tag, password, specialty: 'Architecte' });
    await page.waitForURL(/\/login$/);
    await loginWith(page, { email, password });
    await page.waitForURL(/\/$/);

    await goToTeamsListPage(page);
    await createTeamWith(page, 'team_alpha');

    await expect(
      page.getByText(/impossible de créer une nouvelle team/i),
    ).toBeVisible();
  });

  // TC-TL15: a user with a pending join request tries to create a team
  // → error because they already have a pending membership
  test('TC-TL15: should show error when user with pending request tries to create a team', async ({
    page,
  }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `tag-${faker.string.alphanumeric(8)}`;
    const password = 'ValidPass123';

    await goToRegisterPage(page);
    await registerWith(page, { email, tag, password, specialty: 'Architecte' });
    await page.waitForURL(/\/login$/);
    await loginWith(page, { email, password });
    await page.waitForURL(/\/$/);

    await goToTeamsListPage(page);

    // First join a team to get a pending request
    await joinTeamByName(page, 'TEAM_ALPHA');
    await expect(page.getByText(/demande en attente/i)).toBeVisible();

    // Then try to create a team
    await createTeamWith(page, `TEAM-${faker.string.alphanumeric(6)}`);

    await expect(
      page.getByText(/impossible de créer une nouvelle team/i),
    ).toBeVisible();
  });
});
