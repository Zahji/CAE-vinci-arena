import { expect, Page } from '@playwright/test';

const passwordInput = (page: Page) =>
  page.getByRole('textbox', { name: /^mot de passe$/i });

const goToRegisterPage = async (page: Page) => {
  await page.goto('/register');
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole('heading', { name: /s'inscrire/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/tag/i)).toBeVisible();
  await expect(passwordInput(page)).toBeVisible();
  await expect(page.getByRole('combobox', { name: /specialit/i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /choisir l'avatar/i }).first(),
  ).toBeVisible();
};

const goToProfilePage = async (page: Page) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.getByRole('heading', { name: /mon espace personnel/i }),
  ).toBeVisible();
};

const goToLoginPage = async (page: Page) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: /connexion/i }),
  ).toBeVisible();
};

const selectSpecialty = async (page: Page, specialty: string) => {
  await page.getByRole('combobox', { name: /specialit/i }).click();
  await page.getByRole('option', { name: specialty }).click();
};

const chooseFirstAvatar = async (page: Page) => {
  await page.getByRole('button', { name: /choisir l'avatar/i }).first().click();
};

const registerWith = async (
  page: Page,
  {
    email,
    tag,
    password,
    specialty,
  }: {
    email: string;
    tag: string;
    password: string;
    specialty: string;
  },
) => {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/tag/i).fill(tag);
  await passwordInput(page).fill(password);
  await selectSpecialty(page, specialty);
  await chooseFirstAvatar(page);
  await page.getByRole('button', { name: /créer le compte/i }).click();
};

const loginWith = async (
  page: Page,
  { email, password }: { email: string; password: string },
) => {
  await page.getByLabel(/email/i).fill(email);
  await passwordInput(page).fill(password);
  await page.getByRole('button', { name: /s'authentifier/i }).click();
};

const goToTeamsListPage = async (page: Page) => {
  await page.goto('/teams');
  await expect(page).toHaveURL(/\/teams$/);
  await expect(
    page.getByRole('heading', { name: /liste des teams/i }),
  ).toBeVisible();
};

const goToTeamDetailsPage = async (page: Page, teamId: number) => {
  await page.goto(`/teams/${teamId}`);
  await expect(page).toHaveURL(new RegExp(`/teams/${teamId}$`));
};

const goToMembersPage = async (page: Page) => {
  await page.goto('/members');
  await expect(page).toHaveURL(/\/members$/);
  await expect(
    page.getByRole('heading', { name: /liste des membres/i }),
  ).toBeVisible();
};

const goToTournamentDetailsPage = async (page: Page, tournamentId: number) => {
  await page.goto(`/tournaments/${tournamentId}`);
  await expect(page).toHaveURL(new RegExp(`/tournaments/${tournamentId}$`));
};

const goToTournamentsPage = async (page: Page) => {
  await page.goto('/tournaments');
  await expect(page).toHaveURL(/\/tournaments$/);
  await expect(page.getByRole('heading', { name: /tournois/i })).toBeVisible();
};

const createTeamWith = async (page: Page, name: string) => {
  await page.getByRole('textbox', { name: /nom de la team/i }).fill(name);
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: /créer une team/i }).click();
};

const joinTeamByName = async (page: Page, teamName: string) => {
  await expect(page.getByRole('columnheader', { name: /demande d'adhésion/i })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: teamName });
  await row.getByRole('button', { name: /rejoindre/i }).click();
};

const goToNotificationPage = async (page: Page) => {
  await page.goto('/notifications');
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(
    page.getByRole('heading', { name: /notifications/i }),
  ).toBeVisible();
};

const goToMatchDetailPage = async (
  page: Page,
  tournamentId: number,
  matchId: number,
) => {
  await page.goto(`/tournaments/${tournamentId}/matches/${matchId}/selections`);
  await expect(page).toHaveURL(
    new RegExp(`/tournaments/${tournamentId}/matches/${matchId}/selections$`),
  );
  await expect(
    page.getByRole('heading', { name: /détail du match/i }),
  ).toBeVisible();
};

const goToSelectionPage = async (
  page: Page,
  tournamentId: number,
  matchId: number,
  teamId: number,
) => {
  await page.goto(
    `/tournaments/${tournamentId}/matches/${matchId}/selections/${teamId}`,
  );
  await expect(page).toHaveURL(
    new RegExp(
      `/tournaments/${tournamentId}/matches/${matchId}/selections/${teamId}$`,
    ),
  );
  await expect(page.getByText(/membres sélectionnés/i)).toBeVisible();
};

const goToHomePage = async (page: Page) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByText(/vinci arena tournois/i),
  ).toBeVisible();
};

export {
  chooseFirstAvatar,
  createTeamWith,
  goToLoginPage,
  goToMatchDetailPage,
  goToMembersPage,
  goToSelectionPage,
  goToTeamDetailsPage,
  goToProfilePage,
  goToRegisterPage,
  goToTeamsListPage,
  goToTournamentsPage,
  goToTournamentDetailsPage,
  goToNotificationPage,
  goToHomePage,
  joinTeamByName,
  loginWith,
  registerWith,
  selectSpecialty,
};
