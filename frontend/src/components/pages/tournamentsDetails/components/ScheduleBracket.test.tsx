import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import type { Match } from '../../../../types';
import ScheduleBracket from './ScheduleBracket';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock('./EncoderResultButton', () => ({
  default: ({ match }: { match: Match }) => (
    <div>encoder-result-{match.matchId}</div>
  ),
}));

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  matchId: 1,
  round: 1,
  startTime: '2026-06-01T10:00:00',
  state: 'PLANIFIED',
  team1Name: 'TEAM_A',
  team1Id: 10,
  team2Name: 'TEAM_B',
  team2Id: 20,
  ...overrides,
});

describe('ScheduleBracket', () => {
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  test('shows empty state when there are no matches', () => {
    render(
      <ScheduleBracket
        matches={[]}
        onSuccess={vi.fn()}
        tournamentId={3}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(
      screen.getByText(/aucun planning généré pour ce tournoi/i),
    ).toBeTruthy();
  });

  test('renders final-only layout and allows navigation to match details when admin', async () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 44,
            round: 1,
            state: 'ONGOING',
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={3}
        currentTeamId={undefined}
        isAdmin
      />,
    );

    expect(screen.getByText('Finale')).toBeTruthy();
    expect(screen.getByText('En cours')).toBeTruthy();
    expect(screen.getByText('encoder-result-44')).toBeTruthy();

    await userEvent.click(screen.getByText('TEAM_A'));

    expect(navigateMock).toHaveBeenCalledWith(
      '/tournaments/3/matches/44/selections',
    );
  });

  test('renders stage labels, state labels, bye text and score placeholders', () => {
    const matches: Match[] = [
      makeMatch({
        matchId: 101,
        round: 1,
        state: 'UNKNOWN_STATE',
        team1Name: 'A',
        team2Name: 'B',
      }),
      makeMatch({
        matchId: 102,
        round: 2,
        state: 'PLANIFIED',
        team1Name: 'C',
        team2Name: 'D',
      }),
      makeMatch({
        matchId: 103,
        round: 3,
        state: 'ONGOING',
        team1Name: 'E',
        team2Name: 'F',
      }),
      makeMatch({
        matchId: 104,
        round: 4,
        state: 'ENDED',
        team1Name: 'G',
        team2Name: 'H',
        team1Score: 2,
        team2Score: 1,
      }),
      makeMatch({
        matchId: 105,
        round: 5,
        state: 'CONTESTED',
        team1Name: 'I',
        team2Name: 'J',
      }),
      makeMatch({
        matchId: 106,
        round: 6,
        state: 'PLANIFIED',
        team1Name: 'K',
        team2Name: 'L',
      }),
      makeMatch({
        matchId: 107,
        round: 7,
        state: 'PLANIFIED',
        team1Name: 'M',
        team2Name: 'N',
      }),
      makeMatch({
        matchId: 108,
        round: 8,
        state: 'PLANIFIED',
        team1Name: 'O',
        team2Name: 'P',
      }),
      makeMatch({
        matchId: 109,
        round: 1,
        state: 'ENDED',
        byeTeamId: 999,
        team1Id: undefined,
        team2Id: undefined,
        team1Name: 'TEAM_BYE',
        team2Name: undefined,
        team1Score: undefined,
        team2Score: undefined,
      }),
    ];

    render(
      <ScheduleBracket
        matches={matches}
        onSuccess={vi.fn()}
        tournamentId={9}
        currentTeamId={10}
        isAdmin={false}
      />,
    );

    expect(screen.getAllByText('Round 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Round 2').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Trente-deuxièmes de finale').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Seizièmes de finale').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Huitièmes de finale').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Quarts de finale').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Demi-finale').length).toBeGreaterThan(0);
    expect(screen.getByText('Finale')).toBeTruthy();

    expect(screen.getAllByText('UNKNOWN_STATE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Planifie').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contesté').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Terminé').length).toBeGreaterThan(0);

    expect(screen.getByText(/TEAM_BYE \(BYE\)/)).toBeTruthy();
    expect(screen.getAllByText('TEAM_BYE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  }, 25000);

  test('navigates to match details when clicking a card', async () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 11,
            round: 1,
            state: 'PLANIFIED',
            team1Id: 1,
            team2Id: 2,
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={5}
        currentTeamId={999}
        isAdmin={false}
      />,
    );

    await userEvent.click(screen.getByText('TEAM_A'));

    expect(navigateMock).toHaveBeenCalledWith(
      '/tournaments/5/matches/11/selections',
    );
  });

  test('falls back to dash when date formatting input is invalid', () => {
    render(
      <ScheduleBracket
        matches={[makeMatch({ matchId: 31, startTime: 'raw-date-value' })]}
        onSuccess={vi.fn()}
        tournamentId={1}
        currentTeamId={10}
        isAdmin
      />,
    );

    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  test('renders right-side placeholders and falls back to dash for missing team2 name', () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 501,
            round: 1,
            team1Name: undefined,
            team2Name: undefined,
            team2Id: undefined,
          }),
          makeMatch({
            matchId: 503,
            round: 1,
            state: 'ENDED',
            byeTeamId: 777,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 502,
            round: 2,
            team1Name: 'FINALIST_A',
            team2Name: 'FINALIST_B',
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={7}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(screen.getByText('Bye (BYE)')).toBeTruthy();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  test('does not display bye labels for non-ended partially qualified next match', () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 801,
            round: 2,
            state: 'PLANIFIED',
            byeTeamId: 10,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={7}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(screen.queryByText(/Bye \(BYE\)/)).toBeNull();
    expect(screen.queryByText(/Qualifie d'office/)).toBeNull();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  test('resolves BYE qualified team name from byeTeamId when match names are missing', () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 901,
            round: 1,
            state: 'ENDED',
            team1Id: 500,
            team1Name: 'TEAM_NOVA',
            team2Id: 777,
            team2Name: 'TEAM_KAPPA',
            team1Score: 1,
            team2Score: 3,
          }),
          makeMatch({
            matchId: 902,
            round: 1,
            state: 'ENDED',
            byeTeamId: 777,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={7}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(screen.getByText('TEAM_KAPPA (BYE)')).toBeTruthy();
    expect(screen.getAllByText('TEAM_KAPPA').length).toBeGreaterThan(1);
  });

  test('groups adjacent BYE matches into one regular match card', () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 1001,
            round: 1,
            state: 'ENDED',
            team1Id: 900,
            team1Name: 'TEAM_REF_1',
            team2Id: 901,
            team2Name: 'TEAM_LAMBDA',
            team1Score: 0,
            team2Score: 3,
          }),
          makeMatch({
            matchId: 1002,
            round: 1,
            state: 'ENDED',
            team1Id: 902,
            team1Name: 'TEAM_REF_2',
            team2Id: 903,
            team2Name: 'TEAM_RHO',
            team1Score: 0,
            team2Score: 3,
          }),
          makeMatch({
            matchId: 1003,
            round: 2,
            state: 'ENDED',
            byeTeamId: 901,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 1004,
            round: 2,
            state: 'ENDED',
            byeTeamId: 903,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 1005,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_OTHER_1',
            team2Name: 'TEAM_OTHER_2',
          }),
          makeMatch({
            matchId: 1006,
            round: 3,
            state: 'PLANIFIED',
            team1Name: 'TEAM_FINAL_1',
            team2Name: 'TEAM_FINAL_2',
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={7}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(screen.queryByText('TEAM_LAMBDA (BYE)')).toBeNull();
    expect(screen.queryByText('TEAM_RHO (BYE)')).toBeNull();
    expect(screen.getAllByText('TEAM_LAMBDA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TEAM_RHO').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('grouped-bye-badge').length).toBeGreaterThan(
      0,
    );
  });

  test('groups BYE matches even when they are separated by a regular match', () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 1101,
            round: 1,
            state: 'ENDED',
            team1Id: 910,
            team1Name: 'TEAM_REF_A',
            team2Id: 911,
            team2Name: 'TEAM_LAMBDA',
            team1Score: 0,
            team2Score: 3,
          }),
          makeMatch({
            matchId: 1102,
            round: 1,
            state: 'ENDED',
            team1Id: 912,
            team1Name: 'TEAM_REF_B',
            team2Id: 913,
            team2Name: 'TEAM_RHO',
            team1Score: 0,
            team2Score: 3,
          }),
          makeMatch({
            matchId: 1103,
            round: 2,
            state: 'ENDED',
            byeTeamId: 911,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 1104,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_MIDDLE_1',
            team2Name: 'TEAM_MIDDLE_2',
          }),
          makeMatch({
            matchId: 1105,
            round: 2,
            state: 'ENDED',
            byeTeamId: 913,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 1106,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_SIDE_1',
            team2Name: 'TEAM_SIDE_2',
          }),
          makeMatch({
            matchId: 1107,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_SIDE_3',
            team2Name: 'TEAM_SIDE_4',
          }),
          makeMatch({
            matchId: 1108,
            round: 3,
            state: 'PLANIFIED',
            team1Name: 'TEAM_FINAL_A',
            team2Name: 'TEAM_FINAL_B',
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={7}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(screen.queryByText('TEAM_LAMBDA (BYE)')).toBeNull();
    expect(screen.queryByText('TEAM_RHO (BYE)')).toBeNull();
    expect(screen.getAllByText('TEAM_LAMBDA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TEAM_RHO').length).toBeGreaterThan(0);
  });

  test('matches attachment case with right-side BYE regrouping (ZETA/LAMBDA/RHO branch)', () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 1201,
            round: 1,
            state: 'ENDED',
            team1Id: 100,
            team1Name: 'TEAM_ZETA',
            team2Id: 101,
            team2Name: 'TEAM_KAPPA',
            team1Score: 3,
            team2Score: 1,
          }),
          makeMatch({
            matchId: 1202,
            round: 1,
            state: 'ENDED',
            team1Id: 102,
            team1Name: 'TEAM_LAMBDA',
            team2Id: 103,
            team2Name: 'TEAM_PHI',
            team1Score: 3,
            team2Score: 1,
          }),
          makeMatch({
            matchId: 1203,
            round: 1,
            state: 'ENDED',
            team1Id: 104,
            team1Name: 'TEAM_RHO',
            team2Id: 105,
            team2Name: 'TEAM_TAU',
            team1Score: 3,
            team2Score: 1,
          }),
          makeMatch({
            matchId: 1204,
            round: 1,
            state: 'PLANIFIED',
            team1Name: '-',
            team2Name: '-',
          }),
          makeMatch({
            matchId: 1301,
            round: 2,
            state: 'ENDED',
            team1Name: 'TEAM_DELTA',
            team2Name: 'TEAM_SIGMA',
            team1Id: 201,
            team2Id: 202,
            team1Score: 3,
            team2Score: 1,
          }),
          makeMatch({
            matchId: 1302,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_BUFFER_1',
            team2Name: 'TEAM_BUFFER_2',
          }),
          makeMatch({
            matchId: 1303,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_BUFFER_3',
            team2Name: 'TEAM_BUFFER_4',
          }),
          makeMatch({
            matchId: 1304,
            round: 2,
            state: 'ENDED',
            byeTeamId: 102,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 1305,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_RIGHT_BUFFER_1',
            team2Name: 'TEAM_RIGHT_BUFFER_2',
          }),
          makeMatch({
            matchId: 1306,
            round: 2,
            state: 'ENDED',
            byeTeamId: 104,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 1401,
            round: 3,
            state: 'PLANIFIED',
            team1Name: 'TEAM_FINAL_LEFT',
            team2Name: 'TEAM_FINAL_RIGHT',
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={11}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(screen.queryByText('TEAM_LAMBDA (BYE)')).toBeNull();
    expect(screen.queryByText('TEAM_RHO (BYE)')).toBeNull();
    expect(screen.getAllByText('TEAM_LAMBDA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TEAM_RHO').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('grouped-bye-badge').length).toBeGreaterThan(
      0,
    );
  });

  test('pairs outer BYE teams so SIGMA plays RHO while LAMBDA remains BYE', () => {
    render(
      <ScheduleBracket
        matches={[
          makeMatch({
            matchId: 2101,
            round: 1,
            state: 'ENDED',
            team1Id: 301,
            team1Name: 'TEAM_SIGMA',
            team2Id: 401,
            team2Name: 'TEAM_NOVA',
            team1Score: 3,
            team2Score: 1,
          }),
          makeMatch({
            matchId: 2102,
            round: 1,
            state: 'ENDED',
            team1Id: 302,
            team1Name: 'TEAM_LAMBDA',
            team2Id: 402,
            team2Name: 'TEAM_PHI',
            team1Score: 3,
            team2Score: 1,
          }),
          makeMatch({
            matchId: 2103,
            round: 1,
            state: 'ENDED',
            team1Id: 303,
            team1Name: 'TEAM_RHO',
            team2Id: 403,
            team2Name: 'TEAM_TAU',
            team1Score: 3,
            team2Score: 1,
          }),
          makeMatch({
            matchId: 2201,
            round: 2,
            state: 'ENDED',
            byeTeamId: 301,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 2202,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_BUFFER_A',
            team2Name: 'TEAM_BUFFER_B',
          }),
          makeMatch({
            matchId: 2203,
            round: 2,
            state: 'ENDED',
            byeTeamId: 302,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 2204,
            round: 2,
            state: 'PLANIFIED',
            team1Name: 'TEAM_BUFFER_C',
            team2Name: 'TEAM_BUFFER_D',
          }),
          makeMatch({
            matchId: 2205,
            round: 2,
            state: 'ENDED',
            byeTeamId: 303,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 2301,
            round: 3,
            state: 'PLANIFIED',
            team1Name: 'TEAM_DELTA',
            team2Name: 'TEAM_SIGMA',
          }),
          makeMatch({
            matchId: 2302,
            round: 3,
            state: 'ENDED',
            byeTeamId: 302,
            team1Id: undefined,
            team2Id: undefined,
            team1Name: undefined,
            team2Name: undefined,
          }),
          makeMatch({
            matchId: 2401,
            round: 4,
            state: 'PLANIFIED',
            team1Name: 'TEAM_FINAL_L',
            team2Name: 'TEAM_FINAL_R',
          }),
        ]}
        onSuccess={vi.fn()}
        tournamentId={13}
        currentTeamId={undefined}
        isAdmin={false}
      />,
    );

    expect(screen.queryByText('TEAM_SIGMA (BYE)')).toBeNull();
    expect(screen.queryByText('TEAM_RHO (BYE)')).toBeNull();
    expect(screen.getAllByText('TEAM_LAMBDA (BYE)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TEAM_SIGMA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TEAM_RHO').length).toBeGreaterThan(0);
  });
});
