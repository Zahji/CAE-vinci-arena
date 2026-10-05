import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { UserContext } from '../../../../contexts/UserContext';
import { ProfileContextType, UserContextType } from '../../../../types';
import PrivateInfo from './PrivateInfo';

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
  unavailabilities: [{ id: 1, startDate: '2024-02-01', endDate: '2024-02-05' }],
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

const createMockUserContext = (isAdmin = false): UserContextType => ({
  authenticatedUser: {
    id: 1,
    email: 'user@user.com',
    tag: 'user1',
    token: 'token',
  },
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue({ id: 1, email: 'user@user.com', isAdmin }),
});

const renderWithContext = (
  profileOverrides: Partial<ProfileContextType> = {},
  isAdmin = false,
) =>
  render(
    <UserContext.Provider value={createMockUserContext(isAdmin)}>
      <ProfileContext.Provider
        value={createMockProfileContext(profileOverrides)}
      >
        <PrivateInfo />
      </ProfileContext.Provider>
    </UserContext.Provider>,
  );

describe('PrivateInfo', () => {
  test('renders email, isManager and isAdmin', () => {
    renderWithContext();
    expect(screen.getByText('user@user.com')).toBeTruthy();
    const nonElements = screen.getAllByText('Non');
    expect(nonElements.length).toBeGreaterThanOrEqual(2);
  });

  test('displays "Oui" for isManager when true', () => {
    renderWithContext({
      profile: {
        id: 1,
        email: 'user@user.com',
        tag: 'user1',
        speciality: 'Mage',
        profilePicture: 'url1',
        date: '2024-01-01',
        isManager: true,
        isAdmin: false,
      },
    });
    expect(screen.getByText('Oui')).toBeTruthy();
  });

  test('displays "Oui" for isAdmin when true', () => {
    renderWithContext({}, true);
    expect(screen.getByText('Oui')).toBeTruthy();
  });

  test('displays unavailabilities', () => {
    renderWithContext();
    expect(screen.getByText(/01\/02\/2024 - 05\/02\/2024/)).toBeTruthy();
  });

  test('displays "Aucune indisponibilité" when list is empty', () => {
    renderWithContext({ unavailabilities: [] });
    expect(screen.getByText(/aucune indisponibilité/i)).toBeTruthy();
  });

  test('calls setOpenPasswordModal when modifier is clicked', () => {
    const setOpenPasswordModal = vi.fn();
    renderWithContext({ setOpenPasswordModal });
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }));
    expect(setOpenPasswordModal).toHaveBeenCalledWith(true);
  });

  test('calls setOpenUnavailModal when ajouter is clicked', () => {
    const setOpenUnavailModal = vi.fn();
    renderWithContext({ setOpenUnavailModal });
    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    expect(setOpenUnavailModal).toHaveBeenCalledWith(true);
  });
});
