import { expect, test } from '@playwright/test';
import { goToMatchDetailPage } from './helpers';
import { findDeltaIotaMatch } from './springBattleMatch';

interface Tournament {
  id: number;
  name: string;
}

interface Match {
  matchId: number;
  state: string;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
}

let tournamentId: number;
let matchId: number;

// Seb (TEAM_DELTA manager). Ne modifie pas la base : skip si pas de bouton Contester.

test.describe('Contest score - manager', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const spring = tournaments.find((t) => t.name === 'Spring Battle Series 2026');
    tournamentId = spring!.id;

    const matchRes = await request.get(`/api/tournaments/${tournamentId}/matches`);
    const matches: Match[] = await matchRes.json();
    const m = findDeltaIotaMatch(matches);
    if (!m) {
      throw new Error('Expected TEAM_DELTA vs TEAM_IOTA match in Spring Battle');
    }
    matchId = m.matchId;
  });

  test('TC-CONT1: should validate contest reason then cancel', async ({ page }) => {
    await goToMatchDetailPage(page, tournamentId, matchId);

    const contestBtn = page.getByRole('button', { name: /contester/i });
    test.skip(
      (await contestBtn.count()) === 0,
      'Contest button not visible (match not ENDED or contestation window expired).',
    );

    await contestBtn.click();
    const dialog = page.getByRole('dialog', { name: /contester le score/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^confirmer$/i }).click();
    await expect(
      dialog.getByText(/veuillez entrer une raison/i),
    ).toBeVisible();
    await dialog.getByRole('button', { name: /annuler/i }).click();
    await expect(dialog).toBeHidden();
  });
});
