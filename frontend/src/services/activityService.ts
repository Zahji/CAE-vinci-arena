import { TeamActivity } from '../types';

export interface MembershipHistory {
  teamId: number;
  teamName: string;
  leftAt: string;
}

export interface MemberActivityData {
  tournamentId: number;
  tournamentName: string;
  round: number;
  totalRounds: number;
  matchId: number;
  selectedTeamId: number;
  team1Id: number | null;
  team1Name: string | null;
  team2Id: number | null;
  team2Name: string | null;
  winnerTeamId: number | null;
  state: 'PLANIFIED' | 'ONGOING' | 'ENDED' | 'CONTESTED';
}

const createHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: token,
});

const ensureRequestSucceeded = (response: Response) => {
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}`);
  }
};

const fetchTeamActivity = async (
  teamId: number,
  token: string,
): Promise<TeamActivity[]> => {
  const response = await fetch(`/api/teams/${teamId}/activity`, {
    method: 'GET',
    headers: createHeaders(token),
  });
  ensureRequestSucceeded(response);
  return response.json() as Promise<TeamActivity[]>;
};

const fetchPastTeams = async (
  userId: number,
  token: string,
): Promise<MembershipHistory[]> => {
  const response = await fetch(`/api/users/${userId}/past-teams`, {
    method: 'GET',
    headers: createHeaders(token),
  });
  ensureRequestSucceeded(response);
  return response.json() as Promise<MembershipHistory[]>;
};

const fetchMemberActivity = async (
  userId: number,
  token?: string,
): Promise<MemberActivityData[]> => {
  const headers = token
    ? createHeaders(token)
    : { 'Content-Type': 'application/json' };
  const response = await fetch(`/api/users/${userId}/member-activity`, {
    method: 'GET',
    headers,
  });
  ensureRequestSucceeded(response);
  return response.json() as Promise<MemberActivityData[]>;
};

export { fetchTeamActivity, fetchPastTeams, fetchMemberActivity };
