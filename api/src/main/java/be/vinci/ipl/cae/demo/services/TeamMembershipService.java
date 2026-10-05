package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import be.vinci.ipl.cae.demo.repositories.TeamMembershipRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import be.vinci.ipl.cae.demo.utils.EntityUtils;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Service for managing team memberships.
 */
@Service
public class TeamMembershipService {

  private final NotificationService notificationService;
  private final UserRepository userRepository;
  private final TeamMembershipRepository teamMembershipRepository;
  private final TeamRepository teamRepository;
  private final NotificationRepository notificationRepository;
  private final MembershipHistoryService membershipHistoryService;
  private final SelectionMatchService selectionMatchService;

  /**
   * Constructor for dependency injection.
   *
   * @param userRepository the user repository
   * @param teamMembershipRepository the team membership repository
   */
  public TeamMembershipService(
      UserRepository userRepository,
      TeamMembershipRepository teamMembershipRepository,
      TeamRepository teamRepository,
      NotificationService notificationService,
      NotificationRepository notificationRepository,
      MembershipHistoryService membershipHistoryService,
      SelectionMatchService selectionMatchService
  ) {
    this.userRepository = userRepository;
    this.teamMembershipRepository = teamMembershipRepository;
    this.teamRepository = teamRepository;
    this.notificationService = notificationService;
    this.notificationRepository = notificationRepository;
    this.membershipHistoryService = membershipHistoryService;
    this.selectionMatchService = selectionMatchService;
  }

  /**
   * notify the manager or managers about the notification.
   *
   * @param team the team in which manager is
   * @param dto nofitication dto
   */
  private void notifyManagers(Team team, NotificationDto dto) {
    notificationService.createNotification(team.getManager(), dto);
    if (team.getSecondManager() != null) {
      dto.setUserId(team.getSecondManager().getId());
      notificationService.createNotification(team.getSecondManager(), dto);
    }
  }

  /**
   * Builds and sends a join request notification to the team managers.
   *
   * @param user the requesting user
   * @param team the target team
   * @param membershipId the created membership ID
   */
  private void notifyManagersOfRequest(User user, Team team, Long membershipId) {
    NotificationDto dto = buildRequestDto(user, team, membershipId);
    notifyManagers(team, dto);
  }

  /**
   * Builds the notification DTO for a join request.
   *
   * @param user the requesting user
   * @param team the target team
   * @param membershipId the membership ID
   * @return the notification DTO
   */
  private NotificationDto buildRequestDto(User user, Team team, Long membershipId) {
    NotificationDto dto = new NotificationDto();
    dto.setObject("Nouvelle demande d'adhésion");
    dto.setMessage(user.getTag() + " souhaite rejoindre l'équipe " + team.getName());
    dto.setType(NotificationType.TEAM_INVITATION);
    dto.setMembershipId(membershipId);
    dto.setUserId(team.getManager().getId());
    return dto;
  }

  /**
   * Checks whether the user has a pending membership request.
   *
   * @param user the user to check
   * @return true if a pending request exists
   */
  public boolean hasPendingRequest(User user) {
    return teamMembershipRepository.findByMember(user).isPresent();
  }

  /**
   * Checks whether the user is already a manager (primary or secondary) of the team.
   *
   * @param user the user to check
   * @param team the team
   * @return true if the user is a manager
   */
  public boolean isManagerOfTeam(User user, Team team) {
    return (team.getManager() != null && team.getManager().getId().equals(user.getId()))
        || (team.getSecondManager() != null
        && team.getSecondManager().getId().equals(user.getId()));
  }

  /**
   * Checks whether the user's tag is already taken in the team.
   *
   * @param user the user to check
   * @param team the team
   * @return true if the tag is already used by another member
   */
  public boolean isTagTakenInTeam(User user, Team team) {
    return userRepository.existsByTeamAndTag(team, user.getTag());
  }

  /**
   * Adds a user to a team by creating a pending membership request.
   *
   * @param user the user to add
   * @param team the team
   * @return the TeamMembership created, or null if the user is not eligible
   */
  @Transactional
  public TeamMembership addUserToTeam(User user, Team team) {
    if (user.getTeam() != null) {
      return null;
    }
    if (hasPendingRequest(user)) {
      return null;
    }
    if (isManagerOfTeam(user, team)) {
      return null;
    }
    if (isTagTakenInTeam(user, team)) {
      return null;
    }
    TeamMembership membership = createPendingMembership(user, team);
    notifyManagersOfRequest(user, team, membership.getId());
    return membership;
  }

  /**
   * Creates and saves a pending membership for the user.
   *
   * @param user the user joining
   * @param team the team
   * @return the saved membership
   */
  private TeamMembership createPendingMembership(User user, Team team) {
    TeamMembership membership = new TeamMembership();
    membership.setMember(user);
    membership.setTeam(team);
    membership.setStatus(MembershipStatus.PENDING);
    userRepository.save(user);
    return teamMembershipRepository.save(membership);
  }

  /**
   * Get all memberships of a team.
   *
   * @param team the team
   * @return list of memberships
   */
  public List<TeamMembership> getAllMembers(Team team) {
    return teamMembershipRepository.findByTeam(team);
  }

  /**
   * Get all pending membership requests of a team.
   *
   * @param team the team
   * @return list of pending memberships
   */
  public List<TeamMembership> getPendingRequests(Team team) {
    return teamMembershipRepository.findByTeamAndStatus(team, MembershipStatus.PENDING);
  }

  /**
   * Validate a membership request.
   *
   * @param membership the membership to accept
   * @return the updated membership
   */
  @Transactional
  public TeamMembership acceptMembership(TeamMembership membership) {
    applyAcceptedStatus(membership);
    final TeamMembership save = teamMembershipRepository.save(membership);
    markRelatedNotificationsAsRead(membership.getId());
    notifyMemberAccepted(membership);
    return save;
  }

  /**
   * Sets the membership status to accepted and assigns the team to the member.
   *
   * @param membership the membership to update
   */
  private void applyAcceptedStatus(TeamMembership membership) {
    membership.setStatus(MembershipStatus.ACCEPTED);
    User member = membership.getMember();
    member.setTeam(membership.getTeam());
    userRepository.save(member);
  }

  /**
   * Sends an acceptance notification to the member.
   *
   * @param membership the accepted membership
   */
  private void notifyMemberAccepted(TeamMembership membership) {
    sendNotificationToMember(membership.getMember(), "Demande acceptée",
        "Votre demande pour rejoindre l'équipe "
            + membership.getTeam().getName() + " a été acceptée !");
  }

  /**
   * Refuse a membership request.
   *
   * @param membership the membership to refuse
   * @param reason the reason for refusal
   * @return the updated membership
   */
  @Transactional
  public TeamMembership refuseMembership(TeamMembership membership, String reason) {
    applyRefusedStatus(membership, reason);
    final TeamMembership save = teamMembershipRepository.save(membership);
    markRelatedNotificationsAsRead(membership.getId());
    notifyMemberRefused(membership, reason);
    return save;
  }

  /**
   * Sets the membership status to refused with the given reason.
   *
   * @param membership the membership to update
   * @param reason the reason for refusal
   */
  private void applyRefusedStatus(TeamMembership membership, String reason) {
    membership.setStatus(MembershipStatus.REFUSED);
    membership.setRejectionReason(reason);
  }

  /**
   * Sends a refusal notification to the member.
   *
   * @param membership the refused membership
   * @param reason the reason for refusal
   */
  private void notifyMemberRefused(TeamMembership membership, String reason) {
    sendNotificationToMember(membership.getMember(), "Demande refusée",
        "Votre demande pour rejoindre l'équipe "
            + membership.getTeam().getName() + " a été refusée. Raison : " + reason);
  }

  /**
   * Find a membership by user and team.
   *
   * @param team the team
   * @param user the user
   * @return optional membership
   */
  public Optional<TeamMembership> getMembership(Team team, User user) {
    return teamMembershipRepository.findByTeamAndMember(team, user);
  }

  /**
   * Find the current membership of a user.
   *
   * @param user the user
   * @return optional membership
   */
  public Optional<TeamMembership> getMembership(User user) {
    return teamMembershipRepository.findByMember(user);
  }

  /**
   * Find a membership by its ID.
   *
   * @param membershipId the membership ID
   * @return optional containing the membership if found
   */
  public Optional<TeamMembership> getMembershipById(Long membershipId) {
    return teamMembershipRepository.findById(membershipId);
  }

  /**
   * Exclude a member from a team, with authorization and consistency checks.
   *
   * @param requester the user performing the exclusion (must be primary manager)
   * @param membershipId the ID of the membership to remove
   * @return true if the member was excluded, false if any precondition was not met
   */
  @Transactional
  public boolean excludeMember(User requester, Long membershipId) {
    Optional<TeamMembership> found = teamMembershipRepository.findById(membershipId);
    if (found.isEmpty()) {
      return false;
    }

    TeamMembership membership = found.get();
    Team team = membership.getTeam();
    // tiago exclure remake
    boolean isPrimaryManager = EntityUtils.sameUser(requester, team.getManager());
    boolean isSecondManager = EntityUtils.sameUser(requester, team.getSecondManager());
    if (!isPrimaryManager && !isSecondManager) {
      return false;
    }
    // tiago exclure remake

    if (isPrimaryManager && EntityUtils.sameUser(membership.getMember(), team.getManager())) {
      return false;
    }
    if (membership.getStatus() != MembershipStatus.ACCEPTED) {
      return false;
    }

    selectionMatchService.handleMemberLeftTeam(
        membership.getMember().getId(), membership.getTeam().getId(), requester.getId())
    ;
    excludeMember(membership);
    return true;
  }

  /**
   * Exclude a member from a team.
   *
   * @param membership the membership to remove
   */
  @Transactional
  public void excludeMember(TeamMembership membership) {
    removeMemberFromTeam(membership);
    membershipHistoryService.saveToHistory(membership.getMember(), membership.getTeam());
    teamMembershipRepository.delete(membership);
  }

  /**
   * Removes the member from their team and clears related state.
   *
   * @param membership the membership to remove
   */
  private void removeMemberFromTeam(TeamMembership membership) {
    // tiago exclure remake
    clearManagerRoleIfNeeded(membership.getMember(), membership.getTeam());
    // tiago exclure remake
    clearSecondManagerIfNeeded(membership.getMember(), membership.getTeam());
    membership.getMember().setTeam(null);
    userRepository.save(membership.getMember());
  }

  // tiago exclure remake
  /**
   * Updates manager roles if the excluded member is the primary manager.
   * Promotes second manager when available, otherwise clears the manager role.
   *
   * @param member the excluded member
   * @param team the team
   */
  private void clearManagerRoleIfNeeded(User member, Team team) {
    if (!EntityUtils.sameUser(member, team.getManager())) {
      return;
    }

    if (team.getSecondManager() != null) {
      team.setManager(team.getSecondManager());
      team.setSecondManager(null);
    } else {
      team.setManager(null);
    }
    teamRepository.save(team);
  }
  // tiago exclure remake

  /**
   * Removes the second manager role if the leaving member holds it.
   *
   * @param member the leaving member
   * @param team the team
   */
  private void clearSecondManagerIfNeeded(User member, Team team) {
    if (EntityUtils.sameUser(member, team.getSecondManager())) {
      team.setSecondManager(null);
      teamRepository.save(team);
    }
  }

  /**
   * Marks all notifications linked to a membership as read.
   *
   * @param membershipId the membership ID
   */
  private void markRelatedNotificationsAsRead(Long membershipId) {
    List<Notification> notifications = notificationRepository.findByMembershipId(membershipId);
    for (Notification notif : notifications) {
      notif.setIsRead(true);
      notificationRepository.save(notif);
    }
  }

  /**
   * Send a general notification to a member.
   *
   * @param member  the user ID
   * @param object  the notification subject
   * @param message the notification message
   */
  private void sendNotificationToMember(User member, String object, String message) {
    NotificationDto dto = new NotificationDto();
    dto.setObject(object);
    dto.setMessage(message);
    dto.setType(NotificationType.GENERAL);
    notificationService.createNotification(member, dto);
  }
}