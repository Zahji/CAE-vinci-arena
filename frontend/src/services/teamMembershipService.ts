import { TeamMembership } from '../types';
import { createHeaders, ensureRequestSucceeded } from './apiUtils';

const MEMBERSHIPS_BASE_URL = '/api/teams/memberships';

/**
 * Fetches the current user's team membership.
 * Returns null if the user has no membership.
 * @param {string} token - the auth token
 * @return {Promise<TeamMembership | null>} the membership or null
 */
const fetchCurrentMembership = async (
  token: string,
): Promise<TeamMembership | null> => {
  const response = await fetch(`${MEMBERSHIPS_BASE_URL}/me`, {
    method: 'GET',
    headers: createHeaders(token),
  });

  if (response.status === 204) {
    return null;
  }

  ensureRequestSucceeded(response);

  return response.json() as Promise<TeamMembership>;
};

/**
 * Fetches all members of a team.
 * @param {number} teamId - the team ID
 * @param {string} token - the auth token
 * @return {Promise<TeamMembership[]>} the list of memberships
 */
const fetchTeamMembers = async (
  teamId: number,
  token: string,
): Promise<TeamMembership[]> => {
  const response = await fetch(`${MEMBERSHIPS_BASE_URL}/${teamId}/members`, {
    method: 'GET',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  const members: TeamMembership[] | null = await response.json();
  return members ?? [];
};

/**
 * Sends a join request to a team.
 * @param {string} token - the auth token
 * @param {number} teamId - the team ID
 * @return {Promise<void>}
 */
const joinTeam = async (token: string, teamId: number): Promise<void> => {
  const response = await fetch(`${MEMBERSHIPS_BASE_URL}/${teamId}/membership`, {
    method: 'POST',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(
    response,
    undefined,
    'Impossible de rejoindre la team :\n un membre possède déjà le même tag',
  );
};

/**
 * Excludes a member from a team by their membership ID.
 * @param {string} token - the auth token
 * @param {number} membershipId - the membership ID
 * @return {Promise<void>}
 */
const excludeMember = async (
  token: string,
  membershipId: number,
): Promise<void> => {
  const response = await fetch(`${MEMBERSHIPS_BASE_URL}/${membershipId}`, {
    method: 'DELETE',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);
};

export { fetchCurrentMembership, fetchTeamMembers, joinTeam, excludeMember };
