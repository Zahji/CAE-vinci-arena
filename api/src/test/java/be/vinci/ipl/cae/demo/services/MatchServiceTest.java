package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.MatchCreateDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
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
import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchServiceTest {

  @Mock
  private MatchRepository matchRepository;

  @Mock
  private TournamentRepository tournamentRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private TournamentRegistrationRepository registrationRepository;

  @Mock
  private ParticipationMatchRepository participationRepository;

  @InjectMocks
  private MatchService matchService;

  private Tournament tournament;
  private User admin;
  private MatchCreateDto dto;

  @BeforeEach
  void setUp() {
    tournament = new Tournament();
    tournament.setId(1L);

    admin = new User();
    ReflectionTestUtils.setField(admin, "id", 3L);
    admin.setAdmin(true);

    dto = new MatchCreateDto();
    dto.setStartTime(LocalDateTime.now().plusDays(1));
    dto.setRound(1L);
    dto.setState(StateMatch.PLANIFIED);
    dto.setTournamentId(1L);
    dto.setAdminId(3L);
  }

  @Test
  void getMatchById_existingId_returnsMatch() {
    Match match = new Match();
    match.setMatchId(1L);
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

    Optional<Match> result = matchService.getMatchById(1L);

    assertTrue(result.isPresent());
    assertEquals(1L, result.get().getMatchId());
  }

  @Test
  void getMatchById_nonExistingId_returnsEmpty() {
    when(matchRepository.findById(999L)).thenReturn(Optional.empty());

    Optional<Match> result = matchService.getMatchById(999L);

    assertTrue(result.isEmpty());
  }

  @Test
  void buildMatch_validData_returnsMatch() {
    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(userRepository.findById(3L)).thenReturn(Optional.of(admin));

    Optional<Match> result = matchService.buildMatch(dto);

    assertTrue(result.isPresent());
    assertEquals(tournament, result.get().getTournament());
    assertEquals(admin, result.get().getAdmin());
    assertEquals(StateMatch.PLANIFIED, result.get().getState());
  }

  @Test
  void buildMatch_invalidTournament_returnsEmpty() {
    when(tournamentRepository.findById(1L)).thenReturn(Optional.empty());

    Optional<Match> result = matchService.buildMatch(dto);

    assertTrue(result.isEmpty());
  }

  @Test
  void buildMatch_invalidAdmin_returnsEmpty() {
    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(userRepository.findById(3L)).thenReturn(Optional.empty());

    Optional<Match> result = matchService.buildMatch(dto);

    assertTrue(result.isEmpty());
  }

  @Test
  void buildMatch_nonAdminUser_returnsEmpty() {
    User nonAdmin = new User();
    ReflectionTestUtils.setField(nonAdmin, "id", 3L);
    nonAdmin.setAdmin(false);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(userRepository.findById(3L)).thenReturn(Optional.of(nonAdmin));

    Optional<Match> result = matchService.buildMatch(dto);
    assertTrue(result.isEmpty());
  }

  @Test
  void buildMatch_nullState_defaultsToPlanified() {
    dto.setState(null);
    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(userRepository.findById(3L)).thenReturn(Optional.of(admin));

    Optional<Match> result = matchService.buildMatch(dto);

    assertTrue(result.isPresent());
    //Tests that null state defaults to PLANIFIED
    assertEquals(StateMatch.PLANIFIED, result.get().getState());
  }

  @Test
  void saveMatch_validMatch_returnsSaved() {
    Match match = new Match();
    Match saved = new Match();
    saved.setMatchId(1L);
    when(matchRepository.save(match)).thenReturn(saved);

    Match result = matchService.saveMatch(match);

    assertEquals(1L, result.getMatchId());
  }

  // ==================== updateMatchState ====================

  @Test
  void updateMatchState_planifiedToContested_returnsEmpty() {
    Match match = new Match();
    match.setState(StateMatch.PLANIFIED);

    assertTrue(matchService.updateMatchState(match, StateMatch.CONTESTED).isEmpty());
  }

  @Test
  void updateMatchState_ongoingToEnded_success() {
    Match match = new Match();
    match.setState(StateMatch.ONGOING);
    match.setStartTime(LocalDateTime.now().minusMinutes(10));
    when(matchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.ENDED);

    assertTrue(result.isPresent());
    assertEquals(StateMatch.ENDED, result.get().getState());
  }

  @Test
  void updateMatchState_ongoingToContested_returnsEmpty() {
    // Service does NOT allow ONGOING → CONTESTED
    // (Contesting is handled by ParticipationMatchService.contestScore)
    Match match = new Match();
    match.setStartTime(LocalDateTime.now().minusMinutes(10));
    match.setState(StateMatch.ONGOING);

    assertTrue(matchService.updateMatchState(match, StateMatch.CONTESTED).isEmpty());
  }

  @Test
  void updateMatchState_ongoingToPlanified_returnsEmpty() {
    Match match = new Match();
    match.setState(StateMatch.ONGOING);
    match.setStartTime(LocalDateTime.now().minusMinutes(10));

    assertTrue(matchService.updateMatchState(match, StateMatch.PLANIFIED).isEmpty());
  }

  @Test
  void updateMatchState_contestedToEnded_success() {
    Match match = new Match();
    match.setState(StateMatch.CONTESTED);
    match.setStartTime(LocalDateTime.now().minusMinutes(10));
    when(matchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.ENDED);

    assertTrue(result.isPresent());
    assertEquals(StateMatch.ENDED, result.get().getState());
  }

  @Test
  void updateMatchState_contestedToOngoing_returnsEmpty() {
    Match match = new Match();
    match.setState(StateMatch.CONTESTED);
    match.setStartTime(LocalDateTime.now().minusMinutes(10));

    assertTrue(matchService.updateMatchState(match, StateMatch.ONGOING).isEmpty());
  }

  @Test
  void updateMatchState_contestedToPlanified_returnsEmpty() {
    Match match = new Match();
    match.setState(StateMatch.CONTESTED);

    assertTrue(matchService.updateMatchState(match, StateMatch.PLANIFIED).isEmpty());
  }

  @Test
  void updateMatchState_endedToOngoing_returnsEmpty() {
    Match match = new Match();
    match.setState(StateMatch.ENDED);

    assertTrue(matchService.updateMatchState(match, StateMatch.ONGOING).isEmpty());
  }

  @Test
  void updateMatchState_endedToContested_success() {
    Match match = new Match();
    match.setState(StateMatch.ENDED);
    when(matchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.CONTESTED);

    assertTrue(result.isPresent());
    assertEquals(StateMatch.CONTESTED, result.get().getState());
  }

  @Test
  void updateMatchState_endedToPlanified_returnsEmpty() {
    Match match = new Match();
    match.setState(StateMatch.ENDED);

    assertTrue(matchService.updateMatchState(match, StateMatch.PLANIFIED).isEmpty());
  }

  @Test
  void updateMatchState_nullNewState_returnsEmpty() {
    Match match = new Match();
    match.setState(StateMatch.PLANIFIED);

    assertTrue(matchService.updateMatchState(match, null).isEmpty());
  }

  // ==================== TIME CONSTRAINT TESTS ====================

  @Test
  void updateMatchState_planifiedToOngoing_fails_whenFutureTime() {
    Match match = new Match();
    match.setState(StateMatch.PLANIFIED);
    match.setStartTime(LocalDateTime.now().plusHours(1)); // Starts in 1 hour

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.ONGOING);

    assertTrue(result.isEmpty());
    verify(matchRepository, never()).save(any());
  }

  @Test
  void updateMatchState_planifiedToOngoing_fails_whenStartTimeIsNull() {
    Match match = new Match();
    match.setState(StateMatch.PLANIFIED);
    match.setStartTime(null);

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.ONGOING);

    assertTrue(result.isEmpty());
    verify(matchRepository, never()).save(any());
  }

  @Test
  void updateMatchState_planifiedToOngoing_success_whenTimePassed() {
    Match match = new Match();
    match.setState(StateMatch.PLANIFIED);
    match.setStartTime(LocalDateTime.now().minusMinutes(10)); // Already started
    when(matchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.ONGOING);

    assertTrue(result.isPresent());
    assertEquals(StateMatch.ONGOING, result.get().getState());
  }


  @Test
  void updateMatchState_planifiedToEnded_fails_whenFutureTime() {
    Match match = new Match();
    match.setState(StateMatch.PLANIFIED);
    match.setStartTime(LocalDateTime.now().plusHours(1)); // Starts in 1 hour

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.ENDED);

    assertTrue(result.isEmpty());
    verify(matchRepository, never()).save(any());
  }

  @Test
  void updateMatchState_planifiedToEnded_success_whenTimePassed() {
    Match match = new Match();
    match.setState(StateMatch.PLANIFIED);
    match.setStartTime(LocalDateTime.now().minusMinutes(10)); // Already started
    when(matchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    Optional<Match> result = matchService.updateMatchState(match, StateMatch.ENDED);

    assertTrue(result.isPresent());
    assertEquals(StateMatch.ENDED, result.get().getState());
  }


  @Test
  void getMatchForTournament_validId_returnsMatches() {
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of(new Match()));

    Iterable<Match> result = matchService.getMatchForTournament(1L);

    assertNotNull(result);
  }

  @Test
  void generateEliminationBracket_afterInscriptionEnd_returnsMatches() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now().plusDays(10));
    tournament.setEndInscriptionDate(LocalDate.now().minusDays(1));
    tournament.setEndDate(LocalDate.now().plusDays(12));

    Team team1 = new Team();
    team1.setName("Team One");
    Team team2 = new Team();
    team2.setName("Team Two");

    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);
    TournamentRegistration reg2 = new TournamentRegistration();
    reg2.setTournament(tournament);
    reg2.setTeam(team2);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of());
    when(registrationRepository.findByTournament(tournament)).thenReturn(List.of(reg1, reg2));
    when(matchRepository.save(any(Match.class))).thenAnswer(i -> i.getArgument(0));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isPresent());
    assertEquals(1, result.get().size());
  }

  @Test
  void generateEliminationBracket_inscriptionsStillOpenAndNotFull_returnsEmpty() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now().plusDays(10));
    tournament.setEndInscriptionDate(LocalDate.now().plusDays(2));
    tournament.setEndDate(LocalDate.now().plusDays(12));
    tournament.setMaxTeams(8);

    Team team1 = new Team();
    team1.setName("Team One");
    Team team2 = new Team();
    team2.setName("Team Two");
    Team team3 = new Team();
    team3.setName("Team Three");

    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);
    TournamentRegistration reg2 = new TournamentRegistration();
    reg2.setTournament(tournament);
    reg2.setTeam(team2);
    TournamentRegistration reg3 = new TournamentRegistration();
    reg3.setTournament(tournament);
    reg3.setTeam(team3);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(registrationRepository.findByTournament(tournament)).thenReturn(List.of(reg1, reg2, reg3));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isEmpty());
  }

  @Test
  void generateEliminationBracket_fullTournament_returnsMatches() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now().plusDays(10));
    tournament.setEndInscriptionDate(LocalDate.now().plusDays(2));
    tournament.setEndDate(LocalDate.now().plusDays(12));
    tournament.setMaxTeams(2);

    Team team1 = new Team();
    team1.setName("Team One");
    Team team2 = new Team();
    team2.setName("Team Two");

    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);
    TournamentRegistration reg2 = new TournamentRegistration();
    reg2.setTournament(tournament);
    reg2.setTeam(team2);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of());
    when(registrationRepository.findByTournament(tournament)).thenReturn(List.of(reg1, reg2));
    when(matchRepository.save(any(Match.class))).thenAnswer(i -> i.getArgument(0));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isPresent());
    assertEquals(1, result.get().size());
  }

  @Test
  void generateEliminationBracket_tournamentNotFound_returnsEmpty() {
    when(tournamentRepository.findById(1L)).thenReturn(Optional.empty());

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isEmpty());
  }

  @Test
  void generateEliminationBracket_tournamentNotPlanified_returnsEmpty() {
    tournament.setState(State.ONGOING);
    tournament.setStartDate(LocalDate.now());
    tournament.setEndInscriptionDate(LocalDate.now());
    tournament.setEndDate(LocalDate.now().plusDays(1));

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isEmpty());
  }

  @Test
  void generateEliminationBracket_existingMatches_returnsEmpty() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now());
    tournament.setEndInscriptionDate(LocalDate.now().minusDays(1));
    tournament.setEndDate(LocalDate.now().plusDays(1));

    Team team1 = new Team();
    team1.setName("Team One");
    Team team2 = new Team();
    team2.setName("Team Two");
    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);
    TournamentRegistration reg2 = new TournamentRegistration();
    reg2.setTournament(tournament);
    reg2.setTeam(team2);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(registrationRepository.findByTournament(tournament)).thenReturn(List.of(reg1, reg2));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of(new Match()));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isEmpty());
  }

  @Test
  void generateEliminationBracket_lessThanTwoTeams_returnsEmpty() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now());
    tournament.setEndInscriptionDate(LocalDate.now().minusDays(1));
    tournament.setEndDate(LocalDate.now().plusDays(1));

    Team team1 = new Team();
    team1.setName("Solo Team");
    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(registrationRepository.findByTournament(tournament)).thenReturn(List.of(reg1));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isEmpty());
  }

  @Test
  void generateEliminationBracket_endDateExceeded_returnsEmpty() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now());
    tournament.setEndInscriptionDate(LocalDate.now().minusDays(1));
    tournament.setEndDate(LocalDate.now());

    Team team1 = new Team();
    team1.setName("Team One");
    Team team2 = new Team();
    team2.setName("Team Two");
    Team team3 = new Team();
    team3.setName("Team Three");
    Team team4 = new Team();
    team4.setName("Team Four");
    Team team5 = new Team();
    team5.setName("Team Five");
    Team team6 = new Team();
    team6.setName("Team Six");
    Team team7 = new Team();
    team7.setName("Team Seven");
    Team team8 = new Team();
    team8.setName("Team Eight");

    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);
    TournamentRegistration reg2 = new TournamentRegistration();
    reg2.setTournament(tournament);
    reg2.setTeam(team2);
    TournamentRegistration reg3 = new TournamentRegistration();
    reg3.setTournament(tournament);
    reg3.setTeam(team3);
    TournamentRegistration reg4 = new TournamentRegistration();
    reg4.setTournament(tournament);
    reg4.setTeam(team4);
    TournamentRegistration reg5 = new TournamentRegistration();
    reg5.setTournament(tournament);
    reg5.setTeam(team5);
    TournamentRegistration reg6 = new TournamentRegistration();
    reg6.setTournament(tournament);
    reg6.setTeam(team6);
    TournamentRegistration reg7 = new TournamentRegistration();
    reg7.setTournament(tournament);
    reg7.setTeam(team7);
    TournamentRegistration reg8 = new TournamentRegistration();
    reg8.setTournament(tournament);
    reg8.setTeam(team8);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of());
    when(registrationRepository.findByTournament(tournament)).thenReturn(
      List.of(reg1, reg2, reg3, reg4, reg5, reg6, reg7, reg8));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDate.now().atTime(23, 40),
        60
    );

    assertTrue(result.isEmpty());
  }

  @Test
  void generateEliminationBracket_startDayAndOddTeams_createsByeMatch() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now());
    tournament.setEndInscriptionDate(LocalDate.now().minusDays(1));
    tournament.setEndDate(LocalDate.now().plusDays(2));

    Team team1 = new Team();
    team1.setName("Team One");
    Team team2 = new Team();
    team2.setName("Team Two");
    Team team3 = new Team();
    team3.setName("Team Three");

    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);
    TournamentRegistration reg2 = new TournamentRegistration();
    reg2.setTournament(tournament);
    reg2.setTeam(team2);
    TournamentRegistration reg3 = new TournamentRegistration();
    reg3.setTournament(tournament);
    reg3.setTeam(team3);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of());
    when(registrationRepository.findByTournament(tournament)).thenReturn(List.of(reg1, reg2, reg3));
    when(matchRepository.save(any(Match.class))).thenAnswer(i -> i.getArgument(0));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isPresent());
    assertEquals(3, result.get().size());
    assertEquals(1, result.get().stream().filter(m -> m.getState() == StateMatch.ENDED).count());
    verify(participationRepository, times(4)).save(any());
  }

  @Test
  void generateEliminationBracket_fourTeams_coversNullTeamParticipationGuard() {
    tournament.setState(State.PLANIFIED);
    tournament.setStartDate(LocalDate.now());
    tournament.setEndInscriptionDate(LocalDate.now().minusDays(1));
    tournament.setEndDate(LocalDate.now().plusDays(2));

    Team team1 = new Team();
    team1.setName("Team One");
    Team team2 = new Team();
    team2.setName("Team Two");
    Team team3 = new Team();
    team3.setName("Team Three");
    Team team4 = new Team();
    team4.setName("Team Four");

    TournamentRegistration reg1 = new TournamentRegistration();
    reg1.setTournament(tournament);
    reg1.setTeam(team1);
    TournamentRegistration reg2 = new TournamentRegistration();
    reg2.setTournament(tournament);
    reg2.setTeam(team2);
    TournamentRegistration reg3 = new TournamentRegistration();
    reg3.setTournament(tournament);
    reg3.setTeam(team3);
    TournamentRegistration reg4 = new TournamentRegistration();
    reg4.setTournament(tournament);
    reg4.setTeam(team4);

    when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of());
    when(registrationRepository.findByTournament(tournament))
        .thenReturn(List.of(reg1, reg2, reg3, reg4));
    when(matchRepository.save(any(Match.class))).thenAnswer(i -> i.getArgument(0));

    Optional<List<Match>> result = matchService.generateEliminationBracket(
        1L,
        admin,
        LocalDateTime.now().plusHours(1),
        60
    );

    assertTrue(result.isPresent());
    assertEquals(3, result.get().size());
    verify(participationRepository, times(4)).save(any());
  }
}