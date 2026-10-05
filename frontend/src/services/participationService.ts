export const updateScore = async (
  token: string,
  tournamentId: number,
  matchId: number,
  teamId: number,
  score: number,
): Promise<void> => {
  const response = await fetch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}/score?score=${score}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}`);
  }
};

export const contestScore = async (
  token: string,
  tournamentId: number,
  matchId: number,
  teamId: number,
  reason: string,
): Promise<void> => {
  const response = await fetch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}/contest?reason=${encodeURIComponent(reason)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}`);
  }
};

export const declareForfeit = async (
  token: string,
  tournamentId: number,
  matchId: number,
  teamId: number,
): Promise<void> => {
  const response = await fetch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/participations/${teamId}/forfeit?forfeit=true`,
    {
      method: 'PATCH',
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}`);
  }
};
