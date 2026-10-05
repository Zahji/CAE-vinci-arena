import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import TeamsListPage from '../teamsList/TeamsListPage';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

describe('TeamsListPage', () => {
  const mockTeams = [
    { id: 1, name: 'Team Alpha', managersCount: 1, membersCount: 3 },
    { id: 2, name: 'Team Beta', managersCount: 1, membersCount: 2 },
  ];

  /**
   * Returns a user context for a logged-in user.
   * @param {number} [teamId] - the user's team id
   * @return {UserContextType} the context value
   */
  const createContextValue = (teamId?: number): UserContextType => ({
    authenticatedUser: {
      id: 1,
      email: 'user@test.com',
      tag: 'user',
      token: 'test-token',
      teamId,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'user@test.com', isAdmin: false }),
  });

  /**
   * Shows the teams list page inside a user context.
   * @param {UserContextType} contextValue - the user context
   * @return {void}
   */
  const renderTeamsListPage = (contextValue = createContextValue()) =>
    render(
      <UserContext.Provider value={contextValue}>
        <TeamsListPage />
      </UserContext.Provider>,
    );

  let fetchMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    navigateMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeams),
      })
      .mockResolvedValueOnce({ ok: true, status: 204 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders the teams list page title', async () => {
    renderTeamsListPage();

    await waitFor(() => {
      expect(screen.getByText(/liste des teams/i)).toBeTruthy();
    });
  });

  test('displays teams in the table', async () => {
    renderTeamsListPage();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeTruthy();
      expect(screen.getByText('Team Beta')).toBeTruthy();
    });
  });

  test('shows the create team form when authenticated', async () => {
    renderTeamsListPage();

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });
  });

  test('hides the create team form when not authenticated', async () => {
    const unauthenticatedContext: UserContextType = {
      authenticatedUser: undefined,
      registerUser: vi.fn(),
      loginUser: vi.fn(),
      clearUser: vi.fn(),
      refreshUser: vi.fn(),
      jwtData: vi.fn().mockReturnValue(null),
    };

    render(
      <UserContext.Provider value={unauthenticatedContext}>
        <TeamsListPage />
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.queryByRole('textbox')).toBeNull();
    });
  });

  test('creates a team when the form is filled and submitted', async () => {
    const newTeam = {
      id: 3,
      name: 'Nouvelle Team',
      managersCount: 1,
      membersCount: 1,
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newTeam),
    });

    renderTeamsListPage();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeTruthy();
    });

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Nouvelle Team' },
    });
    fireEvent.click(screen.getByRole('checkbox', { hidden: true }));
    fireEvent.click(screen.getByRole('button', { name: /créer une team/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/teams',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  test('shows an error when loading teams fails', async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    renderTeamsListPage();

    await waitFor(() => {
      expect(screen.getByText(/erreur 500/i)).toBeTruthy();
    });
  });

  test('navigates to team details when a team row is clicked', async () => {
    renderTeamsListPage();

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Team Alpha'));

    expect(navigateMock).toHaveBeenCalledWith('/teams/1');
  });

  test('shows a join error and dismisses it', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });

    renderTeamsListPage();

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /rejoindre/i })[0],
      ).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /rejoindre/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/impossible de rejoindre la team/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText(/impossible de rejoindre la team/i)).toBeNull();
    });
  });

  test('dismisses the error alert when the close button is clicked', async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });

    renderTeamsListPage();

    await waitFor(() => {
      expect(screen.getByText(/erreur 503/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText(/erreur 503/i)).toBeNull();
    });
  });

  test('shows the basic help text when user has no team', async () => {
    renderTeamsListPage();

    await waitFor(() => {
      expect(
        screen.getByText('Cliquez sur une team pour consulter ses membres.'),
      ).toBeTruthy();
    });
  });

  test('shows the extended help text when user has a team', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeams),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 10,
            member: {
              id: 1,
              email: 'user@test.com',
              tag: 'user',
              speciality: '',
              profilePicture: '',
              date: '',
            },
            team: {
              id: 1,
              name: 'Team Alpha',
              managersCount: 1,
              membersCount: 3,
            },
            status: 'ACCEPTED',
          }),
      });

    renderTeamsListPage(createContextValue(1));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Sur votre team, vous pouvez également effectuer les actions liées à votre rôle\./,
        ),
      ).toBeTruthy();
    });
  });

  test('shows "Ma team" for the current user team', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeams),
      })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    renderTeamsListPage(createContextValue(1));

    await waitFor(() => {
      expect(screen.getByText('Ma team')).toBeTruthy();
    });
  });
});
