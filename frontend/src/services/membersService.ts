import { Unavailability, UserPublicProfile } from '../types';
import { createHeaders, ensureRequestSucceeded } from './apiUtils';

const MEMBRES_BASE_URL = '/api/users';

/**
 * Fetches all members (public profiles).
 * @return {Promise<UserPublicProfile[]>} the list of members
 */
const fetchAllMembers = async (): Promise<UserPublicProfile[]> => {
  const response = await fetch(MEMBRES_BASE_URL, {
    method: 'GET',
  });

  ensureRequestSucceeded(response);

  const members: UserPublicProfile[] | null = await response.json();
  return members ?? [];
};

/**
 * Fetches a member's public profile by ID.
 * @param {number} id - the member ID
 * @return {Promise<UserPublicProfile>} the member profile
 */
const fetchMemberById = async (id: number): Promise<UserPublicProfile> => {
  const response = await fetch(`${MEMBRES_BASE_URL}/${id}`, {
    method: 'GET',
  });

  ensureRequestSucceeded(response);

  return response.json() as Promise<UserPublicProfile>;
};

/**
 * Bans a member by ID.
 * @param {string} token - the auth token
 * @param {number} id - the member ID
 * @return {Promise<void>}
 */
const banMember = async (token: string, id: number): Promise<void> => {
  const response = await fetch(`${MEMBRES_BASE_URL}/${id}/ban`, {
    method: 'PATCH',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);
};

/**
 * Fetches the unavailabilities of a member.
 * @param {number} id - the member ID
 * @param {string} token - the auth token
 * @return {Promise<Unavailability[]>} the list of unavailabilities
 */
const fetchMemberUnavailabilities = async (
  id: number,
  token: string,
): Promise<Unavailability[]> => {
  const response = await fetch(`${MEMBRES_BASE_URL}/${id}/unavailabilities`, {
    method: 'GET',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  const result: Unavailability[] | null = await response.json();
  return result ?? [];
};

export {
  fetchAllMembers,
  fetchMemberById,
  banMember,
  fetchMemberUnavailabilities,
};
