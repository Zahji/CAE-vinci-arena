import { expect, test } from '@playwright/test';
import { goToSelectionPage } from './helpers';

interface Tournament {
  id: number;
  name: string;
}

interface Match {
  matchId: number;
  state: string;
  team1Name: string;
  team2Name: string;
  team1Id: number;
  team2Id: number;
  startTime?: string;
}

let tournamentId: number;
let matchId: number;
let teamOmegaId: number;
let planifiedStartInPast = false;

// Tibo (chromium-omega) — responsable TEAM_OMEGA, match TEAM_OMEGA vs TEAM_ALPHA (PLANIFIED).

test.describe('Selection - PLANIFIED match (future start)', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const spring = tournaments.find((t) => t.name === 'Spring Battle Series 2026');
    tournamentId = spring!.id;

    const matchRes = await request.get(`/api/tournaments/${tournamentId}/matches`);
    const matches: Match[] = await matchRes.json();
    const m = matches.find(
      (x) =>
        x.state === 'PLANIFIED'
        && [x.team1Name, x.team2Name].includes('TEAM_OMEGA')
        && [x.team1Name, x.team2Name].includes('TEAM_ALPHA'),
    );
    if (!m) {
      throw new Error('Expected TEAM_OMEGA vs TEAM_ALPHA PLANIFIED match in seed');
    }
    matchId = m.matchId;
    teamOmegaId = m.team1Name === 'TEAM_OMEGA' ? m.team1Id : m.team2Id;

    if (m.startTime && new Date(m.startTime).getTime() <= Date.now()) {
      planifiedStartInPast = true;
    }
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (planifiedStartInPast) {
      testInfo.skip();
    }
    await goToSelectionPage(page, tournamentId, matchId, teamOmegaId);
  });

  test('TC-SEL-P1: should allow selection changes when match is PLANIFIED', async ({
    page,
  }) => {
    const addOrConfirm = page.getByRole('button', {
      name: /ajouter|confirmer la sélection/i,
    });
    await expect(addOrConfirm.first()).toBeVisible({ timeout: 15000 });
  });
});
