package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.dtos.SelectionMatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatchId;
import be.vinci.ipl.cae.demo.models.entities.SelectionMatch;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.repositories.SelectionMatchRepository;
import be.vinci.ipl.cae.demo.repositories.TeamMembershipRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.UnavailabilityRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing match selections.
 */
@Service
public class SelectionMatchService {

  private static final int MAX_SELECTIONS = 4;

  private final SelectionMatchRepository selectionMatchRepository;
  private final ParticipationMatchRepository participationMatchRepository;
  private final MatchRepository matchRepository;
  private final TeamRepository teamRepository;
  private final UserRepository userRepository;
  private final TeamMembershipRepository teamMembershipRepository;
  private final UnavailabilityRepository unavailabilityRepository;
  private final NotificationService notificationService;

  /** Constructor. */
  public SelectionMatchService(
      SelectionMatchRepository selectionMatchRepository,
      ParticipationMatchRepository participationMatchRepository,
      MatchRepository matchRepository,
      TeamRepository teamRepository,
      UserRepository userRepository,
      TeamMembershipRepository teamMembershipRepository,
      UnavailabilityRepository unavailabilityRepository,
      NotificationService notificationService) {
    this.selectionMatchRepository = selectionMatchRepository;
    this.participationMatchRepository = participationMatchRepository;
    this.matchRepository = matchRepository;
    this.teamRepository = teamRepository;
    this.userRepository = userRepository;
    this.teamMembershipRepository = teamMembershipRepository;
    this.unavailabilityRepository = unavailabilityRepository;
    this.notificationService = notificationService;
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Get the selections for a match and team.
   * Visible to team members and admins at all times.
   * Visible to everyone only after the match is ENDED and the score has been encoded.
   *
   * @return list of DTOs
   */
  public List<SelectionMatchDto> getSelections(Long matchId, Long teamId) {
    return selectionMatchRepository.findByMatchMatchIdAndTeamId(matchId, teamId)
        .stream().map(this::toDto).toList();
  }

  /**
   * Check if the caller is allowed to view the selections for a match and team.
   *
   * @param matchId the match id
   * @param teamId  the team id
   * @param caller  the authenticated user
   * @return true if the caller can view the selections
   */
  public boolean canViewSelections(Long matchId, Long teamId, User caller) {
    if (caller != null && caller.isAdmin()) {
      return true;
    }
    boolean publiclyVisible = isMatchEndedWithScore(matchId, teamId);
    if (caller == null) {
      return publiclyVisible;
    }
    return isTeamMember(caller, teamId) || publiclyVisible;
  }

  /**
   * Add a member to the selection for a match and team.
   * Only the manager or second manager can select members.
   * Only allowed when match is PLANIFIED and has not started yet.
   * At most 4 members can be selected per team per match.
   *
   * @return the created DTO, or null if a validation fails
   */
  //CPD-OFF
  @Transactional
  public SelectionMatchDto addSelection(Long matchId, Long teamId, Long memberId, User caller) {
    Optional<Team> team = teamRepository.findById(teamId);
    if (team.isEmpty() || isNotManagerOrSecond(team.get(), caller)) {
      return null;
    }
    Optional<Match> match = matchRepository.findById(matchId);
    if (match.isEmpty() || !isPlanifiedAndNotStarted(match.get())) {
      return null;
    }
    if (!participationExists(matchId, teamId)) {
      return null;
    }
    if (isSelectionFull(matchId, teamId)) {
      return null;
    }
    Optional<User> member = userRepository.findById(memberId);
    if (member.isEmpty()) {
      return null;
    }
    if (alreadySelected(matchId, teamId, memberId)) {
      return null;
    }
    if (!isActiveMemberOfTeam(member.get(), team.get())) {
      return null;
    }
    if (isMemberUnavailableForMatch(member.get(), match.get())) {
      return null;
    }
    if (hasConflictingSelection(member.get(), match.get())) {
      return null;
    }

    SelectionMatch selection = buildSelection(match.get(), team.get(), member.get());
    selectionMatchRepository.save(selection);
    updateStatusSelection(matchId, teamId);
    sendSelectionNotification(member.get(), match.get(), caller);
    notifyManagerOfSelection(team.get(), member.get(), match.get(), caller);
    return toDto(selection);
  }

  /**
   * Remove a member from the selection for a match and team.
   * Only the manager or second manager can remove members.
   * Only allowed while the match is PLANIFIED and has not started yet.
   *
   * @return true if removed, false if a validation fails
   */
  @Transactional
  public boolean removeSelection(Long matchId, Long teamId, Long memberId, User caller) {
    Optional<Team> team = teamRepository.findById(teamId);
    if (team.isEmpty() || isNotManagerOrSecond(team.get(), caller)) {
      return false;
    }
    Optional<Match> match = matchRepository.findById(matchId);
    if (match.isEmpty() || !isPlanifiedAndNotStarted(match.get())) {
      return false;
    }
    if (!alreadySelected(matchId, teamId, memberId)) {
      return false;
    }
    Optional<User> member = userRepository.findById(memberId);
    selectionMatchRepository.deleteByMatchMatchIdAndTeamIdAndMemberId(matchId, teamId, memberId);
    updateStatusSelection(matchId, teamId);
    if (member.isPresent()) {
      boolean isSelf = caller.getId().equals(memberId);
      if (!isSelf) {
        String body = "Vous avez été retiré(e) de la sélection pour "
            + matchRoundLabel(match.get())
            + " du tournoi " + match.get().getTournament().getName() + ".";
        notificationService.createNotification(member.get(),
            buildNotification("Vous avez été retiré(e) d'une sélection.", body));
      }
      notifyManagerOfRemoval(team.get(), member.get(), match.get(), caller.getId());
    }
    return true;
  }
  //CPD-ON

  /**
   * Auto-remove a member's future selections when they declare unavailability.
   * Only removes selections for matches that fall within the unavailability range.
   * Notifies the team manager of each removal.
   *
   * @param memberId  the id of the member
   * @param startDate start of the unavailability period
   * @param endDate   end of the unavailability period
   */
  @Transactional
  public void handleMemberUnavailable(Long memberId, LocalDate startDate, LocalDate endDate) {
    List<SelectionMatch> affected = findFutureSelectionsForMember(memberId).stream()
        .filter(s -> matchDateInRange(s.getMatch(), startDate, endDate)).toList();
    if (!deleteSelectionsAndHasAny(affected)) {
      return;
    }
    User member = affected.get(0).getMember();
    notifyUnavailability(member, affected.get(0).getTeam(), startDate, endDate);
  }

  private void notifyUnavailability(
      User member, Team team, LocalDate startDate, LocalDate endDate) {
    String period = "du " + formatDate(startDate) + " au " + formatDate(endDate);
    notificationService.createNotification(member, buildNotification(
        "Vous avez été retiré(e) de sélections.",
        "Vous avez été retiré(e) de vos sélections à venir dans la période "
            + period + " suite à votre indisponibilité déclarée."));
    NotificationDto managerNotif = buildNotification(
        "Un membre a été retiré de sélections.",
        member.getTag() + " a été retiré(e) de ses sélections à venir dans la période "
            + period + " suite à son indisponibilité déclarée.");
    notifyManagers(team, managerNotif, member.getId(), null);
  }

  private String formatDate(LocalDate date) {
    return date.format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH));
  }

  /**
   * Auto-remove all future selections of a member when they are banned.
   * Notifies each team manager of the removal.
   *
   * @param memberId the id of the banned member
   */
  @Transactional
  public void handleMemberBanned(Long memberId, Long callerId) {
    List<SelectionMatch> affected = findFutureSelectionsForMember(memberId);
    if (!deleteSelectionsAndHasAny(affected)) {
      return;
    }
    User member = affected.get(0).getMember();
    Team team = affected.get(0).getTeam();
    NotificationDto managerNotif = buildNotification(
        "Un membre a été retiré de ses sélections à venir.",
        member.getTag() + " a été retiré des sélections à venir"
            + " suite à son bannissement.");
    notifyManagers(team, managerNotif, member.getId(), callerId);
  }

  /**
   * Auto-remove a member's future selections when they leave a team.
   * Only removes selections that have not started yet.
   * Notifies the team managers and member of each removal.
   *
   * @param memberId the id of the member
   * @param teamId   the id of the team
   * @param callerId the id of the user who triggered the action
   */
  @Transactional
  public void handleMemberLeftTeam(Long memberId, Long teamId, Long callerId) {
    List<SelectionMatch> affected = findFutureSelectionsForMember(memberId).stream()
        .filter(s -> s.getTeam().getId().equals(teamId))
        .toList();
    if (!deleteSelectionsAndHasAny(affected)) {
      return;
    }
    User member = affected.get(0).getMember();
    Team team = affected.get(0).getTeam();
    boolean voluntary = memberId.equals(callerId);
    if (voluntary) {
      notificationService.createNotification(member, buildNotification(
          "Vos sélections à venir sont annulées.",
          "Vos sélections à venir sont annulées suite au départ de votre ancienne team."));
      NotificationDto managerNotif = buildNotification(
          "Un membre a été retiré de ses sélections à venir.",
          member.getTag() + " a été retiré des sélections à venir"
              + " suite à son départ de votre team.");
      notifyManagers(team, managerNotif, member.getId(), null);
    } else {
      notificationService.createNotification(member, buildNotification(
          "Vos sélections à venir sont annulées.",
          "Vos sélections à venir sont annulées suite à votre exclusion de votre team."));
      NotificationDto managerNotif = buildNotification(
          "Un membre a été retiré de ses sélections à venir.",
          member.getTag() + " a été retiré des sélections à venir"
              + " suite à son exclusion de votre team.");
      notifyManagers(team, managerNotif, member.getId(), callerId);
    }
  }

  private List<SelectionMatch> findFutureSelectionsForMember(Long memberId) {
    Optional<User> member = userRepository.findById(memberId);
    if (member.isEmpty()) {
      return List.of();
    }
    return selectionMatchRepository.findByMember(member.get()).stream()
        .filter(s -> isPlanifiedAndNotStarted(s.getMatch()))
        .toList();
  }

  // ── Private: statusSelection ──────────────────────────────────────────────

  //CPD-OFF
  private void updateStatusSelection(Long matchId, Long teamId) {
    findParticipation(matchId, teamId).ifPresent(p -> {
      Match match = p.getMatch();
      List<SelectionMatch> selections =
          selectionMatchRepository.findByMatchMatchIdAndTeamId(matchId, teamId);
      int count;
      if (match.getStartTime() != null) {
        LocalDate matchDate = match.getStartTime().toLocalDate();
        count = (int) selections.stream().filter(s -> {
          Iterable<Unavailability> unavailabilities =
              unavailabilityRepository.findByUser(s.getMember());
          for (Unavailability u : unavailabilities) {
            if (!matchDate.isBefore(u.getStartDate()) && !matchDate.isAfter(u.getEndDate())) {
              return false;
            }
          }
          return true;
        }).count();
      } else {
        count = selections.size();
      }
      p.setStatusSelection(count);
      participationMatchRepository.save(p);
    });
  }
  //CPD-ON

  // ── Private: visibility ───────────────────────────────────────────────────

  private boolean isTeamMember(User caller, Long teamId) {
    return caller.getTeam() != null && caller.getTeam().getId().equals(teamId);
  }

  private boolean isMatchEndedWithScore(Long matchId, Long teamId) {
    return matchRepository.findById(matchId).map(m ->
        m.getState() == StateMatch.CONTESTED
            || (m.getState() == StateMatch.ENDED
                && findParticipation(matchId, teamId)
                    .map(p -> p.getScore() != null).orElse(false))
    ).orElse(false);
  }

  // ── Private: access control ───────────────────────────────────────────────

  private boolean isNotManagerOrSecond(Team team, User caller) {
    return !isManager(team, caller) && !isSecondManager(team, caller);
  }

  private boolean isManager(Team team, User caller) {
    return team.getManager() != null
        && team.getManager().getId().equals(caller.getId());
  }

  private boolean isSecondManager(Team team, User caller) {
    return team.getSecondManager() != null
        && team.getSecondManager().getId().equals(caller.getId());
  }

  // ── Private: validation ───────────────────────────────────────────────────

  private boolean isPlanifiedAndNotStarted(Match match) {
    if (match.getState() != StateMatch.PLANIFIED) {
      return false;
    }
    return match.getStartTime() == null || match.getStartTime().isAfter(LocalDateTime.now());
  }

  private boolean participationExists(Long matchId, Long teamId) {
    return findParticipation(matchId, teamId).isPresent();
  }

  private boolean isSelectionFull(Long matchId, Long teamId) {
    return selectionMatchRepository.countByMatchMatchIdAndTeamId(matchId, teamId) >= MAX_SELECTIONS;
  }

  private boolean alreadySelected(Long matchId, Long teamId, Long memberId) {
    return selectionMatchRepository
        .existsByMatchMatchIdAndTeamIdAndMemberId(matchId, teamId, memberId);
  }

  private boolean isActiveMemberOfTeam(User member, Team team) {
    if (isManager(team, member) || isSecondManager(team, member)) {
      return true;
    }
    return teamMembershipRepository.findByTeamAndMember(team, member)
        .map(m -> m.getStatus() == MembershipStatus.ACCEPTED)
        .orElse(false);
  }

  private boolean isMemberUnavailableForMatch(User member, Match match) {
    if (match.getStartTime() == null) {
      return false;
    }
    LocalDate matchDate = match.getStartTime().toLocalDate();
    for (Unavailability u : unavailabilityRepository.findByUser(member)) {
      if (!matchDate.isBefore(u.getStartDate()) && !matchDate.isAfter(u.getEndDate())) {
        return true;
      }
    }
    return false;
  }

  private boolean hasConflictingSelection(User member, Match match) {
    return match.getStartTime() != null
        && selectionMatchRepository.findByMember(member).stream()
            .anyMatch(s -> isAtSameTime(s.getMatch(), match));
  }

  private boolean isAtSameTime(Match a, Match b) {
    return !a.getMatchId().equals(b.getMatchId())
        && a.getStartTime() != null
        && a.getStartTime().equals(b.getStartTime());
  }

  private boolean matchDateInRange(Match match, LocalDate start, LocalDate end) {
    if (match.getStartTime() == null) {
      return false;
    }
    LocalDate matchDate = match.getStartTime().toLocalDate();
    return !matchDate.isBefore(start) && !matchDate.isAfter(end);
  }

  // ── Private: mutations ────────────────────────────────────────────────────

  private SelectionMatch buildSelection(Match match, Team team, User member) {
    SelectionMatch s = new SelectionMatch();
    s.setMatch(match);
    s.setTeam(team);
    s.setMember(member);
    return s;
  }

  private boolean deleteSelectionsAndHasAny(List<SelectionMatch> selections) {
    if (selections.isEmpty()) {
      return false;
    }
    selections.forEach(this::deleteSelection);
    return true;
  }

  private void deleteSelection(SelectionMatch selection) {
    Long matchId = selection.getMatch().getMatchId();
    Long teamId = selection.getTeam().getId();
    Long memberId = selection.getMember().getId();
    selectionMatchRepository.deleteByMatchMatchIdAndTeamIdAndMemberId(matchId, teamId, memberId);
    updateStatusSelection(matchId, teamId);
  }

  // ── Private: notifications ────────────────────────────────────────────────

  /**
   * Sends a notification to the selected member for a match.
   * If the member selected themselves, the message confirms their participation.
   * Otherwise, it informs them they were selected by their manager.
   *
   * @param member the selected member
   * @param match  the match concerned
   * @param caller the user who performed the selection
   */
  private void sendSelectionNotification(User member, Match match, User caller) {
    boolean isSelf = member.getId().equals(caller.getId());
    String tournoi = match.getTournament().getName();
    String roundLabel = matchRoundLabel(match);
    String subject = isSelf
        ? "Confirmation de votre participation à un match"
        : "Vous êtes sélectionné(e) pour un match";
    String body = isSelf
        ? "Votre participation à " + roundLabel + " du tournoi " + tournoi + " est confirmée."
        : "Vous êtes sélectionné(e) pour " + roundLabel + " du tournoi " + tournoi + ".";
    notificationService.createNotification(member, buildNotification(subject, body));
  }

  /**
   * Notifies the team managers that a member has been added to the selection for a match.
   * The member and the caller are excluded from receiving the notification.
   *
   * @param team   the team whose managers are notified
   * @param member the member who was added to the selection
   * @param match  the match concerned
   * @param caller the user who performed the selection
   */
  private void notifyManagerOfSelection(Team team, User member, Match match, User caller) {
    String roundLabel = matchRoundLabel(match);
    String body = member.getTag() + " a été ajouté(e) à la sélection pour "
        + roundLabel + " du tournoi " + match.getTournament().getName() + ".";
    NotificationDto notif = buildNotification("Un membre a été ajouté à la sélection.", body);
    notifyManagers(team, notif, member.getId(), caller.getId());
  }

  /**
   * Notifies the team managers that a member has been removed from the selection for a match.
   * The removed member and the caller are excluded so they don't receive a manager notification.
   *
   * @param team          the team whose managers are notified
   * @param member        the member who was removed from the selection
   * @param match         the match concerned
   * @param excludeUserId the ID of the caller to exclude from manager notifications
   */
  private void notifyManagerOfRemoval(Team team, User member, Match match, Long excludeUserId) {
    String roundLabel = matchRoundLabel(match);
    String body = member.getTag() + " a été retiré(e) de la sélection pour "
        + roundLabel + " du tournoi " + match.getTournament().getName() + ".";
    NotificationDto notif = buildNotification("Un membre a été retiré de la sélection.", body);
    notifyManagers(team, notif, member.getId(), excludeUserId);
  }

  private void notifyManagers(Team team, NotificationDto notif, Long excludeMemberId,
      Long excludeCallerId) {
    for (User manager : managersOf(team)) {
      if (!manager.getId().equals(excludeMemberId)
          && !manager.getId().equals(excludeCallerId)) {
        notificationService.createNotification(manager, notif);
      }
    }
  }

  private List<User> managersOf(Team team) {
    List<User> managers = new java.util.ArrayList<>();
    if (team.getManager() != null) {
      managers.add(team.getManager());
    }
    if (team.getSecondManager() != null) {
      managers.add(team.getSecondManager());
    }
    return managers;
  }

  private NotificationDto buildNotification(String subject, String body) {
    NotificationDto dto = new NotificationDto();
    dto.setType(NotificationType.GENERAL);
    dto.setObject(subject);
    dto.setMessage(body);
    return dto;
  }

  /**
   * Returns a French label for the round of a match (e.g. "la finale", "le round 2").
   *
   * @param match the match
   * @return the round label
   */
  private String matchRoundLabel(Match match) {
    if (match.getRound() == null || match.getTournament() == null
        || match.getTournament().getId() == null) {
      return "ce match";
    }
    long round = match.getRound();
    long totalRounds = matchRepository.findByTournamentId(match.getTournament().getId())
        .stream().filter(m -> m.getRound() != null).mapToLong(Match::getRound).max().orElse(1L);
    if (totalRounds == 1 || round == totalRounds) {
      return "la finale";
    } else if (round == totalRounds - 1) {
      return "la demi-finale";
    } else if (round == totalRounds - 2) {
      return "le quart de finale";
    } else if (round == totalRounds - 3) {
      return "le huitième de finale";
    } else {
      return "le round " + round;
    }
  }

  // ── Private: mapping ──────────────────────────────────────────────────────

  private SelectionMatchDto toDto(SelectionMatch s) {
    return new SelectionMatchDto(
        s.getMatch().getMatchId(),
        s.getTeam().getId(),
        s.getMember().getId(),
        s.getMember().getTag(),
        s.getMember().getSpeciality().getName()
    );
  }

  // ── Private: repository helper ────────────────────────────────────────────

  private Optional<ParticipationMatch> findParticipation(Long matchId, Long teamId) {
    return participationMatchRepository.findById(new ParticipationMatchId(matchId, teamId));
  }
}
