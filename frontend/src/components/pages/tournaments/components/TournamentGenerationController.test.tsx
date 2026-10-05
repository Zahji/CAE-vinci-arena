import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Tournament } from '../../../../types';
import TournamentGenerationController from './TournamentGenerationController';
import { hasGeneratedMatches } from '../../../../services/tournamentService';

let latestTableProps: {
  lockedTournamentIds?: Set<number>;
  onGenerateSchedule?: (tournamentId: number) => Promise<void>;
} = {};

vi.mock('../../../../services/tournamentService', () => ({
  hasGeneratedMatches: vi.fn(),
}));

vi.mock('./TournamentTable', () => ({
  default: (props: {
    lockedTournamentIds: Set<number>;
    onGenerateSchedule: (tournamentId: number) => Promise<void>;
  }) => {
    latestTableProps = props;
    return (
      <div>
        <button onClick={() => void props.onGenerateSchedule(1)}>
          generate-1
        </button>
        <button onClick={() => void props.onGenerateSchedule(2)}>
          generate-2
        </button>
        <div>
          locked:
          {Array.from(props.lockedTournamentIds)
            .sort((a, b) => a - b)
            .join(',')}
        </div>
      </div>
    );
  },
}));

const tournaments: Tournament[] = [
  {
    id: 1,
    name: 'Spring Clash',
    description: 'Tournoi du printemps',
    state: 'PLANIFIED',
    stateDisplayName: 'Planifié',
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    startInscriptionDate: '2026-03-01',
    endInscriptionDate: '2026-03-31',
    maxTeams: 16,
    registrationsCount: 0,
  },
  {
    id: 2,
    name: 'Summer Clash',
    description: 'Tournoi d été',
    state: 'PLANIFIED',
    stateDisplayName: 'Planifié',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    startInscriptionDate: '2026-05-01',
    endInscriptionDate: '2026-05-31',
    maxTeams: 16,
    registrationsCount: 0,
  },
];

describe('TournamentGenerationController', () => {
  beforeEach(() => {
    latestTableProps = {};
    vi.clearAllMocks();
  });

  test('loads locked tournament ids for admins based on generated matches', async () => {
    vi.mocked(hasGeneratedMatches)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    render(
      <TournamentGenerationController
        tournamentList={tournaments}
        isAdmin
        handleGenerateSchedule={vi.fn().mockResolvedValue(undefined)}
        registeredTournamentIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(latestTableProps.lockedTournamentIds?.has(1)).toBe(true);
      expect(latestTableProps.lockedTournamentIds?.has(2)).toBe(false);
    });
  });

  test('ignores lock check errors and keeps non-failing locked ids', async () => {
    vi.mocked(hasGeneratedMatches)
      .mockRejectedValueOnce(new Error('check failed'))
      .mockResolvedValueOnce(true);

    render(
      <TournamentGenerationController
        tournamentList={tournaments}
        isAdmin
        handleGenerateSchedule={vi.fn().mockResolvedValue(undefined)}
        registeredTournamentIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(latestTableProps.lockedTournamentIds?.has(1)).toBe(false);
      expect(latestTableProps.lockedTournamentIds?.has(2)).toBe(true);
    });
  });

  test('does not load locks when tournament list is empty', async () => {
    render(
      <TournamentGenerationController
        tournamentList={[]}
        isAdmin
        handleGenerateSchedule={vi.fn().mockResolvedValue(undefined)}
        registeredTournamentIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('locked:')).toBeTruthy();
    });

    expect(hasGeneratedMatches).not.toHaveBeenCalled();
  });

  test('resets locks when user is not admin', async () => {
    vi.mocked(hasGeneratedMatches).mockResolvedValue(true);

    const { rerender } = render(
      <TournamentGenerationController
        tournamentList={tournaments}
        isAdmin
        handleGenerateSchedule={vi.fn().mockResolvedValue(undefined)}
        registeredTournamentIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(latestTableProps.lockedTournamentIds?.has(1)).toBe(true);
    });

    rerender(
      <TournamentGenerationController
        tournamentList={tournaments}
        isAdmin={false}
        handleGenerateSchedule={vi.fn().mockResolvedValue(undefined)}
        registeredTournamentIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(Array.from(latestTableProps.lockedTournamentIds ?? [])).toEqual(
        [],
      );
    });
  });

  test('blocks schedule generation when tournament is already locked', async () => {
    const handleGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    vi.mocked(hasGeneratedMatches).mockResolvedValue(true);

    render(
      <TournamentGenerationController
        tournamentList={tournaments}
        isAdmin
        handleGenerateSchedule={handleGenerateSchedule}
        registeredTournamentIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(latestTableProps.lockedTournamentIds?.has(1)).toBe(true);
    });

    await userEvent.click(screen.getByRole('button', { name: 'generate-1' }));

    expect(handleGenerateSchedule).not.toHaveBeenCalled();
  });

  test('calls generation only once while immediate lock is active', async () => {
    let resolveGeneration: (() => void) | undefined;
    const handleGenerateSchedule = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveGeneration = resolve;
        }),
    );

    vi.mocked(hasGeneratedMatches).mockResolvedValue(false);

    render(
      <TournamentGenerationController
        tournamentList={[]}
        isAdmin
        handleGenerateSchedule={handleGenerateSchedule}
        registeredTournamentIds={new Set()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'generate-1' }));
    await userEvent.click(screen.getByRole('button', { name: 'generate-1' }));

    expect(handleGenerateSchedule).toHaveBeenCalledTimes(1);

    resolveGeneration?.();

    await waitFor(() => {
      expect(latestTableProps.lockedTournamentIds?.has(1)).toBe(false);
    });
  });

  test('keeps lock after generation when matches are now generated', async () => {
    const handleGenerateSchedule = vi.fn().mockResolvedValue(undefined);
    vi.mocked(hasGeneratedMatches)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    render(
      <TournamentGenerationController
        tournamentList={[]}
        isAdmin
        handleGenerateSchedule={handleGenerateSchedule}
        registeredTournamentIds={new Set()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'generate-1' }));

    await waitFor(() => {
      expect(handleGenerateSchedule).toHaveBeenCalledWith(1);
      expect(latestTableProps.lockedTournamentIds?.has(1)).toBe(true);
    });
  });

  test('keeps immediate lock when final lock check fails after generation error', async () => {
    const handleGenerateSchedule = vi.fn().mockRejectedValue(new Error('boom'));
    vi.mocked(hasGeneratedMatches).mockRejectedValue(
      new Error('lock check failed'),
    );

    render(
      <TournamentGenerationController
        tournamentList={[]}
        isAdmin
        handleGenerateSchedule={handleGenerateSchedule}
        registeredTournamentIds={new Set()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'generate-1' }));

    await waitFor(() => {
      expect(handleGenerateSchedule).toHaveBeenCalledTimes(1);
    });

    await userEvent.click(screen.getByRole('button', { name: 'generate-1' }));

    expect(handleGenerateSchedule).toHaveBeenCalledTimes(1);
  });

  test('does not update lock state after unmount when lock loading is cancelled', async () => {
    const checkResolvers: Array<(value: boolean) => void> = [];
    vi.mocked(hasGeneratedMatches).mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          checkResolvers.push(resolve);
        }),
    );

    const { unmount } = render(
      <TournamentGenerationController
        tournamentList={tournaments}
        isAdmin
        handleGenerateSchedule={vi.fn().mockResolvedValue(undefined)}
        registeredTournamentIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(hasGeneratedMatches).toHaveBeenCalledTimes(2);
    });

    unmount();

    checkResolvers.forEach((resolve) => resolve(true));

    await waitFor(() => {
      expect(hasGeneratedMatches).toHaveBeenCalled();
    });
  });
});
