import { expect, test } from '@playwright/test';
import { goToTournamentDetailsPage } from './helpers';

interface Tournament {
  id: number;
  name: string;
  state: string;
}

let planifiedId: number;
let planifiedName: string;

// These tests run without any stored session (chromium-public).

test.describe('Tournament details - unauthenticated', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const planified = tournaments.find((t) => t.state === 'PLANIFIED');
    planifiedId = planified!.id;
    planifiedName = planified!.name;
  });

  // TC-TD6: unauthenticated user sees the tournament info but not the register button
  test('TC-TD6: should display tournament info without register button', async ({
    page,
  }) => {
    await goToTournamentDetailsPage(page, planifiedId);
    await expect(page.getByText(planifiedName)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /inscrire ma team/i }),
    ).not.toBeVisible();
  });

  // TC-TD10: navigating to a non-existent tournament shows an error alert
  test('TC-TD10: should show error alert for a non-existent tournament', async ({
    page,
  }) => {
    await page.goto('/tournaments/99999');
    await expect(
      page.getByText(/ce tournoi n'est pas encore publié ou n'existe pas/i),
    ).toBeVisible();
  });
});
