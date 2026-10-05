import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ProfileContext, ProfileContextProvider } from './ProfileContext';
import { UserContext } from './UserContext';
import { ProfileContextType, UserContextType } from '../types';
import {
  fetchProfile,
  fetchUnavailabilities,
  fetchSpecialities,
  fetchAvatars,
  updatePassword,
  addUnavailability,
  updateSpeciality,
  updateProfilePicture,
} from '../services/profileService';

vi.mock('../services/profileService', () => ({
  fetchProfile: vi.fn(),
  fetchUnavailabilities: vi.fn(),
  fetchSpecialities: vi.fn(),
  fetchAvatars: vi.fn(),
  updatePassword: vi.fn(),
  addUnavailability: vi.fn(),
  updateSpeciality: vi.fn(),
  updateProfilePicture: vi.fn(),
}));

describe('ProfileContext', () => {
  const authenticatedUser = {
    id: 1,
    email: 'user@user.com',
    tag: 'user1',
    token: 'test-token',
  };

  const mockProfile = {
    id: 1,
    email: 'user@user.com',
    tag: 'user1',
    speciality: 'Mage',
    profilePicture: 'url1',
    date: '2024-01-01',
    teamName: 'Team 1',
    isManager: false,
    isAdmin: false,
  };

  let contextValue: ProfileContextType | undefined;

  const ContextConsumer = () => {
    contextValue = useContext(ProfileContext);
    return null;
  };

  const createUserContextValue = (
    user: typeof authenticatedUser | null = authenticatedUser,
  ): UserContextType => ({
    authenticatedUser: user ?? undefined,
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue(
        user ? { id: user.id, email: user.email, isAdmin: false } : null,
      ),
  });

  const renderProfileContext = (userContextValue = createUserContextValue()) =>
    render(
      <UserContext.Provider value={userContextValue}>
        <ProfileContextProvider>
          <ContextConsumer />
        </ProfileContextProvider>
      </UserContext.Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    contextValue = undefined;
    vi.mocked(fetchProfile).mockResolvedValue(mockProfile);
    vi.mocked(fetchUnavailabilities).mockResolvedValue([]);
    vi.mocked(fetchSpecialities).mockResolvedValue(['Mage', 'Archer']);
    vi.mocked(fetchAvatars).mockResolvedValue([
      { id: 'avatar-1', src: 'url1', label: 'Avatar 1' },
    ]);
    vi.mocked(updatePassword).mockResolvedValue(undefined);
    vi.mocked(addUnavailability).mockResolvedValue({
      id: 2,
      startDate: '2030-03-01',
      endDate: '2030-03-05',
    });
    vi.mocked(updateSpeciality).mockResolvedValue(undefined);
    vi.mocked(updateProfilePicture).mockResolvedValue(undefined);
  });

  test('exposes harmless default values without a provider', async () => {
    render(<ContextConsumer />);
    expect(contextValue?.loading).toBe(true);
    expect(contextValue?.error).toBeNull();
    expect(contextValue?.profile).toBeNull();
    expect(contextValue?.unavailabilities).toEqual([]);
    expect(contextValue?.specialties).toEqual([]);
    await expect(
      contextValue?.handlePasswordUpdate() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleAddUnavailability() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleUpdateSpeciality() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    await expect(
      contextValue?.handleUpdatePicture() ?? Promise.resolve(),
    ).resolves.toBeUndefined();
    contextValue?.setOpenPasswordModal(false);
    contextValue?.setOldPassword('');
    contextValue?.setNewPassword('');
    contextValue?.setConfirmPassword('');
    contextValue?.setOpenUnavailModal(false);
    contextValue?.setStartDate('');
    contextValue?.setEndDate('');
    contextValue?.setOpenSpecialityModal(false);
    contextValue?.setNewSpeciality('');
    contextValue?.setOpenPictureModal(false);
    contextValue?.setSelectedAvatarSrc('');
  });

  test('loads profile and initial data on mount', async () => {
    renderProfileContext();
    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.profile).toEqual(mockProfile);
      expect(contextValue?.specialties).toEqual(['Mage', 'Archer']);
    });
    expect(fetchProfile).toHaveBeenCalledWith('test-token');
    expect(fetchUnavailabilities).toHaveBeenCalledWith('test-token');
    expect(fetchSpecialities).toHaveBeenCalled();
    expect(fetchAvatars).toHaveBeenCalled();
  });

  test('does not load data when there is no authenticated user', async () => {
    renderProfileContext(createUserContextValue(null));
    await act(async () => {});
    expect(fetchProfile).not.toHaveBeenCalled();
  });

  test('stores fetchProfile error in context', async () => {
    vi.mocked(fetchProfile).mockRejectedValueOnce(new Error('Erreur 500'));
    renderProfileContext();
    await waitFor(() => {
      expect(contextValue?.loading).toBe(false);
      expect(contextValue?.error).toBe('Erreur 500');
    });
  });

  test('stores unknown fetchProfile error with fallback message', async () => {
    vi.mocked(fetchProfile).mockRejectedValueOnce('unknown error');
    renderProfileContext();
    await waitFor(() => {
      expect(contextValue?.error).toBe('Une erreur inconnue est survenue');
    });
  });

  test('logs error when fetchUnavailabilities fails', async () => {
    vi.mocked(fetchUnavailabilities).mockRejectedValueOnce(
      new Error('unavail error'),
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('logs error when fetchSpecialities fails', async () => {
    vi.mocked(fetchSpecialities).mockRejectedValueOnce(new Error('spec error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('logs error when fetchAvatars fails', async () => {
    vi.mocked(fetchAvatars).mockRejectedValueOnce(new Error('avatar error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('handleUpdateSpeciality keeps profile null when profile was null', async () => {
    vi.mocked(fetchProfile).mockRejectedValueOnce(new Error('error'));
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewSpeciality('Archer');
    });
    await act(async () => {
      await contextValue?.handleUpdateSpeciality();
    });

    expect(contextValue?.profile).toBeNull();
  });

  test('handleUpdatePicture keeps profile null when profile was null', async () => {
    vi.mocked(fetchProfile).mockRejectedValueOnce(new Error('error'));
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setSelectedAvatarSrc('url2');
    });
    await act(async () => {
      await contextValue?.handleUpdatePicture();
    });

    expect(contextValue?.profile).toBeNull();
  });

  // handlePasswordUpdate
  test('handlePasswordUpdate sets error when passwords do not match', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewPassword('abc');
    });
    act(() => {
      contextValue?.setConfirmPassword('xyz');
    });

    await act(async () => {
      await contextValue?.handlePasswordUpdate();
    });

    expect(contextValue?.passwordError).toBe(
      'Les mots de passe ne correspondent pas.',
    );
    expect(updatePassword).not.toHaveBeenCalled();
  });

  test('handlePasswordUpdate sets success and resets fields on success', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setOldPassword('old');
    });
    act(() => {
      contextValue?.setNewPassword('NewPass1');
    });
    act(() => {
      contextValue?.setConfirmPassword('NewPass1');
    });

    await act(async () => {
      await contextValue?.handlePasswordUpdate();
    });

    await waitFor(() => {
      expect(contextValue?.passwordSuccess).toBe(
        'Mot de passe modifié avec succès !',
      );
      expect(contextValue?.oldPassword).toBe('');
      expect(contextValue?.newPassword).toBe('');
      expect(contextValue?.confirmPassword).toBe('');
    });
  });

  test('handlePasswordUpdate stores API error', async () => {
    vi.mocked(updatePassword).mockRejectedValueOnce(
      new Error('Ancien mot de passe incorrect.'),
    );
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewPassword('NewPass1');
    });
    act(() => {
      contextValue?.setConfirmPassword('NewPass1');
    });

    await act(async () => {
      await contextValue?.handlePasswordUpdate();
    });

    await waitFor(() => {
      expect(contextValue?.passwordError).toBe(
        'Ancien mot de passe incorrect.',
      );
    });
  });

  test('handlePasswordUpdate stores unknown error with fallback message', async () => {
    vi.mocked(updatePassword).mockRejectedValueOnce('oops');
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewPassword('NewPass1');
    });
    act(() => {
      contextValue?.setConfirmPassword('NewPass1');
    });

    await act(async () => {
      await contextValue?.handlePasswordUpdate();
    });

    await waitFor(() => {
      expect(contextValue?.passwordError).toBe(
        'Une erreur inconnue est survenue',
      );
    });
  });

  // handleAddUnavailability
  test('handleAddUnavailability sets error when dates are missing', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleAddUnavailability();
    });

    expect(contextValue?.unavailError).toBe('Veuillez remplir les deux dates.');
    expect(addUnavailability).not.toHaveBeenCalled();
  });

  test('handleAddUnavailability sets error when end date is before start date', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStartDate('2024-05-10');
    });
    act(() => {
      contextValue?.setEndDate('2024-05-01');
    });

    await act(async () => {
      await contextValue?.handleAddUnavailability();
    });

    expect(contextValue?.unavailError).toBe(
      'La date de fin doit être après la date de début.',
    );
  });

  test('handleAddUnavailability adds unavailability and closes modal on success', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStartDate('2030-03-01');
      contextValue?.setEndDate('2030-03-05');
      contextValue?.setOpenUnavailModal(true);
    });

    await act(async () => {
      await contextValue?.handleAddUnavailability();
    });

    await waitFor(() => {
      expect(contextValue?.unavailabilities).toContainEqual({
        id: 2,
        startDate: '2030-03-01',
        endDate: '2030-03-05',
      });
      expect(contextValue?.openUnavailModal).toBe(false);
    });
  });

  test('handleAddUnavailability stores API error', async () => {
    vi.mocked(addUnavailability).mockRejectedValueOnce(
      new Error("Erreur lors de l'ajout."),
    );
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStartDate('2030-03-01');
      contextValue?.setEndDate('2030-03-05');
    });

    await act(async () => {
      await contextValue?.handleAddUnavailability();
    });

    await waitFor(() => {
      expect(contextValue?.unavailError).toBe("Erreur lors de l'ajout.");
    });
  });

  test('handleAddUnavailability stores unknown error with fallback message', async () => {
    vi.mocked(addUnavailability).mockRejectedValueOnce('oops');
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStartDate('2030-03-01');
      contextValue?.setEndDate('2030-03-05');
    });

    await act(async () => {
      await contextValue?.handleAddUnavailability();
    });

    await waitFor(() => {
      expect(contextValue?.unavailError).toBe(
        'Une erreur inconnue est survenue',
      );
    });
  });

  test('handlePasswordUpdate sets error when password does not meet policy', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewPassword('weak');
      contextValue?.setConfirmPassword('weak');
    });

    await act(async () => {
      await contextValue?.handlePasswordUpdate();
    });

    expect(contextValue?.passwordError).toBe(
      'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre.',
    );
    expect(updatePassword).not.toHaveBeenCalled();
  });

  test('handleAddUnavailability sets error when dates are in the past', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setStartDate('2020-01-01');
      contextValue?.setEndDate('2020-01-05');
    });

    await act(async () => {
      await contextValue?.handleAddUnavailability();
    });

    expect(contextValue?.unavailError).toBe(
      'Les dates ne peuvent pas être dans le passé.',
    );
    expect(addUnavailability).not.toHaveBeenCalled();
  });

  // handleUpdateSpeciality
  test('handleUpdateSpeciality sets error when no speciality is selected', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleUpdateSpeciality();
    });

    expect(contextValue?.specialityError).toBe(
      'Veuillez choisir une spécialité.',
    );
    expect(updateSpeciality).not.toHaveBeenCalled();
  });

  test('handleUpdateSpeciality updates profile and closes modal on success', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewSpeciality('Archer');
      contextValue?.setOpenSpecialityModal(true);
    });

    await act(async () => {
      await contextValue?.handleUpdateSpeciality();
    });

    await waitFor(() => {
      expect(contextValue?.profile?.speciality).toBe('Archer');
      expect(contextValue?.openSpecialityModal).toBe(false);
    });
  });

  test('handleUpdateSpeciality stores API error', async () => {
    vi.mocked(updateSpeciality).mockRejectedValueOnce(
      new Error('Erreur lors de la modification.'),
    );
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setNewSpeciality('Archer');
    });

    await act(async () => {
      await contextValue?.handleUpdateSpeciality();
    });

    await waitFor(() => {
      expect(contextValue?.specialityError).toBe(
        'Erreur lors de la modification.',
      );
    });
  });

  // handleUpdatePicture
  test('handleUpdatePicture sets error when no avatar is selected', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    await act(async () => {
      await contextValue?.handleUpdatePicture();
    });

    expect(contextValue?.pictureError).toBe('Veuillez choisir une photo.');
    expect(updateProfilePicture).not.toHaveBeenCalled();
  });

  test('handleUpdatePicture updates profile picture and closes modal on success', async () => {
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setSelectedAvatarSrc('url2');
      contextValue?.setOpenPictureModal(true);
    });

    await act(async () => {
      await contextValue?.handleUpdatePicture();
    });

    await waitFor(() => {
      expect(contextValue?.profile?.profilePicture).toBe('url2');
      expect(contextValue?.openPictureModal).toBe(false);
    });
  });

  test('handleUpdatePicture stores API error', async () => {
    vi.mocked(updateProfilePicture).mockRejectedValueOnce(
      new Error('Erreur lors de la modification.'),
    );
    renderProfileContext();
    await waitFor(() => expect(contextValue?.loading).toBe(false));

    act(() => {
      contextValue?.setSelectedAvatarSrc('url2');
    });

    await act(async () => {
      await contextValue?.handleUpdatePicture();
    });

    await waitFor(() => {
      expect(contextValue?.pictureError).toBe(
        'Erreur lors de la modification.',
      );
    });
  });
});
