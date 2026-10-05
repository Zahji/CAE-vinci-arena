package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatchId;
import java.util.List;
import org.springframework.data.repository.CrudRepository;

/**
 * Repository for Participation Match.
 */
public interface ParticipationMatchRepository extends
    CrudRepository<ParticipationMatch, ParticipationMatchId> {

  /**
   * find participation match by ID match (Naming is weird, but it doesn't work otherwise).
   *
   * @param matchId match ID
   * @return if found
   */
  List<ParticipationMatch> findByMatchMatchId(Long matchId);

  /**
   * Find Participant Match by its team ID.
   *
   * @param teamId team ID
   * @return if found
   */
  List<ParticipationMatch> findByTeamId(Long teamId);
}
