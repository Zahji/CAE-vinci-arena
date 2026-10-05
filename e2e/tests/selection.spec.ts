import { expect, test } from '@playwright/test';
import { goToSelectionPage } from './helpers';
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
}

let tournamentId: number;
let matchId: number;
let teamId: number;
let selectionHasOngoingDeltaIota = false;

// Authenticated as TEAM_DELTA manager (seb@mail.com) — chromium-manager project.
// The ONGOING TEAM_DELTA vs TEAM_IOTA match has 4 selected members per side.

test.describe('Selection - manager', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const springBattle = tournaments.find((t) => t.name === 'Spring Battle Series 2026');
    tournamentId = springBattle!.id;

    const matchRes = await request.get(
      `/api/tournaments/${tournamentId}/matches`,
    );
    const matches: Match[] = await matchRes.json();
    const match = findDeltaIotaMatch(matches);
    if (match?.state === 'ONGOING') {
      selectionHasOngoingDeltaIota = true;
      matchId = match.matchId;
      teamId =
        match.team1Name === 'TEAM_DELTA' ? match.team1Id : match.team2Id;
    }
  });

  test.describe('with ONGOING TEAM_DELTA vs TEAM_IOTA', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      if (!selectionHasOngoingDeltaIota) {
        testInfo.skip(
          true,
          'No ONGOING TEAM_DELTA vs TEAM_IOTA match (encode tests need a fresh DB or reset).',
        );
      }
      await goToSelectionPage(page, tournamentId, matchId, teamId);
    });

    // TC-SEL1: page loads with the members counter
    test('TC-SEL1: should display the members selection counter', async ({
      page,
    }) => {
      await expect(page.getByText(/membres sélectionnés/i)).toBeVisible();
    });

    // TC-SEL2: seeded members are listed
    test('TC-SEL2: should display team member tags', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'Ice' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Iron' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Putsh' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Zero' })).toBeVisible();
    });

    // TC-SEL3: match is ONGOING → canModify is false → no confirm button
    test('TC-SEL3: should not show the confirm button when the match is not PLANIFIED', async ({
      page,
    }) => {
      await expect(
        page.getByRole('button', { name: /confirmer la sélection/i }),
      ).not.toBeVisible();
    });

    // TC-SEL4: match is ONGOING → canModify is false → no add/remove buttons
    test('TC-SEL4: should not show add or remove buttons when canModify is false', async ({
      page,
    }) => {
      await expect(
        page.getByRole('button', { name: /ajouter/i }),
      ).not.toBeVisible();
      await expect(
        page.getByRole('button', { name: /retirer/i }),
      ).not.toBeVisible();
    });

    // TC-SEL5: back button is present
    test('TC-SEL5: should display the back button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /retour/i }),
      ).toBeVisible();
    });

    // TC-SEL6: back button navigates to the bracket
    test('TC-SEL6: should navigate to the bracket when clicking the back button', async ({
      page,
    }) => {
      await page.getByRole('button', { name: /retour/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/tournaments/${tournamentId}/bracket`),
      );
    });
  });

  // TC-SEL7: invalid tournamentId
  test('TC-SEL7: should show an alert for an invalid tournamentId', async ({
    page,
  }) => {
    await page.goto('/tournaments/abc/matches/1/selections/1');
    await expect(page.getByText(/paramètres invalides/i)).toBeVisible();
  });

  // TC-SEL8: invalid matchId
  test('TC-SEL8: should show an alert for an invalid matchId', async ({
    page,
  }) => {
    await page.goto('/tournaments/1/matches/abc/selections/1');
    await expect(page.getByText(/paramètres invalides/i)).toBeVisible();
  });

  // TC-SEL9: invalid teamId
  test('TC-SEL9: should show an alert for an invalid teamId', async ({
    page,
  }) => {
    await page.goto('/tournaments/1/matches/1/selections/abc');
    await expect(page.getByText(/paramètres invalides/i)).toBeVisible();
  });
});
