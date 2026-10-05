import { AuthenticatedUser, UserProfile } from '../types';

const ADMINISTRATION_BASE_URL = '/api/administrators';
const SELF_DEMOTION_ERROR =
  'Vous ne pouvez pas vous rétrograder si vous êtes le seul administrateur';

const createHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: token,
});

const ensureRequestSucceeded = (
  response: Response,
  forbiddenMessage?: string,
) => {
  if (response.ok) {
    return;
  }

  if (response.status === 403 && forbiddenMessage) {
    throw new Error(forbiddenMessage);
  }

  throw new Error(`Erreur ${response.status}`);
};

const fetchAdministrators = async (token: string): Promise<UserProfile[]> => {
  const response = await fetch(`${ADMINISTRATION_BASE_URL}/`, {
    method: 'GET',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  const administrationList: UserProfile[] | null = await response.json();
  return administrationList ?? [];
};

const fetchNonAdmins = async (token: string): Promise<UserProfile[]> => {
  const response = await fetch(`${ADMINISTRATION_BASE_URL}/non-admins`, {
    method: 'GET',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  const nonAdmins: UserProfile[] | null = await response.json();
  return nonAdmins ?? [];
};

const promoteAdministrator = async (
  token: string,
  userId: number,
): Promise<void> => {
  const response = await fetch(`${ADMINISTRATION_BASE_URL}/${userId}`, {
    method: 'POST',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);
};

const demoteAdministrator = async (
  token: string,
  userId: number,
): Promise<void> => {
  const response = await fetch(`${ADMINISTRATION_BASE_URL}/${userId}`, {
    method: 'DELETE',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response, SELF_DEMOTION_ERROR);
};

const refreshToken = async (token: string): Promise<AuthenticatedUser> => {
  const response = await fetch('/api/auths/refresh', {
    method: 'GET',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  return response.json() as Promise<AuthenticatedUser>;
};

export {
  fetchAdministrators,
  fetchNonAdmins,
  promoteAdministrator,
  demoteAdministrator,
  refreshToken,
};
