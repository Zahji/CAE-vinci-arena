import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ProfileContext } from '../../../../contexts/ProfileContext';
import { ProfileContextType } from '../../../../types';
import AddUnavailabilityDialog from './AddUnavailabilityDialog';

const createMockContext = (
  overrides: Partial<ProfileContextType> = {},
): ProfileContextType => ({
  profile: null,
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
  openUnavailModal: true,
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
      <AddUnavailabilityDialog />
    </ProfileContext.Provider>,
  );

describe('AddUnavailabilityDialog', () => {
  test('does not render when closed', () => {
    renderWithContext({ openUnavailModal: false });
    expect(
      screen.queryByRole('heading', { name: /ajouter une indisponibilité/i }),
    ).toBeNull();
  });

  test('renders date fields when open', () => {
    renderWithContext();
    expect(
      screen.getByRole('heading', { name: /ajouter une indisponibilité/i }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/date de début/i)).toBeTruthy();
    expect(screen.getByLabelText(/date de fin/i)).toBeTruthy();
  });

  test('shows error message', () => {
    renderWithContext({ unavailError: 'Veuillez remplir les deux dates.' });
    expect(screen.getByText(/veuillez remplir les deux dates/i)).toBeTruthy();
  });

  test('calls setOpenUnavailModal(false) when annuler is clicked', () => {
    const setOpenUnavailModal = vi.fn();
    renderWithContext({ setOpenUnavailModal });
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(setOpenUnavailModal).toHaveBeenCalledWith(false);
  });

  test('calls handleAddUnavailability when ajouter is clicked', () => {
    const handleAddUnavailability = vi.fn();
    renderWithContext({ handleAddUnavailability });
    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    expect(handleAddUnavailability).toHaveBeenCalledOnce();
  });

  test('calls setStartDate when start date changes', () => {
    const setStartDate = vi.fn();
    renderWithContext({ setStartDate });
    fireEvent.change(screen.getByLabelText(/date de début/i), {
      target: { value: '2024-03-01' },
    });
    expect(setStartDate).toHaveBeenCalledWith('2024-03-01');
  });

  test('calls setEndDate when end date changes', () => {
    const setEndDate = vi.fn();
    renderWithContext({ setEndDate });
    fireEvent.change(screen.getByLabelText(/date de fin/i), {
      target: { value: '2024-03-05' },
    });
    expect(setEndDate).toHaveBeenCalledWith('2024-03-05');
  });

  test('calls setOpenUnavailModal(false) when dialog onClose fires', () => {
    const setOpenUnavailModal = vi.fn();
    renderWithContext({ setOpenUnavailModal });
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
    });
    expect(setOpenUnavailModal).toHaveBeenCalledWith(false);
  });
});
