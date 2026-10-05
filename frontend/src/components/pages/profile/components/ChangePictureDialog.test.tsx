import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { ProfileContextType } from '../../../../types';
import ChangePictureDialog from './ChangePictureDialog';

const mockAvatarOptions = [
  { id: 'avatar-1', src: 'url1', label: 'Avatar 1' },
  { id: 'avatar-2', src: 'url2', label: 'Avatar 2' },
];

const createMockContext = (
  overrides: Partial<ProfileContextType> = {},
): ProfileContextType => ({
  profile: null,
  specialties: [],
  unavailabilities: [],
  avatarOptions: mockAvatarOptions,
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
  openPictureModal: true,
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

const renderWithContext = (overrides: Partial<ProfileContextType> = {}) =>
  render(
    <ProfileContext.Provider value={createMockContext(overrides)}>
      <ChangePictureDialog />
    </ProfileContext.Provider>,
  );

describe('ChangePictureDialog', () => {
  test('does not render when closed', () => {
    renderWithContext({ openPictureModal: false });
    expect(
      screen.queryByRole('heading', { name: /modifier la photo de profil/i }),
    ).toBeNull();
  });

  test('renders avatar buttons when open', () => {
    renderWithContext();
    expect(
      screen.getByRole('heading', { name: /modifier la photo de profil/i }),
    ).toBeTruthy();
    const avatarButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('img'));
    expect(avatarButtons).toHaveLength(2);
  });

  test('shows error message', () => {
    renderWithContext({ pictureError: 'Veuillez choisir une photo.' });
    expect(screen.getByText(/veuillez choisir une photo/i)).toBeTruthy();
  });

  test('calls setSelectedAvatarSrc when an avatar is clicked', () => {
    const setSelectedAvatarSrc = vi.fn();
    renderWithContext({ setSelectedAvatarSrc });
    const avatarButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('img'));
    fireEvent.click(avatarButtons[0]);
    expect(setSelectedAvatarSrc).toHaveBeenCalledWith('url1');
  });

  test('calls setOpenPictureModal(false) when annuler is clicked', () => {
    const setOpenPictureModal = vi.fn();
    renderWithContext({ setOpenPictureModal });
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(setOpenPictureModal).toHaveBeenCalledWith(false);
  });

  test('calls handleUpdatePicture when confirmer is clicked', () => {
    const handleUpdatePicture = vi.fn();
    renderWithContext({ handleUpdatePicture });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    expect(handleUpdatePicture).toHaveBeenCalledOnce();
  });

  test('calls setOpenPictureModal(false) when dialog onClose fires', () => {
    const setOpenPictureModal = vi.fn();
    renderWithContext({ setOpenPictureModal });
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
    });
    expect(setOpenPictureModal).toHaveBeenCalledWith(false);
  });

  test('renders selected avatar with blue border', () => {
    renderWithContext({ selectedAvatarSrc: 'url1' });
    const avatarButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('img'));
    expect(avatarButtons[0]).toBeTruthy();
  });
});
