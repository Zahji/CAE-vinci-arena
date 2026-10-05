package be.vinci.ipl.cae.demo.repositories;


import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.repository.CrudRepository;


/**
 * Repository for Match entities.
 */
public interface MatchRepository extends CrudRepository<Match, Long> {

  /**
   * Find all match by tournament ID.
   *
   * @param tournamentId the tournament ID
   * @return list of matches
   */
  List<Match> findByTournamentId(Long tournamentId);

  /**
   * Find a match based by its state and date (used to check matches that need to start).
   *
   * @param stateMatch State Match
   * @param dateTimeOfStart Date and time of start
   * @return if found
   */
  List<Match> findByStateAndStartTimeBefore(StateMatch stateMatch, LocalDateTime dateTimeOfStart);

}
