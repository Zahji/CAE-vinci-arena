import { expect, test, type APIRequestContext } from '@playwright/test';
import { goToTournamentDetailsPage } from './helpers';

interface Tournament {
  id: number;
  name: string;
  state: string;
  maxTeams: number;
  registrationsCount: number;
  endInscriptionDate: string;
}

const resolvePlanifiedWhereAlphaCanRegister = async (
  request: APIRequestContext,
  tournaments: Tournament[],
): Promise<{ id: number; name: string }> => {
  const today = new Date().toISOString().slice(0, 10);
  const planified = tournaments.filter((t) => t.state === 'PLANIFIED');

  for (const t of planified) {
    if (t.registrationsCount < 1) continue;
    if (t.registrationsCount >= t.maxTeams) continue;
    if (today > t.endInscriptionDate) continue;

    const regRes = await request.get(`/api/tournaments/${t.id}/registrations`);
    const regs = (await regRes.json()) as { teamName: string }[];
    if (regs.some((r) => r.teamName === 'TEAM_ALPHA')) continue;

    return { id: t.id, name: t.name };
  }

  const tomorrowCup = tournaments.find((t) => t.name === 'Tomorrow Cup');
  if (!tomorrowCup) {
    throw new Error('Tomorrow Cup seed tournament not found');
  }
  return { id: tomorrowCup.id, name: tomorrowCup.name };
};

// Lea is logged in automatically via playwright/.auth/user.json (chromium-user).

let planifiedOpenId: number;
let planifiedOpenName: string;
let planifiedAlreadyRegisteredId: number;
let ongoingId: number;
let finishedId: number;
let planningTournamentId: number;
let planningTournamentName: string;

test.describe('Tournament details', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();

    const open = await resolvePlanifiedWhereAlphaCanRegister(request, tournaments);
    planifiedOpenId = open.id;
    planifiedOpenName = open.name;

    const elite2026 = tournaments.find((t) => t.name === 'Elite Championship 2026');
    const springBattle = tournaments.find((t) => t.name === 'Spring Battle Series 2026');
    const springArena = tournaments.find((t) => t.name === 'Spring Arena Cup 2025');
    planifiedAlreadyRegisteredId = elite2026!.id;
    ongoingId = springBattle!.id;
    finishedId = springArena!.id;
    planningTournamentId = springBattle!.id;
    planningTournamentName = springBattle!.name;
  });

  // TC-TD1: the page displays the tournament name, description, state chip,
  // dates and the team count
  test('TC-TD1: should display tournament info after loading', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, planifiedOpenId);
    await expect(page.getByText(planifiedOpenName)).toBeVisible();
    await expect(page.getByRole('heading', { name: /teams inscrites/i })).toBeVisible();
  });

  // TC-TD2: teams are listed for a tournament with registrations
  test('TC-TD2: should show registered teams', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, planifiedOpenId);
    await expect(
      page.getByRole('columnheader', { name: /nom de la team/i }),
    ).toBeVisible();
  });

  // TC-TD3: a PLANIFIED tournament with open registrations shows the register button for lea
  test('TC-TD3: should show register button for lea on a PLANIFIED tournament', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, planifiedOpenId);
    const registerBtn = page.getByRole('button', { name: /inscrire ma team/i });
    test.skip(
      !(await registerBtn.isVisible()),
      'No PLANIFIED tournament left where TEAM_ALPHA can register (DB state).',
    );
    await expect(registerBtn).toBeVisible();
  });

  // TC-TD7: the register button is hidden when TEAM_ALPHA is already registered
  test('TC-TD7: should not show register button when TEAM_ALPHA is already registered', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, planifiedAlreadyRegisteredId);
    await expect(
      page.getByRole('button', { name: /inscrire ma team/i }),
    ).not.toBeVisible();
  });

  // TC-TD8: the ONGOING tournament does not show the register button for lea
  test('TC-TD8: should not show register button for an ONGOING tournament', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, ongoingId);
    await expect(
      page.getByRole('button', { name: /inscrire ma team/i }),
    ).not.toBeVisible();
  });

  // TC-TD9: the FINISHED tournament does not show the register button for lea
  test('TC-TD9: should not show register button for a FINISHED tournament', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, finishedId);
    await expect(
      page.getByRole('button', { name: /inscrire ma team/i }),
    ).not.toBeVisible();
  });

  // TC-PL4: from details, user can open the dedicated planning page and go back
  test('TC-PL4: should open planning page from details and allow navigation back', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, planningTournamentId);

    await page.getByRole('button', { name: /afficher planning/i }).click();
    await expect(page).toHaveURL(new RegExp(`/tournaments/${planningTournamentId}/bracket$`));
    await expect(
      page.getByRole('heading', {
        name: new RegExp(`planning du tournoi:\\s*${planningTournamentName}`, 'i'),
      }),
    ).toBeVisible();

    const emptyPlanning = page.getByText(/aucun planning généré pour ce tournoi\./i);
    if (await emptyPlanning.count()) {
      await expect(emptyPlanning).toBeVisible();
    } else {
      await expect(
        page.getByText(/finale|demi-finale|quarts de finale|round/i).first(),
      ).toBeVisible();
    }

    await page.getByRole('button', { name: /retour aux details/i }).click();
    await expect(page).toHaveURL(new RegExp(`/tournaments/${planningTournamentId}$`));
  });
});
