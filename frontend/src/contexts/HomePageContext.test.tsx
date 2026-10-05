import { useContext } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HomePageContext, HomePageProvider } from './HomePageContext';
import { HomePageContextType } from '../types';
import { fetchTournaments } from '../services/tournamentService';

vi.mock('../services/tournamentService', () => ({
  fetchTournaments: vi.fn(),
}));

describe('HomePageContext', () => {
  const planifiedTournament = {
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
  };

  const ongoingTournament = {
    ...planifiedTournament,
    id: 2,
    name: 'Summer Clash',
    state: 'ONGOING',
    stateDisplayName: 'En cours',
    startDate: '2026-05-01',
  };

  const inPreparationTournament = {
    ...planifiedTournament,
    id: 3,
    name: 'Hidden Tournament',
    state: 'IN_PREPARATION',
    stateDisplayName: 'En préparation',
  };

  const endedTournament = {
    ...planifiedTournament,
    id: 4,
    name: 'Past Tournament',
    state: 'ENDED',
    stateDisplayName: 'Terminé',
  };

  let contextValue: HomePageContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(HomePageContext);
    return null;
  };

  const DefaultContextConsumer = () => {
    contextValue = useContext(HomePageContext);
    return null;
  };

  const renderContext = () =>
    render(
      <HomePageProvider>
        <ContextConsumer />
      </HomePageProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchTournaments).mockResolvedValue([planifiedTournament]);
  });

  test('exposes default values without a provider', () => {
    render(<DefaultContextConsumer />);

    expect(contextValue?.tournaments).toBeNull();
    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.error).toBeNull();
  });

  test('starts with loading true before fetch completes', () => {
    vi.mocked(fetchTournaments).mockImplementation(() => new Promise(() => {}));

    renderContext();

    expect(contextValue?.loading).toBe(true);
  });

  test('sets loading to false after fetch completes', async () => {
    renderContext();

    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
    });
  });

  test('loads and exposes tournaments on mount', async () => {
    renderContext();

    await waitFor(() => {
      expect(fetchTournaments).toHaveBeenCalledOnce();
      expect(contextValue?.tournaments).toEqual([planifiedTournament]);
      expect(contextValue?.error).toBeNull();
    });
  });

  test('keeps only PLANIFIED and ONGOING tournaments', async () => {
    vi.mocked(fetchTournaments).mockResolvedValueOnce([
      planifiedTournament,
      ongoingTournament,
      inPreparationTournament,
      endedTournament,
    ]);

    renderContext();

    await waitFor(() => {
      expect(contextValue?.tournaments).toHaveLength(2);
      const states = contextValue?.tournaments?.map((t) => t.state);
      expect(states).toContain('PLANIFIED');
      expect(states).toContain('ONGOING');
      expect(states).not.toContain('IN_PREPARATION');
      expect(states).not.toContain('ENDED');
    });
  });

  test('sorts tournaments by startDate descending', async () => {
    const earlier = { ...planifiedTournament, id: 1, startDate: '2026-03-01' };
    const later = { ...planifiedTournament, id: 2, startDate: '2026-05-01' };

    vi.mocked(fetchTournaments).mockResolvedValueOnce([earlier, later]);

    renderContext();

    await waitFor(() => {
      expect(contextValue?.tournaments?.[0].startDate).toBe('2026-05-01');
      expect(contextValue?.tournaments?.[1].startDate).toBe('2026-03-01');
    });
  });

  test('returns an empty array when no tournaments match the filter', async () => {
    vi.mocked(fetchTournaments).mockResolvedValueOnce([
      inPreparationTournament,
      endedTournament,
    ]);

    renderContext();

    await waitFor(() => {
      expect(contextValue?.tournaments).toEqual([]);
      expect(contextValue?.loading).toBe(false);
    });
  });

  test('stores error message when fetchTournaments fails with an Error', async () => {
    vi.mocked(fetchTournaments).mockRejectedValueOnce(
      new Error('Erreur réseau'),
    );

    renderContext();

    await waitFor(() => {
      expect(contextValue?.error).toBe('Erreur réseau');
      expect(contextValue?.tournaments).toBeNull();
      expect(contextValue?.loading).toBe(false);
    });
  });

  test('stores fallback error message when fetchTournaments fails with unknown value', async () => {
    vi.mocked(fetchTournaments).mockRejectedValueOnce('unknown');

    renderContext();

    await waitFor(() => {
      expect(contextValue?.error).toBe('Une erreur est survenue');
      expect(contextValue?.loading).toBe(false);
    });
  });

  test('context provides values inside provider', async () => {
    let hookValue: HomePageContextType | undefined;

    const HookConsumer = () => {
      hookValue = useContext(HomePageContext);
      return null;
    };

    render(
      <HomePageProvider>
        <HookConsumer />
      </HomePageProvider>,
    );

    await waitFor(() => {
      expect(hookValue?.loading).toBe(false);
      expect(hookValue?.tournaments).toEqual([planifiedTournament]);
    });
  });
});
