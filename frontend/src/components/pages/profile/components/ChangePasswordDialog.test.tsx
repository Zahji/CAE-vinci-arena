import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { ProfileContextType } from '../../../../types';
import ChangePasswordDialog from './ChangePasswordDialog';

const createMockContext = (
  overrides: Partial<ProfileContextType> = {},
): ProfileContextType => ({
  profile: null,
  specialties: [],
  unavailabilities: [],
  avatarOptions: [],
  loading: false,
  error: null,
  openPasswordModal: true,
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

const renderWithContext = (overrides: Partial<ProfileContextType> = {}) =>
  render(
    <ProfileContext.Provider value={createMockContext(overrides)}>
      <ChangePasswordDialog />
    </ProfileContext.Provider>,
  );

describe('ChangePasswordDialog', () => {
  test('does not render when closed', () => {
    renderWithContext({ openPasswordModal: false });
    expect(
      screen.queryByRole('heading', { name: /modifier le mot de passe/i }),
    ).toBeNull();
  });

  test('renders fields when open', () => {
    renderWithContext();
    expect(
      screen.getByRole('heading', { name: /modifier le mot de passe/i }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/ancien mot de passe/i)).toBeTruthy();
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeTruthy();
    expect(screen.getByLabelText(/confirmer/i)).toBeTruthy();
  });

  test('shows error message', () => {
    renderWithContext({
      passwordError: 'Les mots de passe ne correspondent pas.',
    });
    expect(
      screen.getByText(/les mots de passe ne correspondent pas/i),
    ).toBeTruthy();
  });

  test('shows success message', () => {
    renderWithContext({
      passwordSuccess: 'Mot de passe modifié avec succès !',
    });
    expect(screen.getByText(/mot de passe modifié avec succès/i)).toBeTruthy();
  });

  test('calls setOpenPasswordModal(false) when annuler is clicked', () => {
    const setOpenPasswordModal = vi.fn();
    renderWithContext({ setOpenPasswordModal });
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(setOpenPasswordModal).toHaveBeenCalledWith(false);
  });

  test('calls handlePasswordUpdate when confirmer is clicked', () => {
    const handlePasswordUpdate = vi.fn();
    renderWithContext({ handlePasswordUpdate });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    expect(handlePasswordUpdate).toHaveBeenCalledOnce();
  });

  test('calls setOldPassword when typing in old password field', () => {
    const setOldPassword = vi.fn();
    renderWithContext({ setOldPassword });
    fireEvent.change(screen.getByLabelText(/ancien mot de passe/i), {
      target: { value: 'secret' },
    });
    expect(setOldPassword).toHaveBeenCalledWith('secret');
  });

  test('calls setNewPassword when typing in new password field', () => {
    const setNewPassword = vi.fn();
    renderWithContext({ setNewPassword });
    fireEvent.change(screen.getByLabelText(/nouveau mot de passe/i), {
      target: { value: 'newpass' },
    });
    expect(setNewPassword).toHaveBeenCalledWith('newpass');
  });

  test('calls setConfirmPassword when typing in confirm field', () => {
    const setConfirmPassword = vi.fn();
    renderWithContext({ setConfirmPassword });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { value: 'newpass' },
    });
    expect(setConfirmPassword).toHaveBeenCalledWith('newpass');
  });

  test('calls setOpenPasswordModal(false) when dialog onClose fires', () => {
    const setOpenPasswordModal = vi.fn();
    renderWithContext({ setOpenPasswordModal });
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
    });
    expect(setOpenPasswordModal).toHaveBeenCalledWith(false);
  });
});
