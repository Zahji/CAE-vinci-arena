import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import TeamDetailsPage from '../teamsDetails/TeamDetailsPage';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});

describe('TeamDetailsPage', () => {
  const manager = {
    id: 1,
    email: 'manager@test.com',
    tag: 'mage',
    speciality: 'Mage',
    profilePicture: '',
    date: '',
  };

  const member = {
    id: 2,
    email: 'member@test.com',
    tag: 'archer',
    speciality: 'Archer',
    profilePicture: '',
    date: '',
  };

  const mockTeam = {
    id: 1,
    name: 'Team Alpha',
    manager,
    secondManager: null,
    managersCount: 1,
    membersCount: 2,
  };

  const mockMemberships = [
    { id: 10, member, team: mockTeam, status: 'ACCEPTED' },
  ];

  const createContextValue = (): UserContextType => ({
    authenticatedUser: {
      id: 1,
      email: 'manager@test.com',
      tag: 'mage',
      token: 'test-token',
      teamId: 1,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'manager@test.com', isAdmin: false }),
  });

  const createMemberContextValue = (): UserContextType => ({
    authenticatedUser: {
      id: 2,
      email: 'member@test.com',
      tag: 'archer',
      token: 'test-token',
      teamId: 1,
    },
    setAuthenticatedUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 2, email: 'member@test.com', isAdmin: false }),
  });

  const renderTeamDetailsPage = (contextValue = createContextValue()) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={contextValue}>
          <TeamDetailsPage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

  let fetchMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    navigateMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(useParams).mockReturnValue({ teamId: '1' });
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemberships),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('displays the team members', async () => {
    renderTeamDetailsPage();

    await waitFor(() => {
      expect(screen.getByText('mage')).toBeTruthy();
      expect(screen.getByText('archer')).toBeTruthy();
    });
  });

  test('shows a warning when the primary manager and other members exist', async () => {
    renderTeamDetailsPage();

    await waitFor(() => {
      expect(screen.getByText(/vous êtes responsable principal/i)).toBeTruthy();
    });
  });

  test('shows an error alert when the team cannot be loaded', async () => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(new Error('Erreur 404'));

    renderTeamDetailsPage();

    await waitFor(() => {
      expect(screen.getByText(/erreur 404/i)).toBeTruthy();
    });
  });

  test('calls the designate endpoint when the button is clicked and confirmed', async () => {
    const teamWithSecondManager = {
      ...mockTeam,
      secondManager: member,
      managersCount: 2,
    };
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(teamWithSecondManager),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemberships),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderTeamDetailsPage();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /désigner second responsable/i }),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /désigner second responsable/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/second-manager/2'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  test('dismisses the error alert when the close button is clicked', async () => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(new Error('Erreur réseau'));

    renderTeamDetailsPage();

    await waitFor(() => {
      expect(screen.getByText(/erreur réseau/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText(/erreur réseau/i)).toBeNull();
    });
  });

  test('shows a success message after a successful leave and dismisses it', async () => {
    const teamWithSecondManager = {
      ...mockTeam,
      secondManager: member,
      managersCount: 2,
    };

    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(teamWithSecondManager),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemberships),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({ ok: true });

    renderTeamDetailsPage(createMemberContextValue());

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /quitter la team/i }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /quitter la team/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /confirmer/i })).toBeNull();
      expect(screen.getByText(/vous avez quitté la team/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText(/vous avez quitté la team/i)).toBeNull();
    });
  });

  test('shows the activity section with three columns', async () => {
    renderTeamDetailsPage();

    await waitFor(() => {
      expect(screen.getByText(/activité de la team/i)).toBeTruthy();
      expect(screen.getByText(/passés/i)).toBeTruthy();
      expect(screen.getByText(/en cours/i)).toBeTruthy();
      expect(screen.getByText(/futurs/i)).toBeTruthy();
    });
  });

  test('shows a tournament name in the future column when it is not yet started', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemberships),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              tournamentId: 99,
              tournamentName: 'Future Cup',
              startDate: '2099-01-01',
              endDate: '2099-01-03',
            },
          ]),
      });

    renderTeamDetailsPage();

    await waitFor(() => {
      expect(screen.getByText('Future Cup')).toBeTruthy();
    });
  });

  test('calls the leave endpoint when the leave button is clicked and confirmed', async () => {
    const teamWithSecondManager = {
      ...mockTeam,
      secondManager: member,
      managersCount: 2,
    };

    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(teamWithSecondManager),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemberships),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({ ok: true });

    renderTeamDetailsPage(createMemberContextValue());

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /quitter la team/i }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /quitter la team/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/leave'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });
});
