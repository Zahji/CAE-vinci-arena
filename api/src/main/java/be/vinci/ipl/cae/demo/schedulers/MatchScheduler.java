package be.vinci.ipl.cae.demo.schedulers;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.services.MatchService;
import be.vinci.ipl.cae.demo.services.ParticipationMatchService;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


/**
 * Barbaric BUT working component that checks every 1 minute.
 * if the match should start or not.
 */
@Component
public class MatchScheduler {

  private static final Logger log = LoggerFactory.getLogger(MatchScheduler.class);
  private final MatchRepository matchRepository;
  private final ParticipationMatchRepository participationRepository;
  private final MatchService matchService;
  private final ParticipationMatchService participationService;

  /**
   * Constructor.
   *
   * @param matchRepository match Repository
   * @param participationRepository Participation Repository
   * @param matchService Match Service
   * @param participationService Participation Service
   */
  public MatchScheduler(MatchRepository matchRepository,
      ParticipationMatchRepository participationRepository,
      MatchService matchService,
      ParticipationMatchService participationService) {
    this.matchRepository = matchRepository;
    this.participationRepository = participationRepository;
    this.matchService = matchService;
    this.participationService = participationService;
  }

  /**
   * Checking every minute.
   */
  @Scheduled(fixedRate = 60000)
  public void autoStartMatches() {
    LocalDateTime now = LocalDateTime.now();
    List<Match> matches = matchRepository.findByStateAndStartTimeBefore(
        StateMatch.PLANIFIED, now);

    for (Match match : matches) {
      try {
        processMatchStart(match);
      } catch (Exception e) {
        if (log.isErrorEnabled()) {
          log.error("Failed to process match {}", match.getMatchId(), e);
        }
      }
    }
  }

  /**
   * Try starting match.
   *
   * @param match full match
   */
  private void processMatchStart(Match match) {
    List<ParticipationMatch> teams = participationRepository
        .findByMatchMatchId(match.getMatchId());

    if (teams.size() < 2) {
      matchService.updateMatchState(match, StateMatch.ENDED);
      return;
    }

    ParticipationMatch team1 = teams.get(0);
    ParticipationMatch team2 = teams.get(1);

    boolean t1Invalid = team1.getDeclaredForfeit() || team1.getStatusSelection() < 1;
    boolean t2Invalid = team2.getDeclaredForfeit() || team2.getStatusSelection() < 1;

    // Both invalid (forfeit or insufficient players) → end with no winner
    if (t1Invalid && t2Invalid) {
      matchService.updateMatchState(match, StateMatch.ENDED);
      return;
    }

    // Only team 1 invalid → team 2 wins by forfeit
    if (t1Invalid) {
      handleForfeitWin(match, team1, team2, team2);
      return;
    }

    // Only team 2 invalid → team 1 wins by forfeit
    if (t2Invalid) {
      handleForfeitWin(match, team1, team2, team1);
      return;
    }

    // Both valid → normal start
    matchService.updateMatchState(match, StateMatch.ONGOING);
  }

  /**
   * Handle match when someone did forfait or had insufficient players selected.
   *
   * @param match match
   * @param team1 team 1
   * @param team2 team 2
   * @param winner winner, the team that didn't forfait
   */
  private void handleForfeitWin(Match match, ParticipationMatch team1,
      ParticipationMatch team2, ParticipationMatch winner) {
    ParticipationMatch loser = winner.equals(team1) ? team2 : team1;

    // Internal forfeit resolution starts from PLANIFIED matches at start time.
    // Move to ONGOING so score encoding stays aligned with API restrictions.
    matchService.updateMatchState(match, StateMatch.ONGOING);

    if (!loser.getDeclaredForfeit()) {
      loser.setDeclaredForfeit(true);
      participationRepository.save(loser);
    }

    participationService.updateScore(match.getMatchId(), winner.getTeam().getId(), 5);
    participationService.updateScore(match.getMatchId(), loser.getTeam().getId(), null);
    matchService.updateMatchState(match, StateMatch.ENDED);
  }
}