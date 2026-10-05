package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.schedulers.MatchScheduler;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MatchSchedulerTest {

  @Mock private MatchRepository matchRepository;
  @Mock private ParticipationMatchRepository participationRepository;
  @Mock private MatchService matchService;
  @Mock private ParticipationMatchService participationService;

  @InjectMocks private MatchScheduler scheduler;

  /* ---------- Helper factories ---------- */

  private Match mockMatch(Long id) {
    Match m = mock(Match.class);
    when(m.getMatchId()).thenReturn(id);
    return m;
  }

  private ParticipationMatch mockTeam(Long teamId, boolean declaredForfeit, int statusSelection) {
    ParticipationMatch pm = mock(ParticipationMatch.class);
    Team team = mock(Team.class);
    when(team.getId()).thenReturn(teamId);
    when(pm.getTeam()).thenReturn(team);
    when(pm.getDeclaredForfeit()).thenReturn(declaredForfeit);
    when(pm.getStatusSelection()).thenReturn(statusSelection);
    return pm;
  }

  private void givenMatchesToStart(List<Match> matches) {
    when(matchRepository.findByStateAndStartTimeBefore(
        eq(StateMatch.PLANIFIED), any(LocalDateTime.class)))
        .thenReturn(matches);
  }

  /* ---------- No matches ---------- */

  @Test
  void autoStartMatches_noMatches_doesNothing() {
    givenMatchesToStart(List.of());

    scheduler.autoStartMatches();

    verify(matchRepository).findByStateAndStartTimeBefore(
        eq(StateMatch.PLANIFIED), any(LocalDateTime.class));
    verifyNoInteractions(participationRepository, matchService, participationService);
  }

  /* ---------- Less than 2 teams ---------- */

  @Test
  void autoStartMatches_onlyOneTeam_endsMatchImmediately() {
    Match match = mockMatch(1L);
    ParticipationMatch team = mockTeam(10L, false, 5);
    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L))
        .thenReturn(List.of(team));

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verifyNoInteractions(participationService);
  }

  @Test
  void autoStartMatches_zeroTeams_endsMatchImmediately() {
    Match match = mockMatch(1L);
    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of());

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verifyNoInteractions(participationService);
  }

  /* ---------- Normal start ---------- */

  @Test
  void autoStartMatches_bothTeamsValid_startsMatch() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, false, 5);
    ParticipationMatch t2 = mockTeam(20L, false, 5);

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(match, StateMatch.ONGOING);
    verifyNoInteractions(participationService);
  }

  /* ---------- Single forfeit (already declared) ---------- */

  @Test
  void autoStartMatches_team1AlreadyForfeited_team2WinsWithoutSave() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, true, 5);   // already declared forfeit
    ParticipationMatch t2 = mockTeam(20L, false, 5);  // valid

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(participationService).updateScore(1L, 20L, 5);
    verify(participationService).updateScore(1L, 10L, null);
    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verify(participationRepository, never()).save(t1);
  }

  @Test
  void autoStartMatches_team2AlreadyForfeited_team1WinsWithoutSave() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, false, 5); // valid
    ParticipationMatch t2 = mockTeam(20L, true, 5);  // already declared forfeit

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(participationService).updateScore(1L, 10L, 5);
    verify(participationService).updateScore(1L, 20L, null);
    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verify(participationRepository, never()).save(t2);
  }

  /* ---------- Insufficient players (triggers save) ---------- */

  @Test
  void autoStartMatches_team1InsufficientPlayers_team2WinsAndSavesLoser() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, false, 0);  // 0 players selected
    ParticipationMatch t2 = mockTeam(20L, false, 5);  // valid

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(participationService).updateScore(1L, 20L, 5);
    verify(participationService).updateScore(1L, 10L, null);
    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verify(participationRepository).save(t1); // loser marked forfeit
  }

  @Test
  void autoStartMatches_team2InsufficientPlayers_team1WinsAndSavesLoser() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, false, 5);  // valid
    ParticipationMatch t2 = mockTeam(20L, false, 0);  // 0 players selected

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(participationService).updateScore(1L, 10L, 5);
    verify(participationService).updateScore(1L, 20L, null);
    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verify(participationRepository).save(t2);
  }

  /* ---------- Both invalid ---------- */

  @Test
  void autoStartMatches_bothForfeit_endsWithNoWinner() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, true, 5);
    ParticipationMatch t2 = mockTeam(20L, true, 5);

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verifyNoInteractions(participationService);
    verify(participationRepository, never()).save(any());
  }

  @Test
  void autoStartMatches_bothInsufficientPlayers_endsWithNoWinner() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, false, 0);
    ParticipationMatch t2 = mockTeam(20L, false, 0);

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verifyNoInteractions(participationService);
    verify(participationRepository, never()).save(any());
  }

  @Test
  void autoStartMatches_oneForfeitOneInsufficient_endsWithNoWinner() {
    Match match = mockMatch(1L);
    ParticipationMatch t1 = mockTeam(10L, true, 5);   // forfeit
    ParticipationMatch t2 = mockTeam(20L, false, 0);  // insufficient

    givenMatchesToStart(List.of(match));
    when(participationRepository.findByMatchMatchId(1L)).thenReturn(List.of(t1, t2));

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(match, StateMatch.ENDED);
    verifyNoInteractions(participationService);
    verify(participationRepository, never()).save(any());
  }

  /* ---------- Resilience ---------- */

  @Test
  void autoStartMatches_oneMatchThrows_othersStillProcess() {
    Match goodMatch = mockMatch(1L);
    Match badMatch = mockMatch(2L);
    ParticipationMatch t1 = mockTeam(10L, false, 5);
    ParticipationMatch t2 = mockTeam(20L, false, 5);

    givenMatchesToStart(List.of(goodMatch, badMatch));
    when(participationRepository.findByMatchMatchId(1L))
        .thenReturn(List.of(t1, t2));
    when(participationRepository.findByMatchMatchId(2L))
        .thenThrow(new RuntimeException("DB error"));

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(goodMatch, StateMatch.ONGOING);
  }

  /* ---------- Multiple matches ---------- */

  @Test
  void autoStartMatches_multipleMatches_allProcessed() {
    Match m1 = mockMatch(1L);
    Match m2 = mockMatch(2L);
    ParticipationMatch m1t1 = mockTeam(10L, false, 5);
    ParticipationMatch m1t2 = mockTeam(20L, false, 5);
    ParticipationMatch m2t1 = mockTeam(30L, false, 0);
    ParticipationMatch m2t2 = mockTeam(40L, false, 5);

    givenMatchesToStart(List.of(m1, m2));
    when(participationRepository.findByMatchMatchId(1L))
        .thenReturn(List.of(m1t1, m1t2));
    when(participationRepository.findByMatchMatchId(2L))
        .thenReturn(List.of(m2t1, m2t2));

    scheduler.autoStartMatches();

    verify(matchService).updateMatchState(m1, StateMatch.ONGOING);
    verify(matchService).updateMatchState(m2, StateMatch.ENDED);
    verify(participationService).updateScore(2L, 40L, 5);
    verify(participationService).updateScore(2L, 30L, null);
    verify(participationRepository).save(m2t1);
  }
}