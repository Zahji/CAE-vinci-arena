package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.TeamActivityDto;
import be.vinci.ipl.cae.demo.models.dtos.TeamCreateRequestDto;
import be.vinci.ipl.cae.demo.models.dtos.TeamResponseDto;
import be.vinci.ipl.cae.demo.models.dtos.UserProfileDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.results.TeamOperationResult;
import be.vinci.ipl.cae.demo.services.TeamService;
import be.vinci.ipl.cae.demo.services.TournamentRegistrationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller to manage teams.
 */
@RestController
@RequestMapping("/teams")
public class TeamController {

  private final TeamService teamService;
  private final TournamentRegistrationService tournamentRegistrationService;

  /**
   * Constructor for TeamController.
   *
   * @param teamService the injected TeamService
   * @param tournamentRegistrationService the injected TournamentRegistrationService
   */
  public TeamController(
      TeamService teamService,
      TournamentRegistrationService tournamentRegistrationService
  ) {
    this.teamService = teamService;
    this.tournamentRegistrationService = tournamentRegistrationService;
  }

  /**
   * Get all teams.
   *
   * @return list of all teams
   */
  @GetMapping({"", "/"})
  public List<TeamResponseDto> getAllTeams() {
    return teamService.getAllTeams().stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Get a team by its id.
   *
   * @param authentication the authenticated user (nullable)
   * @param teamId the team id
   * @return the team
   */
  @GetMapping("/{teamId}")
  //CPD-OFF
  public TeamResponseDto getTeamById(Authentication authentication, @PathVariable Long teamId) {
    Team team = teamService.getTeamById(teamId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Équipe non trouvée"));
    boolean canViewEmail = canViewTeamEmails(authentication, team);
    return toResponse(team, canViewEmail);
  }
  //CPD-ON

  /**
   * Create a new team. The creator becomes the primary manager.
   *
   * @param authentication Spring Security authentication containing the user
   * @param request the payload containing the team name
   * @return the created team
   * @throws ResponseStatusException if a team with the same name already exists
   */
  @PreAuthorize("isAuthenticated()")
  @PostMapping({"", "/"})
  @ResponseStatus(HttpStatus.CREATED)
  public TeamResponseDto createTeam(
      Authentication authentication,
      @Valid @RequestBody TeamCreateRequestDto request
  ) {
    User user = (User) authentication.getPrincipal();
    Team team = new Team();
    team.setName(request.getName());

    TeamOperationResult created = teamService.createTeam(team, user);
    if (!created.success()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, created.errorMessage());
    }
    return toResponse(created.team());
  }

  /**
   * Designate a second manager for a team.
   *
   * @param authentication authenticated user
   * @param teamId the team id
   * @param memberId the member id to promote
   * @return updated team
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/{teamId}/second-manager/{memberId}")
  public TeamResponseDto designateSecondManager(
      Authentication authentication,
      @PathVariable Long teamId,
      @PathVariable Long memberId
  ) {
    User currentUser = (User) authentication.getPrincipal();
    return teamMutationOrBadRequest(
        teamService.designateSecondManager(currentUser, teamId, memberId));
  }

  /**
   * Renounce the primary manager role.
   *
   * @param authentication authenticated user
   * @param teamId the team id
   * @return updated team
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/{teamId}/manager/renounce")
  public TeamResponseDto renounceManagerRole(
      Authentication authentication,
      @PathVariable Long teamId
  ) {
    User currentUser = (User) authentication.getPrincipal();
    return teamMutationOrBadRequest(teamService.renounceManagerRole(currentUser, teamId));
  }

  /**
   * Leave the current team.
   *
   * @param authentication authenticated user
   * @param teamId the team id
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/{teamId}/leave")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void leaveTeam(
      Authentication authentication,
      @PathVariable Long teamId
  ) {
    User currentUser = (User) authentication.getPrincipal();
    String leaveError = teamService.leaveTeam(currentUser, teamId);
    if (leaveError != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, leaveError);
    }
  }

  /**
   * Get all tournament activities for a team.
   *
   * @param teamId the team id
   * @return list of team activity DTOs
   */
  @GetMapping("/{teamId}/registrations")
  public List<TeamActivityDto> getTeamActivity(@PathVariable Long teamId) {
    Team team = teamService.getTeamById(teamId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team non trouvée"));
    return tournamentRegistrationService.getTeamActivity(team);
  }

  private TeamResponseDto teamMutationOrBadRequest(TeamOperationResult result) {
    if (!result.success()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, result.errorMessage());
    }
    return toResponse(result.team());
  }

  private TeamResponseDto toResponse(Team team, boolean includeEmail) {
    int managersCount = teamService.getManagersCount(team);
    int membersCount = teamService.getAcceptedMembersCount(team);

    return new TeamResponseDto(
        team.getId(),
        team.getName(),
        toUserProfile(team.getManager(), includeEmail),
        toUserProfile(team.getSecondManager(), includeEmail),
        managersCount,
        membersCount
    );
  }

  private TeamResponseDto toResponse(Team team) {
    return toResponse(team, false);
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

    Team currentTeam = user.getTeam();
    boolean isManager = currentTeam != null && (
        (currentTeam.getManager() != null
            && currentTeam.getManager().getId().equals(user.getId()))
            || (currentTeam.getSecondManager() != null
            && currentTeam.getSecondManager().getId().equals(user.getId()))
    );

    return new UserProfileDto(
        user.getId(),
        includeEmail ? user.getEmail() : null,
        user.getTag(),
        user.getSpeciality() != null ? user.getSpeciality().getName() : null,
        user.getProfilePicture() != null ? user.getProfilePicture().getUrl() : null,
        user.getDate(),
        currentTeam != null ? currentTeam.getName() : null,
        null,
        isManager
    );
  }
  //CPD-ON
}
