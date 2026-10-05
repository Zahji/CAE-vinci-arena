package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.dtos.TournamentDto;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistration;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.SelectionMatch;
import be.vinci.ipl.cae.demo.repositories.SelectionMatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TournamentServiceTest {

  @Mock
  private TournamentRepository tournamentRepository;

  @Mock
  private TournamentRegistrationRepository tournamentRegistrationRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private SelectionMatchRepository selectionMatchRepository;

  @InjectMocks
  private TournamentService tournamentService;

  @Test
  void getAllTournamentsMapsAllRepositoryEntities() {
    Tournament firstTournament = buildTournament(1L, "Spring Clash", "Tournoi du printemps");
    Tournament secondTournament = buildTournament(2L, "Summer Clash", "Tournoi de l'été");

    when(tournamentRepository.findAll()).thenReturn(List.of(firstTournament, secondTournament));
    when(tournamentRegistrationRepository.countByTournament(any(Tournament.class))).thenReturn(0);

    List<TournamentDto> result = tournamentService.getAllTournaments(null, true);

    assertEquals(2, result.size());
    assertEquals("Spring Clash", result.getFirst().getName());
    assertEquals("Summer Clash", result.get(1).getName());
    assertEquals("Tournoi de l'été", result.get(1).getDescription());
    assertEquals(State.IN_PREPARATION, result.getFirst().getState());
    assertEquals("En préparation", result.getFirst().getStateDisplayName());
    verify(tournamentRepository).findAll();
    verify(tournamentRepository, never()).findByState(any(State.class));
  }

  @Test
  void getAllTournamentsFiltersByStateWhenRequested() {
    Tournament openTournament = buildTournament(8L, "Open Cup", "Tournoi ouvert");
    openTournament.setState(State.PLANIFIED);

    when(tournamentRepository.findByState(State.PLANIFIED)).thenReturn(List.of(openTournament));
    when(tournamentRegistrationRepository.countByTournament(any(Tournament.class))).thenReturn(0);

    List<TournamentDto> result = tournamentService.getAllTournaments(State.PLANIFIED, true);

    assertEquals(1, result.size());
    assertEquals("Open Cup", result.getFirst().getName());
    assertEquals(State.PLANIFIED, result.getFirst().getState());
    assertEquals("Planifié", result.getFirst().getStateDisplayName());
    verify(tournamentRepository).findByState(State.PLANIFIED);
    verify(tournamentRepository, never()).findAll();
  }

  @Test
  void getTournamentByIdReturnsDtoWhenTournamentExists() {
    Tournament tournament = buildTournament(3L, "Autumn Cup", "Tournoi d'automne");
    when(tournamentRepository.findById(3L)).thenReturn(Optional.of(tournament));
    when(tournamentRegistrationRepository.countByTournament(tournament)).thenReturn(0);

    TournamentDto result = tournamentService.getTournamentById(3L, true);

    assertEquals(3L, result.getId());
    assertEquals("Autumn Cup", result.getName());
    assertEquals("Tournoi d'automne", result.getDescription());
    assertEquals(State.IN_PREPARATION, result.getState());
    assertEquals("En préparation", result.getStateDisplayName());
  }

  @Test
  void getTournamentByIdReturnsNullWhenTournamentDoesNotExist() {
    when(tournamentRepository.findById(99L)).thenReturn(Optional.empty());

    TournamentDto result = tournamentService.getTournamentById(99L, true);

    assertNull(result);
  }

  @Test
  void createTournamentPersistsTournamentFieldsFromDto() {
    TournamentDto request = buildTournamentDto(999L, "Winter Cup", "Tournoi d'hiver");
    request.setState(State.PLANIFIED);
    Tournament savedTournament = buildTournament(4L, "Winter Cup", "Tournoi d'hiver");

    when(tournamentRepository.save(any(Tournament.class))).thenReturn(savedTournament);
    when(tournamentRegistrationRepository.countByTournament(savedTournament)).thenReturn(0);

    TournamentDto result = tournamentService.createTournament(request);

    ArgumentCaptor<Tournament> captor = ArgumentCaptor.forClass(Tournament.class);
    verify(tournamentRepository).save(captor.capture());

    Tournament tournamentToSave = captor.getValue();
    assertNull(ReflectionTestUtils.getField(tournamentToSave, "id"));
    assertEquals("Winter Cup", tournamentToSave.getName());
    assertEquals("Tournoi d'hiver", tournamentToSave.getDescription());
    assertEquals(LocalDate.of(2026, 1, 10), tournamentToSave.getStartDate());
    assertEquals(LocalDate.of(2026, 1, 12), tournamentToSave.getEndDate());
    assertEquals(LocalDate.of(2025, 12, 1), tournamentToSave.getStartInscriptionDate());
    assertEquals(LocalDate.of(2025, 12, 20), tournamentToSave.getEndInscriptionDate());
    assertEquals(16, tournamentToSave.getMaxTeams());
    assertEquals(State.IN_PREPARATION, tournamentToSave.getState());
    assertEquals(4L, result.getId());
    assertEquals(State.IN_PREPARATION, result.getState());
    assertEquals("En préparation", result.getStateDisplayName());
  }

  @Test
  void createTournamentReturnsNullWhenNameAlreadyExists() {
    TournamentDto request = buildTournamentDto(999L, "Winter Cup", "Tournoi d'hiver");
    Tournament existingTournament = buildTournament(4L, "Winter Cup", "Déjà existant");

    when(tournamentRepository.findByNameIgnoreCase("Winter Cup"))
        .thenReturn(Optional.of(existingTournament));

    TournamentDto result = tournamentService.createTournament(request);

    assertNull(result);
    verify(tournamentRepository, never()).save(any(Tournament.class));
  }

  @Test
  void updateTournamentReplacesFieldsWhenTournamentExists() {
    Tournament existingTournament = buildTournament(5L, "Old Cup", "Ancienne description");
    TournamentDto request = buildTournamentDto(999L, "New Cup", "Nouvelle description");
    request.setState(null);

    when(tournamentRepository.findById(5L)).thenReturn(Optional.of(existingTournament));
    when(tournamentRepository.save(existingTournament)).thenReturn(existingTournament);
    when(tournamentRegistrationRepository.countByTournament(existingTournament)).thenReturn(0);

    TournamentDto result = tournamentService.updateTournament(5L, request);

    assertEquals(5L, result.getId());
    assertEquals("New Cup", existingTournament.getName());
    assertEquals("Nouvelle description", existingTournament.getDescription());
    assertEquals(LocalDate.of(2026, 1, 10), existingTournament.getStartDate());
    assertEquals(LocalDate.of(2026, 1, 12), existingTournament.getEndDate());
    assertEquals(16, existingTournament.getMaxTeams());
    assertEquals(State.IN_PREPARATION, existingTournament.getState());
    assertEquals(State.IN_PREPARATION, result.getState());
    assertEquals("En préparation", result.getStateDisplayName());
    verify(tournamentRepository).save(existingTournament);
  }

  @Test
  void updateTournamentWithoutStateReturnsNullWhenTournamentIsNotInPreparation() {
    Tournament existingTournament = buildTournament(17L, "Locked Cup", "Tournoi verrouillé");
    existingTournament.setState(State.PLANIFIED);
    TournamentDto request = buildTournamentDto(17L, "Locked Cup Updated", "Nouvelle description");
    request.setState(null);

    when(tournamentRepository.findById(17L)).thenReturn(Optional.of(existingTournament));

    TournamentDto result = tournamentService.updateTournament(17L, request);

    assertNull(result);
    verify(tournamentRepository, never()).save(any());
  }

  @Test
  void updateTournamentReturnsNullWhenTournamentDoesNotExist() {
    when(tournamentRepository.findById(42L)).thenReturn(Optional.empty());

    TournamentDto result = tournamentService.updateTournament(42L,
        buildTournamentDto(42L, "Ghost Cup", "Introuvable"));

    assertNull(result);
    verify(tournamentRepository, never()).save(any());
  }

  @Test
  void updateTournamentAllowsValidTransitionInPreparationToPlanified() {
    Tournament existing = buildTournament(5L, "Spring Cup", "Description");
    TournamentDto request = buildTournamentDto(5L, "Spring Cup", "Description");
    request.setState(State.PLANIFIED);

    when(tournamentRepository.findById(5L)).thenReturn(Optional.of(existing));
    when(tournamentRepository.save(existing)).thenReturn(existing);
    when(tournamentRegistrationRepository.countByTournament(existing)).thenReturn(0);

    TournamentDto result = tournamentService.updateTournament(5L, request);

    assertNotNull(result);
    verify(tournamentRepository).save(existing);
  }

  @Test
  void updateTournamentReturnsNullForInvalidTransitionInPreparationToOngoing() {
    Tournament existing = buildTournament(6L, "Spring Cup", "Description");
    TournamentDto request = buildTournamentDto(6L, "Spring Cup", "Description");
    request.setState(State.ONGOING);

    when(tournamentRepository.findById(6L)).thenReturn(Optional.of(existing));

    TournamentDto result = tournamentService.updateTournament(6L, request);

    assertNull(result);
    verify(tournamentRepository, never()).save(any());
  }

  @Test
  void updateTournamentReturnsNullForInvalidTransitionInPreparationToFinished() {
    Tournament existing = buildTournament(7L, "Spring Cup", "Description");
    TournamentDto request = buildTournamentDto(7L, "Spring Cup", "Description");
    request.setState(State.FINISHED);

    when(tournamentRepository.findById(7L)).thenReturn(Optional.of(existing));

    TournamentDto result = tournamentService.updateTournament(7L, request);

    assertNull(result);
    verify(tournamentRepository, never()).save(any());
  }

  @Test
  void updateTournamentAllowsSameStateTransition() {
    Tournament existing = buildTournament(8L, "Spring Cup", "Description");
    TournamentDto request = buildTournamentDto(8L, "Spring Cup Updated", "New Description");
    request.setState(State.IN_PREPARATION);

    when(tournamentRepository.findById(8L)).thenReturn(Optional.of(existing));
    when(tournamentRepository.save(existing)).thenReturn(existing);
    when(tournamentRegistrationRepository.countByTournament(existing)).thenReturn(0);

    TournamentDto result = tournamentService.updateTournament(8L, request);

    assertNotNull(result);
    verify(tournamentRepository).save(existing);
  }

  @Test
  void updateTournamentReturnsNullForInvalidTransitionFromFinished() {
    Tournament existing = buildTournament(9L, "Old Cup", "Description");
    existing.setState(State.FINISHED);
    TournamentDto request = buildTournamentDto(9L, "Old Cup", "Description");
    request.setState(State.IN_PREPARATION);

    when(tournamentRepository.findById(9L)).thenReturn(Optional.of(existing));

    TournamentDto result = tournamentService.updateTournament(9L, request);

    assertNull(result);
    verify(tournamentRepository, never()).save(any());
  }

  @Test
  void updateTournamentAllowsValidTransitionPlanifiedToOngoing() {
    Tournament existing = buildTournament(30L, "Planified Cup", "Description");
    existing.setState(State.PLANIFIED);
    TournamentDto request = buildTournamentDto(30L, "Planified Cup", "Description");
    request.setState(State.ONGOING);

    when(tournamentRepository.findById(30L)).thenReturn(Optional.of(existing));
    when(tournamentRepository.save(existing)).thenReturn(existing);
    when(tournamentRegistrationRepository.countByTournament(existing)).thenReturn(0);

    TournamentDto result = tournamentService.updateTournament(30L, request);

    assertNotNull(result);
    assertEquals(State.ONGOING, existing.getState());
    verify(tournamentRepository).save(existing);
  }

  @Test
  void updateTournamentReturnsNullForInvalidTransitionPlanifiedToFinished() {
    Tournament existing = buildTournament(31L, "Planified Cup", "Description");
    existing.setState(State.PLANIFIED);
    TournamentDto request = buildTournamentDto(31L, "Planified Cup", "Description");
    request.setState(State.FINISHED);

    when(tournamentRepository.findById(31L)).thenReturn(Optional.of(existing));

    TournamentDto result = tournamentService.updateTournament(31L, request);

    assertNull(result);
    verify(tournamentRepository, never()).save(any());
  }

  @Test
  void updateTournamentAllowsValidTransitionOngoingToFinished() {
    Tournament existing = buildTournament(32L, "Ongoing Cup", "Description");
    existing.setState(State.ONGOING);
    TournamentDto request = buildTournamentDto(32L, "Ongoing Cup", "Description");
    request.setState(State.FINISHED);

    when(tournamentRepository.findById(32L)).thenReturn(Optional.of(existing));
    when(tournamentRepository.save(existing)).thenReturn(existing);
    when(tournamentRegistrationRepository.countByTournament(existing)).thenReturn(0);

    TournamentDto result = tournamentService.updateTournament(32L, request);

    assertNotNull(result);
    assertEquals(State.FINISHED, existing.getState());
    verify(tournamentRepository).save(existing);
  }

  @Test
  void updateTournamentReturnsNullForInvalidTransitionOngoingToPlanified() {
    Tournament existing = buildTournament(33L, "Ongoing Cup", "Description");
    existing.setState(State.ONGOING);
    TournamentDto request = buildTournamentDto(33L, "Ongoing Cup", "Description");
    request.setState(State.PLANIFIED);

    when(tournamentRepository.findById(33L)).thenReturn(Optional.of(existing));

    TournamentDto result = tournamentService.updateTournament(33L, request);

    assertNull(result);
    verify(tournamentRepository, never()).save(any());
  }

  @Test
  void deleteTournamentDeletesTournamentWhenItExists() {
    Tournament tournament = buildTournament(6L, "Delete Cup", "À supprimer");
    when(tournamentRepository.findById(6L)).thenReturn(Optional.of(tournament));

    boolean result = tournamentService.deleteTournament(6L);

    assertTrue(result);
    verify(tournamentRepository).delete(tournament);
  }

  @Test
  void deleteTournamentReturnsFalseWhenTournamentDoesNotExist() {
    when(tournamentRepository.findById(404L)).thenReturn(Optional.empty());

    boolean result = tournamentService.deleteTournament(404L);

    assertFalse(result);
    verify(tournamentRepository, never()).delete(any());
  }

  @Test
  void toTournamentDtoMapsAllTournamentFields() {
    Tournament tournament = buildTournament(7L, "Mapping Cup", "Validation du mapping");
    when(tournamentRegistrationRepository.countByTournament(tournament)).thenReturn(3);

    TournamentDto result = tournamentService.toTournamentDto(tournament);

    assertEquals(7L, result.getId());
    assertEquals("Mapping Cup", result.getName());
    assertEquals("Validation du mapping", result.getDescription());
    assertEquals(LocalDate.of(2026, 1, 10), result.getStartDate());
    assertEquals(LocalDate.of(2026, 1, 12), result.getEndDate());
    assertEquals(LocalDate.of(2025, 12, 1), result.getStartInscriptionDate());
    assertEquals(LocalDate.of(2025, 12, 20), result.getEndInscriptionDate());
    assertEquals(16, result.getMaxTeams());
    assertEquals(State.IN_PREPARATION, result.getState());
    assertEquals("En préparation", result.getStateDisplayName());
    assertEquals(3, result.getRegistrationsCount());
    assertNull(result.getWinner());
  }

  @Test
  void toTournamentDtoMapsWinnerField() {
    Tournament tournament = buildTournament(8L, "Winner Cup", "Tournoi avec vainqueur");
    tournament.setWinner("TEAM_ALPHA");
    when(tournamentRegistrationRepository.countByTournament(tournament)).thenReturn(0);

    TournamentDto result = tournamentService.toTournamentDto(tournament);

    assertEquals("TEAM_ALPHA", result.getWinner());
  }

  @Test
  void getAllTournamentsHidesInPreparationTournamentsForNonAdmins() {
    Tournament inPreparationTournament = buildTournament(9L, "Draft Cup", "Brouillon");
    Tournament openTournament = buildTournament(10L, "Open Cup", "Tournoi ouvert");
    openTournament.setState(State.PLANIFIED);

    when(tournamentRepository.findAll()).thenReturn(List.of(inPreparationTournament, openTournament));
    when(tournamentRegistrationRepository.countByTournament(any(Tournament.class))).thenReturn(0);

    List<TournamentDto> result = tournamentService.getAllTournaments(null, false);

    assertEquals(1, result.size());
    assertEquals("Open Cup", result.getFirst().getName());
    assertEquals(State.PLANIFIED, result.getFirst().getState());
  }

  @Test
  void getAllTournamentsShowsInPreparationTournamentsForAdmins() {
    Tournament inPreparationTournament = buildTournament(11L, "Draft Cup", "Brouillon");
    Tournament openTournament = buildTournament(12L, "Open Cup", "Tournoi ouvert");
    openTournament.setState(State.PLANIFIED);

    when(tournamentRepository.findAll()).thenReturn(List.of(inPreparationTournament, openTournament));
    when(tournamentRegistrationRepository.countByTournament(any(Tournament.class))).thenReturn(0);

    List<TournamentDto> result = tournamentService.getAllTournaments(null, true);

    assertEquals(2, result.size());
    assertEquals(State.IN_PREPARATION, result.getFirst().getState());
    assertEquals(State.PLANIFIED, result.get(1).getState());
  }

  @Test
  void getTournamentByIdReturnsNullForNonAdminWhenTournamentIsInPreparation() {
    Tournament inPreparationTournament = buildTournament(13L, "Draft Cup", "Brouillon");
    when(tournamentRepository.findById(13L)).thenReturn(Optional.of(inPreparationTournament));

    TournamentDto result = tournamentService.getTournamentById(13L, false);

    assertNull(result);
  }

  @Test
  void getTournamentByIdReturnsDtoForAdminWhenTournamentIsInPreparation() {
    Tournament inPreparationTournament = buildTournament(14L, "Draft Cup", "Brouillon");
    when(tournamentRepository.findById(14L)).thenReturn(Optional.of(inPreparationTournament));
    when(tournamentRegistrationRepository.countByTournament(inPreparationTournament)).thenReturn(0);

    TournamentDto result = tournamentService.getTournamentById(14L, true);

    assertNotNull(result);
    assertEquals(14L, result.getId());
    assertEquals("Draft Cup", result.getName());
    assertEquals(State.IN_PREPARATION, result.getState());
  }

  @Test
  void getTournamentByIdReturnsDtoForNonAdminWhenTournamentIsPlanified() {
    Tournament openTournament = buildTournament(15L, "Open Cup", "Tournoi ouvert");
    openTournament.setState(State.PLANIFIED);
    when(tournamentRepository.findById(15L)).thenReturn(Optional.of(openTournament));
    when(tournamentRegistrationRepository.countByTournament(openTournament)).thenReturn(0);

    TournamentDto result = tournamentService.getTournamentById(15L, false);

    assertNotNull(result);
    assertEquals(15L, result.getId());
    assertEquals(State.PLANIFIED, result.getState());
  }

  @Test
  void getTournamentEntityByIdReturnsTournamentWhenItExists() {
    Tournament tournament = buildTournament(16L, "Entity Cup", "Tournoi entité");
    when(tournamentRepository.findById(16L)).thenReturn(Optional.of(tournament));

    Optional<Tournament> result = tournamentService.getTournamentEntityById(16L);

    assertTrue(result.isPresent());
    assertEquals(16L, result.get().getId());
  }

  @Test
  void getTournamentEntityByIdReturnsEmptyWhenTournamentDoesNotExist() {
    when(tournamentRepository.findById(999L)).thenReturn(Optional.empty());

    Optional<Tournament> result = tournamentService.getTournamentEntityById(999L);

    assertTrue(result.isEmpty());
  }

  // ==================== getTournamentsByTeamName ====================

  @Test
  void getTournamentsByTeamNameReturnsTournamentsForRegisteredTeam() {
    Tournament tournament = buildTournament(20L, "Team Cup", "Tournoi team");
    tournament.setState(State.PLANIFIED);
    TournamentRegistration registration = new TournamentRegistration();
    registration.setTournament(tournament);

    when(tournamentRegistrationRepository.findByTeamNameIgnoreCase("TEAM_ALPHA"))
        .thenReturn(List.of(registration));
    when(tournamentRegistrationRepository.countByTournament(tournament)).thenReturn(1);

    List<TournamentDto> result =
        tournamentService.getTournamentsByTeamName("TEAM_ALPHA", false);

    assertEquals(1, result.size());
    assertEquals("Team Cup", result.getFirst().getName());
  }

  @Test
  void getTournamentsByTeamNameHidesInPreparationForNonAdmin() {
    Tournament tournament = buildTournament(21L, "Draft Cup", "Brouillon");
    TournamentRegistration registration = new TournamentRegistration();
    registration.setTournament(tournament);

    when(tournamentRegistrationRepository.findByTeamNameIgnoreCase("TEAM_ALPHA"))
        .thenReturn(List.of(registration));

    List<TournamentDto> result =
        tournamentService.getTournamentsByTeamName("TEAM_ALPHA", false);

    assertEquals(0, result.size());
  }

  @Test
  void getTournamentsByTeamNameShowsInPreparationForAdmin() {
    Tournament tournament = buildTournament(34L, "Draft Cup", "Brouillon");
    TournamentRegistration registration = new TournamentRegistration();
    registration.setTournament(tournament);

    when(tournamentRegistrationRepository.findByTeamNameIgnoreCase("TEAM_ALPHA"))
        .thenReturn(List.of(registration));
    when(tournamentRegistrationRepository.countByTournament(tournament)).thenReturn(1);

    List<TournamentDto> result =
        tournamentService.getTournamentsByTeamName("TEAM_ALPHA", true);

    assertEquals(1, result.size());
    assertEquals("Draft Cup", result.getFirst().getName());
    assertEquals(State.IN_PREPARATION, result.getFirst().getState());
  }

  // ==================== getTournamentsByTeamNameAndPlayerTag ====================

  @Test
  void getTournamentsByTeamNameAndPlayerTagReturnsTournamentsWherePlayerWasSelectedWithTeam() {
    Tournament tournament = buildTournament(40L, "Combined Cup", "Tournoi combiné");
    tournament.setState(State.PLANIFIED);
    User user = new User();
    Team team = new Team();
    team.setName("TEAM_ALPHA");
    Match match = new Match();
    match.setTournament(tournament);
    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setTeam(team);
    selection.setMember(user);

    when(userRepository.findByTagIgnoreCase("Flash")).thenReturn(List.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection));
    when(tournamentRegistrationRepository.countByTournament(tournament)).thenReturn(1);

    List<TournamentDto> result =
        tournamentService.getTournamentsByTeamNameAndPlayerTag("TEAM_ALPHA", "Flash", false);

    assertEquals(1, result.size());
    assertEquals("Combined Cup", result.getFirst().getName());
  }

  @Test
  void getTournamentsByTeamNameAndPlayerTagExcludesSelectionsWithDifferentTeam() {
    Tournament tournament = buildTournament(41L, "Other Cup", "Autre tournoi");
    tournament.setState(State.PLANIFIED);
    User user = new User();
    Team otherTeam = new Team();
    otherTeam.setName("OTHER_TEAM");
    Match match = new Match();
    match.setTournament(tournament);
    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setTeam(otherTeam);
    selection.setMember(user);

    when(userRepository.findByTagIgnoreCase("Flash")).thenReturn(List.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection));

    List<TournamentDto> result =
        tournamentService.getTournamentsByTeamNameAndPlayerTag("TEAM_ALPHA", "Flash", false);

    assertEquals(0, result.size());
  }

  @Test
  void getTournamentsByTeamNameAndPlayerTagReturnsEmptyWhenTagNotFound() {
    when(userRepository.findByTagIgnoreCase("Unknown")).thenReturn(List.of());

    List<TournamentDto> result =
        tournamentService.getTournamentsByTeamNameAndPlayerTag("TEAM_ALPHA", "Unknown", false);

    assertEquals(0, result.size());
  }

  // ==================== getTournamentsByPlayerTag ====================

  @Test
  void getTournamentsByPlayerTagReturnsTournamentsWherePlayerWasSelected() {
    Tournament tournament = buildTournament(22L, "Tag Cup", "Tournoi tag");
    tournament.setState(State.PLANIFIED);
    User user = new User();
    Match match = new Match();
    match.setTournament(tournament);
    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setMember(user);

    when(userRepository.findByTagIgnoreCase("Flash")).thenReturn(List.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection));
    when(tournamentRegistrationRepository.countByTournament(tournament)).thenReturn(1);

    List<TournamentDto> result =
        tournamentService.getTournamentsByPlayerTag("Flash", false);

    assertEquals(1, result.size());
    assertEquals("Tag Cup", result.getFirst().getName());
  }

  @Test
  void getTournamentsByPlayerTagReturnsEmptyWhenPlayerHasNoSelections() {
    User user = new User();

    when(userRepository.findByTagIgnoreCase("Ghost")).thenReturn(List.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of());

    List<TournamentDto> result =
        tournamentService.getTournamentsByPlayerTag("Ghost", false);

    assertEquals(0, result.size());
  }

  @Test
  void getTournamentsByPlayerTagReturnsEmptyWhenTagNotFound() {
    when(userRepository.findByTagIgnoreCase("Unknown")).thenReturn(List.of());

    List<TournamentDto> result =
        tournamentService.getTournamentsByPlayerTag("Unknown", false);

    assertEquals(0, result.size());
  }

  private Tournament buildTournament(Long id, String name, String description) {
    Tournament tournament = new Tournament();
    ReflectionTestUtils.setField(tournament, "id", id);
    tournament.setName(name);
    tournament.setDescription(description);
    tournament.setStartDate(LocalDate.of(2026, 1, 10));
    tournament.setEndDate(LocalDate.of(2026, 1, 12));
    tournament.setStartInscriptionDate(LocalDate.of(2025, 12, 1));
    tournament.setEndInscriptionDate(LocalDate.of(2025, 12, 20));
    tournament.setMaxTeams(16);
    tournament.setState(State.IN_PREPARATION);
    return tournament;
  }

  private TournamentDto buildTournamentDto(Long id, String name, String description) {
    TournamentDto tournamentDto = new TournamentDto();
    tournamentDto.setId(id);
    tournamentDto.setName(name);
    tournamentDto.setDescription(description);
    tournamentDto.setStartDate(LocalDate.of(2026, 1, 10));
    tournamentDto.setEndDate(LocalDate.of(2026, 1, 12));
    tournamentDto.setStartInscriptionDate(LocalDate.of(2025, 12, 1));
    tournamentDto.setEndInscriptionDate(LocalDate.of(2025, 12, 20));
    tournamentDto.setMaxTeams(16);
    tournamentDto.setState(State.IN_PREPARATION);
    return tournamentDto;
  }
}
