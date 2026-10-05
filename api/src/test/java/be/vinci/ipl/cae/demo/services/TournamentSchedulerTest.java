package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.schedulers.TournamentScheduler;
import java.time.LocalDate;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TournamentSchedulerTest {

  @Mock private TournamentRepository tournamentRepository;

  @InjectMocks private TournamentScheduler scheduler;

  /* ---------- Helper factories ---------- */

  private Tournament mockTournament(Long id) {
    Tournament t = mock(Tournament.class);
    when(t.getId()).thenReturn(id);
    return t;
  }

  private void givenTournamentsToStart(List<Tournament> tournaments) {
    when(tournamentRepository.findByStateAndStartDateLessThanEqual(
        eq(State.PLANIFIED), any(LocalDate.class)))
        .thenReturn(tournaments);
  }

  private void givenTournamentsToEnd(List<Tournament> tournaments) {
    when(tournamentRepository.findByStateAndEndDateLessThan(
        eq(State.ONGOING), any(LocalDate.class)))
        .thenReturn(tournaments);
  }

  /* ---------- No tournaments ---------- */

  @Test
  void autoUpdateTournamentStates_noTournaments_doesNothing() {
    givenTournamentsToStart(List.of());
    givenTournamentsToEnd(List.of());

    scheduler.autoUpdateTournamentStates();

    verify(tournamentRepository, never()).save(any());
  }

  /* ---------- PLANIFIED → ONGOING ---------- */

  @Test
  void autoUpdateTournamentStates_planifiedTournamentDue_setsOngoing() {
    Tournament tournament = mockTournament(1L);
    givenTournamentsToStart(List.of(tournament));
    givenTournamentsToEnd(List.of());

    scheduler.autoUpdateTournamentStates();

    verify(tournament).setState(State.ONGOING);
    verify(tournamentRepository).save(tournament);
  }

  @Test
  void autoUpdateTournamentStates_multiplePlanifiedDue_allSetOngoing() {
    Tournament t1 = mockTournament(1L);
    Tournament t2 = mockTournament(2L);
    givenTournamentsToStart(List.of(t1, t2));
    givenTournamentsToEnd(List.of());

    scheduler.autoUpdateTournamentStates();

    verify(t1).setState(State.ONGOING);
    verify(t2).setState(State.ONGOING);
    verify(tournamentRepository).save(t1);
    verify(tournamentRepository).save(t2);
  }

  @Test
  void autoUpdateTournamentStates_noPlanifiedDue_noStartSave() {
    givenTournamentsToStart(List.of());
    givenTournamentsToEnd(List.of());

    scheduler.autoUpdateTournamentStates();

    verify(tournamentRepository, never()).save(any());
  }

  /* ---------- ONGOING → FINISHED ---------- */

  @Test
  void autoUpdateTournamentStates_ongoingTournamentPast_setsFinished() {
    Tournament tournament = mockTournament(1L);
    givenTournamentsToStart(List.of());
    givenTournamentsToEnd(List.of(tournament));

    scheduler.autoUpdateTournamentStates();

    verify(tournament).setState(State.FINISHED);
    verify(tournamentRepository).save(tournament);
  }

  @Test
  void autoUpdateTournamentStates_multipleOngoingPast_allSetFinished() {
    Tournament t1 = mockTournament(1L);
    Tournament t2 = mockTournament(2L);
    givenTournamentsToStart(List.of());
    givenTournamentsToEnd(List.of(t1, t2));

    scheduler.autoUpdateTournamentStates();

    verify(t1).setState(State.FINISHED);
    verify(t2).setState(State.FINISHED);
    verify(tournamentRepository).save(t1);
    verify(tournamentRepository).save(t2);
  }

  @Test
  void autoUpdateTournamentStates_noOngoingPast_noEndSave() {
    givenTournamentsToStart(List.of());
    givenTournamentsToEnd(List.of());

    scheduler.autoUpdateTournamentStates();

    verify(tournamentRepository, never()).save(any());
  }

  /* ---------- Both start and end in same run ---------- */

  @Test
  void autoUpdateTournamentStates_bothStartAndEnd_allProcessed() {
    Tournament toStart = mockTournament(1L);
    Tournament toEnd = mockTournament(2L);
    givenTournamentsToStart(List.of(toStart));
    givenTournamentsToEnd(List.of(toEnd));

    scheduler.autoUpdateTournamentStates();

    verify(toStart).setState(State.ONGOING);
    verify(toEnd).setState(State.FINISHED);
    verify(tournamentRepository).save(toStart);
    verify(tournamentRepository).save(toEnd);
  }

  /* ---------- Resilience ---------- */

  @Test
  void autoUpdateTournamentStates_oneStartThrows_othersStillProcess() {
    Tournament goodTournament = mockTournament(1L);
    Tournament badTournament = mockTournament(2L);
    givenTournamentsToStart(List.of(badTournament, goodTournament));
    givenTournamentsToEnd(List.of());

    when(tournamentRepository.save(badTournament))
        .thenThrow(new RuntimeException("DB error"));

    scheduler.autoUpdateTournamentStates();

    verify(goodTournament).setState(State.ONGOING);
    verify(tournamentRepository).save(goodTournament);
  }

  @Test
  void autoUpdateTournamentStates_oneEndThrows_othersStillProcess() {
    Tournament goodTournament = mockTournament(1L);
    Tournament badTournament = mockTournament(2L);
    givenTournamentsToStart(List.of());
    givenTournamentsToEnd(List.of(badTournament, goodTournament));

    when(tournamentRepository.save(badTournament))
        .thenThrow(new RuntimeException("DB error"));

    scheduler.autoUpdateTournamentStates();

    verify(goodTournament).setState(State.FINISHED);
    verify(tournamentRepository).save(goodTournament);
  }
}