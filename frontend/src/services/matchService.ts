import { Match, ParticipationMatch } from '../types';
import { createHeaders, ensureRequestSucceeded } from './apiUtils';

const fetchMatch = async (
  tournamentId: number,
  matchId: number,
  token: string,
): Promise<Match> => {
  const response = await fetch(
    `/api/tournaments/${tournamentId}/matches/${matchId}`,
    {
      method: 'GET',
      headers: createHeaders(token),
    },
  );

  ensureRequestSucceeded(response);

  return response.json() as Promise<Match>;
};

const fetchParticipation = async (
  tournamentId: number,
  matchId: number,
  teamId: number,
  token: string,
): Promise<ParticipationMatch> => {
  const response = await fetch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}`,
    {
      method: 'GET',
      headers: createHeaders(token),
    },
  );

  ensureRequestSucceeded(response);

  return response.json() as Promise<ParticipationMatch>;
};

export { fetchMatch, fetchParticipation };
