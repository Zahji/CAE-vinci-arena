const addTournamentId = (
  ids: Set<number>,
  tournamentId: number,
): Set<number> => {
  const next = new Set(ids);
  next.add(tournamentId);
  return next;
};

const removeTournamentId = (
  ids: Set<number>,
  tournamentId: number,
): Set<number> => {
  const next = new Set(ids);
  next.delete(tournamentId);
  return next;
};

const isGenerationBlocked = (
  tournamentId: number,
  immediateLockedIds: Set<number>,
  lockedIds: Set<number>,
  pendingIds: Set<number>,
): boolean => {
  return (
    immediateLockedIds.has(tournamentId) ||
    lockedIds.has(tournamentId) ||
    pendingIds.has(tournamentId)
  );
};

const applyGenerationResultLock = (
  ids: Set<number>,
  tournamentId: number,
  isNowLocked: boolean,
): Set<number> => {
  return isNowLocked
    ? addTournamentId(ids, tournamentId)
    : removeTournamentId(ids, tournamentId);
};

const buildLockedIdsFromChecks = (
  checkedLockedIds: Array<number | null>,
  pendingIds: Set<number>,
): Set<number> => {
  const lockedIds = new Set(
    checkedLockedIds.filter((id): id is number => id !== null),
  );

  pendingIds.forEach((id) => {
    lockedIds.add(id);
  });

  return lockedIds;
};

export {
  addTournamentId,
  removeTournamentId,
  isGenerationBlocked,
  applyGenerationResultLock,
  buildLockedIdsFromChecks,
};
