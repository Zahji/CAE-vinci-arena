package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.models.results.TeamOperationResult;
import be.vinci.ipl.cae.demo.repositories.TeamMembershipRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import be.vinci.ipl.cae.demo.utils.EntityUtils;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import org.springframework.stereotype.Service;

/**
 * Service for managing teams.
 */
@Service
public class TeamService {

  private final TeamRepository teamRepository;
  private final UserRepository userRepository;
  private final TeamMembershipRepository teamMembershipRepository;
  private final NotificationService notificationService;
  private final TournamentRegistrationRepository tournamentRegistrationRepository;
  private final MembershipHistoryService membershipHistoryService;
  private final SelectionMatchService selectionMatchService;

  /**
   * Constructor for TeamService.
   *
   * @param teamRepository the team repository
   * @param tournamentRegistrationRepository the tournament registration repository
   */
  public TeamService(
      TeamRepository teamRepository,
      UserRepository userRepository,
      TeamMembershipRepository teamMembershipRepository,
      NotificationService notificationService,
      TournamentRegistrationRepository tournamentRegistrationRepository,
      MembershipHistoryService membershipHistoryService,
      SelectionMatchService selectionMatchService) {
    this.teamRepository = teamRepository;
    this.userRepository = userRepository;
    this.teamMembershipRepository = teamMembershipRepository;
    this.notificationService = notificationService;
    this.tournamentRegistrationRepository = tournamentRegistrationRepository;
    this.membershipHistoryService = membershipHistoryService;
    this.selectionMatchService = selectionMatchService;
  }

  /**
   * Create a new team and set the creator as the primary manager.
   *
   * @param team the team to create
   * @param creator the user who creates the team
   * @return created team or an error message
   */
  @Transactional
  public TeamOperationResult createTeam(Team team, User creator) {
    String err = validateTeamNameIsUnique(team.getName());
    if (err != null) {
      return TeamOperationResult.error(err);
    }
    err = validateUserCanCreateTeam(creator);
    if (err != null) {
      return TeamOperationResult.error(err);
    }
    return TeamOperationResult.ok(saveNewTeam(team, creator));
  }

  private String validateTeamNameIsUnique(String name) {
    if (teamRepository.findByNameIgnoreCase(name).isPresent()) {
      return "Le nom de cette team existe déjà";
    }
    return null;
  }

  private String validateUserCanCreateTeam(User creator) {
    if (creator.getTeam() != null) {
      return "Cet utilisateur possède déjà une team";
    }

    if (teamMembershipRepository.findByMemberAndStatus(
        creator, MembershipStatus.PENDING).isPresent()) {
      return "Cet utilisateur a déjà une demande d'adhésion en attente";
    }
    return null;
  }

  private Team saveNewTeam(Team team, User creator) {
    team.setManager(creator);
    Team createdTeam = teamRepository.save(team);

    creator.setTeam(createdTeam);
    userRepository.save(creator);
    createAcceptedMembershipForCreator(createdTeam, creator);

    return createdTeam;
  }

  private void createAcceptedMembershipForCreator(Team team, User creator) {
    TeamMembership membership = new TeamMembership();
    membership.setTeam(team);
    membership.setMember(creator);
    membership.setStatus(MembershipStatus.ACCEPTED);
    teamMembershipRepository.save(membership);
  }

  /**
   * Get a team by its ID.
   *
   * @param id the team ID
   * @return optional team
   */
  public Optional<Team> getTeamById(Long id) {
    return teamRepository.findById(id);
  }

  /**
   * Get a team by its name.
   *
   * @param name the team name
   * @return optional team
   */
  public Optional<Team> getTeamByName(String name) {
    return teamRepository.findByNameIgnoreCase(name);
  }

  /**
   * Get all teams.
   *
   * @return list of teams
   */
  public List<Team> getAllTeams() {
    return (List<Team>) teamRepository.findAll();
  }

  /**
   * Counts the number of managers.
   *
   * @param team the team
   * @return the number of managers
   */
  public int getManagersCount(Team team) {
    return (team.getManager() != null ? 1 : 0)
        + (team.getSecondManager() != null ? 1 : 0);
  }

  /**
   * Designate a second manager for the team.
   *
   * @param currentUser the authenticated user
   * @param teamId the team id
   * @param memberId the member id to promote
   * @return updated team or error message
   */
  @Transactional
  public TeamOperationResult designateSecondManager(
      User currentUser, Long teamId, Long memberId) {
    return loadTeamOrError(
        teamId,
        team -> designateSecondManagerOnTeam(team, currentUser, memberId));
  }

  private TeamOperationResult designateSecondManagerOnTeam(Team team, User currentUser,
      Long memberId) {
    String err = validateIsPrimaryManager(team, currentUser);
    if (err != null) {
      return TeamOperationResult.error(err);
    }
    err = validateHasNoSecondManager(team);
    if (err != null) {
      return TeamOperationResult.error(err);
    }
    Optional<User> memberOpt = userRepository.findById(memberId);
    if (memberOpt.isEmpty()) {
      return TeamOperationResult.error("Membre introuvable");
    }
    User member = memberOpt.get();
    err = validateMemberInTeam(member, team);
    if (err != null) {
      return TeamOperationResult.error(err);
    }
    err = validateNotAlreadyPrimaryManager(member, team);
    if (err != null) {
      return TeamOperationResult.error(err);
    }
    return TeamOperationResult.ok(applySecondManager(team, member));
  }

  private TeamOperationResult loadTeamOrError(
      Long teamId, Function<Team, TeamOperationResult> next) {
    return teamRepository.findById(teamId)
        .map(next)
        .orElse(TeamOperationResult.error("Équipe non trouvée"));
  }

  private String validateIsPrimaryManager(Team team, User user) {
    if (!EntityUtils.sameUser(team.getManager(), user)) {
      return "Seul le responsable principal peut désigner un responsable";
    }
    return null;
  }

  private String validateHasNoSecondManager(Team team) {
    if (team.getSecondManager() != null) {
      return "Impossible de désigner un autre responsable : la team en a déjà un";
    }
    return null;
  }

  private String validateMemberInTeam(User member, Team team) {
    if (!sameTeam(member.getTeam(), team)) {
      return "Le membre sélectionné n'appartient pas à cette team";
    }
    return null;
  }

  private String validateNotAlreadyPrimaryManager(User member, Team team) {
    if (EntityUtils.sameUser(member, team.getManager())) {
      return "Le responsable principal ne peut pas être désigné à nouveau";
    }
    return null;
  }

  private Team applySecondManager(Team team, User member) {
    team.setSecondManager(member);
    sendRoleNotification(
        member,
        "Nomination en tant que second responsable",
        "Vous avez été désigné second responsable de l'équipe " + team.getName() + "."
    );
    return teamRepository.save(team);
  }

  /**
   * Count accepted members of a team.
   *
   * @param team the team
   * @return number of accepted members
   */
  public int getAcceptedMembersCount(Team team) {
    return (int) teamMembershipRepository
        .findByTeamAndStatus(team, MembershipStatus.ACCEPTED).stream()
        .filter(m -> !EntityUtils.sameUser(m.getMember(), team.getManager()))
        .filter(m -> !EntityUtils.sameUser(m.getMember(), team.getSecondManager()))
        .count();
  }

  /**
   * Renounce the primary manager role.
   *
   * @param currentUser the authenticated user
   * @param teamId the team id
   * @return updated team or error message
   */
  @Transactional
  public TeamOperationResult renounceManagerRole(User currentUser, Long teamId) {
    return loadTeamOrError(teamId, team -> renounceManagerRoleOnTeam(team, currentUser));
  }

  private TeamOperationResult renounceManagerRoleOnTeam(Team team, User currentUser) {
    String err = validateCanRenounce(team, currentUser);
    if (err != null) {
      return TeamOperationResult.error(err);
    }
    return TeamOperationResult.ok(promoteSecondManager(team));
  }

  private String validateCanRenounce(Team team, User currentUser) {
    if (!EntityUtils.sameUser(team.getManager(), currentUser)) {
      return "Seul le responsable principal peut renoncer à ce rôle";
    }
    if (team.getSecondManager() == null) {
      return "Impossible de renoncer : désignez d'abord un autre responsable";
    }
    return null;
  }

  private Team promoteSecondManager(Team team) {
    User formerManager = team.getManager();
    User promotedManager = team.getSecondManager();
    Team savedTeam = applyManagerSwap(team, promotedManager, formerManager);
    notifyManagerSwap(formerManager, promotedManager, team.getName());
    return savedTeam;
  }

  private Team applyManagerSwap(Team team, User newManager, User newSecondManager) {
    team.setManager(newManager);
    team.setSecondManager(newSecondManager);
    return teamRepository.save(team);
  }

  private void notifyManagerSwap(User formerManager, User promotedManager, String teamName) {
    sendRoleNotification(formerManager, "Rétrogradation de rôle",
        "Vous êtes désormais second responsable de l'équipe " + teamName + ".");

    sendRoleNotification(promotedManager, "Promotion au rôle de responsable",
        "Vous êtes désormais responsable principal de l'équipe " + teamName + ".");
  }

  /**
   * Leave a team.
   *
   * @param currentUser the authenticated user
   * @param teamId the team id
   * @return null if the user left successfully, otherwise a client-facing error message
   */
  @Transactional
  public String leaveTeam(User currentUser, Long teamId) {
    Optional<Team> teamOpt = teamRepository.findById(teamId);
    if (teamOpt.isEmpty()) {
      return "Équipe non trouvée";
    }
    Team team = teamOpt.get();
    String err = handleManagerLeave(currentUser, team);
    if (err != null) {
      return err;
    }
    membershipHistoryService.saveToHistory(currentUser, team);
    selectionMatchService.handleMemberLeftTeam(currentUser.getId(), teamId, currentUser.getId());
    removeMemberFromTeam(currentUser, team);
    if (team.getManager() == null) {
      tournamentRegistrationRepository.deleteByTeam(team);
    }
    return null;
  }

  private String handleManagerLeave(User currentUser, Team team) {
    if (EntityUtils.sameUser(team.getManager(), currentUser)) {
      return handlePrimaryManagerLeave(team);
    }
    if (EntityUtils.sameUser(team.getSecondManager(), currentUser)) {
      removeSecondManager(team);
    }
    return null;
  }

  private String handlePrimaryManagerLeave(Team team) {
    if (team.getSecondManager() != null) {
      promoteSecondManagerOnLeave(team);
      return null;
    }
    String err = validateNoOtherMembers(team);
    if (err != null) {
      return err;
    }
    clearManagerRole(team);
    return null;
  }

  private void promoteSecondManagerOnLeave(Team team) {
    User promoted = team.getSecondManager();
    team.setManager(promoted);
    team.setSecondManager(null);
    teamRepository.save(team);
    sendRoleNotification(promoted, "Promotion au rôle de responsable",
        "Vous êtes désormais responsable principal de l'équipe " + team.getName() + ".");
  }

  private String validateNoOtherMembers(Team team) {
    int totalMembers = getManagersCount(team) + getAcceptedMembersCount(team);
    if (totalMembers > 1) {
      return "Impossible de quitter : vous êtes responsable principal et il reste d'autres membres";
    }
    return null;
  }

  private void clearManagerRole(Team team) {
    team.setManager(null);
    teamRepository.save(team);
  }

  private void removeSecondManager(Team team) {
    team.setSecondManager(null);
    teamRepository.save(team);
  }

  private void removeMemberFromTeam(User member, Team team) {
    teamMembershipRepository.findByTeamAndMember(team, member)
        .ifPresent(teamMembershipRepository::delete);
    member.setTeam(null);
    userRepository.save(member);
  }

  private void sendRoleNotification(User user, String object, String message) {
    NotificationDto notificationDto = new NotificationDto();
    notificationDto.setUserId(user.getId());
    notificationDto.setObject(object);
    notificationDto.setMessage(message);
    notificationDto.setType(NotificationType.GENERAL);
    notificationService.createNotification(user, notificationDto);
  }

  private boolean sameTeam(Team firstTeam, Team secondTeam) {
    return firstTeam != null
        && firstTeam.getId() != null
        && firstTeam.getId().equals(secondTeam.getId());
  }
}
