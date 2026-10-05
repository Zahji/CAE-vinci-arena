import { SelectionMatch } from '../types';
import { createHeaders, ensureRequestSucceeded } from './apiUtils';

/**
 * Builds the base URL for selection endpoints.
 * @param {number} tournamentId - the tournament ID
 * @param {number} matchId - the match ID
 * @param {number} teamId - the team ID
 * @return {string} the URL
 */
const selectionUrl = (tournamentId: number, matchId: number, teamId: number) =>
  `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}/selections`;

/**
 * Fetches all selected members for a match and team.
 * @param {number} tournamentId - the tournament ID
 * @param {number} matchId - the match ID
 * @param {number} teamId - the team ID
 * @param {string} token - the auth token
 * @return {Promise<SelectionMatch[]>} the list of selections
 */
const fetchSelections = async (
  tournamentId: number,
  matchId: number,
  teamId: number,
  token: string,
): Promise<SelectionMatch[]> => {
  const response = await fetch(selectionUrl(tournamentId, matchId, teamId), {
    method: 'GET',
    headers: createHeaders(token),
  });

  ensureRequestSucceeded(response);

  return response.json() as Promise<SelectionMatch[]>;
};

/**
 * Adds a member to the selection for a match.
 * @param {number} tournamentId - the tournament ID
 * @param {number} matchId - the match ID
 * @param {number} teamId - the team ID
 * @param {number} memberId - the member ID to add
 * @param {string} token - the auth token
 * @return {Promise<SelectionMatch>} the created selection
 */
const addSelection = async (
  tournamentId: number,
  matchId: number,
  teamId: number,
  memberId: number,
  token: string,
): Promise<SelectionMatch> => {
  const response = await fetch(selectionUrl(tournamentId, matchId, teamId), {
    method: 'POST',
    headers: createHeaders(token),
    body: JSON.stringify({ memberId }),
  });

  ensureRequestSucceeded(
    response,
    undefined,
    'Ce membre est déjà sélectionné pour un match au même horaire.',
  );

  return response.json() as Promise<SelectionMatch>;
};

/**
 * Removes a member from the selection for a match.
 * @param {number} tournamentId - the tournament ID
 * @param {number} matchId - the match ID
 * @param {number} teamId - the team ID
 * @param {number} memberId - the member ID to remove
 * @param {string} token - the auth token
 * @return {Promise<void>}
 */
const removeSelection = async (
  tournamentId: number,
  matchId: number,
  teamId: number,
  memberId: number,
  token: string,
): Promise<void> => {
  const response = await fetch(
    `${selectionUrl(tournamentId, matchId, teamId)}/${memberId}`,
    {
      method: 'DELETE',
      headers: createHeaders(token),
    },
  );

  ensureRequestSucceeded(response);
};

export { fetchSelections, addSelection, removeSelection };
