import { expect, test } from '@playwright/test';
import {
  goToMatchDetailPage,
  goToTournamentDetailsPage,
} from './helpers';

interface Tournament {
  id: number;
  name: string;
}

interface Match {
  matchId: number;
  state: string;
  team1Name: string;
  team2Name: string;
}

let tomorrowCupId: number;
let springBattleId: number;
let planifiedMatchId: number;
let alphaAlreadyRegisteredTomorrow = false;

test.describe('Tournament user flows', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const tomorrow = tournaments.find((t) => t.name === 'Tomorrow Cup');
    const spring = tournaments.find((t) => t.name === 'Spring Battle Series 2026');
    tomorrowCupId = tomorrow!.id;
    springBattleId = spring!.id;

    const regRes = await request.get(
      `/api/tournaments/${tomorrowCupId}/registrations`,
    );
    const registrations = (await regRes.json()) as { teamName: string }[];
    alphaAlreadyRegisteredTomorrow = registrations.some(
      (r) => r.teamName === 'TEAM_ALPHA',
    );

    const matchRes = await request.get(`/api/tournaments/${springBattleId}/matches`);
    const matches: Match[] = await matchRes.json();
    const planified = matches.find(
      (m) =>
        m.state === 'PLANIFIED'
        && [m.team1Name, m.team2Name].includes('TEAM_OMEGA')
        && [m.team1Name, m.team2Name].includes('TEAM_ALPHA'),
    );
    planifiedMatchId = planified!.matchId;
  });

  // 1 — Inscription complète (Tomorrow Cup : TEAM_ALPHA absente du seed)
  test('TC-TREG1: should register TEAM_ALPHA and show success', async ({
    page,
  }) => {
    test.skip(
      alphaAlreadyRegisteredTomorrow,
      'TEAM_ALPHA is already registered for Tomorrow Cup.',
    );
    await goToTournamentDetailsPage(page, tomorrowCupId);
    const registerBtn = page.getByRole('button', { name: /inscrire ma team/i });
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();
    await expect(
      page.getByText(/votre team a été inscrite avec succès/i),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByRole('row', { name: /TEAM_ALPHA/i }),
    ).toBeVisible();
  });

  // 5 — Détail match → planning → autre match
  test('TC-NAV1: should navigate bracket to another match via planning', async ({
    page,
  }) => {
    await page.goto(`/tournaments/${springBattleId}/bracket`);
    await expect(page).toHaveURL(new RegExp(`/tournaments/${springBattleId}/bracket$`));

    await page.getByText('TEAM_DELTA').first().click();
    await expect(page).toHaveURL(/\/matches\/\d+\/selections$/);

    await page.getByRole('button', { name: /retour au planning/i }).click();
    await expect(page).toHaveURL(new RegExp(`/tournaments/${springBattleId}/bracket$`));

    await page.getByText('TEAM_IOTA').first().click();
    await expect(page).toHaveURL(/\/matches\/\d+\/selections$/);
  });

  // 3 (forfait) — dialogue sans confirmer (conserve les données démo)
  test('TC-FF1: should open forfeit dialog for manager on a PLANIFIED match', async ({
    page,
  }) => {
    await goToMatchDetailPage(page, springBattleId, planifiedMatchId);
    const forfeitBtn = page.getByRole('button', { name: /déclarer forfait/i });
    await expect(forfeitBtn).toBeVisible();
    await forfeitBtn.click();
    await expect(
      page.getByRole('dialog', { name: /déclarer forfait/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/cette action attribuera automatiquement/i),
    ).toBeVisible();
    await page
      .getByRole('dialog', { name: /déclarer forfait/i })
      .getByRole('button', { name: /annuler/i })
      .click();
    await expect(
      page.getByRole('dialog', { name: /déclarer forfait/i }),
    ).toBeHidden();
  });
});
