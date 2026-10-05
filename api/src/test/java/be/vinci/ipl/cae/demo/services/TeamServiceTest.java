package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.results.TeamOperationResult;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamMembershipRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import be.vinci.ipl.cae.demo.services.MembershipHistoryService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

  @Mock
  private TeamRepository teamRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private TeamMembershipRepository teamMembershipRepository;

  @Mock
  private NotificationService notificationService;

  @Mock
  private TournamentRegistrationRepository tournamentRegistrationRepository;

  @InjectMocks
  private TeamService teamService;

  @Mock
  private MembershipHistoryService membershipHistoryService;

  @Mock
  private SelectionMatchService selectionMatchService;

  // ==================== createTeam ====================

  @Test
  void createTeamSuccessfullySetsManagerAndSavesCreator() {
    Team team = new Team();
    team.setName("TestTeam");
    User creator = buildUser(1L);

    when(teamRepository.findByNameIgnoreCase("TestTeam")).thenReturn(Optional.empty());
    when(teamMembershipRepository.findByMemberAndStatus(creator, MembershipStatus.PENDING))
        .thenReturn(Optional.empty());
    when(teamRepository.save(team)).thenReturn(team);

    TeamOperationResult outcome = teamService.createTeam(team, creator);

    assertTrue(outcome.success());
    Team result = outcome.team();
    assertEquals(creator, result.getManager());
    assertEquals(team, creator.getTeam());
    verify(userRepository).save(creator);
    verify(teamMembershipRepository).save(argThat(membership ->
      membership.getTeam() == team
        && membership.getMember() == creator
        && membership.getStatus() == MembershipStatus.ACCEPTED));
  }

  @Test
  void createTeamRejectsWhenNameAlreadyExists() {
    Team team = new Team();
    team.setName("ExistingTeam");
    User creator = buildUser(1L);

    when(teamRepository.findByNameIgnoreCase("ExistingTeam"))
        .thenReturn(Optional.of(new Team()));

    TeamOperationResult outcome = teamService.createTeam(team, creator);

    assertFalse(outcome.success());
    assertEquals("Le nom de cette team existe déjà", outcome.errorMessage());
    verify(teamRepository, never()).save(team);
  }

  @Test
  void createTeamRejectsWhenCreatorAlreadyHasTeam() {
    Team team = new Team();
    team.setName("NewTeam");
    User creator = buildUser(1L);
    creator.setTeam(new Team());

    when(teamRepository.findByNameIgnoreCase("NewTeam")).thenReturn(Optional.empty());

    TeamOperationResult outcome = teamService.createTeam(team, creator);

    assertFalse(outcome.success());
    assertEquals("Cet utilisateur possède déjà une team", outcome.errorMessage());
    verify(teamRepository, never()).save(team);
  }

  @Test
  void createTeamRejectsWhenCreatorHasPendingMembershipRequest() {
    Team team = new Team();
    team.setName("NewTeam");
    User creator = buildUser(1L);

    when(teamRepository.findByNameIgnoreCase("NewTeam")).thenReturn(Optional.empty());
    when(teamMembershipRepository.findByMemberAndStatus(creator, MembershipStatus.PENDING))
        .thenReturn(Optional.of(new TeamMembership()));

    TeamOperationResult outcome = teamService.createTeam(team, creator);

    assertFalse(outcome.success());
    assertEquals("Cet utilisateur a déjà une demande d'adhésion en attente",
        outcome.errorMessage());
    verify(teamRepository, never()).save(team);
  }

  // ==================== getManagersCount ====================

  @Test
  void getManagersCountReturnsZeroWhenNoManagers() {
    Team team = new Team();
    assertEquals(0, teamService.getManagersCount(team));
  }

  @Test
  void getManagersCountReturnsOneWhenOnlyPrimaryManager() {
    Team team = new Team();
    team.setManager(buildUser(1L));
    assertEquals(1, teamService.getManagersCount(team));
  }

  @Test
  void getManagersCountReturnsTwoWhenBothManagersPresent() {
    Team team = new Team();
    team.setManager(buildUser(1L));
    team.setSecondManager(buildUser(2L));
    assertEquals(2, teamService.getManagersCount(team));
  }

  // ==================== designateSecondManager ====================

  @Test
  void designateSecondManagerSuccessfullySetsSecondManagerAndSendsNotification() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    team.setName("TestTeam");
    User manager = buildUser(1L);
    User member = buildUser(2L);
    team.setManager(manager);
    member.setTeam(team);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(teamRepository.save(team)).thenReturn(team);

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 10L, 2L);

    assertTrue(outcome.success());
    assertEquals(member, outcome.team().getSecondManager());
    verify(notificationService).createNotification(eq(member), any(NotificationDto.class));
  }

  @Test
  void designateSecondManagerRejectsWhenNotPrimaryManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = buildUser(1L);
    User otherUser = buildUser(2L);
    team.setManager(manager);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

    TeamOperationResult outcome = teamService.designateSecondManager(otherUser, 10L, 3L);

    assertFalse(outcome.success());
    assertEquals("Seul le responsable principal peut désigner un responsable",
        outcome.errorMessage());
  }

  @Test
  void designateSecondManagerRejectsWhenTeamAlreadyHasSecondManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = buildUser(1L);
    team.setManager(manager);
    team.setSecondManager(buildUser(3L));

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 10L, 2L);

    assertFalse(outcome.success());
    assertEquals("Impossible de désigner un autre responsable : la team en a déjà un",
        outcome.errorMessage());
  }

  @Test
  void designateSecondManagerRejectsWhenMemberNotInTeam() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = buildUser(1L);
    User member = buildUser(2L);
    team.setManager(manager);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 10L, 2L);

    assertFalse(outcome.success());
    assertEquals("Le membre sélectionné n'appartient pas à cette team", outcome.errorMessage());
  }

  @Test
  void designateSecondManagerRejectsWhenMemberIsPrimaryManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = buildUser(1L);
    team.setManager(manager);
    manager.setTeam(team);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(userRepository.findById(1L)).thenReturn(Optional.of(manager));

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 10L, 1L);

    assertFalse(outcome.success());
    assertEquals("Le responsable principal ne peut pas être désigné à nouveau",
        outcome.errorMessage());
  }

  // ==================== getAcceptedMembersCount ====================

  @Test
  void getAcceptedMembersCountExcludesManagers() {
    Team team = new Team();
    User manager = buildUser(1L);
    User secondManager = buildUser(2L);
    User member = buildUser(3L);
    team.setManager(manager);
    team.setSecondManager(secondManager);

    TeamMembership m1 = new TeamMembership();
    m1.setMember(manager);
    TeamMembership m2 = new TeamMembership();
    m2.setMember(secondManager);
    TeamMembership m3 = new TeamMembership();
    m3.setMember(member);

    when(teamMembershipRepository.findByTeamAndStatus(team, MembershipStatus.ACCEPTED))
        .thenReturn(List.of(m1, m2, m3));

    assertEquals(1, teamService.getAcceptedMembersCount(team));
  }

  // ==================== renounceManagerRole ====================

  @Test
  void renounceManagerRoleSwapsManagersAndSendsBothNotifications() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    team.setName("TestTeam");
    User manager = buildUser(1L);
    User secondManager = buildUser(2L);
    team.setManager(manager);
    team.setSecondManager(secondManager);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamRepository.save(team)).thenReturn(team);

    TeamOperationResult outcome = teamService.renounceManagerRole(manager, 10L);

    assertTrue(outcome.success());
    assertEquals(secondManager, outcome.team().getManager());
    assertEquals(manager, outcome.team().getSecondManager());
    verify(notificationService).createNotification(eq(manager), any(NotificationDto.class));
    verify(notificationService).createNotification(eq(secondManager), any(NotificationDto.class));
  }

  @Test
  void renounceManagerRoleRejectsWhenNotPrimaryManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = buildUser(1L);
    User otherUser = buildUser(2L);
    team.setManager(manager);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

    TeamOperationResult outcome = teamService.renounceManagerRole(otherUser, 10L);

    assertFalse(outcome.success());
    assertEquals("Seul le responsable principal peut renoncer à ce rôle", outcome.errorMessage());
    verify(teamRepository, never()).save(team);
  }

  @Test
  void renounceManagerRoleRejectsWhenNoSecondManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = buildUser(1L);
    team.setManager(manager);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

    TeamOperationResult outcome = teamService.renounceManagerRole(manager, 10L);

    assertFalse(outcome.success());
    assertEquals("Impossible de renoncer : désignez d'abord un autre responsable",
        outcome.errorMessage());
    verify(teamRepository, never()).save(team);
  }

  // ==================== leaveTeam ====================

  @Test
  void leaveTeamAllowsPrimaryManagerToLeaveWhenTheyAreLastMember() {
    Team team = new Team();
    User manager = buildUser(1L);

    ReflectionTestUtils.setField(team, "id", 10L);
    team.setManager(manager);
    manager.setTeam(team);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamMembershipRepository.findByTeamAndStatus(team, MembershipStatus.ACCEPTED))
        .thenReturn(List.of());
    when(teamMembershipRepository.findByTeamAndMember(team, manager)).thenReturn(Optional.empty());

    assertNull(teamService.leaveTeam(manager, 10L));

    assertNull(team.getManager());
    assertNull(manager.getTeam());
    verify(teamRepository).save(team);
    verify(userRepository).save(manager);
  }

  @Test
  void leaveTeamAllowsPrimaryManagerToLeaveWhenSecondManagerExistsAndPromotesSecondManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    team.setName("TestTeam");
    User manager = buildUser(1L);
    User secondManager = buildUser(2L);
    team.setManager(manager);
    team.setSecondManager(secondManager);
    manager.setTeam(team);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamRepository.save(team)).thenReturn(team);
    when(teamMembershipRepository.findByTeamAndMember(team, manager)).thenReturn(Optional.empty());

    assertNull(teamService.leaveTeam(manager, 10L));

    assertEquals(secondManager, team.getManager());
    assertNull(team.getSecondManager());
    assertNull(manager.getTeam());
    verify(notificationService).createNotification(eq(secondManager), any(NotificationDto.class));
  }

  @Test
  void leaveTeamRejectsPrimaryManagerWhenOtherMembersExist() {
    Team team = new Team();
    User manager = buildUser(1L);
    User member = buildUser(2L);

    ReflectionTestUtils.setField(team, "id", 10L);
    team.setManager(manager);
    manager.setTeam(team);

    TeamMembership acceptedMember = new TeamMembership();
    acceptedMember.setTeam(team);
    acceptedMember.setMember(member);
    acceptedMember.setStatus(MembershipStatus.ACCEPTED);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamMembershipRepository.findByTeamAndStatus(team, MembershipStatus.ACCEPTED))
        .thenReturn(List.of(acceptedMember));

    assertEquals(
        "Impossible de quitter : vous êtes responsable principal et il reste d'autres membres",
        teamService.leaveTeam(manager, 10L));
    verify(teamRepository, never()).save(team);
    verify(userRepository, never()).save(manager);
  }

  @Test
  void leaveTeamAllowsSecondManagerToLeave() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = buildUser(1L);
    User secondManager = buildUser(2L);
    team.setManager(manager);
    team.setSecondManager(secondManager);
    secondManager.setTeam(team);

    TeamMembership membership = new TeamMembership();

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamMembershipRepository.findByTeamAndMember(team, secondManager))
        .thenReturn(Optional.of(membership));

    assertNull(teamService.leaveTeam(secondManager, 10L));

    assertNull(team.getSecondManager());
    assertNull(secondManager.getTeam());
    verify(teamRepository).save(team);
    verify(teamMembershipRepository).delete(membership);
    verify(userRepository).save(secondManager);
  }

  @Test
  void leaveTeamAllowsRegularMemberAndRemovesMembership() {
    Team team = new Team();
    User manager = buildUser(1L);
    User member = buildUser(2L);

    ReflectionTestUtils.setField(team, "id", 10L);
    team.setManager(manager);
    member.setTeam(team);

    TeamMembership membership = new TeamMembership();
    membership.setTeam(team);
    membership.setMember(member);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(membership));

    assertNull(teamService.leaveTeam(member, 10L));

    assertNull(member.getTeam());
    verify(teamMembershipRepository).delete(membership);
    verify(userRepository).save(member);
    verify(teamRepository, never()).save(team);
  }

  @Test
  void leaveTeamDeletesRegistrationsWhenLastMemberLeaves() {
    Team team = new Team();
    User manager = buildUser(1L);

    ReflectionTestUtils.setField(team, "id", 10L);
    team.setManager(manager);
    manager.setTeam(team);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamMembershipRepository.findByTeamAndStatus(team, MembershipStatus.ACCEPTED))
        .thenReturn(List.of());
    when(teamMembershipRepository.findByTeamAndMember(team, manager)).thenReturn(Optional.empty());

    assertNull(teamService.leaveTeam(manager, 10L));

    verify(tournamentRegistrationRepository).deleteByTeam(team);
  }

  @Test
  void leaveTeamDoesNotDeleteRegistrationsWhenTeamStillHasManager() {
    Team team = new Team();
    User manager = buildUser(1L);
    User member = buildUser(2L);

    ReflectionTestUtils.setField(team, "id", 10L);
    team.setManager(manager);
    member.setTeam(team);

    TeamMembership membership = new TeamMembership();
    membership.setTeam(team);
    membership.setMember(member);

    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(membership));

    assertNull(teamService.leaveTeam(member, 10L));

    verify(tournamentRegistrationRepository, never()).deleteByTeam(team);
  }

  @Test
  void getTeamByIdReturnsTeamWhenFound() {
    Team team = new Team();
    when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

    Optional<Team> result = teamService.getTeamById(1L);

    assertEquals(Optional.of(team), result);
  }

  @Test
  void getTeamByNameReturnsTeamWhenFound() {
    Team team = new Team();
    when(teamRepository.findByNameIgnoreCase("Alpha")).thenReturn(Optional.of(team));

    Optional<Team> result = teamService.getTeamByName("Alpha");

    assertEquals(Optional.of(team), result);
  }

  @Test
  void getAllTeamsReturnsAllTeams() {
    Team t1 = new Team();
    Team t2 = new Team();
    when(teamRepository.findAll()).thenReturn(List.of(t1, t2));

    List<Team> result = teamService.getAllTeams();

    assertEquals(List.of(t1, t2), result);
  }

  @Test
  void designateSecondManagerThrowsWhenTeamNotFound() {
    User user = buildUser(1L);
    when(teamRepository.findById(99L)).thenReturn(Optional.empty());

    TeamOperationResult outcome = teamService.designateSecondManager(user, 99L, 2L);

    assertFalse(outcome.success());
    assertEquals("Équipe non trouvée", outcome.errorMessage());
  }

  @Test
  void designateSecondManagerThrowsWhenMemberNotFound() {
    User manager = buildUser(1L);
    Team team = new Team();
    team.setManager(manager);

    when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
    when(userRepository.findById(99L)).thenReturn(Optional.empty());

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 1L, 99L);

    assertFalse(outcome.success());
    assertEquals("Membre introuvable", outcome.errorMessage());
  }

  @Test
  void designateSecondManagerThrowsWhenMemberHasNoTeam() {
    User manager = buildUser(1L);
    User member = buildUser(2L);
    member.setTeam(null);

    Team team = new Team();
    team.setManager(manager);
    ReflectionTestUtils.setField(team, "id", 1L);

    when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 1L, 2L);

    assertFalse(outcome.success());
    assertEquals("Le membre sélectionné n'appartient pas à cette team", outcome.errorMessage());
  }

  @Test
  void designateSecondManagerThrowsWhenMemberBelongsToDifferentTeam() {
    User manager = buildUser(1L);
    User member = buildUser(2L);
    Team otherTeam = new Team();
    ReflectionTestUtils.setField(otherTeam, "id", 99L);
    member.setTeam(otherTeam);

    Team team = new Team();
    team.setManager(manager);
    ReflectionTestUtils.setField(team, "id", 1L);

    when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 1L, 2L);

    assertFalse(outcome.success());
    assertEquals("Le membre sélectionné n'appartient pas à cette team", outcome.errorMessage());
  }

  @Test
  void designateSecondManagerThrowsWhenMemberTeamHasNoId() {
    User manager = buildUser(1L);
    User member = buildUser(2L);
    Team memberTeam = new Team();
    member.setTeam(memberTeam);

    Team team = new Team();
    team.setManager(manager);
    ReflectionTestUtils.setField(team, "id", 1L);

    when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));

    TeamOperationResult outcome = teamService.designateSecondManager(manager, 1L, 2L);

    assertFalse(outcome.success());
    assertEquals("Le membre sélectionné n'appartient pas à cette team", outcome.errorMessage());
  }

  private User buildUser(Long id) {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", id);
    return user;
  }
}
