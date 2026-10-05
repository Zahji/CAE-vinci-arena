import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { MemberDetailsContext } from '../../../contexts/MemberDetailsContext';
import { UserContext } from '../../../contexts/UserContext';
import { MemberDetailsContextType, UserContextType } from '../../../types';
import MemberDetailsPageContent from './MemberDetailsPageContent';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

const member = {
  id: 1,
  tag: 'Storm',
  speciality: 'exécuteur',
  profilePicture: 'url1',
  date: '2026-01-10',
  teamName: 'TEAM_IOTA',
  teamId: 2,
  isBanned: false,
};

const createUserContext = (isAdmin = false): UserContextType => ({
  authenticatedUser: { id: 10, email: 'a@a.com', tag: 'admin', token: 'token' },
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ id: 10, email: 'a@a.com', isAdmin }),
});

const renderWithContext = (
  value: Partial<MemberDetailsContextType>,
  isAdmin = false,
) => {
  const contextValue = {
    loading: false,
    error: null,
    member,
    unavailabilities: [],
    canViewUnavailabilities: false,
    openBanModal: false,
    banError: '',
    setOpenBanModal: vi.fn(),
    handleBanMember: vi.fn(),
    ...value,
  } as MemberDetailsContextType;

  return render(
    <MemoryRouter>
      <UserContext.Provider value={createUserContext(isAdmin)}>
        <MemberDetailsContext.Provider value={contextValue}>
          <MemberDetailsPageContent />
        </MemberDetailsContext.Provider>
      </UserContext.Provider>
    </MemoryRouter>,
  );
};

describe('MemberDetailsPageContent', () => {
  test('renders the loading state', () => {
    renderWithContext({ loading: true });
    expect(screen.getAllByRole('progressbar')).toBeTruthy();
  });

  test('renders the error state', () => {
    renderWithContext({ error: 'Erreur réseau' });
    expect(screen.getByText(/erreur réseau/i)).toBeTruthy();
  });

  test('renders the loading state when member is null', () => {
    renderWithContext({ member: null });
    expect(screen.getAllByRole('progressbar')).toBeTruthy();
  });

  test('renders the member tag', () => {
    renderWithContext({});
    expect(screen.getByText('Storm')).toBeTruthy();
  });

  test('renders the member speciality', () => {
    renderWithContext({});
    expect(screen.getByText('exécuteur')).toBeTruthy();
  });

  test('renders the team name when the member has a team', () => {
    renderWithContext({});
    expect(screen.getByText('TEAM_IOTA')).toBeTruthy();
  });

  test('renders "Aucune team" when the member has no team', () => {
    renderWithContext({ member: { ...member, teamName: null, teamId: null } });
    expect(screen.getByText('Aucune team')).toBeTruthy();
  });

  test('renders the formatted creation date', () => {
    renderWithContext({});
    expect(screen.getByText(/10\/01\/2026/)).toBeTruthy();
  });

  test('navigates to team page when team name is clicked', () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    renderWithContext({});
    fireEvent.click(screen.getByText('TEAM_IOTA'));
    expect(navigate).toHaveBeenCalledWith('/teams/2');
  });

  test('does not show ban button when not admin', () => {
    renderWithContext({});
    expect(screen.queryByRole('button', { name: /bannir/i })).toBeNull();
  });

  test('shows ban button when admin', () => {
    renderWithContext({}, true);
    expect(screen.getByRole('button', { name: /bannir/i })).toBeTruthy();
  });

  test('calls setOpenBanModal when ban button is clicked', () => {
    const setOpenBanModal = vi.fn();
    renderWithContext({ setOpenBanModal }, true);
    fireEvent.click(screen.getByRole('button', { name: /bannir/i }));
    expect(setOpenBanModal).toHaveBeenCalledWith(true);
  });

  test('shows banned message and hides ban button when member is banned', () => {
    renderWithContext({ member: { ...member, isBanned: true } }, true);
    expect(
      screen.getByText(/ne fait plus partie de la plateforme/i),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /bannir/i })).toBeNull();
  });

  test('shows ban dialog when openBanModal is true', () => {
    renderWithContext({ openBanModal: true }, true);
    expect(screen.getByText(/confirmer le bannissement/i)).toBeTruthy();
  });

  test('calls setOpenBanModal(false) when dialog is closed', () => {
    const setOpenBanModal = vi.fn();
    renderWithContext({ openBanModal: true, setOpenBanModal }, true);
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(setOpenBanModal).toHaveBeenCalledWith(false);
  });
});
