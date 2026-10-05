package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.dtos.TeamActivityDto;
import be.vinci.ipl.cae.demo.models.dtos.TournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistration;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.models.results.TournamentRegistrationResult;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TournamentRegistrationServiceTest {

  @Mock
  private TournamentRegistrationRepository tournamentRegistrationRepository;

  @Mock
  private TeamService teamService;

  @InjectMocks
  private TournamentRegistrationService tournamentRegistrationService;

  private Tournament openTournament;
  private Team activeTeam;
  private User manager;

  @BeforeEach
  void setUp() {
    manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);

    activeTeam = new Team();
    ReflectionTestUtils.setField(activeTeam, "id", 10L);
    activeTeam.setName("TEAM_ALPHA");
    activeTeam.setManager(manager);

    openTournament = new Tournament();
    ReflectionTestUtils.setField(openTournament, "id", 100L);
    openTournament.setName("Spring Cup");
    openTournament.setState(State.PLANIFIED);
    openTournament.setMaxTeams(8);
  }

  @Test
  void registerTeamFailsWhenTeamHasNoManager() {
    activeTeam.setManager(null);

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, manager);

    assertFalse(r.success());
    assertEquals("Cette team n'a pas de responsable principal", r.errorMessage());
  }

  @Test
  void registerTeamFailsWhenUserIsNotPrimaryManager() {
    User otherUser = new User();
    ReflectionTestUtils.setField(otherUser, "id", 99L);

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, otherUser);

    assertFalse(r.success());
    assertEquals("Seul le responsable principal ou secondaire peut inscrire la team",
        r.errorMessage());
  }

  @Test
  void registerTeamFailsWhenUserIsNeitherPrimaryNorSecondManager() {
    User secondManager = new User();
    ReflectionTestUtils.setField(secondManager, "id", 2L);
    activeTeam.setSecondManager(secondManager);

    User otherUser = new User();
    ReflectionTestUtils.setField(otherUser, "id", 99L);

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, otherUser);

    assertFalse(r.success());
    assertEquals("Seul le responsable principal ou secondaire peut inscrire la team",
        r.errorMessage());
  }

  @Test
  void registerTeamFailsWhenTournamentIsNotPlanified() {
    openTournament.setState(State.IN_PREPARATION);

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, manager);

    assertFalse(r.success());
    assertEquals("Les inscriptions ne sont pas ouvertes pour ce tournoi", r.errorMessage());
  }

  @Test
  void registerTeamFailsWhenRegistrationPeriodIsFinished() {
    openTournament.setEndInscriptionDate(LocalDate.now().minusDays(1));

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, manager);

    assertFalse(r.success());
    assertEquals("La période d'inscription est finie", r.errorMessage());
    assertTrue(r.conflict());
  }

  @Test
  void registerTeamFailsWhenTeamHasNotEnoughMembers() {
    when(teamService.getManagersCount(activeTeam)).thenReturn(1);
    when(teamService.getAcceptedMembersCount(activeTeam)).thenReturn(2);

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, manager);

    assertFalse(r.success());
    assertEquals("La team doit avoir au moins 4 membres pour s'inscrire", r.errorMessage());
  }

  @Test
  void registerTeamFailsWhenTeamIsAlreadyRegistered() {
    when(teamService.getManagersCount(activeTeam)).thenReturn(1);
    when(teamService.getAcceptedMembersCount(activeTeam)).thenReturn(3);
    when(tournamentRegistrationRepository.existsByTournamentAndTeam(openTournament, activeTeam))
        .thenReturn(true);

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, manager);

    assertFalse(r.success());
    assertEquals("Cette team est déjà inscrite à ce tournoi", r.errorMessage());
  }

  @Test
  void registerTeamThrowsWhenTournamentIsFull() {
    when(teamService.getManagersCount(activeTeam)).thenReturn(1);
    when(teamService.getAcceptedMembersCount(activeTeam)).thenReturn(3);
    when(tournamentRegistrationRepository.existsByTournamentAndTeam(openTournament, activeTeam))
        .thenReturn(false);
    when(tournamentRegistrationRepository.findByTournament(openTournament))
        .thenReturn(List.of(new TournamentRegistration(), new TournamentRegistration(),
            new TournamentRegistration(), new TournamentRegistration(),
            new TournamentRegistration(), new TournamentRegistration(),
            new TournamentRegistration(), new TournamentRegistration()));

    TournamentRegistrationResult r =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, manager);

    assertFalse(r.success());
    assertEquals("Ce tournoi a atteint le nombre maximum d'équipes", r.errorMessage());
  }

  @Test
  void registerTeamSucceedsWhenSecondManagerRegisters() {
    User secondManager = new User();
    ReflectionTestUtils.setField(secondManager, "id", 2L);
    activeTeam.setSecondManager(secondManager);

    when(teamService.getManagersCount(activeTeam)).thenReturn(1);
    when(teamService.getAcceptedMembersCount(activeTeam)).thenReturn(3);
    when(tournamentRegistrationRepository.existsByTournamentAndTeam(openTournament, activeTeam))
        .thenReturn(false);
    when(tournamentRegistrationRepository.findByTournament(openTournament))
        .thenReturn(List.of());

    TournamentRegistration saved = buildRegistration(openTournament, activeTeam);
    when(tournamentRegistrationRepository.save(any(TournamentRegistration.class)))
        .thenReturn(saved);

    TournamentRegistrationResult outcome =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, secondManager);

    assertTrue(outcome.success());
    TournamentRegistrationDto result = outcome.registration();
    assertEquals(100L, result.tournamentId());
    assertEquals("Spring Cup", result.tournamentName());
    assertEquals(10L, result.teamId());
    assertEquals("TEAM_ALPHA", result.teamName());
    verify(tournamentRegistrationRepository).save(any(TournamentRegistration.class));
  }

  @Test
  void registerTeamSavesAndReturnsDtoOnSuccess() {
    when(teamService.getManagersCount(activeTeam)).thenReturn(1);
    when(teamService.getAcceptedMembersCount(activeTeam)).thenReturn(3);
    when(tournamentRegistrationRepository.existsByTournamentAndTeam(openTournament, activeTeam))
        .thenReturn(false);
    when(tournamentRegistrationRepository.findByTournament(openTournament))
        .thenReturn(List.of());

    TournamentRegistration saved = buildRegistration(openTournament, activeTeam);
    when(tournamentRegistrationRepository.save(any(TournamentRegistration.class)))
        .thenReturn(saved);

    TournamentRegistrationResult outcome =
        tournamentRegistrationService.registerTeam(openTournament, activeTeam, manager);

    assertTrue(outcome.success());
    TournamentRegistrationDto result = outcome.registration();
    assertEquals(100L, result.tournamentId());
    assertEquals("Spring Cup", result.tournamentName());
    assertEquals(10L, result.teamId());
    assertEquals("TEAM_ALPHA", result.teamName());
    verify(tournamentRegistrationRepository).save(any(TournamentRegistration.class));
  }

  @Test
  void getRegistrationsReturnsDtosForTournament() {
    TournamentRegistration registration = buildRegistration(openTournament, activeTeam);
    when(tournamentRegistrationRepository.findByTournament(openTournament))
        .thenReturn(List.of(registration));

    List<TournamentRegistrationDto> result =
        tournamentRegistrationService.getRegistrations(openTournament);

    assertEquals(1, result.size());
    assertEquals(100L, result.getFirst().tournamentId());
    assertEquals(10L, result.getFirst().teamId());
  }

  @Test
  void getRegistrationsByTeamReturnsDtosForTeam() {
    TournamentRegistration registration = buildRegistration(openTournament, activeTeam);
    when(tournamentRegistrationRepository.findByTeam(activeTeam))
        .thenReturn(List.of(registration));

    List<TournamentRegistrationDto> result =
        tournamentRegistrationService.getRegistrationsByTeam(activeTeam);

    assertEquals(1, result.size());
    assertEquals(100L, result.getFirst().tournamentId());
    assertEquals(10L, result.getFirst().teamId());
  }

  @Test
  void getTeamActivityReturnsDtosWithDatesForTeam() {
    openTournament.setStartDate(LocalDate.of(2026, 6, 1));
    openTournament.setEndDate(LocalDate.of(2026, 6, 3));

    TournamentRegistration registration = buildRegistration(openTournament, activeTeam);
    when(tournamentRegistrationRepository.findByTeam(activeTeam))
        .thenReturn(List.of(registration));

    List<TeamActivityDto> result =
        tournamentRegistrationService.getTeamActivity(activeTeam);

    assertEquals(1, result.size());
    assertEquals(100L, result.getFirst().tournamentId());
    assertEquals("Spring Cup", result.getFirst().tournamentName());
    assertEquals(LocalDate.of(2026, 6, 1), result.getFirst().startDate());
    assertEquals(LocalDate.of(2026, 6, 3), result.getFirst().endDate());
  }

  private TournamentRegistration buildRegistration(Tournament tournament, Team team) {
    TournamentRegistration registration = new TournamentRegistration();
    registration.setTournament(tournament);
    registration.setTeam(team);
    return registration;
  }
}
