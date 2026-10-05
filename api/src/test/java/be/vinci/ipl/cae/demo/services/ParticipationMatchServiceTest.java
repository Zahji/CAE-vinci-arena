package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.dtos.ParticipationMatchCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.ParticipationMatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatchId;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ParticipationMatchServiceTest {

  @Mock
  private ParticipationMatchRepository repository;
  @Mock
  private MatchRepository matchRepository;
  @Mock
  private TeamRepository teamRepository;
  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private ParticipationMatchService service;

  private Match match;
  private Team team;
  private ParticipationMatch participation;
  private User admin;
  private Tournament tournament;

  @BeforeEach
  void setUp() {
    // Setup admin
    admin = new User();
    ReflectionTestUtils.setField(admin, "id", 99L);

    // Setup tournament
    tournament = new Tournament();
    ReflectionTestUtils.setField(tournament, "id", 1L);
    tournament.setName("Test Tournament");

    // Setup match
    match = new Match();
    ReflectionTestUtils.setField(match, "matchId", 1L);
    match.setState(StateMatch.ENDED);
    match.setRound(1L);
    match.setAdmin(admin);
    match.setTournament(tournament);

    // Setup team
    team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    team.setName("TEAM_ALPHA");
    team.setManager(admin);

    // Setup participation
    participation = new ParticipationMatch();
    participation.setMatch(match);
    participation.setTeam(team);
    participation.setScore(10);
    participation.setDeclaredForfeit(false);
    participation.setStatusSelection(0);
    participation.setMotifRefuse(null);

    // Default timestamp for contest window tests
    match.setScoreUpdatedAt(LocalDateTime.now().minusMinutes(30));
  }

  // =============================================================================
  // GETTERS
  // =============================================================================

  @Test
  void getParticipationsByMatchReturnsListWithCorrectFields() {
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation));

    List<ParticipationMatchDto> result = service.getParticipationsByMatch(1L);

    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals(1L, result.getFirst().getMatchId());
    assertEquals(10L, result.getFirst().getTeamId());
    assertEquals("TEAM_ALPHA", result.getFirst().getTeamName());
  }

  @Test
  void getParticipationsByMatchReturnsEmptyListWhenNoParticipations() {
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of());

    List<ParticipationMatchDto> result = service.getParticipationsByMatch(1L);

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  void getParticipationsByTeamReturnsListForTeam() {
    when(repository.findByTeamId(10L)).thenReturn(List.of(participation));

    List<ParticipationMatchDto> result = service.getParticipationsByTeam(10L);

    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals(10L, result.getFirst().getTeamId());
  }

  @Test
  void getParticipationsByTeamReturnsEmptyListWhenNone() {
    when(repository.findByTeamId(10L)).thenReturn(List.of());
    assertTrue(service.getParticipationsByTeam(10L).isEmpty());
  }

  @Test
  void getParticipationReturnsParticipationWhenFound() {
    when(repository.findById(new ParticipationMatchId(1L, 10L)))
        .thenReturn(Optional.of(participation));

    Optional<ParticipationMatchDto> result = service.getParticipation(1L, 10L);

    assertTrue(result.isPresent());
    assertEquals("TEAM_ALPHA", result.get().getTeamName());
  }

  @Test
  void getParticipationReturnsEmptyWhenNotFound() {
    when(repository.findById(any())).thenReturn(Optional.empty());
    assertTrue(service.getParticipation(1L, 10L).isEmpty());
  }

  // =============================================================================
  // CREATE PARTICIPATION
  // =============================================================================

  @Test
  void createParticipationSuccessfullyCreatesAndSaves() {
    ParticipationMatchCreateDto dto = new ParticipationMatchCreateDto();
    dto.setMatchId(1L);
    dto.setTeamId(10L);

    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(repository.findById(any())).thenReturn(Optional.empty());
    when(repository.save(any())).thenReturn(participation);

    Optional<ParticipationMatchDto> result = service.createParticipation(dto);

    assertTrue(result.isPresent());
    verify(repository).save(any());
  }

  @Test
  void createParticipationReturnsEmptyWhenMatchNotFound() {
    ParticipationMatchCreateDto dto = new ParticipationMatchCreateDto();
    dto.setMatchId(99L);
    dto.setTeamId(10L);

    when(matchRepository.findById(99L)).thenReturn(Optional.empty());

    assertTrue(service.createParticipation(dto).isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void createParticipationReturnsEmptyWhenTeamNotFound() {
    ParticipationMatchCreateDto dto = new ParticipationMatchCreateDto();
    dto.setMatchId(1L);
    dto.setTeamId(99L);

    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(teamRepository.findById(99L)).thenReturn(Optional.empty());

    assertTrue(service.createParticipation(dto).isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void createParticipationReturnsEmptyWhenAlreadyExists() {
    ParticipationMatchCreateDto dto = new ParticipationMatchCreateDto();
    dto.setMatchId(1L);
    dto.setTeamId(10L);

    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(repository.findById(any())).thenReturn(Optional.of(participation));

    assertTrue(service.createParticipation(dto).isEmpty());
    verify(repository, never()).save(any());
  }

  // =============================================================================
  // UPDATE SCORE - SUCCESS CASES
  // =============================================================================

  @Test
  void updateScore_ongoing_firstTeamSetsScore_keepsOngoing() {
    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, null);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(new ParticipationMatchId(1L, 10L))).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    Optional<ParticipationMatchDto> result = service.updateScore(1L, 10L, 3);

    assertTrue(result.isPresent());
    assertEquals(3, participation.getScore());
    assertNotNull(match.getScoreUpdatedAt());
    assertEquals(StateMatch.ONGOING, match.getState());
    verify(matchRepository).save(match);
  }

  @Test
  void updateScore_ongoing_secondTeamSetsScore_endsMatch() {
    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    Optional<ParticipationMatchDto> result = service.updateScore(1L, 10L, 3);

    assertTrue(result.isPresent());
    assertEquals(3, participation.getScore());
    assertEquals(StateMatch.ENDED, match.getState());
    verify(matchRepository).save(match);
  }

  @Test
  void updateScore_contested_firstTeamSetsScore_keepsContested() {
    match.setState(StateMatch.CONTESTED);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, null);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    Optional<ParticipationMatchDto> result = service.updateScore(1L, 10L, 3);

    assertTrue(result.isPresent());
    assertEquals(StateMatch.CONTESTED, match.getState());
    verify(matchRepository).save(match);
  }

  @Test
  void updateScore_contested_secondTeamSetsScore_endsMatch() {
    match.setState(StateMatch.CONTESTED);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    Optional<ParticipationMatchDto> result = service.updateScore(1L, 10L, 3);

    assertTrue(result.isPresent());
    assertEquals(StateMatch.ENDED, match.getState());
    verify(matchRepository).save(match);
  }

  @Test
  void updateScore_planified_returnsEmpty() {
    match.setState(StateMatch.PLANIFIED);
    participation.setScore(null);

    when(repository.findById(any())).thenReturn(Optional.of(participation));

    Optional<ParticipationMatchDto> result = service.updateScore(1L, 10L, 3);

    assertTrue(result.isEmpty());
    assertNull(participation.getScore());
    assertEquals(StateMatch.PLANIFIED, match.getState());
    verify(matchRepository, never()).save(any());
  }

  @Test
  void updateScore_setsScoreUpdatedAtOnlyOnFirstCall() {
    match.setState(StateMatch.ONGOING);
    match.setScoreUpdatedAt(null);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, null);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    // First call
    service.updateScore(1L, 10L, 5);
    LocalDateTime firstTimestamp = match.getScoreUpdatedAt();
    assertNotNull(firstTimestamp);

    // Second call - timestamp should NOT change
    service.updateScore(1L, 10L, 10);
    assertEquals(firstTimestamp, match.getScoreUpdatedAt());
  }

  // =============================================================================
  // UPDATE SCORE - FAILURE CASES
  // =============================================================================

  @Test
  void updateScoreReturnsEmptyWhenParticipationNotFound() {
    when(repository.findById(any())).thenReturn(Optional.empty());
    assertTrue(service.updateScore(1L, 10L, 3).isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void updateScoreReturnsEmptyWhenMatchIsEnded() {
    match.setState(StateMatch.ENDED);
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    assertTrue(service.updateScore(1L, 10L, 3).isEmpty());
    verify(repository, never()).save(any());
    verify(matchRepository, never()).save(any());
  }

  // =============================================================================
  // UPDATE SCORE - NOTIFICATIONS
  // =============================================================================

  @Test
  void updateScore_notifiesWhenMatchEnds() {
    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    service.updateScore(1L, 10L, 3);

    verify(notificationService).createNotification(
        eq(admin),
        argThat(dto -> dto.getObject().equals("Score enregistré"))
    );
  }

  @Test
  void updateScore_doesNotNotifyWhenMatchStaysOngoing() {
    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, null);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    service.updateScore(1L, 10L, 3);

    verify(notificationService, never()).createNotification(any(), any());
  }

  @Test
  void updateScore_whenMatchEnds_advancesWinnerToNextRound() {
    match.setRound(1L);
    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    Match nextRoundMatch = new Match();
    ReflectionTestUtils.setField(nextRoundMatch, "matchId", 2L);
    nextRoundMatch.setTournament(tournament);
    nextRoundMatch.setRound(2L);

    ParticipationMatch other = createOtherParticipation(20L, 5);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findByMatchMatchId(2L)).thenReturn(List.of());
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of(match, nextRoundMatch));
    when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    service.updateScore(1L, 10L, 7);

    verify(repository).save(argThat(saved ->
        saved.getMatch() != null
            && saved.getMatch().getMatchId().equals(2L)
            && saved.getTeam() != null
            && saved.getTeam().getId().equals(10L)
    ));
  }

  @Test
  void updateScore_whenWinnerAlreadyInNextRound_doesNotDuplicate() {
    match.setRound(1L);
    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    Match nextRoundMatch = new Match();
    ReflectionTestUtils.setField(nextRoundMatch, "matchId", 2L);
    nextRoundMatch.setTournament(tournament);
    nextRoundMatch.setRound(2L);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    ParticipationMatch alreadyQualified = new ParticipationMatch();
    alreadyQualified.setMatch(nextRoundMatch);
    alreadyQualified.setTeam(team);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findByMatchMatchId(2L)).thenReturn(List.of(alreadyQualified));
    when(matchRepository.findByTournamentId(1L)).thenReturn(List.of(match, nextRoundMatch));
    when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    service.updateScore(1L, 10L, 7);

    verify(repository, never()).save(argThat(saved ->
        saved.getMatch() != null
            && saved.getMatch().getMatchId().equals(2L)
            && saved.getTeam() != null
            && saved.getTeam().getId().equals(10L)
    ));
  }

  // =============================================================================
  // CONTEST SCORE - SUCCESS CASES
  // =============================================================================

  @Test
  void contestScoreSuccessfullySetsReasonAndChangesStateToContested() {
    match.setState(StateMatch.ENDED);
    participation.setScore(10);
    participation.setMotifRefuse(null);
    match.setScoreUpdatedAt(LocalDateTime.now().minusMinutes(90));

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.save(any())).thenReturn(participation);

    Optional<ParticipationMatchDto> result = service.contestScore(1L, 10L, "Wrong score");

    assertTrue(result.isPresent());
    assertEquals("Wrong score", participation.getMotifRefuse());
    assertEquals(StateMatch.CONTESTED, match.getState());
    verify(matchRepository).save(match);
  }

  @Test
  void contestScoreResetsAllScoresToNull() {
    match.setState(StateMatch.ENDED);
    participation.setScore(10);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.save(any())).thenReturn(participation);

    service.contestScore(1L, 10L, "Wrong score");

    assertNull(participation.getScore());
    assertNull(other.getScore());
    verify(repository, times(3)).save(any(ParticipationMatch.class));
    verify(matchRepository).save(match);
  }

  @Test
  void contestScoreDoesNotResetScoreUpdatedAt() {
    match.setState(StateMatch.ENDED);
    participation.setScore(10);
    LocalDateTime originalTimestamp = LocalDateTime.now().minusMinutes(30);
    match.setScoreUpdatedAt(originalTimestamp);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.save(any())).thenReturn(participation);

    service.contestScore(1L, 10L, "reason");

    assertEquals(originalTimestamp, match.getScoreUpdatedAt());
    verify(matchRepository).save(match);
  }

  @Test
  void contestScore_notifiesParticipants() {
    match.setState(StateMatch.ENDED);
    participation.setScore(10);
    match.setScoreUpdatedAt(LocalDateTime.now().minusMinutes(30));

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.save(any())).thenReturn(participation);

    service.contestScore(1L, 10L, "Wrong score");

    verify(notificationService).createNotification(
        eq(admin),
        argThat(dto -> dto.getObject().equals("Score contesté"))
    );
  }

  // =============================================================================
  // CONTEST SCORE - FAILURE CASES
  // =============================================================================

  @Test
  void contestScoreReturnsEmptyWhenParticipationNotFound() {
    when(repository.findById(any())).thenReturn(Optional.empty());
    assertTrue(service.contestScore(1L, 10L, "reason").isEmpty());
  }

  @Test
  void contestScoreReturnsEmptyWhenReasonIsNull() {
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    assertTrue(service.contestScore(1L, 10L, null).isEmpty());
  }

  @Test
  void contestScoreReturnsEmptyWhenReasonIsBlank() {
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    assertTrue(service.contestScore(1L, 10L, "   ").isEmpty());
  }

  @Test
  void contestScoreReturnsEmptyWhenAlreadyContested() {
    participation.setMotifRefuse("Already contested");
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    assertTrue(service.contestScore(1L, 10L, "Another reason").isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void contestScoreReturnsEmptyWhenMatchNotEnded() {
    match.setState(StateMatch.ONGOING);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));

    assertTrue(service.contestScore(1L, 10L, "reason").isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void contestScoreReturnsEmptyWhenScoreUpdatedAtIsNull() {
    match.setScoreUpdatedAt(null);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));

    assertTrue(service.contestScore(1L, 10L, "reason").isEmpty());
  }

  @Test
  void contestScoreReturnsEmptyWhenOutside2HourWindow() {
    match.setScoreUpdatedAt(LocalDateTime.now().minusMinutes(121));

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));

    assertTrue(service.contestScore(1L, 10L, "reason").isEmpty());
  }

  @Test
  void contestScoreSucceedsExactlyAt2HourBoundary() {
    match.setScoreUpdatedAt(LocalDateTime.now().minusMinutes(120));

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.save(any())).thenReturn(participation);

    Optional<ParticipationMatchDto> result = service.contestScore(1L, 10L, "reason");

    assertTrue(result.isPresent());
  }

  @Test
  void contestScoreReturnsEmptyWhenTeamHasDeclaredForfeit() {
    match.setState(StateMatch.ENDED);
    participation.setScore(10);
    participation.setDeclaredForfeit(true); // forfeited team tries to contest

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));

    assertTrue(service.contestScore(1L, 10L, "reason").isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void contestScoreReturnsEmptyWhenOtherTeamHasDeclaredForfeit() {
    match.setState(StateMatch.ENDED);
    participation.setScore(10);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(true); // other team forfeited

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));

    assertTrue(service.contestScore(1L, 10L, "reason").isEmpty());
    verify(repository, never()).save(any());
  }

  // =============================================================================
  // DECLARE FORFEIT - SUCCESS CASES
  // =============================================================================

  @Test
  void declareForfeitSuccessfullyEndsOngoingMatchAndAdvancesWinner() {
    Team forfeitingTeam = new Team();
    ReflectionTestUtils.setField(forfeitingTeam, "id", 10L);
    forfeitingTeam.setName("TEAM_ALPHA");

    Team winningTeam = new Team();
    ReflectionTestUtils.setField(winningTeam, "id", 20L);
    winningTeam.setName("TEAM_BETA");

    Match nextRoundMatch = new Match();
    ReflectionTestUtils.setField(nextRoundMatch, "matchId", 2L);
    nextRoundMatch.setRound(2L);
    nextRoundMatch.setState(StateMatch.PLANIFIED);
    nextRoundMatch.setTournament(tournament);

    match.setState(StateMatch.ONGOING);

    ParticipationMatch forfeitingParticipation = new ParticipationMatch();
    forfeitingParticipation.setMatch(match);
    forfeitingParticipation.setTeam(forfeitingTeam);
    forfeitingParticipation.setScore(null);
    forfeitingParticipation.setDeclaredForfeit(false);

    ParticipationMatch winningParticipation = new ParticipationMatch();
    winningParticipation.setMatch(match);
    winningParticipation.setTeam(winningTeam);
    winningParticipation.setScore(null);
    winningParticipation.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(forfeitingParticipation));
    when(repository.findByMatchMatchId(1L))
        .thenReturn(List.of(forfeitingParticipation, winningParticipation));
    when(repository.findByMatchMatchId(2L)).thenReturn(List.of());
    when(matchRepository.findByTournamentId(1L))
        .thenReturn(List.of(match, nextRoundMatch));
    when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    Optional<ParticipationMatchDto> result = service.declareForfeit(1L, 10L, true);

    assertTrue(result.isPresent());
    assertTrue(forfeitingParticipation.getDeclaredForfeit());
    assertEquals(0, forfeitingParticipation.getScore());
    assertEquals(5, winningParticipation.getScore());
    assertEquals(StateMatch.ENDED, match.getState());
    verify(repository, times(3)).save(any());
    verify(matchRepository).save(match);
  }

  @Test
  void declareForfeitSuccessfullySetsAndSaves() {
    match.setState(StateMatch.PLANIFIED);

    ParticipationMatch other = createOtherParticipation(20L, null);
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    Optional<ParticipationMatchDto> result = service.declareForfeit(1L, 10L, true);

    assertTrue(result.isPresent());
    assertTrue(participation.getDeclaredForfeit());
    assertEquals(0, participation.getScore());
    assertEquals(StateMatch.ENDED, match.getState());
  }

  @Test
  void declareForfeit_canUndoForfeit() {
    match.setState(StateMatch.PLANIFIED);
    participation.setDeclaredForfeit(true);

    when(repository.findById(any())).thenReturn(Optional.of(participation));

    Optional<ParticipationMatchDto> result = service.declareForfeit(1L, 10L, false);

    assertTrue(result.isEmpty());
    verify(repository, never()).save(any());
  }

  // =============================================================================
  // DECLARE FORFEIT - FAILURE CASES
  // =============================================================================

  @Test
  void declareForfeitReturnsEmptyWhenParticipationNotFound() {
    when(repository.findById(any())).thenReturn(Optional.empty());
    assertTrue(service.declareForfeit(1L, 10L, true).isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void declareForfeitReturnsEmptyWhenMatchIsNotPlanified() {
    match.setState(StateMatch.CONTESTED);

    when(repository.findById(any())).thenReturn(Optional.of(participation));

    assertTrue(service.declareForfeit(1L, 10L, true).isEmpty());
    verify(repository, never()).save(any());
  }

  @Test
  void declareForfeitReturnsEmptyWhenMatchIsEnded() {
    match.setState(StateMatch.ENDED);

    when(repository.findById(any())).thenReturn(Optional.of(participation));

    assertTrue(service.declareForfeit(1L, 10L, true).isEmpty());
    verify(repository, never()).save(any());
  }

  // =============================================================================
  // NOTIFICATIONS
  // =============================================================================

  @Test
  void updateScore_notifiesSecondManagerWhenMatchEnds() {
    User secondManager = new User();
    ReflectionTestUtils.setField(secondManager, "id", 100L);
    team.setSecondManager(secondManager);

    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    service.updateScore(1L, 10L, 3);

    verify(notificationService).createNotification(
        eq(admin),
        argThat(dto -> dto.getObject().equals("Score enregistré"))
    );
    verify(notificationService).createNotification(
        eq(secondManager),
        argThat(dto -> dto.getObject().equals("Score enregistré"))
    );
  }

  @Test
  void contestScore_notifiesSecondManager() {
    User secondManager = new User();
    ReflectionTestUtils.setField(secondManager, "id", 100L);
    team.setSecondManager(secondManager);

    match.setState(StateMatch.ENDED);
    participation.setScore(10);
    match.setScoreUpdatedAt(LocalDateTime.now().minusMinutes(30));

    ParticipationMatch other = createOtherParticipation(20L, 5);
    other.setDeclaredForfeit(false);

    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.save(any())).thenReturn(participation);

    service.contestScore(1L, 10L, "Wrong score");

    verify(notificationService).createNotification(
        eq(admin),
        argThat(dto -> dto.getObject().equals("Score contesté"))
    );
    verify(notificationService).createNotification(
        eq(secondManager),
        argThat(dto -> dto.getObject().equals("Score contesté"))
    );
  }

  @Test
  void notifyMatchParticipants_doesNotNotifyNullSecondManager() {
    team.setSecondManager(null);

    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    ParticipationMatch other = createOtherParticipation(20L, 5);
    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, other));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    service.updateScore(1L, 10L, 3);

    verify(notificationService).createNotification(
        eq(admin),
        argThat(dto -> dto.getObject().equals("Score enregistré"))
    );
    verify(notificationService, never()).createNotification(isNull(), any());
  }

  @Test
  void notifyMatchParticipants_notifiesAllManagersAndSecondManagers() {
    User team1Second = new User();
    ReflectionTestUtils.setField(team1Second, "id", 101L);
    team.setSecondManager(team1Second);

    Team team2 = new Team();
    ReflectionTestUtils.setField(team2, "id", 20L);
    User team2Manager = new User();
    ReflectionTestUtils.setField(team2Manager, "id", 201L);
    User team2Second = new User();
    ReflectionTestUtils.setField(team2Second, "id", 202L);
    team2.setManager(team2Manager);
    team2.setSecondManager(team2Second);

    ParticipationMatch p2 = new ParticipationMatch();
    p2.setMatch(match);
    p2.setTeam(team2);
    p2.setScore(5);
    p2.setDeclaredForfeit(false);

    match.setState(StateMatch.ONGOING);
    participation.setScore(null);

    when(repository.findByMatchMatchId(1L)).thenReturn(List.of(participation, p2));
    when(repository.findById(any())).thenReturn(Optional.of(participation));
    when(repository.save(any())).thenReturn(participation);

    service.updateScore(1L, 10L, 3);

    verify(notificationService).createNotification(eq(admin), any());
    verify(notificationService).createNotification(eq(team1Second), any());
    verify(notificationService).createNotification(eq(team2Manager), any());
    verify(notificationService).createNotification(eq(team2Second), any());
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private ParticipationMatch createOtherParticipation(Long teamId, Integer score) {
    ParticipationMatch other = new ParticipationMatch();
    Team otherTeam = new Team();
    ReflectionTestUtils.setField(otherTeam, "id", teamId);
    otherTeam.setName("TEAM_" + teamId);
    other.setTeam(otherTeam);
    other.setMatch(match);
    other.setScore(score);
    other.setDeclaredForfeit(false);
    other.setStatusSelection(0);
    return other;
  }
}