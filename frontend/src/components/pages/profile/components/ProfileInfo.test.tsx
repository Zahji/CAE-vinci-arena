import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { UserContext } from '../../../../contexts/UserContext';
import { ProfileContextType, UserContextType } from '../../../../types';
import ProfileInfo from './ProfileInfo';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

const createMockProfileContext = (
  overrides: Partial<ProfileContextType> = {},
): ProfileContextType => ({
  profile: {
    id: 1,
    email: 'user@user.com',
    tag: 'user1',
    speciality: 'Mage',
    profilePicture: 'url1',
    date: '2024-01-01',
    teamName: 'Team 1',
    isManager: false,
    isAdmin: false,
  },
  specialties: [],
  unavailabilities: [],
  avatarOptions: [],
  loading: false,
  error: null,
  openPasswordModal: false,
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  passwordError: '',
  passwordSuccess: '',
  openUnavailModal: false,
  startDate: '',
  endDate: '',
  unavailError: '',
  openSpecialityModal: false,
  newSpeciality: '',
  specialityError: '',
  openPictureModal: false,
  selectedAvatarSrc: '',
  pictureError: '',
  setOpenPasswordModal: vi.fn(),
  setOldPassword: vi.fn(),
  setNewPassword: vi.fn(),
  setConfirmPassword: vi.fn(),
  handlePasswordUpdate: vi.fn(),
  setOpenUnavailModal: vi.fn(),
  setStartDate: vi.fn(),
  setEndDate: vi.fn(),
  handleAddUnavailability: vi.fn(),
  setOpenSpecialityModal: vi.fn(),
  setNewSpeciality: vi.fn(),
  handleUpdateSpeciality: vi.fn(),
  setOpenPictureModal: vi.fn(),
  setSelectedAvatarSrc: vi.fn(),
  handleUpdatePicture: vi.fn(),
  ...overrides,
});

const createMockUserContext = (teamId?: number): UserContextType => ({
  authenticatedUser: {
    id: 1,
    email: 'user@user.com',
    tag: 'user1',
    token: 'test-token',
    teamId,
  },
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi
    .fn()
    .mockReturnValue({ id: 1, email: 'user@user.com', isAdmin: false }),
});

const renderWithContext = (
  profileOverrides: Partial<ProfileContextType> = {},
  teamId?: number,
) =>
  render(
    <MemoryRouter>
      <UserContext.Provider value={createMockUserContext(teamId)}>
        <ProfileContext.Provider
          value={createMockProfileContext(profileOverrides)}
        >
          <ProfileInfo />
        </ProfileContext.Provider>
      </UserContext.Provider>
    </MemoryRouter>,
  );

describe('ProfileInfo', () => {
  test('renders tag, speciality, team and formatted date', () => {
    renderWithContext({}, 1);
    expect(screen.getByText('user1')).toBeTruthy();
    expect(screen.getByText('Mage')).toBeTruthy();
    expect(screen.getByText('Team 1')).toBeTruthy();
    expect(screen.getByText('01/01/2024')).toBeTruthy();
  });

  test('displays "Aucune team" when teamName is null', () => {
    renderWithContext({
      profile: {
        id: 1,
        email: 'user@user.com',
        tag: 'user1',
        speciality: 'Mage',
        profilePicture: 'url1',
        date: '2024-01-01',
        teamName: undefined,
        isManager: false,
        isAdmin: false,
      },
    });
    expect(screen.getByText('Aucune team')).toBeTruthy();
  });

  test('displays "Aucune photo" when profilePicture is empty', () => {
    renderWithContext({
      profile: {
        id: 1,
        email: 'user@user.com',
        tag: 'user1',
        speciality: 'Mage',
        profilePicture: '',
        date: '2024-01-01',
        isManager: false,
        isAdmin: false,
      },
    });
    expect(screen.getByText('Aucune photo')).toBeTruthy();
  });

  test('calls setOpenSpecialityModal when speciality modifier is clicked', () => {
    const setOpenSpecialityModal = vi.fn();
    renderWithContext({ setOpenSpecialityModal });
    const buttons = screen.getAllByRole('button', { name: /modifier/i });
    fireEvent.click(buttons[0]);
    expect(setOpenSpecialityModal).toHaveBeenCalledWith(true);
  });

  test('calls setOpenPictureModal when photo modifier is clicked', () => {
    const setOpenPictureModal = vi.fn();
    renderWithContext({ setOpenPictureModal });
    const buttons = screen.getAllByRole('button', { name: /modifier/i });
    fireEvent.click(buttons[1]);
    expect(setOpenPictureModal).toHaveBeenCalledWith(true);
  });

  test('displays "—" when date is empty', () => {
    renderWithContext({
      profile: {
        id: 1,
        email: 'user@user.com',
        tag: 'user1',
        speciality: 'Mage',
        profilePicture: 'url1',
        date: '',
        isManager: false,
        isAdmin: false,
      },
    });
    expect(screen.getByText('—')).toBeTruthy();
  });

  test('navigates to team page when team name is clicked', () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    renderWithContext({}, 1);
    fireEvent.click(screen.getByText('Team 1'));
    expect(navigate).toHaveBeenCalledWith('/teams/1');
  });
});
