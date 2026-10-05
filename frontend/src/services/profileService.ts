import { AvatarOption, Profile, Unavailability } from '../types';

const PROFILE_BASE_URL = '/api/users/me';

const createHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: token,
});

const ensureRequestSucceeded = (response: Response, errorMessage?: string) => {
  if (!response.ok) {
    throw new Error(errorMessage ?? `Erreur ${response.status}`);
  }
};

const fetchProfile = async (token: string): Promise<Profile> => {
  const response = await fetch(PROFILE_BASE_URL, {
    method: 'GET',
    headers: createHeaders(token),
  });
  ensureRequestSucceeded(response);
  return response.json() as Promise<Profile>;
};

const fetchUnavailabilities = async (
  token: string,
): Promise<Unavailability[]> => {
  const response = await fetch(`${PROFILE_BASE_URL}/unavailabilities`, {
    headers: createHeaders(token),
  });
  ensureRequestSucceeded(response);
  return response.json() as Promise<Unavailability[]>;
};

const fetchSpecialities = async (): Promise<string[]> => {
  const response = await fetch('/api/specialities');
  ensureRequestSucceeded(response);
  return response.json() as Promise<string[]>;
};

const fetchAvatars = async (): Promise<AvatarOption[]> => {
  const response = await fetch('/api/profile-pictures');
  ensureRequestSucceeded(response);
  const urls: string[] = await response.json();
  return urls.map((url, index) => ({
    id: `avatar-${index + 1}`,
    src: url,
    label: `Avatar ${index + 1}`,
  }));
};

const updatePassword = async (
  token: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  const response = await fetch(`${PROFILE_BASE_URL}/password`, {
    method: 'PATCH',
    headers: createHeaders(token),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  ensureRequestSucceeded(response, 'Ancien mot de passe incorrect.');
};

const addUnavailability = async (
  token: string,
  startDate: string,
  endDate: string,
): Promise<Unavailability> => {
  const response = await fetch(`${PROFILE_BASE_URL}/unavailabilities`, {
    method: 'POST',
    headers: createHeaders(token),
    body: JSON.stringify({ startDate, endDate }),
  });
  ensureRequestSucceeded(response, "Erreur lors de l'ajout.");
  return response.json() as Promise<Unavailability>;
};

const updateSpeciality = async (
  token: string,
  specialityName: string,
): Promise<void> => {
  const response = await fetch(`${PROFILE_BASE_URL}/speciality`, {
    method: 'PATCH',
    headers: createHeaders(token),
    body: JSON.stringify({ specialityName }),
  });
  ensureRequestSucceeded(response, 'Erreur lors de la modification.');
};

const updateProfilePicture = async (
  token: string,
  profilePictureUrl: string,
): Promise<void> => {
  const response = await fetch(`${PROFILE_BASE_URL}/profile-picture`, {
    method: 'PATCH',
    headers: createHeaders(token),
    body: JSON.stringify({ profilePictureUrl }),
  });
  ensureRequestSucceeded(response, 'Erreur lors de la modification.');
};

export {
  fetchProfile,
  fetchUnavailabilities,
  fetchSpecialities,
  fetchAvatars,
  updatePassword,
  addUnavailability,
  updateSpeciality,
  updateProfilePicture,
};
