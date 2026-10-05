import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import TournamentPage from '../tournaments/TournamentPage';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType } from '../../../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

const createUserContextValue = (isAdmin: boolean): UserContextType => ({
  authenticatedUser: {
    id: 1,
    email: 'admin@mail.com',
    tag: 'admin',
    token: 'test-token',
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ id: 1, email: 'admin@mail.com', isAdmin }),
  refreshUser: vi.fn(),
});

const createManagerUserContext = (): UserContextType => ({
  authenticatedUser: {
    id: 1,
    email: 'manager@test.com',
    tag: 'Manager',
    token: 'test-token',
    teamId: 99,
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  jwtData: vi
    .fn()
    .mockReturnValue({ id: 1, email: 'manager@test.com', isAdmin: false }),
  refreshUser: vi.fn(),
});

const getTodayLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

describe('TournamentPage', () => {
  const initialTournaments = [
    {
      id: 1,
      name: 'Spring Clash',
      description: 'Tournoi du printemps',
      state: 'IN_PREPARATION',
      stateDisplayName: 'En préparation',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      startInscriptionDate: '2026-03-01',
      endInscriptionDate: '2026-03-31',
      maxTeams: 16,
      registrationsCount: 3,
    },
  ];

  const managerTeam = {
    id: 99,
    name: 'MY_TEAM',
    manager: {
      id: 1,
      email: 'manager@test.com',
      tag: 'Manager',
      speciality: '',
      profilePicture: '',
      date: '',
    },
    secondManager: null,
    managersCount: 1,
    membersCount: 4,
  };

  let fetchMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    navigateMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('renders the tournament page title and data after loading', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialTournaments),
    });

    render(
      <UserContext.Provider value={createUserContextValue(true)}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /tournois/i }),
      ).toBeTruthy();
    });

    expect(screen.getByText('Spring Clash')).toBeTruthy();
    expect(
      screen.getByText(/début des inscriptions\s*:\s*01\/03\/2026/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/fin des inscriptions\s*:\s*31\/03\/2026/i),
    ).toBeTruthy();
  }, 15000);

  test('renders registrationsCount/maxTeams in tournament cards', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialTournaments),
    });

    render(
      <UserContext.Provider value={createUserContextValue(true)}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/teams inscrites\s*:\s*3\s*\/\s*16/i),
      ).toBeTruthy();
    });
  });

  test('navigates to tournament detail page when clicking a row', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialTournaments),
    });

    render(
      <UserContext.Provider value={createUserContextValue(true)}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Spring Clash')).toBeTruthy();
    });

    await userEvent.click(screen.getByText('Spring Clash'));

    expect(navigateMock).toHaveBeenCalledWith('/tournaments/1');
  });

  test('displays the basic helpText for anonymous user', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialTournaments),
    });

    render(<TournamentPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Cliquez sur un tournoi pour consulter son détail.'),
      ).toBeTruthy();
    });
  });

  test('displays the extended helpText for manager user', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialTournaments),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(managerTeam),
      });

    render(
      <UserContext.Provider value={createManagerUserContext()}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'Cliquez sur un tournoi pour consulter son détail et inscrire votre team.',
        ),
      ).toBeTruthy();
    });
  });

  test('does not render creation form and table when the user is not admin', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(
      <UserContext.Provider value={createUserContextValue(false)}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /tournois/i }),
      ).toBeTruthy();
    });

    expect(
      screen.queryByRole('heading', { name: /créer un tournoi/i }),
    ).toBeNull();
    expect(screen.queryByText('Spring Clash')).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'État' })).toBeNull();
  });

  test('renders the creation dialog for an admin user after clicking create', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialTournaments),
    });

    render(
      <UserContext.Provider value={createUserContextValue(true)}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    const openCreateButton = await screen.findByRole('button', {
      name: /créer un tournoi/i,
    });
    fireEvent.click(openCreateButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    expect(screen.getByRole('textbox', { name: /^nom$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^créer$/i })).toBeTruthy();
  });

  test('prevents creating a tournament with past dates', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialTournaments),
    });

    render(
      <UserContext.Provider value={createUserContextValue(true)}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    const openCreateButton = await screen.findByRole('button', {
      name: /créer un tournoi/i,
    });
    fireEvent.click(openCreateButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    const today = getTodayLocalDate();
    const startDateInput = screen.getByLabelText(/date du début du tournoi/i);
    const endDateInput = screen.getByLabelText(/date de fin du tournoi/i);
    const endInscriptionDateInput = screen.getByLabelText(
      /date limite des inscriptions/i,
    );

    expect(startDateInput.getAttribute('min')).toBe(today);
    expect(endDateInput.getAttribute('min')).toBe(today);
    expect(endInscriptionDateInput.getAttribute('min')).toBe(today);

    fireEvent.change(screen.getByRole('textbox', { name: /^nom$/i }), {
      target: { value: 'Ancien tournoi' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: 'Description test' },
    });
    fireEvent.change(startDateInput, {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(endDateInput, {
      target: { value: '2000-01-10' },
    });
    fireEvent.change(endInscriptionDateInput, {
      target: { value: '2000-01-01' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^créer$/i }));

    expect((startDateInput as HTMLInputElement).checkValidity()).toBe(false);
    expect((endDateInput as HTMLInputElement).checkValidity()).toBe(false);
    expect((endInscriptionDateInput as HTMLInputElement).checkValidity()).toBe(
      false,
    );

    const createCalls = fetchMock.mock.calls.filter(([url, init]) => {
      const requestUrl = typeof url === 'string' ? url : String(url);
      const method = (init as RequestInit | undefined)?.method;
      return requestUrl.includes('/api/tournaments/') && method === 'POST';
    });

    expect(createCalls).toHaveLength(0);
  });

  test('displays the loading state while tournaments are being fetched', () => {
    fetchMock.mockImplementation(
      () => new Promise(() => undefined) as Promise<Response>,
    );

    render(<TournamentPage />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  test('displays an error message when loading fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<TournamentPage />);

    await waitFor(() => {
      expect(screen.getByText(/erreur : erreur 500/i)).toBeTruthy();
    });
  });

  test('uses card layout without state table column', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialTournaments),
    });

    render(
      <UserContext.Provider value={createUserContextValue(true)}>
        <TournamentPage />
      </UserContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Spring Clash')).toBeTruthy();
    });

    expect(screen.queryByRole('columnheader', { name: 'État' })).toBeNull();
  });
});
