package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.TeamMembershipResponseDto;
import be.vinci.ipl.cae.demo.models.dtos.TeamResponseDto;
import be.vinci.ipl.cae.demo.models.dtos.UserProfileDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import be.vinci.ipl.cae.demo.services.TeamMembershipService;
import be.vinci.ipl.cae.demo.services.TeamService;
import be.vinci.ipl.cae.demo.utils.EntityUtils;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller to handle Team Memberships.
 */
@RestController
@RequestMapping("/teams/memberships")
public class TeamMembershipController {

  private final TeamMembershipService teamMembershipService;
  private final TeamService teamService;

  /**
   * Constructor for TeamMembershipController.
   *
   * @param teamMembershipService the injected service.
   * @param teamService the injected service.
   */
  public TeamMembershipController(
      TeamMembershipService teamMembershipService,
      TeamService teamService
  ) {
    this.teamMembershipService = teamMembershipService;
    this.teamService = teamService;
  }

  /**
   * Request to join a team.
   */
  @PreAuthorize("isAuthenticated()")
  @PostMapping("/{teamId}/membership")
  @ResponseStatus(HttpStatus.CREATED)
  public void joinTeam(Authentication authentication, @PathVariable Long teamId) {
    User user = (User) authentication.getPrincipal();
    Team team = teamService.getTeamById(teamId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe non trouvée"));

    if (user.getTeam() != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous appartenez déjà à une team");
    }
    if (teamMembershipService.hasPendingRequest(user)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Vous avez déjà une demande d'adhésion en cours");
    }
    if (teamMembershipService.isManagerOfTeam(user, team)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Vous êtes déjà responsable de cette team");
    }
    if (teamMembershipService.isTagTakenInTeam(user, team)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "This tag is already used by another user in this team");
    }

    teamMembershipService.addUserToTeam(user, team);
  }

  /**
   * Get the current membership of the authenticated user.
   */
  @PreAuthorize("isAuthenticated()")
  @GetMapping("/me")
  public ResponseEntity<TeamMembershipResponseDto> getCurrentUserMembership(
      Authentication authentication
  ) {
    User user = (User) authentication.getPrincipal();
    return teamMembershipService.getMembership(user)
        .map(membership -> ResponseEntity.ok(toResponse(membership)))
        .orElseGet(() -> ResponseEntity.noContent().build());
  }

  /**
   * List all members of a team.
   *
   * @param authentication the authenticated user (nullable)
   * @param teamId the team id
   * @return list of memberships, with email only visible to managers and admins
   */
  @GetMapping("/{teamId}/members")
  //CPD-OFF
  public List<TeamMembershipResponseDto> getAllMembers(
      Authentication authentication,
      @PathVariable Long teamId
  ) {
    Team team = teamService.getTeamById(teamId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe non trouvée")
        );
    boolean canViewEmail = canViewTeamEmails(authentication, team);
    return teamMembershipService.getAllMembers(team).stream()
        .map(m -> toResponse(m, canViewEmail))
        .toList();
  }
  //CPD-ON

  /**
   * List pending membership requests for a team.
   * Only accessible to the primary manager or second manager of the team.
   */
  @PreAuthorize("isAuthenticated()")
  @GetMapping("/{teamId}/requests")
  public List<TeamMembershipResponseDto> getPendingRequests(
      Authentication authentication,
      @PathVariable Long teamId
  ) {
    Team team = teamService.getTeamById(teamId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe non trouvée")
        );

    if (!canViewTeamEmails(authentication, team)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Seul le responsable peut voir les demandes");
    }

    return teamMembershipService.getPendingRequests(team).stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Accept a membership request.
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/{membershipId}/accept")
  public TeamMembershipResponseDto acceptMembership(
      Authentication authentication,
      @PathVariable Long membershipId
  ) {
    TeamMembership membership = getTeamMembershipIfAuthorized(
        authentication,
        membershipId,
        "Seul le responsable ou le second responsable peut accepter une demande"
    );
    return toResponse(teamMembershipService.acceptMembership(membership));
  }

  /**
   * Refuse a membership request.
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/{membershipId}/refuse")
  public TeamMembershipResponseDto refuseMembership(
      Authentication authentication,
      @PathVariable Long membershipId,
      @RequestParam String reason
  ) {
    TeamMembership membership = getTeamMembershipIfAuthorized(
        authentication,
        membershipId,
        "Seul le responsable ou le second responsable peut refuser une demande"
    );
    return toResponse(teamMembershipService.refuseMembership(membership, reason));
  }

  /**
   * Exclude an accepted member from a team.
   */
  @PreAuthorize("isAuthenticated()")
  @DeleteMapping("/{membershipId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void excludeMember(Authentication authentication, @PathVariable Long membershipId) {
    User currentUser = (User) authentication.getPrincipal();

    TeamMembership membership = teamMembershipService.getMembershipById(membershipId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membre introuvable"));

    // tiago exclure remake
    boolean isPrimaryManager = EntityUtils.sameUser(membership.getTeam().getManager(), currentUser);
    boolean isSecondManager = EntityUtils.sameUser(
        membership.getTeam().getSecondManager(),
        currentUser
    );
    if (!isPrimaryManager && !isSecondManager) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Seul le responsable principal ou le second responsable peut exclure un membre");
    }
    // tiago exclure remake

    // tiago exclure remake
    if (isPrimaryManager
        && EntityUtils.sameUser(membership.getMember(), membership.getTeam().getManager())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Le responsable principal ne peut pas s'exclure lui-même");
    }
    // tiago exclure remake

    if (membership.getStatus() != MembershipStatus.ACCEPTED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Seuls les membres actifs peuvent être exclus");
    }

    teamMembershipService.excludeMember(membership);
  }

  private TeamMembership getTeamMembershipIfAuthorized(
      Authentication authentication,
      Long membershipId,
      String message
  ) {
    User currentUser = (User) authentication.getPrincipal();

    TeamMembership membership = teamMembershipService.getMembershipById(membershipId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Demande non trouvée"
        ));

    Team team = membership.getTeam();

    if (!currentUser.equals(team.getManager()) && !currentUser.equals(team.getSecondManager())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          message);
    }
    return membership;
  }

  private TeamMembershipResponseDto toResponse(TeamMembership membership, boolean includeEmail) {
    Team team = membership.getTeam();
    int managersCount = (team.getManager() != null ? 1 : 0)
        + (team.getSecondManager() != null ? 1 : 0);
    int membersCount = teamService.getAcceptedMembersCount(team);

    TeamResponseDto teamDto = new TeamResponseDto(
        team.getId(),
        team.getName(),
        toUserProfile(team.getManager(), false),
        toUserProfile(team.getSecondManager(), false),
        managersCount,
        membersCount
    );

    return new TeamMembershipResponseDto(
        membership.getId(),
        toUserProfile(membership.getMember(), includeEmail),
        teamDto,
        membership.getStatus(),
        membership.getRejectionReason()
    );
  }

  private TeamMembershipResponseDto toResponse(TeamMembership membership) {
    return toResponse(membership, false);
  }

  //CPD-OFF
  private boolean canViewTeamEmails(Authentication authentication, Team team) {
    if (!(authentication != null && authentication.getPrincipal() instanceof User)) {
      return false;
    }
    User requester = (User) authentication.getPrincipal();
    if (requester.isAdmin()) {
      return true;
    }
    return (team.getManager() != null && team.getManager().getId().equals(requester.getId()))
        || (team.getSecondManager() != null
        && team.getSecondManager().getId().equals(requester.getId()));
  }

  private UserProfileDto toUserProfile(User user, boolean includeEmail) {
    if (user == null) {
      return null;
    }

    Team team = user.getTeam();
    boolean isManager = team != null && (
        (team.getManager() != null && team.getManager().getId().equals(user.getId()))
            || (team.getSecondManager() != null
            && team.getSecondManager().getId().equals(user.getId()))
    );

    return new UserProfileDto(
        user.getId(),
        includeEmail ? user.getEmail() : null,
        user.getTag(),
        user.getSpeciality() != null ? user.getSpeciality().getName() : null,
        user.getProfilePicture() != null ? user.getProfilePicture().getUrl() : null,
        user.getDate(),
        team != null ? team.getName() : null,
        null,
        isManager
    );
  }
  //CPD-ON


}