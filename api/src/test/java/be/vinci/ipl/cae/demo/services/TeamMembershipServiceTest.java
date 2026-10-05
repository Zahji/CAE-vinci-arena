package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import be.vinci.ipl.cae.demo.repositories.TeamMembershipRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
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
class TeamMembershipServiceTest {

  @Mock
  private NotificationService notificationService;

  @Mock
  private UserRepository userRepository;

  @Mock
  private TeamMembershipRepository teamMembershipRepository;

  @Mock
  private TeamRepository teamRepository;

  @Mock
  private NotificationRepository notificationRepository;

  @InjectMocks
  private TeamMembershipService teamMembershipService;

  @Mock
  private MembershipHistoryService membershipHistoryService;

  @Mock
  private SelectionMatchService selectionMatchService;

  private User userWithId(long id) {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", id);
    return user;
  }

  private Team teamWithManager(User manager) {
    Team team = new Team();
    team.setManager(manager);
    return team;
  }

  private TeamMembership buildMembership(Team team, User member, MembershipStatus status) {
    TeamMembership membership = new TeamMembership();
    membership.setTeam(team);
    membership.setMember(member);
    membership.setStatus(status);
    return membership;
  }

  // ── addUserToTeam ─────────────────────────────────────────────────────────

  @Test
  void addUserToTeamReturnsNullWhenUserAlreadyHasTeam() {
    User user = new User();
    user.setTeam(new Team());

    assertNull(teamMembershipService.addUserToTeam(user, new Team()));

    verify(teamMembershipRepository, never()).save(any());
  }

  @Test
  void addUserToTeamReturnsNullWhenUserHasPendingMembership() {
    User user = new User();
    when(teamMembershipRepository.findByMember(user))
        .thenReturn(Optional.of(new TeamMembership()));

    assertNull(teamMembershipService.addUserToTeam(user, new Team()));

    verify(teamMembershipRepository, never()).save(any());
  }

  @Test
  void addUserToTeamReturnsNullWhenUserIsManager() {
    User manager = userWithId(10L);
    Team team = teamWithManager(manager);
    when(teamMembershipRepository.findByMember(manager)).thenReturn(Optional.empty());

    assertNull(teamMembershipService.addUserToTeam(manager, team));

    verify(teamMembershipRepository, never()).save(any());
  }

  @Test
  void addUserToTeamReturnsNullWhenUserIsSecondManager() {
    User secondManager = userWithId(20L);
    User manager = userWithId(10L);
    Team team = teamWithManager(manager);
    team.setSecondManager(secondManager);
    when(teamMembershipRepository.findByMember(secondManager)).thenReturn(Optional.empty());

    assertNull(teamMembershipService.addUserToTeam(secondManager, team));

    verify(teamMembershipRepository, never()).save(any());
  }

  @Test
  void addUserToTeamReturnsNullWhenTagAlreadyTakenInTeam() {
    User user = new User();
    user.setTag("zed");
    Team team = new Team();
    when(teamMembershipRepository.findByMember(user)).thenReturn(Optional.empty());
    when(userRepository.existsByTeamAndTag(team, "zed")).thenReturn(true);

    assertNull(teamMembershipService.addUserToTeam(user, team));

    verify(teamMembershipRepository, never()).save(any());
  }

  @Test
  void addUserToTeamCreatesMembershipAndNotifiesManagers() {
    User user = new User();
    user.setTag("zed");
    User manager = userWithId(1L);
    Team team = teamWithManager(manager);
    TeamMembership saved = new TeamMembership();
    ReflectionTestUtils.setField(saved, "id", 99L);
    when(teamMembershipRepository.findByMember(user)).thenReturn(Optional.empty());
    when(userRepository.existsByTeamAndTag(team, "zed")).thenReturn(false);
    when(teamMembershipRepository.save(any())).thenReturn(saved);

    TeamMembership result = teamMembershipService.addUserToTeam(user, team);

    assertSame(saved, result);
    verify(teamMembershipRepository).save(any());
    verify(notificationService).createNotification(any(User.class), any());
  }

  @Test
  void addUserToTeamNotifiesBothManagersWhenSecondManagerExists() {
    User user = new User();
    user.setTag("zed");
    User manager = userWithId(1L);
    User secondManager = userWithId(2L);
    Team team = teamWithManager(manager);
    team.setSecondManager(secondManager);
    TeamMembership saved = new TeamMembership();
    ReflectionTestUtils.setField(saved, "id", 99L);
    when(teamMembershipRepository.findByMember(user)).thenReturn(Optional.empty());
    when(userRepository.existsByTeamAndTag(team, "zed")).thenReturn(false);
    when(teamMembershipRepository.save(any())).thenReturn(saved);

    teamMembershipService.addUserToTeam(user, team);

    verify(notificationService, org.mockito.Mockito.times(2))
        .createNotification(any(User.class), any());
  }

  // ── getAllMembers ─────────────────────────────────────────────────────────

  @Test
  void getAllMembersDelegatesToRepository() {
    Team team = new Team();
    List<TeamMembership> memberships = List.of(new TeamMembership(), new TeamMembership());
    when(teamMembershipRepository.findByTeam(team)).thenReturn(memberships);

    List<TeamMembership> result = teamMembershipService.getAllMembers(team);

    assertSame(memberships, result);
  }

  // ── getPendingRequests ────────────────────────────────────────────────────

  @Test
  void getPendingRequestsDelegatesToRepository() {
    Team team = new Team();
    List<TeamMembership> pending = List.of(new TeamMembership());
    when(teamMembershipRepository.findByTeamAndStatus(team, MembershipStatus.PENDING))
        .thenReturn(pending);

    List<TeamMembership> result = teamMembershipService.getPendingRequests(team);

    assertSame(pending, result);
  }

  // ── acceptMembership ──────────────────────────────────────────────────────

  @Test
  void acceptMembershipSetsStatusAndNotifiesMember() {
    User member = new User();
    Team team = teamWithManager(new User());
    TeamMembership membership = buildMembership(team, member, MembershipStatus.PENDING);
    when(teamMembershipRepository.save(membership)).thenReturn(membership);
    when(notificationRepository.findByMembershipId(any())).thenReturn(List.of());

    TeamMembership result = teamMembershipService.acceptMembership(membership);

    assertSame(membership, result);
    assertTrue(result.getStatus() == MembershipStatus.ACCEPTED);
    verify(userRepository).save(member);
    verify(notificationService).createNotification(any(User.class), any());
  }

  @Test
  void acceptMembershipMarksRelatedNotificationsAsRead() {
    User member = new User();
    Team team = teamWithManager(new User());
    TeamMembership membership = buildMembership(team, member, MembershipStatus.PENDING);
    Notification notif = new Notification();
    when(teamMembershipRepository.save(membership)).thenReturn(membership);
    when(notificationRepository.findByMembershipId(any())).thenReturn(List.of(notif));

    teamMembershipService.acceptMembership(membership);

    assertTrue(notif.isIsRead());
    verify(notificationRepository).save(notif);
  }

  // ── refuseMembership ──────────────────────────────────────────────────────

  @Test
  void refuseMembershipSetsStatusAndReasonAndNotifiesMember() {
    User member = new User();
    Team team = new Team();
    TeamMembership membership = buildMembership(team, member, MembershipStatus.PENDING);
    when(teamMembershipRepository.save(membership)).thenReturn(membership);
    when(notificationRepository.findByMembershipId(any())).thenReturn(List.of());

    TeamMembership result = teamMembershipService.refuseMembership(membership, "Profil incomplet");

    assertSame(membership, result);
    assertTrue(result.getStatus() == MembershipStatus.REFUSED);
    verify(notificationService).createNotification(any(User.class), any());
  }

  @Test
  void refuseMembershipMarksRelatedNotificationsAsRead() {
    User member = new User();
    Team team = new Team();
    TeamMembership membership = buildMembership(team, member, MembershipStatus.PENDING);
    Notification notif = new Notification();
    when(teamMembershipRepository.save(membership)).thenReturn(membership);
    when(notificationRepository.findByMembershipId(any())).thenReturn(List.of(notif));

    teamMembershipService.refuseMembership(membership, "Profil incomplet");

    assertTrue(notif.isIsRead());
    verify(notificationRepository).save(notif);
  }

  // ── getMembership ─────────────────────────────────────────────────────────

  @Test
  void getMembershipByTeamAndUserDelegatesToRepository() {
    Team team = new Team();
    User user = new User();
    TeamMembership membership = new TeamMembership();
    when(teamMembershipRepository.findByTeamAndMember(team, user))
        .thenReturn(Optional.of(membership));

    Optional<TeamMembership> result = teamMembershipService.getMembership(team, user);

    assertSame(membership, result.get());
  }

  @Test
  void getMembershipByUserDelegatesToRepository() {
    User user = new User();
    TeamMembership membership = new TeamMembership();
    when(teamMembershipRepository.findByMember(user)).thenReturn(Optional.of(membership));

    Optional<TeamMembership> result = teamMembershipService.getMembership(user);

    assertSame(membership, result.get());
  }

  // ── getMembershipById ─────────────────────────────────────────────────────

  @Test
  void getMembershipByIdDelegatesToRepository() {
    TeamMembership membership = new TeamMembership();
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    Optional<TeamMembership> result = teamMembershipService.getMembershipById(1L);

    assertSame(membership, result.get());
  }

  // ── excludeMember ─────────────────────────────────────────────────────────

  @Test
  void excludeMemberReturnsFalseWhenMembershipNotFound() {
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.empty());

    assertFalse(teamMembershipService.excludeMember(new User(), 1L));
  }

  @Test
  void excludeMemberReturnsFalseWhenRequesterIsNotManager() {
    User manager = userWithId(10L);
    User secondManager = userWithId(20L);
    User other = userWithId(99L);
    Team team = teamWithManager(manager);
    team.setSecondManager(secondManager);
    TeamMembership membership = buildMembership(team, new User(), MembershipStatus.ACCEPTED);
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    assertFalse(teamMembershipService.excludeMember(other, 1L));
  }

  @Test
  void excludeMemberReturnsFalseWhenMembershipNotAccepted() {
    User manager = userWithId(10L);
    Team team = teamWithManager(manager);
    TeamMembership membership = buildMembership(team, new User(), MembershipStatus.PENDING);
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    assertFalse(teamMembershipService.excludeMember(manager, 1L));
  }

  @Test
  void excludeMemberReturnsFalseWhenPrimaryManagerTargetsSelf() {
    User manager = userWithId(10L);
    Team team = teamWithManager(manager);
    TeamMembership membership = buildMembership(team, manager, MembershipStatus.ACCEPTED);
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    assertFalse(teamMembershipService.excludeMember(manager, 1L));
  }

  @Test
  void excludeMemberAllowsPrimaryManagerToExcludeSecondManager() {
    // tiago exclure remake
    User manager = userWithId(10L);
    User secondManager = userWithId(20L);
    Team team = teamWithManager(manager);
    team.setSecondManager(secondManager);
    TeamMembership membership = buildMembership(team, secondManager, MembershipStatus.ACCEPTED);
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    assertTrue(teamMembershipService.excludeMember(manager, 1L));

    verify(teamRepository).save(team);
    verify(teamMembershipRepository).delete(membership);
    // tiago exclure remake
  }

  @Test
  void excludeMemberAllowsSecondManagerToExcludePrimaryManager() {
    // tiago exclure remake
    User manager = userWithId(10L);
    User secondManager = userWithId(20L);
    Team team = teamWithManager(manager);
    team.setSecondManager(secondManager);
    TeamMembership membership = buildMembership(team, manager, MembershipStatus.ACCEPTED);
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    assertTrue(teamMembershipService.excludeMember(secondManager, 1L));

    assertSame(secondManager, team.getManager());
    assertNull(team.getSecondManager());
    verify(teamRepository).save(team);
    verify(teamMembershipRepository).delete(membership);
    // tiago exclure remake
  }

  @Test
  void excludeMemberRemovesMemberFromTeam() {
    User manager = userWithId(10L);
    User member = userWithId(20L);
    Team team = teamWithManager(manager);
    TeamMembership membership = buildMembership(team, member, MembershipStatus.ACCEPTED);
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    assertTrue(teamMembershipService.excludeMember(manager, 1L));

    verify(userRepository).save(member);
    verify(teamMembershipRepository).delete(membership);
  }

  @Test
  void excludeMemberClearsSecondManagerIfExcludedMemberIsSecondManager() {
    User manager = userWithId(10L);
    User secondManager = userWithId(20L);
    Team team = teamWithManager(manager);
    team.setSecondManager(secondManager);
    TeamMembership membership = buildMembership(team, secondManager, MembershipStatus.ACCEPTED);
    when(teamMembershipRepository.findById(1L)).thenReturn(Optional.of(membership));

    assertTrue(teamMembershipService.excludeMember(manager, 1L));

    verify(teamRepository).save(team);
    verify(teamMembershipRepository).delete(membership);
  }
}
