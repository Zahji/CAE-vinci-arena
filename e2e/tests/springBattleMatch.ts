/**
 * Spring Battle Series 2026 seed uses TEAM_DELTA vs TEAM_IOTA as the primary match
 * (often ONGOING). Prefer ONGOING; fall back to the same pairing in another state
 * so specs do not crash when the match was already encoded in a previous run.
 */
type TeamNames = {
  team1Name?: string;
  team2Name?: string;
};

const isDeltaVsIota = (m: TeamNames): boolean =>
  [m.team1Name, m.team2Name].includes('TEAM_DELTA')
  && [m.team1Name, m.team2Name].includes('TEAM_IOTA');

const findDeltaIotaMatch = <
  T extends TeamNames & { state: string; matchId: number },
>(
  matches: T[],
): T | undefined =>
  matches.find((m) => m.state === 'ONGOING' && isDeltaVsIota(m))
  ?? matches.find((m) => isDeltaVsIota(m));

/** Only ONGOING — for encode button and locked public panels. */
const findOngoingDeltaIotaMatch = <
  T extends TeamNames & { state: string; matchId: number },
>(
  matches: T[],
): T | undefined => matches.find((m) => m.state === 'ONGOING' && isDeltaVsIota(m));

export { findDeltaIotaMatch, findOngoingDeltaIotaMatch, isDeltaVsIota };
