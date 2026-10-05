import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { ProfileContextType } from '../../../../types';
import ChangeSpecialityDialog from './ChangeSpecialityDialog';

const createMockContext = (
  overrides: Partial<ProfileContextType> = {},
): ProfileContextType => ({
  profile: null,
  specialties: ['Mage', 'Archer', 'Guerrier'],
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
  openSpecialityModal: true,
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

const renderWithContext = (overrides: Partial<ProfileContextType> = {}) =>
  render(
    <ProfileContext.Provider value={createMockContext(overrides)}>
      <ChangeSpecialityDialog />
    </ProfileContext.Provider>,
  );

describe('ChangeSpecialityDialog', () => {
  test('does not render when closed', () => {
    renderWithContext({ openSpecialityModal: false });
    expect(
      screen.queryByRole('heading', { name: /modifier la spécialité/i }),
    ).toBeNull();
  });

  test('renders speciality select when open', () => {
    renderWithContext();
    expect(
      screen.getByRole('heading', { name: /modifier la spécialité/i }),
    ).toBeTruthy();
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  test('shows error message', () => {
    renderWithContext({ specialityError: 'Veuillez choisir une spécialité.' });
    expect(screen.getByText(/veuillez choisir une spécialité/i)).toBeTruthy();
  });

  test('calls setOpenSpecialityModal(false) when annuler is clicked', () => {
    const setOpenSpecialityModal = vi.fn();
    renderWithContext({ setOpenSpecialityModal });
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(setOpenSpecialityModal).toHaveBeenCalledWith(false);
  });

  test('calls handleUpdateSpeciality when confirmer is clicked', () => {
    const handleUpdateSpeciality = vi.fn();
    renderWithContext({ handleUpdateSpeciality });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    expect(handleUpdateSpeciality).toHaveBeenCalledOnce();
  });

  test('calls setNewSpeciality when an option is selected', async () => {
    const setNewSpeciality = vi.fn();
    renderWithContext({ setNewSpeciality });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const option = await waitFor(() =>
      screen.getByRole('option', { name: 'Archer' }),
    );
    fireEvent.click(option);
    expect(setNewSpeciality).toHaveBeenCalledWith('Archer');
  });

  test('calls setOpenSpecialityModal(false) when dialog onClose fires', () => {
    const setOpenSpecialityModal = vi.fn();
    renderWithContext({ setOpenSpecialityModal });
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
    });
    expect(setOpenSpecialityModal).toHaveBeenCalledWith(false);
  });
});
