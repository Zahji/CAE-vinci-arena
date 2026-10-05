package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.results.AuthRegisterResult;
import be.vinci.ipl.cae.demo.models.dtos.MemberActivityDto;
import be.vinci.ipl.cae.demo.models.dtos.MembershipHistoryDto;
import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.dtos.UnavailabilityRequestDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.MembershipHistory;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.ProfilePicture;
import be.vinci.ipl.cae.demo.models.entities.SelectionMatch;
import be.vinci.ipl.cae.demo.models.entities.Speciality;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.*;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.repositories.SelectionMatchRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private UnavailabilityRepository unavailabilityRepository;

  @Mock
  private SpecialityRepository specialityRepository;

  @Mock
  private ProfilePictureRepository profilePictureRepository;

  @Mock
  private NotificationService notificationService;

  @Mock
  private BCryptPasswordEncoder passwordEncoder;

  @Mock
  private TeamRepository teamRepository;

  @Mock
  private TeamMembershipRepository teamMembershipRepository;

  @Mock
  private TournamentRegistrationRepository tournamentRegistrationRepository;

  @Mock
  private SelectionMatchRepository selectionMatchRepository;

  @Mock
  private ParticipationMatchRepository participationMatchRepository;

  @Mock
  private SelectionMatchService selectionMatchService;

  @InjectMocks
  private UserService userService;

  @Mock
  private MembershipHistoryRepository membershipHistoryRepository;

  @Mock
  private MatchRepository matchRepository;

  @BeforeEach
  void setUp() {
    // In Mockito-only tests, @PostConstruct is not called automatically.
    ReflectionTestUtils.setField(userService, "jwtSecret", "test-secret");
    userService.init();
  }

  @Test
  void updatePasswordReturnsFalseWhenUserNotFound() {
    when(userRepository.findByEmail("z@mail.com")).thenReturn(null);

    boolean result = userService.updatePassword("z@mail.com", "old", "new");

    assertFalse(result);
    verify(userRepository, never()).save(any());
  }

  @Test
  void updatePasswordReturnsFalseWhenOldPasswordIncorrect() {
    User user = new User();
    when(userRepository.findByEmail("z@mail.com")).thenReturn(user);
    when(passwordEncoder.matches("wrong", user.getPassword())).thenReturn(false);

    boolean result = userService.updatePassword("z@mail.com", "wrong", "new");

    assertFalse(result);
    verify(userRepository, never()).save(any());
  }

  @Test
  void updatePasswordReturnsTrueWhenSuccessful() {
    User user = new User();
    when(userRepository.findByEmail("z@mail.com")).thenReturn(user);
    when(passwordEncoder.matches("old", user.getPassword())).thenReturn(true);
    when(passwordEncoder.encode("new")).thenReturn("hashedNew");

    boolean result = userService.updatePassword("z@mail.com", "old", "new");

    assertTrue(result);
    verify(userRepository).save(user);
  }

  @Test
  void updateSpecialityReturnsFalseWhenSpecialityNotFound() {
    when(specialityRepository.findByName("Unknown")).thenReturn(null);

    boolean result = userService.updateSpeciality(new User(), "Unknown");

    assertFalse(result);
    verify(userRepository, never()).save(any());
  }

  @Test
  void updateSpecialityReturnsTrueWhenSuccessful() {
    User user = new User();
    Speciality speciality = new Speciality();
    when(specialityRepository.findByName("Mage")).thenReturn(speciality);

    boolean result = userService.updateSpeciality(user, "Mage");

    assertTrue(result);
    verify(userRepository).save(user);
  }

  @Test
  void updateProfilePictureReturnsFalseWhenPictureNotFound() {
    when(profilePictureRepository.findByUrl("http://unknown.png")).thenReturn(null);

    boolean result = userService.updateProfilePicture(new User(), "http://unknown.png");

    assertFalse(result);
    verify(userRepository, never()).save(any());
  }

  @Test
  void updateProfilePictureReturnsTrueWhenSuccessful() {
    User user = new User();
    ProfilePicture picture = new ProfilePicture();
    when(profilePictureRepository.findByUrl("http://avatar.png")).thenReturn(picture);

    boolean result = userService.updateProfilePicture(user, "http://avatar.png");

    assertTrue(result);
    verify(userRepository).save(user);
  }

  @Test
  void loginReturnsNullWhenUserNotFound() {
    when(userRepository.findByEmail("z@mail.com")).thenReturn(null);

    AuthenticatedUser result = userService.login("z@mail.com", "pass");

    assertNull(result);
  }

  @Test
  void loginReturnsNullWhenPasswordIncorrect() {
    User user = new User();
    when(userRepository.findByEmail("z@mail.com")).thenReturn(user);
    when(passwordEncoder.matches("wrong", user.getPassword())).thenReturn(false);

    AuthenticatedUser result = userService.login("z@mail.com", "wrong");

    assertNull(result);
  }

  @Test
  void loginReturnsTokenWhenSuccessful() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 77L);
    user.setTag("zed");
    user.setAdmin(false);
    when(userRepository.findByEmail("z@mail.com")).thenReturn(user);
    when(passwordEncoder.matches("pass", user.getPassword())).thenReturn(true);

    AuthenticatedUser result = userService.login("z@mail.com", "pass");

    assertNotNull(result);
    assertNotNull(result.getToken());
    assertFalse(result.getToken().isBlank());
    assertEquals(77L, result.getId());
    assertNull(result.getTeamId());
  }

  @Test
  void loginReturnsTokenWithTeamIdWhenUserHasTeam() {
    User user = new User();
    Team team = new Team();
    ReflectionTestUtils.setField(user, "id", 12L);
    ReflectionTestUtils.setField(team, "id", 45L);
    user.setTag("zed");
    user.setAdmin(true);
    user.setTeam(team);
    when(userRepository.findByEmail("z@mail.com")).thenReturn(user);
    when(passwordEncoder.matches("pass", user.getPassword())).thenReturn(true);

    AuthenticatedUser result = userService.login("z@mail.com", "pass");

    assertNotNull(result);
    assertEquals(45L, result.getTeamId());
    assertTrue(result.isAdmin());
  }

  @Test
  void createJwtTokenReturnsExpectedClaims() {
    AuthenticatedUser result = userService.createJwtToken(1L, "a@mail.com", "tag", true, 99L);

    assertEquals(1L, result.getId());
    assertEquals("a@mail.com", result.getEmail());
    assertEquals("tag", result.getTag());
    assertTrue(result.isAdmin());
    assertEquals(99L, result.getTeamId());
    assertNotNull(result.getToken());
  }

  @Test
  void verifyJwtTokenReturnsEmailWhenTokenIsValid() {
    String token = userService.createJwtToken(8L, "valid@mail.com", "ok", false, null).getToken();

    String result = userService.verifyJwtToken(token);

    assertEquals("valid@mail.com", result);
  }

  @Test
  void verifyJwtTokenReturnsNullWhenTokenIsInvalid() {
    String result = userService.verifyJwtToken("not-a-jwt");

    assertNull(result);
  }

  @Test
  void getJwtClaimsFromTokenReturnsClaimsWhenTokenIsValid() {
    String token = userService.createJwtToken(8L, "claims@mail.com", "ok", true, null).getToken();

    Map<String, Object> claims = userService.getJwtClaimsFromToken(token);

    assertEquals("claims@mail.com", claims.get("email"));
    assertTrue((Boolean) claims.get("isAdmin"));
  }

  @Test
  void getJwtClaimsFromTokenReturnsEmptyMapWhenTokenIsInvalid() {
    Map<String, Object> claims = userService.getJwtClaimsFromToken("invalid");

    assertNotNull(claims);
    assertTrue(claims.isEmpty());
  }

  @Test
  void registerReturnsNullWhenEmailAlreadyExists() {
    when(userRepository.findByEmail("z@mail.com")).thenReturn(new User());

    AuthRegisterResult result = userService.register(
        "z@mail.com", "password", "tag", "Mage", "http://avatar.png");

    assertFalse(result.success());
    assertTrue(result.emailAlreadyExists());
    assertNull(result.badRequestMessage());
    verify(userRepository, never()).save(any());
  }

  @Test
  void registerReturnsInvalidPayloadWhenSpecialityIsInvalid() {
    when(userRepository.findByEmail("z@mail.com")).thenReturn(null);
    when(specialityRepository.findByName("Unknown")).thenReturn(null);

    AuthRegisterResult result =
        userService.register("z@mail.com", "password", "tag", "Unknown", "http://img");

    assertFalse(result.success());
    assertFalse(result.emailAlreadyExists());
    assertEquals("Invalid speciality", result.badRequestMessage());
  }

  @Test
  void registerReturnsInvalidPayloadWhenProfilePictureIsInvalid() {
    Speciality speciality = new Speciality();
    when(userRepository.findByEmail("z@mail.com")).thenReturn(null);
    when(specialityRepository.findByName("Mage")).thenReturn(speciality);
    when(profilePictureRepository.findByUrl("http://missing.png")).thenReturn(null);

    AuthRegisterResult result =
        userService.register("z@mail.com", "password", "tag", "Mage", "http://missing.png");

    assertFalse(result.success());
    assertFalse(result.emailAlreadyExists());
    assertEquals("Invalid profile picture", result.badRequestMessage());
  }

  @Test
  void registerCreatesUserAndReturnsToken() {
    Speciality speciality = new Speciality();
    ProfilePicture picture = new ProfilePicture();
    ReflectionTestUtils.setField(speciality, "name", "Mage");
    ReflectionTestUtils.setField(picture, "url", "http://avatar.png");

    when(userRepository.findByEmail("z@mail.com")).thenReturn(null);
    when(specialityRepository.findByName("Mage")).thenReturn(speciality);
    when(profilePictureRepository.findByUrl("http://avatar.png")).thenReturn(picture);
    when(passwordEncoder.encode("pass")).thenReturn("hashed");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
      User saved = invocation.getArgument(0);
      ReflectionTestUtils.setField(saved, "id", 101L);
      return saved;
    });

    AuthRegisterResult outcome = userService.register(
        "z@mail.com", "pass", "zed", "Mage", "http://avatar.png");

    assertTrue(outcome.success());
    AuthenticatedUser result = outcome.user();
    assertEquals(101L, result.getId());
    assertEquals("z@mail.com", result.getEmail());
    assertEquals("zed", result.getTag());
    assertFalse(result.isAdmin());
    assertNull(result.getTeamId());
    assertNotEquals("", result.getToken());
    verify(userRepository).save(any(User.class));
    verify(notificationService).createNotification(any(User.class), any(NotificationDto.class));
  }

  @Test
  void readOneFromUsernameDelegatesToRepository() {
    User user = new User();
    when(userRepository.findByEmail("x@mail.com")).thenReturn(user);

    User result = userService.readOneFromUsername("x@mail.com");

    assertSame(user, result);
  }

  @Test
  void createOneSavesUserAndSendsWelcomeNotification() {
    ProfilePicture picture = new ProfilePicture();
    Speciality speciality = new Speciality();
    when(passwordEncoder.encode("plain")).thenReturn("hashed");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
      User saved = invocation.getArgument(0);
      ReflectionTestUtils.setField(saved, "id", 55L);
      return saved;
    });

    User result = userService.createOne("mail@test.com", "plain", true, "tag", picture, speciality);

    assertNotNull(result);
    assertEquals("mail@test.com", result.getEmail());
    assertEquals("hashed", result.getPassword());
    assertEquals("tag", result.getTag());
    assertTrue(result.isAdmin());
    assertNotNull(result.getDate());
    assertSame(picture, result.getProfilePicture());
    assertSame(speciality, result.getSpeciality());

    ArgumentCaptor<NotificationDto> notificationCaptor = ArgumentCaptor.forClass(NotificationDto.class);
    verify(notificationService).createNotification(eq(result), notificationCaptor.capture());
    assertEquals(55L, notificationCaptor.getValue().getUserId());
    assertEquals("Bienvenue !", notificationCaptor.getValue().getObject());
  }

  @Test
  void getUnavailabilitiesDelegatesToRepository() {
    User user = new User();
    Iterable<Unavailability> expected = List.of(new Unavailability(), new Unavailability());
    when(unavailabilityRepository.findByUser(user)).thenReturn(expected);

    Iterable<Unavailability> result = userService.getUnavailabilities(user);

    assertSame(expected, result);
  }

  @Test
  void addUnavailabilityCreatesAndSavesUnavailability() {
    User user = new User();
    Unavailability saved = new Unavailability();
    LocalDate startDate = LocalDate.of(2026, 1, 10);
    LocalDate endDate = LocalDate.of(2026, 1, 15);
    UnavailabilityRequestDto request = new UnavailabilityRequestDto(startDate, endDate);
    when(unavailabilityRepository.save(any(Unavailability.class))).thenReturn(saved);

    Unavailability result = userService.addUnavailability(user, request);

    assertSame(saved, result);
    ArgumentCaptor<Unavailability> captor = ArgumentCaptor.forClass(Unavailability.class);
    verify(unavailabilityRepository).save(captor.capture());
    assertSame(user, captor.getValue().getUser());
    assertEquals(startDate, captor.getValue().getStartDate());
    assertEquals(endDate, captor.getValue().getEndDate());
  }

  @Test
  void findUserDelegatesToRepository() {
    User user = new User();
    Optional<User> expected = Optional.of(user);
    when(userRepository.findById(7L)).thenReturn(expected);

    Optional<User> result = userService.findUser(7L);

    assertSame(expected, result);
  }

  @Test
  void getAllUsersDelegatesToRepository() {
    Iterable<User> expected = List.of(new User(), new User());
    when(userRepository.findAll()).thenReturn(expected);

    Iterable<User> result = userService.getAllUsers();

    assertSame(expected, result);
  }

  // ==================== banUser ====================

  @Test
  void banUserDeletesRegistrationsWhenBannedUserWasLastMember() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);
    user.setTeam(team);
    team.setManager(user);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(userRepository.findFirstByTeamAndIsBannedFalseAndIdNotOrderByDateAsc(team, 1L))
        .thenReturn(null);
    when(teamMembershipRepository.findByMember(user)).thenReturn(Optional.empty());

    userService.banUser(1L, 99L);

    verify(tournamentRegistrationRepository).deleteByTeam(team);
  }

  @Test
  void banUserDoesNotDeleteRegistrationsWhenTeamStillHasManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);
    User member = new User();
    ReflectionTestUtils.setField(member, "id", 2L);
    team.setManager(manager);
    member.setTeam(team);

    TeamMembership membership = new TeamMembership();
    when(userRepository.findById(2L)).thenReturn(Optional.of(member));
    when(teamMembershipRepository.findByMember(member)).thenReturn(Optional.of(membership));

    userService.banUser(2L, 99L);

    verify(tournamentRegistrationRepository, never()).deleteByTeam(team);
  }

  @Test
  void banUserReturnsFalseWhenUserNotFound() {
    when(userRepository.findById(99L)).thenReturn(Optional.empty());

    boolean result = userService.banUser(99L, 99L);

    assertFalse(result);
    verify(userRepository, never()).save(any());
  }

  @Test
  void banUserDesignatesOldestMemberWhenMainManagerHasNoSecondManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);
    User oldest = new User();
    ReflectionTestUtils.setField(oldest, "id", 2L);
    manager.setTeam(team);
    team.setManager(manager);

    when(userRepository.findById(1L)).thenReturn(Optional.of(manager));
    when(userRepository.findFirstByTeamAndIsBannedFalseAndIdNotOrderByDateAsc(team, 1L))
        .thenReturn(oldest);
    when(teamMembershipRepository.findByMember(manager)).thenReturn(Optional.empty());

    boolean result = userService.banUser(1L, 99L);

    assertTrue(result);
    assertEquals(oldest, team.getManager());
  }

  @Test
  void banUserSetsManagerNullWhenNoOldestMemberFound() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);
    manager.setTeam(team);
    team.setManager(manager);

    when(userRepository.findById(1L)).thenReturn(Optional.of(manager));
    when(userRepository.findFirstByTeamAndIsBannedFalseAndIdNotOrderByDateAsc(team, 1L))
        .thenReturn(null);
    when(teamMembershipRepository.findByMember(manager)).thenReturn(Optional.empty());

    boolean result = userService.banUser(1L, 99L);

    assertTrue(result);
    assertNull(team.getManager());
  }

  @Test
  void banUserPromotesSecondManagerWhenMainManagerBanned() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);
    User secondManager = new User();
    ReflectionTestUtils.setField(secondManager, "id", 2L);
    manager.setTeam(team);
    team.setManager(manager);
    team.setSecondManager(secondManager);

    when(userRepository.findById(1L)).thenReturn(Optional.of(manager));
    when(teamMembershipRepository.findByMember(manager)).thenReturn(Optional.empty());

    boolean result = userService.banUser(1L, 99L);

    assertTrue(result);
    assertEquals(secondManager, team.getManager());
    assertNull(team.getSecondManager());
  }

  @Test
  void banUserRemovesSecondManagerWhenSecondManagerBanned() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);
    User secondManager = new User();
    ReflectionTestUtils.setField(secondManager, "id", 2L);
    secondManager.setTeam(team);
    team.setManager(manager);
    team.setSecondManager(secondManager);

    when(userRepository.findById(2L)).thenReturn(Optional.of(secondManager));
    when(teamMembershipRepository.findByMember(secondManager)).thenReturn(Optional.empty());

    boolean result = userService.banUser(2L, 99L);

    assertTrue(result);
    assertNull(team.getSecondManager());
    assertEquals(manager, team.getManager());
  }

  @Test
  void banUserReturnsTrueWhenUserHasNoTeam() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(teamMembershipRepository.findByMember(user)).thenReturn(Optional.empty());

    boolean result = userService.banUser(1L, 99L);

    assertTrue(result);
    assertTrue(user.isBanned());
  }

  @Test
  void banUserWhenTeamHasNoManager() {
    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);
    user.setTeam(team);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(teamMembershipRepository.findByMember(user)).thenReturn(Optional.empty());

    boolean result = userService.banUser(1L, 99L);

    assertTrue(result);
  }

  @Test
  void loginReturnsNullWhenUserIsBanned() {
    User user = new User();
    user.setBanned(true);
    when(userRepository.findByEmail("z@mail.com")).thenReturn(user);

    AuthenticatedUser result = userService.login("z@mail.com", "pass");

    assertNull(result);
  }

  @Test
  void findByEmailDelegatesToRepository() {
    User user = new User();
    when(userRepository.findByEmail("test@mail.com")).thenReturn(user);

    User result = userService.findByEmail("test@mail.com");

    assertSame(user, result);
  }

  @Test
  void getPastTeamsReturnsEmptyListWhenUserNotFound() {
    when(userRepository.findById(99L)).thenReturn(Optional.empty());

    List<MembershipHistoryDto> result = userService.getPastTeams(99L);

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  void getPastTeamsReturnsListWhenUserFound() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);

    Team team = new Team();
    ReflectionTestUtils.setField(team, "id", 10L);
    team.setName("Team Alpha");

    MembershipHistory history = new MembershipHistory();
    history.setMember(user);
    history.setTeam(team);
    history.setLeftAt(LocalDate.of(2023, 6, 1));

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(membershipHistoryRepository.findByMember(user)).thenReturn(List.of(history));

    List<MembershipHistoryDto> result = userService.getPastTeams(1L);

    assertEquals(1, result.size());
    assertEquals(10L, result.get(0).teamId());
    assertEquals("Team Alpha", result.get(0).teamName());
    assertEquals(LocalDate.of(2023, 6, 1), result.get(0).leftAt());
  }

  @Test
  void getUnavailabilitiesForMemberReturnsNullWhenMemberNotFound() {
    when(userRepository.findById(99L)).thenReturn(Optional.empty());

    assertNull(userService.getUnavailabilitiesForMember(new User(), 99L));
  }

  @Test
  void getUnavailabilitiesForMemberReturnsNullWhenMemberHasNoTeam() {
    User target = new User();
    target.setTeam(null);
    when(userRepository.findById(1L)).thenReturn(Optional.of(target));

    assertNull(userService.getUnavailabilitiesForMember(new User(), 1L));
  }

  @Test
  void getUnavailabilitiesForMemberReturnsNullWhenCallerIsNotManagerNorSecond() {
    User caller = new User();
    ReflectionTestUtils.setField(caller, "id", 10L);

    User manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);
    User second = new User();
    ReflectionTestUtils.setField(second, "id", 2L);

    Team team = new Team();
    team.setManager(manager);
    team.setSecondManager(second);

    User target = new User();
    target.setTeam(team);
    when(userRepository.findById(5L)).thenReturn(Optional.of(target));

    assertNull(userService.getUnavailabilitiesForMember(caller, 5L));
  }

  @Test
  void getUnavailabilitiesForMemberWorksForManager() {
    User caller = new User();
    ReflectionTestUtils.setField(caller, "id", 1L);

    Team team = new Team();
    team.setManager(caller);

    User target = new User();
    target.setTeam(team);
    when(userRepository.findById(5L)).thenReturn(Optional.of(target));

    List<Unavailability> unavails = List.of(new Unavailability());
    when(unavailabilityRepository.findByUser(target)).thenReturn(unavails);

    assertSame(unavails, userService.getUnavailabilitiesForMember(caller, 5L));
  }

  @Test
  void getUnavailabilitiesForMemberWorksForSecondManager() {
    User caller = new User();
    ReflectionTestUtils.setField(caller, "id", 2L);

    User manager = new User();
    ReflectionTestUtils.setField(manager, "id", 1L);

    Team team = new Team();
    team.setManager(manager);
    team.setSecondManager(caller);

    User target = new User();
    target.setTeam(team);
    when(userRepository.findById(5L)).thenReturn(Optional.of(target));

    List<Unavailability> unavails = List.of(new Unavailability());
    when(unavailabilityRepository.findByUser(target)).thenReturn(unavails);

    assertSame(unavails, userService.getUnavailabilitiesForMember(caller, 5L));
  }

  // ==================== getMemberActivity ====================

  @Test
  void getMemberActivityReturnsEmptyListWhenUserNotFound() {
    when(userRepository.findById(99L)).thenReturn(Optional.empty());

    List<MemberActivityDto> result = userService.getMemberActivity(99L);

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  void getMemberActivityReturnsEmptyListWhenNoSelections() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of());

    List<MemberActivityDto> result = userService.getMemberActivity(1L);

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  void getMemberActivityReturnsDtoWithTwoTeams() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);

    Tournament tournament = new Tournament();
    ReflectionTestUtils.setField(tournament, "id", 10L);
    tournament.setName("Tournoi Marshall");

    Match match = new Match();
    ReflectionTestUtils.setField(match, "matchId", 5L);
    match.setRound(1L);
    match.setState(StateMatch.PLANIFIED);
    match.setTournament(tournament);

    Team team1 = new Team();
    ReflectionTestUtils.setField(team1, "id", 10L);
    team1.setName("Team Alpha");

    Team team2 = new Team();
    ReflectionTestUtils.setField(team2, "id", 20L);
    team2.setName("Team Beta");

    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setMember(user);
    selection.setTeam(team1);

    ParticipationMatch p1 = new ParticipationMatch();
    p1.setTeam(team1);
    p1.setScore(null);

    ParticipationMatch p2 = new ParticipationMatch();
    p2.setTeam(team2);
    p2.setScore(null);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection));
    when(participationMatchRepository.findByMatchMatchId(5L)).thenReturn(List.of(p1, p2));
    when(matchRepository.findByTournamentId(tournament.getId())).thenReturn(List.of(match));

    List<MemberActivityDto> result = userService.getMemberActivity(1L);

    assertEquals(1, result.size());
    assertEquals("Tournoi Marshall", result.get(0).tournamentName());
    assertEquals(10L, result.get(0).team1Id());
    assertEquals(20L, result.get(0).team2Id());
    assertNull(result.get(0).winnerTeamId());
  }

  @Test
  void getMemberActivityDeterminesWinnerWhenMatchEnded() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);

    Tournament tournament = new Tournament();
    ReflectionTestUtils.setField(tournament, "id", 10L);
    tournament.setName("Tournoi Etoile");

    Match match = new Match();
    ReflectionTestUtils.setField(match, "matchId", 5L);
    match.setRound(1L);
    match.setState(StateMatch.ENDED);
    match.setTournament(tournament);

    Team team1 = new Team();
    ReflectionTestUtils.setField(team1, "id", 10L);
    team1.setName("Team Alpha");

    Team team2 = new Team();
    ReflectionTestUtils.setField(team2, "id", 20L);
    team2.setName("Team Beta");

    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setMember(user);
    selection.setTeam(team1);

    ParticipationMatch p1 = new ParticipationMatch();
    p1.setTeam(team1);
    p1.setScore(3);

    ParticipationMatch p2 = new ParticipationMatch();
    p2.setTeam(team2);
    p2.setScore(1);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection));
    when(participationMatchRepository.findByMatchMatchId(5L)).thenReturn(List.of(p1, p2));
    when(matchRepository.findByTournamentId(tournament.getId())).thenReturn(List.of(match));

    List<MemberActivityDto> result = userService.getMemberActivity(1L);

    assertEquals(10L, result.get(0).winnerTeamId());
  }

  @Test
  void getMemberActivityHandlesOneTeamOnly() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);

    Tournament tournament = new Tournament();
    ReflectionTestUtils.setField(tournament, "id", 10L);
    tournament.setName("Tournoi Bye");

    Match match = new Match();
    ReflectionTestUtils.setField(match, "matchId", 5L);
    match.setRound(1L);
    match.setState(StateMatch.ENDED);
    match.setTournament(tournament);

    Team team1 = new Team();
    ReflectionTestUtils.setField(team1, "id", 10L);
    team1.setName("Team Alpha");

    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setMember(user);
    selection.setTeam(team1);

    ParticipationMatch p1 = new ParticipationMatch();
    p1.setTeam(team1);
    p1.setScore(null);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection));
    when(participationMatchRepository.findByMatchMatchId(5L)).thenReturn(List.of(p1));
    when(matchRepository.findByTournamentId(tournament.getId())).thenReturn(List.of(match));

    List<MemberActivityDto> result = userService.getMemberActivity(1L);

    assertEquals(1, result.size());
    assertEquals(10L, result.get(0).team1Id());
    assertNull(result.get(0).team2Id());
    assertNull(result.get(0).winnerTeamId());
  }

  @Test
  void getMemberActivityDeterminesWinnerWhenTeam2Wins() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);

    Tournament tournament = new Tournament();
    ReflectionTestUtils.setField(tournament, "id", 10L);
    tournament.setName("Tournoi Etoile");

    Match match = new Match();
    ReflectionTestUtils.setField(match, "matchId", 5L);
    match.setRound(1L);
    match.setState(StateMatch.ENDED);
    match.setTournament(tournament);

    Team team1 = new Team();
    ReflectionTestUtils.setField(team1, "id", 10L);
    team1.setName("Team Alpha");

    Team team2 = new Team();
    ReflectionTestUtils.setField(team2, "id", 20L);
    team2.setName("Team Beta");

    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setMember(user);
    selection.setTeam(team1);

    ParticipationMatch p1 = new ParticipationMatch();
    p1.setTeam(team1);
    p1.setScore(1);

    ParticipationMatch p2 = new ParticipationMatch();
    p2.setTeam(team2);
    p2.setScore(3);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection));
    when(participationMatchRepository.findByMatchMatchId(5L)).thenReturn(List.of(p1, p2));
    when(matchRepository.findByTournamentId(tournament.getId())).thenReturn(List.of(match));

    List<MemberActivityDto> result = userService.getMemberActivity(1L);

    assertEquals(20L, result.get(0).winnerTeamId());
  }

  @Test
  void getMemberActivityDeduplicatesAndKeepsLastSelection() {
    User user = new User();
    ReflectionTestUtils.setField(user, "id", 1L);

    Tournament tournament = new Tournament();
    ReflectionTestUtils.setField(tournament, "id", 10L);
    tournament.setName("Tournoi Dedup");

    Match match = new Match();
    ReflectionTestUtils.setField(match, "matchId", 5L);
    match.setRound(1L);
    match.setState(StateMatch.PLANIFIED);
    match.setTournament(tournament);

    Team team1 = new Team();
    ReflectionTestUtils.setField(team1, "id", 10L);
    team1.setName("Team Alpha");

    Team team2 = new Team();
    ReflectionTestUtils.setField(team2, "id", 20L);
    team2.setName("Team Beta");

    SelectionMatch selection1 = new SelectionMatch();
    selection1.setMatch(match);
    selection1.setMember(user);
    selection1.setTeam(team1);

    SelectionMatch selection2 = new SelectionMatch();
    selection2.setMatch(match);
    selection2.setMember(user);
    selection2.setTeam(team2);

    ParticipationMatch p1 = new ParticipationMatch();
    p1.setTeam(team1);
    p1.setScore(null);

    ParticipationMatch p2 = new ParticipationMatch();
    p2.setTeam(team2);
    p2.setScore(null);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(selectionMatchRepository.findByMember(user)).thenReturn(List.of(selection1, selection2));
    when(participationMatchRepository.findByMatchMatchId(5L)).thenReturn(List.of(p1, p2));
    when(matchRepository.findByTournamentId(10L)).thenReturn(List.of(match));

    List<MemberActivityDto> result = userService.getMemberActivity(1L);

    assertEquals(1, result.size());
    assertEquals(20L, result.get(0).selectedTeamId());
  }
}