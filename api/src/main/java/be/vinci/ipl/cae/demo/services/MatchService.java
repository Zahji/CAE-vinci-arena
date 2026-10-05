package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.MatchCreateDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistration;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing match-related HTTP requests.
 */
@Service
public class MatchService {

  private final MatchRepository repository;
  private final TournamentRepository tournamentRepository;
  private final UserRepository userRepository;
  private final TournamentRegistrationRepository registrationRepository;
  private final ParticipationMatchRepository participationRepository;

  /**
   * Constructor for Match Service.
   *
   * @param repository Match repository
   * @param tournamentRepository tournament repository
   * @param userRepository User repository
   * @param registrationRepository Registration repository
   * @param participationRepository Participation repository
   */
  public MatchService(MatchRepository repository, TournamentRepository tournamentRepository,
      UserRepository userRepository, TournamentRegistrationRepository registrationRepository,
      ParticipationMatchRepository participationRepository) {
    this.repository = repository;
    this.tournamentRepository = tournamentRepository;
    this.userRepository = userRepository;
    this.registrationRepository = registrationRepository;
    this.participationRepository = participationRepository;
  }

  /**
   * Get a match by its ID.
   */
  public Optional<Match> getMatchById(Long matchId) {
    return repository.findById(matchId);
  }

  /**
   * Get all matches for a specific tournament.
   */
  public Iterable<Match> getMatchForTournament(Long tournamentId) {
    return repository.findByTournamentId(tournamentId);
  }

  /**
   * Build a Match from a DTO.
   */
  public Optional<Match> buildMatch(MatchCreateDto dto) {
    Optional<Tournament> tournamentOpt = tournamentRepository.findById(dto.getTournamentId());
    Optional<User> adminOpt = userRepository.findById(dto.getAdminId());

    if (tournamentOpt.isEmpty() || adminOpt.isEmpty() || !adminOpt.get().isAdmin()) {
      return Optional.empty();
    }

    return Optional.of(createMatchFromDto(dto, tournamentOpt.get(), adminOpt.get()));
  }

  /**
   * Save a match.
   */
  public Match saveMatch(Match match) {
    return repository.save(match);
  }

  /**
   * Update match state with transition validation.
   */
  @Transactional
  public Optional<Match> updateMatchState(Match match, StateMatch newState) {
    if (!isValidStateTransition(match.getState(), newState)) {
      return Optional.empty();
    }
    if (!isStartTimeValid(match, newState)) {
      return Optional.empty();
    }
    match.setState(newState);
    return Optional.of(repository.save(match));
  }

  /**
   * Generate a full single-elimination bracket for a tournament.
   */
  @Transactional
  public Optional<List<Match>> generateEliminationBracket(Long tournamentId, User admin,
      LocalDateTime startDate, int minutesBetweenRounds) {

    Optional<Tournament> tournamentOpt = tournamentRepository.findById(tournamentId);
    if (tournamentOpt.isEmpty()) {
      return Optional.empty();
    }
    Tournament tournament = tournamentOpt.get();

    List<TournamentRegistration> registrations
        = registrationRepository.findByTournament(tournament);

    if (!isBracketGenerationAllowed(tournament, registrations)) {
      return Optional.empty();
    }

    int bracketSize = computeBracketSize(registrations.size());
    int numRounds = (int) (Math.log(bracketSize) / Math.log(2));
    LocalDateTime lastRoundTime
        = startDate.plusMinutes((long) (numRounds - 1) * minutesBetweenRounds);

    if (!isBracketWithinTournamentDates(tournament, lastRoundTime)) {
      return Optional.empty();
    }

    List<Team> teams = shuffledTeams(registrations);
    return Optional.of(buildAllRounds(tournament,
        admin, teams, startDate, minutesBetweenRounds));
  }

  // ---------------------------------
  // Private helpers — buildMatch
  // ----------------------------------

  private Match createMatchFromDto(MatchCreateDto dto,
      Tournament tournament, User admin) {
    Match match = new Match();
    match.setStartTime(dto.getStartTime());
    match.setRound(dto.getRound());
    match.setState(dto.getState() != null ? dto.getState() : StateMatch.PLANIFIED);
    match.setTournament(tournament);
    match.setAdmin(admin);
    return match;
  }

  // -------------------------------------------------------------------------
  // Private helpers — updateMatchState
  // -------------------------------------------------------------------------

  private boolean isValidStateTransition(StateMatch current, StateMatch next) {
    return switch (current) {
      case PLANIFIED -> next == StateMatch.ONGOING || next == StateMatch.ENDED;
      case ONGOING, CONTESTED -> next == StateMatch.ENDED;
      case ENDED -> next == StateMatch.CONTESTED;
    };
  }

  private boolean isStartTimeValid(Match match, StateMatch newState) {
    if (newState != StateMatch.ONGOING && newState != StateMatch.ENDED) {
      return true;
    }
    LocalDateTime now = LocalDateTime.now();
    return match.getStartTime() != null && !match.getStartTime().isAfter(now);
  }

  // ---------------------------------------------
  // Private helpers — generateEliminationBracket
  // ---------------------------------------------

  private boolean isBracketGenerationAllowed(Tournament tournament,
      List<TournamentRegistration> registrations) {

    if (tournament.getState() != State.PLANIFIED) {
      return false;
    }
    if (registrations.size() < 2) {
      return false;
    }
    if (hasExistingMatches(tournament.getId())) {
      return false;
    }

    boolean registrationsClosed = LocalDate.now()
        .isAfter(tournament.getEndInscriptionDate());
    return registrationsClosed || registrations.size() >= tournament.getMaxTeams();
  }

  private boolean hasExistingMatches(Long tournamentId) {
    return repository.findByTournamentId(tournamentId).iterator().hasNext();
  }

  private boolean isBracketWithinTournamentDates(Tournament tournament,
      LocalDateTime lastRoundTime) {
    LocalDateTime tournamentEnd = tournament.getEndDate().atTime(23, 59);
    return !lastRoundTime.plusMinutes(150).isAfter(tournamentEnd);
  }

  private int computeBracketSize(int numTeams) {
    return (int) Math.pow(2, Math.ceil(Math.log(numTeams) / Math.log(2)));
  }

  private List<Team> shuffledTeams(List<TournamentRegistration> registrations) {
    List<Team> teams = new ArrayList<>(registrations.stream()
        .map(TournamentRegistration::getTeam)
        .toList());
    Collections.shuffle(teams);
    return teams;
  }

  private List<Match> buildAllRounds(Tournament tournament,
      User admin, List<Team> teams,
      LocalDateTime startDate, int minutesBetweenRounds) {

    List<Match> allMatches = new ArrayList<>();
    LocalDateTime roundTime = startDate;
    LocalDateTime tournamentEnd = tournament.getEndDate().atTime(23, 59);
    int round = 1;

    while (teams.size() > 1) {
      if (roundTime.plusMinutes(30).isAfter(tournamentEnd)) {
        return allMatches;
      }
      teams = buildRound(tournament, admin, teams, roundTime, round, allMatches);
      roundTime = normalizeRoundStart(roundTime.plusMinutes(minutesBetweenRounds));
      round++;
    }

    return allMatches;
  }

  private List<Team> buildRound(Tournament tournament,
      User admin, List<Team> teams,
      LocalDateTime roundTime, int round, List<Match> allMatches) {

    List<Team> nextRoundTeams = new ArrayList<>();

    int matchesThisRound = teams.size() / 2;
    for (int i = 0; i < matchesThisRound; i++) {
      Match match = saveNewMatch(tournament, admin,
          roundTime, round, StateMatch.PLANIFIED);
      allMatches.add(match);
      createParticipation(match, teams.get(i * 2));
      createParticipation(match, teams.get(i * 2 + 1));
      nextRoundTeams.add(null);
    }

    if (teams.size() % 2 != 0) {
      nextRoundTeams.add(handleByeTeam(tournament, admin,
          teams, roundTime, round, allMatches));
    }

    return nextRoundTeams;
  }

  private Team handleByeTeam(Tournament tournament, User admin, List<Team> teams,
      LocalDateTime roundTime, int round, List<Match> allMatches) {

    Match byeMatch = saveNewMatch(tournament, admin, roundTime,
        round, StateMatch.ENDED);
    allMatches.add(byeMatch);
    Team byeTeam = teams.get(teams.size() - 1);
    createParticipation(byeMatch, byeTeam);
    return byeTeam;
  }

  private Match saveNewMatch(Tournament tournament,
      User admin, LocalDateTime time, int round, StateMatch state) {

    Match match = new Match();
    match.setStartTime(time);
    match.setRound((long) round);
    match.setState(state);
    match.setTournament(tournament);
    match.setAdmin(admin);
    return repository.save(match);
  }

  // -------------------------------------------------------------------------
  // Private helpers — shared
  // -------------------------------------------------------------------------

  private void createParticipation(Match match, Team team) {
    if (team == null) {
      return;
    }
    ParticipationMatch participation = new ParticipationMatch();
    participation.setMatch(match);
    participation.setTeam(team);
    participation.setDeclaredForfeit(false);
    participation.setStatusSelection(0);
    participationRepository.save(participation);
  }

  private LocalDateTime normalizeRoundStart(LocalDateTime candidate) {
    int hour = candidate.getHour();
    if (hour >= 22) {
      return candidate.plusDays(1).with(LocalTime.of(8, 0));
    }
    if (hour < 8) {
      return candidate.with(LocalTime.of(8, 0));
    }
    return candidate;
  }
}