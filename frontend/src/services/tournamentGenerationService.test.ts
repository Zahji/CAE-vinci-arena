import { describe, expect, test } from 'vitest';
import {
  addTournamentId,
  applyGenerationResultLock,
  buildLockedIdsFromChecks,
  isGenerationBlocked,
  removeTournamentId,
} from './tournamentGenerationService';

describe('tournamentGenerationService', () => {
  test('addTournamentId returns a new set with the tournament id', () => {
    const original = new Set([1, 2]);

    const result = addTournamentId(original, 3);

    expect(Array.from(result).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(Array.from(original).sort((a, b) => a - b)).toEqual([1, 2]);
  });

  test('removeTournamentId returns a new set without the tournament id', () => {
    const original = new Set([1, 2, 3]);

    const result = removeTournamentId(original, 2);

    expect(Array.from(result).sort((a, b) => a - b)).toEqual([1, 3]);
    expect(Array.from(original).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  test('isGenerationBlocked returns true when id is in any lock set', () => {
    expect(isGenerationBlocked(7, new Set([7]), new Set(), new Set())).toBe(
      true,
    );
    expect(isGenerationBlocked(7, new Set(), new Set([7]), new Set())).toBe(
      true,
    );
    expect(isGenerationBlocked(7, new Set(), new Set(), new Set([7]))).toBe(
      true,
    );
    expect(isGenerationBlocked(7, new Set(), new Set(), new Set())).toBe(false);
  });

  test('applyGenerationResultLock adds and removes ids depending on lock state', () => {
    const base = new Set([1]);

    const locked = applyGenerationResultLock(base, 2, true);
    const unlocked = applyGenerationResultLock(locked, 2, false);

    expect(Array.from(locked).sort((a, b) => a - b)).toEqual([1, 2]);
    expect(Array.from(unlocked).sort((a, b) => a - b)).toEqual([1]);
  });

  test('buildLockedIdsFromChecks merges checked and pending locked ids', () => {
    const checked = [1, null, 4, null, 9];
    const pending = new Set([2, 9]);

    const result = buildLockedIdsFromChecks(checked, pending);

    expect(Array.from(result).sort((a, b) => a - b)).toEqual([1, 2, 4, 9]);
  });
});
