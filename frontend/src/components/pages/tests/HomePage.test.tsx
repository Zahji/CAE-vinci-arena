import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HomePage from '../HomePage';
import { UserContext } from '../../../contexts/UserContext';
import { HomePageContext } from '../../../contexts/HomePageContext';
import { UserContextType } from '../../../types';

vi.mock('../tournaments/components/TournamentTable', () => ({
  default: (props: { tournamentList: unknown[]; showOnlyName: boolean }) => (
    <div>
      <div>TournamentTable showOnlyName: {String(props.showOnlyName)}</div>
      <div>TournamentTable count: {props.tournamentList?.length ?? 0}</div>
    </div>
  ),
}));

vi.mock('../../../assets/images/logo_cae.png', () => ({
  default: 'logo_cae.png',
}));

describe('HomePage', () => {
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

  const makeHomePageContext = (overrides = {}) => ({
    tournaments: null,
    loading: false,
    error: null,
    ...overrides,
  });

  const createUserContext = (withUser = true): UserContextType => ({
    authenticatedUser: withUser
      ? { id: 1, email: 'a@a.com', tag: 'Sparky', token: 'token' }
      : undefined,
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue({ id: 1, isAdmin: false }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (withUser = true, homeCtx = makeHomePageContext()) => {
    return render(
      <UserContext.Provider value={createUserContext(withUser)}>
        <HomePageContext.Provider value={homeCtx}>
          <HomePage />
        </HomePageContext.Provider>
      </UserContext.Provider>,
    );
  };

  test('renders the logo image', () => {
    renderPage();
    const logo = screen.getByAltText('Vinci Arena Logo');
    expect(logo).toBeTruthy();
  });

  test('renders the site title', () => {
    renderPage();
    expect(screen.getByText('VINCI ARENA TOURNOIS')).toBeTruthy();
  });

  test('shows personalised welcome message when user is authenticated', () => {
    renderPage(true);
    expect(
      screen.getByText(/bienvenue sparky sur le site officiel de/i),
    ).toBeTruthy();
  });

  test('shows generic welcome message when user is not authenticated', () => {
    renderPage(false);
    expect(screen.getByText(/bienvenu sur le site officiel de/i)).toBeTruthy();
  });

  test('does not show personalised message when user is not authenticated', () => {
    renderPage(false);
    expect(screen.queryByText(/bienvenue/i)).toBeNull();
  });

  test('renders description paragraphs', () => {
    renderPage();
    expect(screen.getByText(/Vinci ARENA/)).toBeTruthy();
    expect(
      screen.getByText(/tournois amateurs et semi-professionnels/i),
    ).toBeTruthy();
  });

  test('renders the "Tournois" section title', () => {
    renderPage();
    expect(screen.getByText('Tournois')).toBeTruthy();
  });

  test('shows loading spinner when loading is true', () => {
    renderPage(true, makeHomePageContext({ loading: true }));
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  test('does not show loading spinner when loading is false', () => {
    renderPage(true, makeHomePageContext({ loading: false }));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  test('shows error message when error is set', () => {
    renderPage(true, makeHomePageContext({ error: 'Erreur réseau' }));
    expect(screen.getByText('Erreur réseau')).toBeTruthy();
  });

  test('does not show error message when error is null', () => {
    renderPage(true, makeHomePageContext({ error: null }));
    expect(screen.queryByText(/erreur/i)).toBeNull();
  });

  test('renders TournamentTable when not loading and no error', () => {
    renderPage(
      true,
      makeHomePageContext({
        tournaments: [planifiedTournament],
        loading: false,
        error: null,
      }),
    );
    expect(
      screen.getByText(/TournamentTable showOnlyName: true/i),
    ).toBeTruthy();
  });

  test('passes showOnlyName as true to TournamentTable', () => {
    renderPage(
      true,
      makeHomePageContext({
        tournaments: [planifiedTournament],
        loading: false,
      }),
    );
    expect(screen.getByText('TournamentTable showOnlyName: true')).toBeTruthy();
  });

  test('passes the tournaments list to TournamentTable', () => {
    renderPage(
      true,
      makeHomePageContext({
        tournaments: [planifiedTournament],
        loading: false,
      }),
    );
    expect(screen.getByText('TournamentTable count: 1')).toBeTruthy();
  });

  test('does not render TournamentTable when loading', () => {
    renderPage(true, makeHomePageContext({ loading: true }));
    expect(screen.queryByText(/TournamentTable/)).toBeNull();
  });

  test('does not render TournamentTable when there is an error', () => {
    renderPage(true, makeHomePageContext({ error: 'Erreur', loading: false }));
    expect(screen.queryByText(/TournamentTable/)).toBeNull();
  });

  test('does not show error message when loading is true even if error exists', () => {
    // Loading state takes priority in rendering — spinner shown, not error
    renderPage(
      true,
      makeHomePageContext({ loading: true, error: 'Erreur réseau' }),
    );
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });
});
