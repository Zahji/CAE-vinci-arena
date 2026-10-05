package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.dtos.SelectionMatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatchId;
import be.vinci.ipl.cae.demo.models.entities.SelectionMatch;
import be.vinci.ipl.cae.demo.models.entities.Speciality;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
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
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SelectionMatchServiceTest {

  @Mock
  private SelectionMatchRepository selectionMatchRepository;
  @Mock
  private ParticipationMatchRepository participationMatchRepository;
  @Mock
  private MatchRepository matchRepository;
  @Mock
  private TeamRepository teamRepository;
  @Mock
  private UserRepository userRepository;
  @Mock
  private TeamMembershipRepository teamMembershipRepository;
  @Mock
  private UnavailabilityRepository unavailabilityRepository;
  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private SelectionMatchService service;

  // ── helpers ───────────────────────────────────────────────────────────────

  private User buildUser(Long id) {
    User u = new User();
    ReflectionTestUtils.setField(u, "id", id);
    return u;
  }

  private Team buildTeam(Long id) {
    Team t = new Team();
    ReflectionTestUtils.setField(t, "id", id);
    return t;
  }

  private Match buildMatch(Long id, StateMatch state, LocalDateTime startTime) {
    Tournament t = new Tournament();
    t.setName("Test Tournament");
    Match m = new Match();
    m.setMatchId(id);
    m.setState(state);
    m.setStartTime(startTime);
    m.setTournament(t);
    return m;
  }

  private SelectionMatch buildSel(Match match, Team team, User member) {
    SelectionMatch s = new SelectionMatch();
    s.setMatch(match);
    s.setTeam(team);
    s.setMember(member);
    return s;
  }

  private ParticipationMatch buildParticipation(Match match, Team team) {
    ParticipationMatch p = new ParticipationMatch();
    p.setMatch(match);
    p.setTeam(team);
    p.setStatusSelection(2);
    p.setDeclaredForfeit(false);
    return p;
  }

  private ParticipationMatchId pid(Long matchId, Long teamId) {
    return new ParticipationMatchId(matchId, teamId);
  }

  private TeamMembership acceptedMembership() {
    TeamMembership m = new TeamMembership();
    m.setStatus(MembershipStatus.ACCEPTED);
    return m;
  }

  private User memberWithSpeciality(Long id, String tag, String specialityName) {
    Speciality spec = new Speciality();
    spec.setName(specialityName);
    User u = buildUser(id);
    u.setTag(tag);
    u.setSpeciality(spec);
    return u;
  }

  // ── getSelections ─────────────────────────────────────────────────────────

  @Test
  void getSelectionsReturnsMappedDtos() {
    Team team = buildTeam(10L);
    Match match = buildMatch(5L, StateMatch.PLANIFIED, null);
    User member = memberWithSpeciality(1L, "tagA", "Support");
    SelectionMatch s = buildSel(match, team, member);

    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(5L, 10L))
        .thenReturn(List.of(s));

    List<SelectionMatchDto> result = service.getSelections(5L, 10L);

    assertEquals(1, result.size());
    assertEquals(5L, result.get(0).matchId());
    assertEquals(10L, result.get(0).teamId());
    assertEquals(1L, result.get(0).memberId());
    assertEquals("tagA", result.get(0).memberTag());
    assertEquals("Support", result.get(0).memberSpeciality());
  }

  // ── canViewSelections ─────────────────────────────────────────────────────

  @Test
  void canViewSelectionsReturnsTrueForAdmin() {
    User admin = buildUser(1L);
    admin.setAdmin(true);

    assertTrue(service.canViewSelections(1L, 1L, admin));
  }

  @Test
  void canViewSelectionsReturnsTrueForTeamMember() {
    User caller = buildUser(1L);
    Team team = buildTeam(10L);
    caller.setTeam(team);

    assertTrue(service.canViewSelections(1L, 10L, caller));
  }

  @Test
  void canViewSelectionsReturnsFalseWhenCallerInOtherTeamAndMatchNotFound() {
    User caller = buildUser(1L);
    caller.setTeam(buildTeam(99L));
    when(matchRepository.findById(1L)).thenReturn(Optional.empty());

    assertFalse(service.canViewSelections(1L, 10L, caller));
  }

  @Test
  void canViewSelectionsReturnsFalseWhenCallerHasNoTeamAndMatchNotFound() {
    User caller = buildUser(1L);
    when(matchRepository.findById(1L)).thenReturn(Optional.empty());

    assertFalse(service.canViewSelections(1L, 10L, caller));
  }

  @Test
  void canViewSelectionsReturnsFalseWhenMatchNotEnded() {
    User caller = buildUser(1L);
    caller.setTeam(buildTeam(99L));
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.PLANIFIED, null)));

    assertFalse(service.canViewSelections(1L, 10L, caller));
  }

  @Test
  void canViewSelectionsReturnsFalseWhenMatchEndedButParticipationNotFound() {
    User caller = buildUser(1L);
    caller.setTeam(buildTeam(99L));
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.ENDED, null)));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.empty());

    assertFalse(service.canViewSelections(1L, 10L, caller));
  }

  @Test
  void canViewSelectionsReturnsFalseWhenMatchEndedButScoreNull() {
    User caller = buildUser(1L);
    caller.setTeam(buildTeam(99L));
    Match match = buildMatch(1L, StateMatch.ENDED, null);
    ParticipationMatch p = buildParticipation(match, buildTeam(10L));
    p.setScore(null);
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    assertFalse(service.canViewSelections(1L, 10L, caller));
  }

  @Test
  void canViewSelectionsReturnsTrueWhenMatchEndedWithScore() {
    User caller = buildUser(1L);
    caller.setTeam(buildTeam(99L));
    Match match = buildMatch(1L, StateMatch.ENDED, null);
    ParticipationMatch p = buildParticipation(match, buildTeam(10L));
    p.setScore(3);
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    assertTrue(service.canViewSelections(1L, 10L, caller));
  }

  // ── addSelection ──────────────────────────────────────────────────────────

  @Test
  void addSelectionReturnsNullWhenTeamNotFound() {
    when(teamRepository.findById(10L)).thenReturn(Optional.empty());

    assertNull(service.addSelection(1L, 10L, 2L, buildUser(1L)));
  }

  @Test
  void addSelectionReturnsNullWhenBothManagersNull() {
    Team team = buildTeam(10L);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

    assertNull(service.addSelection(1L, 10L, 2L, buildUser(99L)));
  }

  @Test
  void addSelectionReturnsNullWhenCallerNeitherManagerNorSecond() {
    Team team = buildTeam(10L);
    team.setManager(buildUser(1L));
    team.setSecondManager(buildUser(2L));
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

    assertNull(service.addSelection(1L, 10L, 3L, buildUser(99L)));
  }

  @Test
  void addSelectionReturnsNullWhenMatchNotFound() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.empty());

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenMatchNotPlanified() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.ONGOING, LocalDateTime.now().plusDays(1))));

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenMatchAlreadyStarted() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().minusHours(1))));

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenNoParticipation() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.PLANIFIED, null)));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.empty());

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenSelectionFull() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L)))
        .thenReturn(Optional.of(buildParticipation(match, team)));
    when(selectionMatchRepository.countByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(4);

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenAlreadySelected() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = buildUser(2L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L)))
        .thenReturn(Optional.of(buildParticipation(match, team)));
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(true);

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenMemberNotFound() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L)))
        .thenReturn(Optional.of(buildParticipation(match, team)));
    when(userRepository.findById(2L)).thenReturn(Optional.empty());

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenMembershipNotFound() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = buildUser(2L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L)))
        .thenReturn(Optional.of(buildParticipation(match, team)));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(teamMembershipRepository.findByTeamAndMember(team, member)).thenReturn(Optional.empty());

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenMembershipPending() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = buildUser(2L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    TeamMembership membership = new TeamMembership();
    membership.setStatus(MembershipStatus.PENDING);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L)))
        .thenReturn(Optional.of(buildParticipation(match, team)));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(membership));

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenMemberUnavailable() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = buildUser(2L);
    LocalDateTime matchTime = LocalDateTime.of(2026, 5, 5, 15, 0);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, matchTime);
    Unavailability unavail = new Unavailability();
    unavail.setStartDate(LocalDate.of(2026, 5, 1));
    unavail.setEndDate(LocalDate.of(2026, 5, 10));
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L)))
        .thenReturn(Optional.of(buildParticipation(match, team)));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(acceptedMembership()));
    when(unavailabilityRepository.findByUser(member)).thenReturn(List.of(unavail));

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionPassesWhenMatchDateAfterUnavailabilityEnd() {
    // isMemberUnavailableForMatch: !isBefore(start)=true but !isAfter(end)=false → not unavailable
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = memberWithSpeciality(2L, "tag", "Support");
    LocalDateTime matchTime = LocalDateTime.of(2026, 5, 15, 15, 0);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, matchTime);
    ParticipationMatch p = buildParticipation(match, team);
    Unavailability unavail = new Unavailability();
    unavail.setStartDate(LocalDate.of(2026, 5, 1));
    unavail.setEndDate(LocalDate.of(2026, 5, 10));
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of());
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(acceptedMembership()));
    when(unavailabilityRepository.findByUser(member)).thenReturn(List.of(unavail));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of());
    when(selectionMatchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    assertNotNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionReturnsNullWhenConflictingSelection() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = buildUser(2L);
    LocalDateTime matchTime = LocalDateTime.of(2026, 5, 5, 15, 0);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, matchTime);
    Match conflictMatch = buildMatch(99L, StateMatch.PLANIFIED, matchTime);
    SelectionMatch conflict = buildSel(conflictMatch, buildTeam(20L), member);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L)))
        .thenReturn(Optional.of(buildParticipation(match, team)));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(acceptedMembership()));
    when(unavailabilityRepository.findByUser(member)).thenReturn(List.of());
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(conflict));

    assertNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionSuccessAsSelf_NullStartTime() {
    // Covers: self-selection notification, matchDateLabel(null)→"date inconnue",
    // isMemberUnavailableForMatch(null startTime)→false,
    // hasConflictingSelection(null startTime)→false
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "callerTag", "Tank");
    team.setManager(caller);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    ParticipationMatch p = buildParticipation(match, team);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of());
    when(userRepository.findById(1L)).thenReturn(Optional.of(caller));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 1L))
        .thenReturn(false);
    when(selectionMatchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    SelectionMatchDto result = service.addSelection(1L, 10L, 1L, caller);

    assertNotNull(result);
    assertEquals(1L, result.memberId());
    verify(notificationService).createNotification(eq(caller), any(NotificationDto.class));
  }

  @Test
  void addSelectionSuccessWhenExistingSelectionForSameMatchDifferentTeam() {
    // Covers: isAtSameTime: same matchId → false (not a conflict)
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = memberWithSpeciality(2L, "tag", "Support");
    LocalDateTime matchTime = LocalDateTime.of(2026, 5, 15, 15, 0);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, matchTime);
    ParticipationMatch p = buildParticipation(match, team);
    SelectionMatch sameMatchSel = buildSel(match, buildTeam(20L), member);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of());
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(acceptedMembership()));
    when(unavailabilityRepository.findByUser(member)).thenReturn(List.of());
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(sameMatchSel));
    when(selectionMatchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    assertNotNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionSuccessAsSecondManager_UnavailOutOfRange_DifferentTime() {
    // Covers: second manager path, unavailability loop (condition false → date out of range),
    // isAtSameTime: different matchId + different time → false, matchDateLabel(non-null)
    Team team = buildTeam(10L);
    User manager = buildUser(1L);
    User caller = buildUser(2L);
    team.setManager(manager);
    team.setSecondManager(caller);
    User member = memberWithSpeciality(3L, "memberTag", "DPS");
    LocalDateTime matchTime = LocalDateTime.of(2026, 5, 15, 15, 0);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, matchTime);
    ParticipationMatch p = buildParticipation(match, team);
    Unavailability unavail = new Unavailability();
    unavail.setStartDate(LocalDate.of(2026, 6, 1));
    unavail.setEndDate(LocalDate.of(2026, 6, 30));
    Match otherMatch = buildMatch(99L, StateMatch.PLANIFIED, LocalDateTime.of(2026, 5, 20, 15, 0));
    SelectionMatch otherSel = buildSel(otherMatch, team, member);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of(buildSel(match, team, member)));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 3L))
        .thenReturn(false);
    when(userRepository.findById(3L)).thenReturn(Optional.of(member));
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(acceptedMembership()));
    when(unavailabilityRepository.findByUser(member)).thenReturn(List.of(unavail));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(otherSel));
    when(selectionMatchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    SelectionMatchDto result = service.addSelection(1L, 10L, 3L, caller);

    assertNotNull(result);
    assertEquals(3L, result.memberId());
    verify(notificationService).createNotification(eq(member), any(NotificationDto.class));
  }

  @Test
  void addSelectionSuccessWhenOtherSelectionHasNullStartTime() {
    // Covers: isAtSameTime: different matchId + null startTime on existing selection → false
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = memberWithSpeciality(2L, "tag", "Healer");
    LocalDateTime matchTime = LocalDateTime.of(2026, 5, 15, 15, 0);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, matchTime);
    ParticipationMatch p = buildParticipation(match, team);
    Match otherMatch = buildMatch(99L, StateMatch.PLANIFIED, null);
    SelectionMatch otherSel = buildSel(otherMatch, team, member);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of());
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(teamMembershipRepository.findByTeamAndMember(team, member))
        .thenReturn(Optional.of(acceptedMembership()));
    when(unavailabilityRepository.findByUser(member)).thenReturn(List.of());
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(otherSel));
    when(selectionMatchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    assertNotNull(service.addSelection(1L, 10L, 2L, caller));
  }

  @Test
  void addSelectionSuccessWhenManagerSelectsHimselfWithoutMembership() {
    // Manager has no TeamMembership row (created via createTeam) — should still be selectable
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "callerTag", "Tank");
    team.setManager(caller);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    ParticipationMatch p = buildParticipation(match, team);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of());
    when(userRepository.findById(1L)).thenReturn(Optional.of(caller));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 1L))
        .thenReturn(false);
    when(selectionMatchRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    SelectionMatchDto result = service.addSelection(1L, 10L, 1L, caller);

    assertNotNull(result);
    assertEquals(1L, result.memberId());
  }

  // ── canViewSelections (null caller) ──────────────────────────────────────

  @Test
  void canViewSelectionsReturnsFalseForNullCallerWhenMatchNotPublic() {
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.PLANIFIED, null)));

    assertFalse(service.canViewSelections(1L, 10L, null));
  }

  @Test
  void canViewSelectionsReturnsTrueForNullCallerWhenMatchContested() {
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.CONTESTED, null)));

    assertTrue(service.canViewSelections(1L, 10L, null));
  }

  // ── removeSelection ───────────────────────────────────────────────────────

  @Test
  void removeSelectionReturnsFalseWhenTeamNotFound() {
    when(teamRepository.findById(10L)).thenReturn(Optional.empty());

    assertFalse(service.removeSelection(1L, 10L, 2L, buildUser(1L)));
  }

  @Test
  void removeSelectionReturnsFalseWhenCallerNotManager() {
    Team team = buildTeam(10L);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

    assertFalse(service.removeSelection(1L, 10L, 2L, buildUser(99L)));
  }

  @Test
  void removeSelectionReturnsFalseWhenMatchNotFound() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.empty());

    assertFalse(service.removeSelection(1L, 10L, 2L, caller));
  }

  @Test
  void removeSelectionReturnsFalseWhenMatchNotPlanified() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.ENDED, null)));

    assertFalse(service.removeSelection(1L, 10L, 2L, caller));
  }

  @Test
  void removeSelectionReturnsFalseWhenNotAlreadySelected() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L))
        .thenReturn(Optional.of(buildMatch(1L, StateMatch.PLANIFIED, null)));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(false);

    assertFalse(service.removeSelection(1L, 10L, 2L, caller));
  }

  @Test
  void removeSelectionSuccess() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().plusDays(1));
    ParticipationMatch p = buildParticipation(match, team);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(true);
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    assertTrue(service.removeSelection(1L, 10L, 2L, caller));
    verify(selectionMatchRepository).deleteByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L);
    verify(participationMatchRepository).save(p);
  }

  @Test
  void removeSelectionNotifiesMemberAndManagerWhenMemberFoundAndNotSelf() {
    // caller (1L) is second manager; primary manager (99L) receives the manager notification
    User primaryManager = buildUser(99L);
    User caller = buildUser(1L);
    Team team = buildTeam(10L);
    team.setManager(primaryManager);
    team.setSecondManager(caller);
    User member = buildUser(2L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().plusDays(1));
    ParticipationMatch p = buildParticipation(match, team);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(true);
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of());

    assertTrue(service.removeSelection(1L, 10L, 2L, caller));
    verify(notificationService).createNotification(eq(member), any(NotificationDto.class));
    verify(notificationService).createNotification(eq(primaryManager), any(NotificationDto.class));
  }

  @Test
  void removeSelectionDoesNotNotifyMemberWhenCallerIsSelf() {
    Team team = buildTeam(10L);
    User caller = buildUser(2L);
    team.setManager(caller);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().plusDays(1));
    ParticipationMatch p = buildParticipation(match, team);
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(true);
    when(userRepository.findById(2L)).thenReturn(Optional.of(caller));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L)).thenReturn(List.of());

    assertTrue(service.removeSelection(1L, 10L, 2L, caller));
    verify(notificationService, never()).createNotification(eq(caller), any(NotificationDto.class));
  }

  @Test
  void removeSelectionFiltersUnavailableMemberInStatusUpdate() {
    Team team = buildTeam(10L);
    User caller = buildUser(1L);
    team.setManager(caller);
    User member = buildUser(2L);
    User remainingMember = buildUser(3L);
    LocalDateTime matchTime = LocalDateTime.of(2026, 5, 5, 15, 0);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, matchTime);
    ParticipationMatch p = buildParticipation(match, team);
    SelectionMatch remaining = buildSel(match, team, remainingMember);
    Unavailability unavail = new Unavailability();
    unavail.setStartDate(LocalDate.of(2026, 5, 1));
    unavail.setEndDate(LocalDate.of(2026, 5, 10));
    when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
    when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 2L))
        .thenReturn(true);
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(1L, 10L))
        .thenReturn(List.of(remaining));
    when(unavailabilityRepository.findByUser(remainingMember)).thenReturn(List.of(unavail));

    assertTrue(service.removeSelection(1L, 10L, 2L, caller));
    verify(participationMatchRepository).save(p);
  }

  // ── handleMemberUnavailable ───────────────────────────────────────────────

  @Test
  void handleMemberUnavailableDoesNothingWhenMemberNotFound() {
    when(userRepository.findById(1L)).thenReturn(Optional.empty());

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberUnavailableSkipsNonPlanifiedSelection() {
    // isPlanifiedAndNotStarted filters out ONGOING match
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.ONGOING, LocalDateTime.now().plusDays(1));
    SelectionMatch s = buildSel(match, buildTeam(10L), member);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberUnavailableSkipsSelectionWithNullMatchStartTime() {
    // matchDateInRange returns false when match.startTime is null
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, null);
    SelectionMatch s = buildSel(match, buildTeam(10L), member);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberUnavailableSkipsSelectionBeforeRange() {
    // matchDateInRange: !matchDate.isBefore(start)=false → short-circuit → false
    // match is in the future (2026-04-25) but before the unavailability range start (2026-05-01)
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED,
        LocalDateTime.of(2026, 4, 25, 15, 0));
    SelectionMatch s = buildSel(match, buildTeam(10L), member);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberUnavailableSkipsSelectionOutsideRange() {
    // matchDateInRange: !matchDate.isBefore(start)=true but !matchDate.isAfter(end)=false → false
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED,
        LocalDateTime.of(2026, 6, 15, 15, 0));
    SelectionMatch s = buildSel(match, buildTeam(10L), member);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberUnavailableDeletesSelectionInRange() {
    User manager = buildUser(99L);
    Team team = buildTeam(10L);
    team.setManager(manager);
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.of(2026, 5, 5, 15, 0));
    SelectionMatch s = buildSel(match, team, member);
    ParticipationMatch p = buildParticipation(match, team);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(selectionMatchRepository).deleteByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 1L);
    verify(notificationService).createNotification(eq(manager), any(NotificationDto.class));
  }

  @Test
  void handleMemberUnavailableDeletesButSkipsNotificationWhenManagerNull() {
    // Manager is null → manager notification skipped, but member is still notified
    Team team = buildTeam(10L);
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.of(2026, 5, 5, 15, 0));
    SelectionMatch s = buildSel(match, team, member);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.empty());

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(selectionMatchRepository).deleteByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 1L);
    verify(notificationService).createNotification(eq(member), any(NotificationDto.class));
  }

  // ── handleMemberBanned ────────────────────────────────────────────────────

  @Test
  void handleMemberBannedDoesNothingWhenMemberNotFound() {
    when(userRepository.findById(1L)).thenReturn(Optional.empty());

    service.handleMemberBanned(1L, 99L);

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberBannedSkipsNonPlanifiedSelection() {
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.ENDED, null);
    SelectionMatch s = buildSel(match, buildTeam(10L), member);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));

    service.handleMemberBanned(1L, 99L);

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberBannedDeletesFutureSelections() {
    User manager = buildUser(99L);
    Team team = buildTeam(10L);
    team.setManager(manager);
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().plusDays(1));
    SelectionMatch s = buildSel(match, team, member);
    ParticipationMatch p = buildParticipation(match, team);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    service.handleMemberBanned(1L, 100L);

    verify(selectionMatchRepository).deleteByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 1L);
    verify(notificationService).createNotification(eq(manager), any(NotificationDto.class));
  }

  @Test
  void handleMemberUnavailableNotifiesMemberAndManagerWhenDeleteOccurs() {
    User manager = buildUser(99L);
    Team team = buildTeam(10L);
    team.setManager(manager);
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.of(2026, 5, 5, 15, 0));
    SelectionMatch s = buildSel(match, team, member);
    ParticipationMatch p = buildParticipation(match, team);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    service.handleMemberUnavailable(1L, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 10));

    verify(notificationService).createNotification(eq(member), any(NotificationDto.class));
    verify(notificationService).createNotification(eq(manager), any(NotificationDto.class));
  }

  // ── handleMemberLeftTeam ──────────────────────────────────────────────────

  @Test
  void handleMemberLeftTeamDoesNothingWhenMemberNotFound() {
    when(userRepository.findById(1L)).thenReturn(Optional.empty());

    service.handleMemberLeftTeam(1L, 10L, 1L);

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberLeftTeamIgnoresSelectionsForOtherTeam() {
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().plusDays(1));
    SelectionMatch s = buildSel(match, buildTeam(99L), member);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));

    service.handleMemberLeftTeam(1L, 10L, 1L);

    verify(selectionMatchRepository, never())
        .deleteByMatchMatchIdAndTeamIdAndMemberId(any(), any(), any());
  }

  @Test
  void handleMemberLeftTeamVoluntaryNotifiesMemberAndManager() {
    User manager = buildUser(99L);
    Team team = buildTeam(10L);
    team.setManager(manager);
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().plusDays(1));
    SelectionMatch s = buildSel(match, team, member);
    ParticipationMatch p = buildParticipation(match, team);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    service.handleMemberLeftTeam(1L, 10L, 1L);

    verify(selectionMatchRepository).deleteByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 1L);
    verify(notificationService).createNotification(eq(member), any(NotificationDto.class));
    verify(notificationService).createNotification(eq(manager), any(NotificationDto.class));
  }

  @Test
  void handleMemberLeftTeamDeletesSelectionsForSameTeam() {
    User manager = buildUser(99L);
    Team team = buildTeam(10L);
    team.setManager(manager);
    User member = buildUser(1L);
    Match match = buildMatch(1L, StateMatch.PLANIFIED, LocalDateTime.now().plusDays(1));
    SelectionMatch s = buildSel(match, team, member);
    ParticipationMatch p = buildParticipation(match, team);
    when(userRepository.findById(1L)).thenReturn(Optional.of(member));
    when(selectionMatchRepository.findByMember(member)).thenReturn(List.of(s));
    when(participationMatchRepository.findById(pid(1L, 10L))).thenReturn(Optional.of(p));

    service.handleMemberLeftTeam(1L, 10L, 99L);

    verify(selectionMatchRepository).deleteByMatchMatchIdAndTeamIdAndMemberId(1L, 10L, 1L);
    // exclusion: member is notified, manager (caller) is excluded from manager notification
    verify(notificationService).createNotification(eq(member), any(NotificationDto.class));
    verify(notificationService, never()).createNotification(eq(manager), any(NotificationDto.class));
  }

  // ── matchRoundLabel branches ──────────────────────────────────────────────

  private Match buildMatchWithRound(Long matchId, Long round, Long tournamentId) {
    Tournament t = new Tournament();
    t.setId(tournamentId);
    t.setName("Tournoi Test");
    Match m = new Match();
    m.setMatchId(matchId);
    m.setState(StateMatch.PLANIFIED);
    m.setStartTime(LocalDateTime.now().plusDays(1));
    m.setRound(round);
    m.setTournament(t);
    return m;
  }

  private void setupAddSelectionForRoundTest(Match match, Team team, User caller) {
    ParticipationMatch p = buildParticipation(match, team);
    when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
    when(matchRepository.findById(match.getMatchId())).thenReturn(Optional.of(match));
    when(participationMatchRepository.findById(
        pid(match.getMatchId(), team.getId()))).thenReturn(Optional.of(p));
    when(selectionMatchRepository.findByMatchMatchIdAndTeamId(
        match.getMatchId(), team.getId())).thenReturn(List.of());
    when(userRepository.findById(caller.getId())).thenReturn(Optional.of(caller));
    when(selectionMatchRepository.existsByMatchMatchIdAndTeamIdAndMemberId(
        match.getMatchId(), team.getId(), caller.getId())).thenReturn(false);
    when(selectionMatchRepository.save(any())).thenAnswer(i -> i.getArgument(0));
  }

  @Test
  void matchRoundLabel_finale_whenOnlyOneRound() {
    // totalRounds == 1 → "la finale"
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "tag", "Tank");
    team.setManager(caller);
    Match match = buildMatchWithRound(1L, 1L, 100L);
    setupAddSelectionForRoundTest(match, team, caller);
    when(matchRepository.findByTournamentId(100L)).thenReturn(List.of(match));

    assertNotNull(service.addSelection(1L, 10L, 1L, caller));
    verify(notificationService).createNotification(eq(caller), any(NotificationDto.class));
  }

  @Test
  void matchRoundLabel_finale_whenRoundEqualsTotal() {
    // round == totalRounds → "la finale"
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "tag", "Tank");
    team.setManager(caller);
    Match match = buildMatchWithRound(1L, 3L, 100L);
    Match r1a = buildMatchWithRound(2L, 1L, 100L);
    Match r1b = buildMatchWithRound(3L, 2L, 100L);
    setupAddSelectionForRoundTest(match, team, caller);
    when(matchRepository.findByTournamentId(100L)).thenReturn(List.of(match, r1a, r1b));

    assertNotNull(service.addSelection(1L, 10L, 1L, caller));
  }

  @Test
  void matchRoundLabel_demiFinale() {
    // round == totalRounds - 1 → "la demi-finale"
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "tag", "Tank");
    team.setManager(caller);
    Match match = buildMatchWithRound(1L, 2L, 100L);
    Match finale = buildMatchWithRound(2L, 3L, 100L);
    setupAddSelectionForRoundTest(match, team, caller);
    when(matchRepository.findByTournamentId(100L)).thenReturn(List.of(match, finale));

    assertNotNull(service.addSelection(1L, 10L, 1L, caller));
  }

  @Test
  void matchRoundLabel_quartDeFinale() {
    // round == totalRounds - 2 → "le quart de finale"
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "tag", "Tank");
    team.setManager(caller);
    Match match = buildMatchWithRound(1L, 2L, 100L);
    Match demi = buildMatchWithRound(2L, 3L, 100L);
    Match finale = buildMatchWithRound(3L, 4L, 100L);
    setupAddSelectionForRoundTest(match, team, caller);
    when(matchRepository.findByTournamentId(100L)).thenReturn(List.of(match, demi, finale));

    assertNotNull(service.addSelection(1L, 10L, 1L, caller));
  }

  @Test
  void matchRoundLabel_huitiemeDeFinale() {
    // round == totalRounds - 3 → "le huitième de finale"
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "tag", "Tank");
    team.setManager(caller);
    Match match = buildMatchWithRound(1L, 2L, 100L);
    Match quart = buildMatchWithRound(2L, 3L, 100L);
    Match demi = buildMatchWithRound(3L, 4L, 100L);
    Match finale = buildMatchWithRound(4L, 5L, 100L);
    setupAddSelectionForRoundTest(match, team, caller);
    when(matchRepository.findByTournamentId(100L))
        .thenReturn(List.of(match, quart, demi, finale));

    assertNotNull(service.addSelection(1L, 10L, 1L, caller));
  }

  @Test
  void matchRoundLabel_roundN() {
    // round < totalRounds - 3 → "le round N"
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "tag", "Tank");
    team.setManager(caller);
    Match match = buildMatchWithRound(1L, 1L, 100L);
    Match r2 = buildMatchWithRound(2L, 2L, 100L);
    Match r3 = buildMatchWithRound(3L, 3L, 100L);
    Match r4 = buildMatchWithRound(4L, 4L, 100L);
    Match r5 = buildMatchWithRound(5L, 5L, 100L);
    setupAddSelectionForRoundTest(match, team, caller);
    when(matchRepository.findByTournamentId(100L))
        .thenReturn(List.of(match, r2, r3, r4, r5));

    assertNotNull(service.addSelection(1L, 10L, 1L, caller));
  }

  @Test
  void matchRoundLabel_withNullRoundInList() {
    // lambda filter: covers the m.getRound() != null branch when list has a null-round match
    Team team = buildTeam(10L);
    User caller = memberWithSpeciality(1L, "tag", "Tank");
    team.setManager(caller);
    Match match = buildMatchWithRound(1L, 1L, 100L);
    Match nullRound = buildMatch(2L, StateMatch.PLANIFIED, null);
    nullRound.setTournament(match.getTournament());
    setupAddSelectionForRoundTest(match, team, caller);
    when(matchRepository.findByTournamentId(100L)).thenReturn(List.of(match, nullRound));

    assertNotNull(service.addSelection(1L, 10L, 1L, caller));
  }
}
