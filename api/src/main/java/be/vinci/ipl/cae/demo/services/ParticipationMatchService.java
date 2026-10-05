package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.dtos.ParticipationMatchCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.ParticipationMatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatchId;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Participation/matches/tournament-related HTTP requests.
 */
@Service
public class ParticipationMatchService {

  private final ParticipationMatchRepository repository;
  private final MatchRepository matchRepository;
  private final TeamRepository teamRepository;
  private final NotificationService notificationService;

  /**
   * Constructor for participation Match Service.
   *
   * @param repository participation repository
   * @param matchRepository match repository
   * @param teamRepository team repository
   * @param notificationService notification service
   */

  public ParticipationMatchService(ParticipationMatchRepository repository,
                                   MatchRepository matchRepository,
                                   TeamRepository teamRepository,
                                   NotificationService notificationService) {
    this.repository = repository;
    this.matchRepository = matchRepository;
    this.teamRepository = teamRepository;
    this.notificationService = notificationService;
  }

  // -------------------------------------------------------------------------
  // Public — queries
  // -------------------------------------------------------------------------

  /**
   * Get participation by Match ID.
   *
   * @param matchId match ID
   * @return list
   */
  public List<ParticipationMatchDto> getParticipationsByMatch(Long matchId) {
    return toDtoList(repository.findByMatchMatchId(matchId));
  }

  /**
   * get participations by team ID.
   *
   * @param teamId team ID
   * @return list
   */
  public List<ParticipationMatchDto> getParticipationsByTeam(Long teamId) {
    return toDtoList(repository.findByTeamId(teamId));
  }

  /**
   * Get participation by match ID AND team ID.
   *
   * @param matchId match ID
   * @param teamId team ID
   * @return if found
   */
  public Optional<ParticipationMatchDto> getParticipation(Long matchId, Long teamId) {
    return findByIds(matchId, teamId).map(this::convertToDto);
  }

  // -------------------
  // Public — commands
  // -------------------

  /**
   * Create participation (team registers for match).
   */
  @Transactional
  public Optional<ParticipationMatchDto> createParticipation(ParticipationMatchCreateDto dto) {
    Optional<Match> matchOpt = matchRepository.findById(dto.getMatchId());
    Optional<Team> teamOpt = teamRepository.findById(dto.getTeamId());

    if (matchOpt.isEmpty() || teamOpt.isEmpty()) {
      return Optional.empty();
    }
    if (findByIds(dto.getMatchId(), dto.getTeamId()).isPresent()) {
      return Optional.empty();
    }

    return saveAndConvert(buildParticipation(matchOpt.get(), teamOpt.get()));
  }

  /**
   * Update score — only allowed if match is ONGOING or CONTESTED.
   */
  @Transactional
  public Optional<ParticipationMatchDto> updateScore(Long matchId, Long teamId, Integer score) {
    return withContext(matchId, teamId, (participation, match) -> {
      if (match.getState() == StateMatch.ENDED
          || match.getState() == StateMatch.PLANIFIED) {
        return Optional.empty();
      }

      participation.setScore(score);
      initScoreTimestamp(match);

      boolean otherTeamScored = hasOtherTeamScored(matchId, teamId);
      if (shouldEndMatch(match.getState(), otherTeamScored)) {
        match.setState(StateMatch.ENDED);
      }
      matchRepository.save(match);

      if (match.getState() == StateMatch.ENDED) {
        notifyScoreRecorded(match);
      }

      return saveAndConvert(participation);
    });
  }

  /**
   * Contest score — can only be done ONCE per match per team within 2 hours.
   */
  @Transactional
  public Optional<ParticipationMatchDto> contestScore(Long matchId, Long teamId, String reason) {
    return withContext(matchId, teamId, (participation, match) -> {
      if (!isContestable(participation, match, reason)) {
        return Optional.empty();
      }

      participation.setMotifRefuse(reason);
      match.setState(StateMatch.CONTESTED);
      resetAllScores(matchId);
      matchRepository.save(match);
      notifyScoreContested(match, reason);

      return saveAndConvert(participation);
    });
  }

  /**
   * Declare forfeit.
   */
  public Optional<ParticipationMatchDto> declareForfeit(Long matchId, Long teamId,
                                                        boolean forfeit) {
    return withContext(matchId, teamId, (participation, match) -> {
      if (match.getState().equals(StateMatch.PLANIFIED)) {
        return applyForfeitDuringOngoingMatch(match, participation, teamId);
      }

      if (!match.getState().equals(StateMatch.ONGOING) || !forfeit) {
        return Optional.empty();
      }

      return applyForfeitDuringOngoingMatch(match, participation, teamId);
    });
  }

  /**
   * Resolve a forfeit during an ongoing match.
   *
   * @param match current match
   * @param forfeitingParticipation participation of the team that forfeits
   * @param forfeitingTeamId team id of the forfeiting team
   * @return saved forfeiting participation if the operation succeeds
   */
  private Optional<ParticipationMatchDto> applyForfeitDuringOngoingMatch(
      Match match,
      ParticipationMatch forfeitingParticipation,
      Long forfeitingTeamId) {
    List<ParticipationMatch> participations =
        repository.findByMatchMatchId(match.getMatchId());
    if (participations.size() < 2) {
      return Optional.empty();
    }

    Optional<ParticipationMatch> winnerParticipationOpt = participations.stream()
        .filter(p -> p.getTeam() != null
            && p.getTeam().getId() != null
            && !p.getTeam().getId().equals(forfeitingTeamId))
        .findFirst();

    if (winnerParticipationOpt.isEmpty()) {
      return Optional.empty();
    }

    ParticipationMatch winnerParticipation = winnerParticipationOpt.get();

    forfeitingParticipation.setDeclaredForfeit(true);
    forfeitingParticipation.setScore(0);
    winnerParticipation.setDeclaredForfeit(false);
    winnerParticipation.setScore(5);

    match.setScoreUpdatedAt(LocalDateTime.now());
    match.setState(StateMatch.ENDED);

    repository.save(forfeitingParticipation);
    repository.save(winnerParticipation);
    matchRepository.save(match);
    notifyScoreRecorded(match);

    return Optional.of(convertToDto(forfeitingParticipation));
  }

  // --------------------------------
  // Private helpers — IDs & lookup
  // --------------------------------

  private ParticipationMatchId createId(Long matchId, Long teamId) {
    return new ParticipationMatchId(matchId, teamId);
  }

  private Optional<ParticipationMatch> findByIds(Long matchId, Long teamId) {
    return repository.findById(createId(matchId, teamId));
  }

  // ---------------------------------
  // Private helpers — createParticipation
  // ---------------------------------

  private ParticipationMatch buildParticipation(Match match, Team team) {
    ParticipationMatch participation = new ParticipationMatch();
    participation.setMatch(match);
    participation.setTeam(team);
    participation.setStatusSelection(0);
    participation.setDeclaredForfeit(false);
    return participation;
  }

  // ----------------------------------
  // Private helpers — updateScore
  // ----------------------------------

  private void initScoreTimestamp(Match match) {
    if (match.getScoreUpdatedAt() == null) {
      match.setScoreUpdatedAt(LocalDateTime.now());
    }
  }

  private boolean hasOtherTeamScored(Long matchId, Long teamId) {
    return getParticipationsByMatch(matchId).stream()
        .filter(t -> !t.getTeamId().equals(teamId))
        .findFirst()
        .map(t -> t.getScore() != null)
        .orElse(false);
  }

  private boolean shouldEndMatch(StateMatch state, boolean otherTeamScored) {
    boolean isActive = state == StateMatch.ONGOING || state == StateMatch.CONTESTED;
    return !isActive || otherTeamScored;
  }

  /**
   * Helper needed for not duplicating code.
   *
   * @param matchId match id
   * @param teamId team id
   * @param action actions decided in parameters
   * @return result
   */
  private Optional<ParticipationMatchDto> withContext(
      Long matchId, Long teamId,
      java.util.function.BiFunction<ParticipationMatch, Match,
          Optional<ParticipationMatchDto>> action) {
    return findParticipationContext(matchId, teamId)
        .flatMap(ctx -> action.apply(ctx.participation(), ctx.match()));
  }

  private void advanceWinnerToNextRound(Match currentMatch) {
    if (currentMatch.getTournament() == null
        || currentMatch.getTournament().getId() == null
        || currentMatch.getRound() == null) {
      return;
    }

    List<ParticipationMatch> currentParticipations = repository.findByMatchMatchId(
        currentMatch.getMatchId());
    Optional<Team> winnerOpt = resolveWinner(currentParticipations);
    if (winnerOpt.isEmpty()) {
      return;
    }

    Long tournamentId = currentMatch.getTournament().getId();
    Long currentRound = currentMatch.getRound();
    Long nextRound = currentRound + 1;

    List<Match> allTournamentMatches = matchRepository.findByTournamentId(tournamentId);
    List<Match> currentRoundMatches = allTournamentMatches.stream()
        .filter(m -> m.getRound() != null && m.getRound().equals(currentRound))
        .sorted(Comparator.comparing(Match::getMatchId))
        .toList();
    List<Match> nextRoundMatches = allTournamentMatches.stream()
        .filter(m -> m.getRound() != null && m.getRound().equals(nextRound))
        .sorted(Comparator.comparing(Match::getMatchId))
        .toList();

    if (nextRoundMatches.isEmpty()) {
      return;
    }

    int currentMatchIndex = -1;
    for (int i = 0; i < currentRoundMatches.size(); i++) {
      if (currentRoundMatches.get(i).getMatchId().equals(currentMatch.getMatchId())) {
        currentMatchIndex = i;
        break;
      }
    }
    if (currentMatchIndex < 0) {
      return;
    }

    int nextMatchIndex = currentMatchIndex / 2;
    if (nextMatchIndex >= nextRoundMatches.size()) {
      return;
    }

    Match targetMatch = nextRoundMatches.get(nextMatchIndex);
    List<ParticipationMatch> targetParticipations =
        repository.findByMatchMatchId(targetMatch.getMatchId());

    Team winner = winnerOpt.get();
    boolean alreadyPresent = targetParticipations.stream()
        .anyMatch(p -> p.getTeam() != null
            && p.getTeam().getId() != null
            && p.getTeam().getId().equals(winner.getId()));
    if (alreadyPresent || targetParticipations.size() >= 2) {
      return;
    }

    ParticipationMatch nextParticipation = new ParticipationMatch();
    nextParticipation.setMatch(targetMatch);
    nextParticipation.setTeam(winner);
    nextParticipation.setDeclaredForfeit(false);
    nextParticipation.setStatusSelection(0);
    nextParticipation.setScore(null);
    repository.save(nextParticipation);
  }

  private Optional<Team> resolveWinner(List<ParticipationMatch> participations) {
    if (participations.size() < 2) {
      return Optional.empty();
    }

    ParticipationMatch first = participations.get(0);
    ParticipationMatch second = participations.get(1);

    Integer firstScore = first.getScore();
    Integer secondScore = second.getScore();

    if (firstScore == null && secondScore == null) {
      return Optional.empty();
    }
    if (firstScore == null) {
      return Optional.ofNullable(second.getTeam());
    }
    if (secondScore == null) {
      return Optional.ofNullable(first.getTeam());
    }
    if (firstScore.equals(secondScore)) {
      return Optional.empty();
    }

    return firstScore > secondScore
        ? Optional.ofNullable(first.getTeam())
        : Optional.ofNullable(second.getTeam());
  }

  /**
   * Look up participation by IDs and extract match, or return empty if not found.
   * Extracts common pattern from updateScore/contestScore/declareForfeit.
   */
  private Optional<ParticipationContext> findParticipationContext(Long matchId, Long teamId) {
    return findByIds(matchId, teamId)
        .map(p -> new ParticipationContext(p, p.getMatch()));
  }

  /**
   * Holds a participation with its associated match for common lookup pattern.
   */
  private record ParticipationContext(ParticipationMatch participation, Match match) {}

  /**
   * Convert a list of ParticipationMatch entities to DTOs.
   */
  private List<ParticipationMatchDto> toDtoList(List<ParticipationMatch> participations) {
    return participations.stream()
        .map(this::convertToDto)
        .collect(Collectors.toList());
  }

  /**
   * Save participation and convert to DTO — common pattern for all mutating methods.
   */
  private Optional<ParticipationMatchDto> saveAndConvert(ParticipationMatch participation) {
    return Optional.of(convertToDto(repository.save(participation)));
  }

  private boolean isContestable(ParticipationMatch participation,
      Match match, String reason) {
    if (reason == null || reason.isBlank()) {
      return false;
    }
    if (participation.getMotifRefuse() != null) {
      return false;
    }
    if (participation.getScore() == null) {  // add this back
      return false;
    }

    List<ParticipationMatch> participants = repository.findByMatchMatchId(match.getMatchId());
    if (participants.size() < 2) {
      return false;
    }
    if (!match.getState().equals(StateMatch.ENDED)
        || participants.get(0).getDeclaredForfeit()
        || participants.get(1).getDeclaredForfeit()) {
      return false;
    }
    return match.getScoreUpdatedAt() != null
        && !isContestWindowExpired(match.getScoreUpdatedAt());
  }

  private boolean isContestWindowExpired(LocalDateTime scoreUpdatedAt) {
    return Duration.between(scoreUpdatedAt, LocalDateTime.now()).toMinutes() > 120;
  }

  private void resetAllScores(Long matchId) {
    repository.findByMatchMatchId(matchId).forEach(p -> {
      p.setScore(null);
      repository.save(p);
    });
  }

  // -----------------------------------
  // Private helpers — notifications
  // -----------------------------------

  private void notifyScoreRecorded(Match match) {
    advanceWinnerToNextRound(match);

    List<ParticipationMatch> parst = repository.findByMatchMatchId(match.getMatchId());
    Tournament tournament = match.getTournament();
    if (parst.size() < 2) {
      return; // or log a warning
    }

    notifyMatchParticipants(
        match,
        "Score enregistré",
        "Les scores du tournoi " + tournament.getName()
            + " ont été enregistrés: ("
            + parst.get(0).getTeam().getName() + " VS " + parst.get(1).getTeam().getName()
            + ")"
    );
  }

  private void notifyScoreContested(Match match, String reason) {
    List<ParticipationMatch> parst = repository.findByMatchMatchId(match.getMatchId());
    notifyMatchParticipants(
        match,
        "Score contesté",
        "Un score a été contesté pour le match ("
            + parst.get(0).getTeam().getName() + " VS "
            + parst.get(1).getTeam().getName() + "). Raison : "
            + reason
    );
  }

  private void notifyMatchParticipants(Match match, String object, String message) {
    collectUsersToNotify(match).stream()
        .filter(u -> u != null)
        .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a))
        .values()
        .forEach(user -> notificationService.createNotification(user,
            buildNotificationDto(object, message)));
  }

  private List<User> collectUsersToNotify(Match match) {
    List<User> users = new ArrayList<>();

    if (match.getAdmin() != null) {
      users.add(match.getAdmin());
    }

    repository.findByMatchMatchId(match.getMatchId()).forEach(p -> {
      Team team = p.getTeam();
      if (team.getManager() != null) {
        users.add(team.getManager());
      }
      if (team.getSecondManager() != null) {
        users.add(team.getSecondManager());
      }
    });

    return users;
  }

  private NotificationDto buildNotificationDto(String object, String message) {
    NotificationDto dto = new NotificationDto();
    dto.setObject(object);
    dto.setMessage(message);
    dto.setType(NotificationType.GENERAL);
    return dto;
  }

  // -----------------------------------
  // Private helpers — DTO conversion
  // -----------------------------------

  private ParticipationMatchDto convertToDto(ParticipationMatch participation) {
    ParticipationMatchDto dto = new ParticipationMatchDto();
    dto.setMatchId(participation.getMatch().getMatchId());
    dto.setTeamId(participation.getTeam().getId());
    dto.setTeamName(participation.getTeam().getName());
    dto.setDeclaredForfeit(participation.getDeclaredForfeit());
    dto.setScore(participation.getScore());
    dto.setStatusSelection(participation.getStatusSelection());
    dto.setMotifRefuse(participation.getMotifRefuse());
    return dto;
  }
}