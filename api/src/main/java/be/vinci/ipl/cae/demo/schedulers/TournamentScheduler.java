package be.vinci.ipl.cae.demo.schedulers;

import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler that checks every minute if tournaments should.
 * transition from PLANIFIED → ONGOING or ONGOING → ENDED.
 */
@Component
public class TournamentScheduler {

  private static final Logger log = LoggerFactory.getLogger(TournamentScheduler.class);
  private final TournamentRepository tournamentRepository;

  /**
   * Constructor.
   *
   * @param tournamentRepository tournament repository
   */
  public TournamentScheduler(TournamentRepository tournamentRepository) {
    this.tournamentRepository = tournamentRepository;
  }

  /**
   * Checking every minute.
   */
  @Scheduled(fixedRate = 60000)
  public void autoUpdateTournamentStates() {
    LocalDate today = LocalDate.now();

    startDueTournaments(today);
    endFinishedTournaments(today);
  }

  /**
   * Transition PLANIFIED → ONGOING for tournaments whose start date has been reached.
   */
  private void startDueTournaments(LocalDate today) {
    List<Tournament> toStart = tournamentRepository
        .findByStateAndStartDateLessThanEqual(State.PLANIFIED, today);

    for (Tournament tournament : toStart) {
      try {
        tournament.setState(State.ONGOING);
        tournamentRepository.save(tournament);
        if (log.isInfoEnabled()) {
          log.info("Tournament {} started", tournament.getId());
        }
      } catch (Exception e) {
        if (log.isErrorEnabled()) {
          log.error("Failed to start tournament {}", tournament.getId(), e);
        }
      }
    }
  }

  /**
   * Transition ONGOING → ENDED for tournaments whose end date has passed.
   */
  private void endFinishedTournaments(LocalDate today) {
    List<Tournament> toEnd = tournamentRepository
        .findByStateAndEndDateLessThan(State.ONGOING, today);

    for (Tournament tournament : toEnd) {
      try {
        tournament.setState(State.FINISHED);
        tournamentRepository.save(tournament);
        if (log.isInfoEnabled()) {
          log.info("Tournament {} ended", tournament.getId());
        }
      } catch (Exception e) {
        if (log.isErrorEnabled()) {
          log.error("Failed to end tournament {}", tournament.getId(), e);
        }
      }
    }
  }
}
