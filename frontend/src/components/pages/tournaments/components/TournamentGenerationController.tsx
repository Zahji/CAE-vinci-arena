import { useEffect, useRef, useState } from 'react';
import { Tournament } from '../../../../types';
import { hasGeneratedMatches } from '../../../../services/tournamentService';
import {
  addTournamentId,
  applyGenerationResultLock,
  buildLockedIdsFromChecks,
  isGenerationBlocked,
  removeTournamentId,
} from '../../../../services/tournamentGenerationService';
import TournamentTable from './TournamentTable';

type TournamentGenerationControllerProps = {
  tournamentList: Tournament[];
  isAdmin: boolean;
  today?: string;
  onPublishTournament?: (
    tournamentId: number,
    payload: import('../../../../types').PublishTournamentPayload,
  ) => Promise<void>;
  isPublishing?: boolean;
  onEditTournament?: (
    tournament: Tournament,
    payload: import('../../../../types').CreateTournamentPayload,
  ) => Promise<void>;
  isEditing?: boolean;
  handleGenerateSchedule: (tournamentId: number) => Promise<void>;
  isGenerating?: boolean;
  registeredTournamentIds: Set<number>;
  participatedTournamentIds?: Set<number>;
};

const TournamentGenerationController = ({
  tournamentList,
  isAdmin,
  today,
  onPublishTournament,
  isPublishing = false,
  onEditTournament,
  isEditing = false,
  handleGenerateSchedule,
  isGenerating = false,
  registeredTournamentIds,
  participatedTournamentIds,
}: TournamentGenerationControllerProps) => {
  const [lockedTournamentIds, setLockedTournamentIds] = useState<Set<number>>(
    new Set(),
  );
  const [pendingGenerationIds, setPendingGenerationIds] = useState<Set<number>>(
    new Set(),
  );
  const immediateLockedIdsRef = useRef<Set<number>>(new Set());

  const handleGenerateScheduleOnce = async (tournamentId: number) => {
    if (
      isGenerationBlocked(
        tournamentId,
        immediateLockedIdsRef.current,
        lockedTournamentIds,
        pendingGenerationIds,
      )
    ) {
      return;
    }

    immediateLockedIdsRef.current.add(tournamentId);

    setPendingGenerationIds((previous) =>
      addTournamentId(previous, tournamentId),
    );

    setLockedTournamentIds((previous) =>
      addTournamentId(previous, tournamentId),
    );

    try {
      await handleGenerateSchedule(tournamentId);

      const isNowLocked = await hasGeneratedMatches(tournamentId);
      setLockedTournamentIds((previous) =>
        applyGenerationResultLock(previous, tournamentId, isNowLocked),
      );
    } catch {
      return;
    } finally {
      setPendingGenerationIds((previous) =>
        removeTournamentId(previous, tournamentId),
      );

      const stillLocked = await hasGeneratedMatches(tournamentId).catch(
        () => true,
      );
      if (!stillLocked) {
        immediateLockedIdsRef.current.delete(tournamentId);
      }
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLockedTournamentIds(new Set());
      immediateLockedIdsRef.current = new Set();
      return;
    }

    if (tournamentList.length === 0) {
      return;
    }

    let isCancelled = false;

    const loadLockedTournamentIds = async () => {
      const checks = await Promise.all(
        tournamentList.map(async (tournament) => {
          try {
            const locked = await hasGeneratedMatches(tournament.id);
            return locked ? tournament.id : null;
          } catch {
            return null;
          }
        }),
      );

      if (isCancelled) {
        return;
      }

      const lockedIds = buildLockedIdsFromChecks(checks, pendingGenerationIds);

      setLockedTournamentIds(lockedIds);
    };

    void loadLockedTournamentIds();

    return () => {
      isCancelled = true;
    };
  }, [tournamentList, isAdmin, pendingGenerationIds]);

  return (
    <TournamentTable
      tournamentList={tournamentList}
      isAdmin={isAdmin}
      today={today}
      onPublishTournament={onPublishTournament}
      isPublishing={isPublishing}
      onEditTournament={onEditTournament}
      isEditing={isEditing}
      onGenerateSchedule={handleGenerateScheduleOnce}
      isGenerating={isGenerating}
      lockedTournamentIds={lockedTournamentIds}
      registeredTournamentIds={registeredTournamentIds}
      participatedTournamentIds={participatedTournamentIds}
    />
  );
};

export default TournamentGenerationController;
