import { expect, test } from '@playwright/test';
import { goToMatchDetailPage } from './helpers';
import { findDeltaIotaMatch } from './springBattleMatch';

interface Tournament {
  id: number;
  name: string;
}

interface Match {
  matchId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  state: string;
  team1Score?: number | null;
  team2Score?: number | null;
}

let tournamentId: number;
let matchId: number;
let team1Name: string;
let team2Name: string;
let matchHasNoScores = false;

// Lea (chromium-user) is not in TEAM_DELTA / TEAM_IOTA managers for this match.

test.describe('Match detail - authenticated', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const springBattle = tournaments.find((t) => t.name === 'Spring Battle Series 2026');
    tournamentId = springBattle!.id;

    const matchRes = await request.get(
      `/api/tournaments/${tournamentId}/matches`,
    );
    const matches: Match[] = await matchRes.json();
    const m = findDeltaIotaMatch(matches);
    if (!m) {
      throw new Error('Expected TEAM_DELTA vs TEAM_IOTA match in Spring Battle');
    }
    matchId = m.matchId;
    team1Name = m.team1Name;
    team2Name = m.team2Name;
    matchHasNoScores =
      (m.team1Score === null || m.team1Score === undefined)
      && (m.team2Score === null || m.team2Score === undefined);
  });

  test.beforeEach(async ({ page }) => {
    await goToMatchDetailPage(page, tournamentId, matchId);
  });

  // TC-MS1: title and team names are visible
  test('TC-MS1: should display the match title and both team names', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /détail du match/i }),
    ).toBeVisible();
    await expect(page.getByText(team1Name).first()).toBeVisible();
    await expect(page.getByText(team2Name).first()).toBeVisible();
  });

  // TC-MS2: no score yet → shows VS
  test('TC-MS2: should display VS when the match has no score', async ({
    page,
  }) => {
    test.skip(
      !matchHasNoScores,
      'Match already has encoded scores; VS is not shown.',
    );
    await expect(page.getByText('VS', { exact: true }).first()).toBeVisible();
  });

  // TC-MS3: lea is not a manager of either team → no modification controls visible
  test('TC-MS3: should not show modification controls for a non-manager user', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /ajouter/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /confirmer la sélection/i }),
    ).not.toBeVisible();
  });

  // TC-MS4: contest button only shown to managers of the teams
  test('TC-MS4: should not show the contest button for a non-manager user', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /contester/i }),
    ).not.toBeVisible();
  });

  // TC-MS5: back button is always present
  test('TC-MS5: should display the back button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /retour au planning/i }),
    ).toBeVisible();
  });

  // TC-MS6: back button navigates to the bracket
  test('TC-MS6: should navigate to the bracket when clicking the back button', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /retour au planning/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/tournaments/${tournamentId}/bracket`),
    );
  });

  // TC-MS7: invalid tournamentId
  test('TC-MS7: should show an alert for an invalid tournamentId', async ({
    page,
  }) => {
    await page.goto('/tournaments/abc/matches/1/selections');
    await expect(page.getByText(/paramètres invalides/i)).toBeVisible();
  });

  // TC-MS8: invalid matchId
  test('TC-MS8: should show an alert for an invalid matchId', async ({
    page,
  }) => {
    await page.goto('/tournaments/1/matches/abc/selections');
    await expect(page.getByText(/paramètres invalides/i)).toBeVisible();
  });

  // TC-MS9: non-existent match shows an error
  test('TC-MS9: should show an error for a non-existent match', async ({
    page,
  }) => {
    await page.goto(`/tournaments/${tournamentId}/matches/99999/selections`);
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
