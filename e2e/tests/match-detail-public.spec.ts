import { expect, test } from '@playwright/test';
import { findDeltaIotaMatch, findOngoingDeltaIotaMatch } from './springBattleMatch';

interface Tournament {
  id: number;
  name: string;
}

interface Match {
  matchId: number;
  state: string;
  team1Name?: string;
  team2Name?: string;
}

let tournamentId: number;
let matchId: number;
/** ONGOING DELTA/IOTA only — ENDED shows selections instead of locked copy. */
let ongoingDeltaIotaMatchId: number | null;

// No stored session — chromium-public project.

test.describe('Match detail - unauthenticated', () => {
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
    const ongoing = findOngoingDeltaIotaMatch(matches);
    ongoingDeltaIotaMatchId = ongoing?.matchId ?? null;
  });

  // TC-MS10: page is accessible without authentication
  test('TC-MS10: should display the match detail page without authentication', async ({
    page,
  }) => {
    await page.goto(
      `/tournaments/${tournamentId}/matches/${matchId}/selections`,
    );
    await expect(
      page.getByRole('heading', { name: /détail du match/i }),
    ).toBeVisible();
  });

  // TC-MS11: panels are locked for unauthenticated users
  test('TC-MS11: should show locked panels for an unauthenticated user', async ({
    page,
  }) => {
    test.skip(
      ongoingDeltaIotaMatchId == null,
      'No ONGOING TEAM_DELTA vs TEAM_IOTA match (ENDED shows selections, not locked copy).',
    );
    await page.goto(
      `/tournaments/${tournamentId}/matches/${ongoingDeltaIotaMatchId}/selections`,
    );
    await expect(
      page.getByText(/sera visible une fois le match terminé/i).first(),
    ).toBeVisible();
  });

  // TC-MS12: invalid params without authentication
  test('TC-MS12: should show an alert for invalid params without authentication', async ({
    page,
  }) => {
    await page.goto('/tournaments/abc/matches/1/selections');
    await expect(page.getByText(/paramètres invalides/i)).toBeVisible();
  });
});
