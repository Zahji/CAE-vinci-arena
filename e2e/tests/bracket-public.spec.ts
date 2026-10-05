import { expect, test } from '@playwright/test';

interface Tournament {
  id: number;
  name: string;
}

let tournamentId: number;
let tournamentName: string;

test.describe('Bracket page - unauthenticated', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/tournaments');
    const tournaments: Tournament[] = await res.json();
    const springBattle = tournaments.find(
      (t) => t.name === 'Spring Battle Series 2026',
    );
    tournamentId = springBattle!.id;
    tournamentName = springBattle!.name;
  });

  test('TC-BR-PUB1: should display planning heading without authentication', async ({
    page,
  }) => {
    await page.goto(`/tournaments/${tournamentId}/bracket`);
    await expect(
      page.getByRole('heading', {
        name: new RegExp(`planning du tournoi:\\s*${tournamentName}`, 'i'),
      }),
    ).toBeVisible();
  });

  test('TC-BR-PUB2: should show match content without authentication', async ({
    page,
  }) => {
    await page.goto(`/tournaments/${tournamentId}/bracket`);
    const roundPattern =
      /finale|demi-finale|quarts de finale|round\s+\d+/i;
    await expect(page.getByText(roundPattern).first()).toBeVisible();
  });

  test('TC-BR-PUB3: should not show encode result button without authentication', async ({
    page,
  }) => {
    await page.goto(`/tournaments/${tournamentId}/bracket`);
    await expect(
      page.getByRole('button', { name: /encoder résultat/i }),
    ).toHaveCount(0);
  });

  test('TC-BR-PUB4: should show alert for invalid tournament id', async ({
    page,
  }) => {
    await page.goto('/tournaments/abc/bracket');
    await expect(
      page.getByText(/identifiant de tournoi invalide/i),
    ).toBeVisible();
  });
});
