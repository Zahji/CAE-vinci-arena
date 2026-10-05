import { expect, test } from '@playwright/test';
import { findDeltaIotaMatch, findOngoingDeltaIotaMatch } from './springBattleMatch';

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

let tournamentId: number;
let tournamentName: string;
let emptyTournamentId: number;
let deltaIotaMatchId: number;
let team1Name: string;
let team2Name: string;
let bracketHasDeltaIota = false;
let hasOngoingDeltaIotaForEncode = false;

const goToBracketPage = async (
  page: import('@playwright/test').Page,
  id: number,
) => {
  await page.goto(`/tournaments/${id}/bracket`);
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/bracket$`));
};

test.describe('Bracket page', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const springBattle = tournaments.find(
      (t) => t.name === 'Spring Battle Series 2026',
    );
    const tomorrowCup = tournaments.find((t) => t.name === 'Tomorrow Cup');

    tournamentId = springBattle!.id;
    tournamentName = springBattle!.name;
    emptyTournamentId = tomorrowCup!.id;

    const matchRes = await request.get(
      `/api/tournaments/${tournamentId}/matches`,
    );
    const matches: Match[] = await matchRes.json();
    const deltaIota = findDeltaIotaMatch(matches);
    if (deltaIota) {
      bracketHasDeltaIota = true;
      deltaIotaMatchId = deltaIota.matchId;
      team1Name = deltaIota.team1Name;
      team2Name = deltaIota.team2Name;
    }
    hasOngoingDeltaIotaForEncode = Boolean(findOngoingDeltaIotaMatch(matches));
  });

  test.beforeEach(async ({ page }) => {
    await goToBracketPage(page, tournamentId);
  });

  test('TC-BR1: should display planning heading with tournament name', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', {
        name: new RegExp(`planning du tournoi:\\s*${tournamentName}`, 'i'),
      }),
    ).toBeVisible();
  });

  test('TC-BR2: should show at least one round label', async ({ page }) => {
    const roundPattern =
      /finale|demi-finale|quarts de finale|huitièmes de finale|seizièmes de finale|trente-deuxièmes de finale|round\s+\d+/i;
    await expect(page.getByText(roundPattern).first()).toBeVisible();
  });

  test('TC-BR3: should show team names on an ongoing match card', async ({
    page,
  }) => {
    test.skip(
      !bracketHasDeltaIota,
      'No TEAM_DELTA vs TEAM_IOTA match in Spring Battle.',
    );
    await expect(page.getByText(team1Name).first()).toBeVisible();
    await expect(page.getByText(team2Name).first()).toBeVisible();
  });

  test('TC-BR4: should navigate to match detail when clicking a match card', async ({
    page,
  }) => {
    test.skip(
      !bracketHasDeltaIota,
      'No TEAM_DELTA vs TEAM_IOTA match in Spring Battle.',
    );
    await page.getByText(team1Name).first().click();
    await expect(page).toHaveURL(
      new RegExp(
        `/tournaments/${tournamentId}/matches/${deltaIotaMatchId}/selections$`,
      ),
    );
    await expect(
      page.getByRole('heading', { name: /détail du match/i }),
    ).toBeVisible();
  });

  test('TC-BR5: should display back to details button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /retour aux details/i }),
    ).toBeVisible();
  });

  test('TC-BR6: should navigate back to tournament details from bracket', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /retour aux details/i }).click();
    await expect(page).toHaveURL(new RegExp(`/tournaments/${tournamentId}$`));
  });

  // Lea is platform admin (JWT) and match admin on Spring Battle (seed) — same as client demo.
  test('TC-BR7: should show encode result button when user is admin and match admin', async ({
    page,
  }) => {
    test.skip(
      !hasOngoingDeltaIotaForEncode,
      'No ONGOING TEAM_DELTA vs TEAM_IOTA match (encode button only in ONGOING/CONTESTED).',
    );
    const encodeOnDeltaIota = page
      .getByTestId(`bracket-match-${deltaIotaMatchId}`)
      .getByRole('button', { name: /encoder résultat/i });
    await expect(encodeOnDeltaIota).toBeVisible();
  });

  test('TC-BR-ADM3: should show score fields for both teams in encode dialog', async ({
    page,
  }) => {
    test.skip(
      !hasOngoingDeltaIotaForEncode,
      'No ONGOING TEAM_DELTA vs TEAM_IOTA match (encode button only in ONGOING/CONTESTED).',
    );
    const encodeOnDeltaIota = page
      .getByTestId(`bracket-match-${deltaIotaMatchId}`)
      .getByRole('button', { name: /encoder résultat/i });
    await encodeOnDeltaIota.click();
    const dialog = page.getByRole('dialog', { name: /encoder le résultat/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[type="number"]')).toHaveCount(2);
    await dialog.getByRole('button', { name: /annuler/i }).click();
    await expect(dialog).toBeHidden();
  });

  test('TC-BR-ADM4: should validate scores before submit', async ({ page }) => {
    test.skip(
      !hasOngoingDeltaIotaForEncode,
      'No ONGOING TEAM_DELTA vs TEAM_IOTA match (encode button only in ONGOING/CONTESTED).',
    );
    const encodeOnDeltaIota = page
      .getByTestId(`bracket-match-${deltaIotaMatchId}`)
      .getByRole('button', { name: /encoder résultat/i });
    await encodeOnDeltaIota.click();
    const dialog = page.getByRole('dialog', { name: /encoder le résultat/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^confirmer$/i }).click();
    await expect(
      dialog.getByText(/veuillez entrer des scores valides/i),
    ).toBeVisible();
    await dialog.getByRole('button', { name: /annuler/i }).click();
    await expect(dialog).toBeHidden();
  });

  // Non-destructive: do not PATCH scores (would end the seeded ONGOING match and break other specs).
  test('TC-BR-ADM5: should close encode dialog without saving after filling scores', async ({
    page,
  }) => {
    test.skip(
      !hasOngoingDeltaIotaForEncode,
      'No ONGOING TEAM_DELTA vs TEAM_IOTA match (encode button only in ONGOING/CONTESTED).',
    );
    const encodeOnDeltaIota = page
      .getByTestId(`bracket-match-${deltaIotaMatchId}`)
      .getByRole('button', { name: /encoder résultat/i });
    await encodeOnDeltaIota.click();
    const dialog = page.getByRole('dialog', { name: /encoder le résultat/i });
    await expect(dialog).toBeVisible();

    const scoreInputs = dialog.locator('input[type="number"]');
    await scoreInputs.nth(0).fill('3');
    await scoreInputs.nth(1).fill('2');
    await dialog.getByRole('button', { name: /annuler/i }).click();
    await expect(dialog).toBeHidden();
  });

  test('TC-BR8: should show alert for invalid tournament id in URL', async ({
    page,
  }) => {
    await page.goto('/tournaments/abc/bracket');
    await expect(
      page.getByText(/identifiant de tournoi invalide/i),
    ).toBeVisible();
  });

  test('TC-BR9: should show alert for non-existent tournament', async ({
    page,
  }) => {
    await page.goto('/tournaments/99999/bracket');
    await expect(
      page.getByText(/ce tournoi n'est pas encore publié ou n'existe pas/i),
    ).toBeVisible();
  });

  test('TC-BR10: should show empty planning message when no matches exist', async ({
    page,
  }) => {
    await goToBracketPage(page, emptyTournamentId);
    await expect(
      page.getByText(/aucun planning généré pour ce tournoi\./i),
    ).toBeVisible();
  });
});
