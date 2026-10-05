package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.MemberActivityDto;
import be.vinci.ipl.cae.demo.models.dtos.MembershipHistoryDto;
import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.dtos.UnavailabilityRequestDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ProfilePicture;
import be.vinci.ipl.cae.demo.models.entities.Speciality;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.models.results.AuthRegisterResult;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.MembershipHistoryRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.repositories.ProfilePictureRepository;
import be.vinci.ipl.cae.demo.repositories.SelectionMatchRepository;
import be.vinci.ipl.cae.demo.repositories.SpecialityRepository;
import be.vinci.ipl.cae.demo.repositories.TeamMembershipRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.UnavailabilityRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * User service.
 */
@Service
public class UserService {

  @Value("${JWT_SECRET}")
  private String jwtSecret;
  private static final long lifetimeJwt = 24 * 60 * 60 * 1000; // 24 hours
  private Algorithm algorithm;

  /**
   * Initialize the JWT algorithm once the secret is injected.
   */
  @PostConstruct
  public void init() {
    this.algorithm = Algorithm.HMAC256(jwtSecret);
  }

  private final BCryptPasswordEncoder passwordEncoder;
  private final UserRepository userRepository;
  private final UnavailabilityRepository unavailabilityRepository;
  private final SpecialityRepository specialityRepository;
  private final NotificationService notificationService;
  private final ProfilePictureRepository profilePictureRepository;
  private final TeamRepository teamRepository;
  private final TeamMembershipRepository teamMembershipRepository;
  private final TournamentRegistrationRepository tournamentRegistrationRepository;
  private final MembershipHistoryRepository membershipHistoryRepository;
  private final SelectionMatchRepository selectionMatchRepository;
  private final ParticipationMatchRepository participationMatchRepository;
  private final MatchRepository matchRepository;
  private final SelectionMatchService selectionMatchService;
  /**
   * Constructor.
   *
   * @param passwordEncoder the password encoder
   * @param userRepository  the user repository
   * @param specialityRepository the speciality repository
   * @param profilePictureRepository the profile picture repository
   * @param unavailabilityRepository the unavailability repository
   */

  public UserService(BCryptPasswordEncoder passwordEncoder, UserRepository userRepository,
                     UnavailabilityRepository unavailabilityRepository,
                     SpecialityRepository specialityRepository,
                     NotificationService notificationService,
                     ProfilePictureRepository profilePictureRepository,
                     TeamRepository teamRepository,
                     TeamMembershipRepository teamMembershipRepository,
                     MembershipHistoryRepository membershipHistoryRepository,
                     TournamentRegistrationRepository tournamentRegistrationRepository,
                     SelectionMatchRepository selectionMatchRepository,
                     ParticipationMatchRepository participationMatchRepository,
                     MatchRepository matchRepository,
                     SelectionMatchService selectionMatchService) {
    this.passwordEncoder = passwordEncoder;
    this.userRepository = userRepository;
    this.specialityRepository = specialityRepository;
    this.unavailabilityRepository = unavailabilityRepository;
    this.profilePictureRepository = profilePictureRepository;
    this.notificationService = notificationService;
    this.teamRepository = teamRepository;
    this.teamMembershipRepository = teamMembershipRepository;
    this.tournamentRegistrationRepository = tournamentRegistrationRepository;
    this.membershipHistoryRepository = membershipHistoryRepository;
    this.selectionMatchRepository = selectionMatchRepository;
    this.participationMatchRepository = participationMatchRepository;
    this.matchRepository = matchRepository;
    this.selectionMatchService = selectionMatchService;
  }

  /**
   * Create a JWT token.
   *
   * @param email the email to included in the claim
   * @return the JWT token
   */
  public AuthenticatedUser createJwtToken(
      Long id,
      String email,
      String tag,
      boolean isAdmin,
      Long teamId
  ) {
    String token = JWT.create()
        .withIssuer("auth0")
        .withClaim("id", id)
        .withClaim("email", email)
        .withClaim("tag", tag)
        .withClaim("isAdmin", isAdmin)
        .withIssuedAt(new Date())
        .withExpiresAt(new Date(System.currentTimeMillis() + lifetimeJwt))
        .sign(algorithm);

    AuthenticatedUser authenticatedUser = new AuthenticatedUser();
    authenticatedUser.setId(id);
    authenticatedUser.setEmail(email);
    authenticatedUser.setTag(tag);
    authenticatedUser.setAdmin(isAdmin);
    authenticatedUser.setTeamId(teamId);
    authenticatedUser.setToken(token);

    return authenticatedUser;
  }

  /**
   * Verify a JWT token.
   *
   * @param token the token to verify
   * @return the username if the token is valid, null otherwise
   */
  public String verifyJwtToken(String token) {
    try {
      return JWT.require(algorithm).build().verify(token).getClaim("email").asString();
    } catch (Exception e) {
      return null;
    }
  }

  /**
   * Get JWT claims (email and admin status) from token.
   *
   * @param token the JWT token
   * @return a map with email and isAdmin, or null if invalid
   */
  public Map<String, Object> getJwtClaimsFromToken(String token) {
    try {
      var decodedJwt = JWT.require(algorithm).build().verify(token);
      Map<String, Object> claims = new HashMap<>();
      claims.put("email", decodedJwt.getClaim("email").asString());
      claims.put("isAdmin", decodedJwt.getClaim("isAdmin").asBoolean());
      return claims;
    } catch (Exception e) {
      return new HashMap<String, Object>();
    }
  }

  /**
   * Login a user.
   *
   * @param email the email
   * @param password the password
   * @return the authenticated user if the login is successful, null otherwise
   */
  public AuthenticatedUser login(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
      return null;
    }

    if (user.isBanned()) {
      return null;
    }

    if (!passwordEncoder.matches(password, user.getPassword())) {
      return null;
    }

    return createJwtToken(
        user.getId(),
        email,
        user.getTag(),
        user.isAdmin(),
        user.getTeam() == null ? null : user.getTeam().getId()
    );
  }

  /**
   * Register a new user.
   *
   * @param email the email
   * @param password the password
   * @param tag the user tag
   * @param specialityName the speciality name
   * @param profilePicture the profile picture URL
   * @return outcome with JWT on success, email conflict, or invalid payload
   */
  public AuthRegisterResult register(String email, String password, String tag,
                                      String specialityName, String profilePicture) {
    User user = userRepository.findByEmail(email);
    if (user != null) {
      return AuthRegisterResult.emailTaken();
    }

    Speciality speciality = specialityRepository.findByName(specialityName);
    if (speciality == null) {
      return AuthRegisterResult.invalidPayload("Invalid speciality");
    }

    ProfilePicture profilePictureEntity = profilePictureRepository.findByUrl(profilePicture);
    if (profilePictureEntity == null) {
      return AuthRegisterResult.invalidPayload("Invalid profile picture");
    }

    User newUser = createOne(email, password, false, tag, profilePictureEntity,
        speciality);

    return AuthRegisterResult.ok(
        createJwtToken(newUser.getId(), email, newUser.getTag(), false, null));
  }

  /**
   * Read a user from its username.
   *
   * @param username the username
   * @return the user if it exists, null otherwise
   */
  public User readOneFromUsername(String username) {
    return userRepository.findByEmail(username);
  }

  /**
   * Create a new user.
   *
   * @param email the email
   * @param password the password
   * @param tag the tag
   * @param profilePicture the profile picture
   * @param speciality the speciality
   * @param isAdmin whether the user is admin
   * @return the created user
   */
  public User createOne(String email, String password, boolean isAdmin, String tag,
                        ProfilePicture profilePicture, Speciality speciality) {
    String hashedPassword = passwordEncoder.encode(password);

    User user = new User();
    user.setEmail(email);
    user.setPassword(hashedPassword);
    user.setTag(tag);
    user.setProfilePicture(profilePicture);
    user.setSpeciality(speciality);
    user.setAdmin(isAdmin);
    user.setDate(LocalDate.now());

    User savedUser = userRepository.save(user);
    sendWelcomeNotification(savedUser);
    return savedUser;
  }

  private void sendWelcomeNotification(User user) {
    NotificationDto notificationDto = new NotificationDto();
    notificationDto.setUserId(user.getId());
    notificationDto.setObject("Bienvenue !");
    notificationDto.setMessage("Votre compte a été créé avec succès.");
    notificationDto.setType(NotificationType.WELCOME);
    notificationService.createNotification(user, notificationDto);
  }

  /**
   * Updates the password of a user after verifying the old password.
   * Returns false if the user does not exist or if the old password is incorrect.
   *
   * @param email the email of the user
   * @param oldPassword the current password to verify
   * @param newPassword the new password to set
   * @return true if the password was updated, false otherwise
   */
  public boolean updatePassword(String email, String oldPassword, String newPassword) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
      return false;
    }
    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
      return false;
    }
    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);
    return true;
  }

  /**
   * Retrieves all unavailabilities for a given user.
   *
   * @param user the authenticated user
   * @return the list of unavailabilities
   */
  public Iterable<Unavailability> getUnavailabilities(User user) {
    return unavailabilityRepository.findByUser(user);
  }

  /**
   * Creates and saves a new unavailability for a given user.
   *
   * @param user the authenticated user
   * @param request the unavailability dates
   * @return the saved unavailability
   */
  public Unavailability addUnavailability(User user, UnavailabilityRequestDto request) {
    Unavailability unavailability = new Unavailability();
    unavailability.setUser(user);
    unavailability.setStartDate(request.startDate());
    unavailability.setEndDate(request.endDate());
    Unavailability saved = unavailabilityRepository.save(unavailability);
    selectionMatchService.handleMemberUnavailable(
        user.getId(), request.startDate(), request.endDate());
    return saved;
  }

  /**
   * Updates the speciality of a given user.
   *
   * @param user the authenticated user
   * @param specialityName the new speciality name
   * @return true if the speciality was updated, false otherwise
   */
  public boolean updateSpeciality(User user, String specialityName) {
    Speciality speciality = specialityRepository.findByName(specialityName);
    if (speciality == null) {
      return false;
    }
    user.setSpeciality(speciality);
    userRepository.save(user);
    return true;
  }

  /**
   * Updates the profile picture of a given user.
   *
   * @param user the authenticated user
   * @param profilePictureUrl the URL of the new profile picture
   * @return true if the picture was updated, false if the URL does not match any existing picture
   */
  public boolean updateProfilePicture(User user, String profilePictureUrl) {
    ProfilePicture picture = profilePictureRepository.findByUrl(profilePictureUrl);
    if (picture == null) {
      return false;
    }
    user.setProfilePicture(picture);
    userRepository.save(user);
    return true;
  }

  /**
   * Find a user by ID.
   *
   * @param userId the user ID
   * @return the user if found
   */
  public Optional<User> findUser(Long userId) {
    return userRepository.findById(userId);
  }

  /**
   * Retrieves all users.
   *
   * @return all users.
   */
  public Iterable<User> getAllUsers() {
    return userRepository.findAll();
  }

  /**
   * Ban a user by ID.
   *
   * @param userId the ID of the user to ban
   * @return true if the user was banned, false if not found
   */
  @Transactional
  public boolean banUser(Long userId, Long callerId) {
    Optional<User> optionalUser = userRepository.findById(userId);
    if (optionalUser.isEmpty()) {
      return false;
    }
    User user = optionalUser.get();

    Team team = user.getTeam();
    if (team != null) {
      boolean isMainManager = team.getManager() != null
          && team.getManager().getId().equals(userId);
      boolean isSecondManager = team.getSecondManager() != null
          && team.getSecondManager().getId().equals(userId);
      boolean hasNoSecondManager = team.getSecondManager() == null;

      if (isMainManager && hasNoSecondManager) {
        User oldest = userRepository
            .findFirstByTeamAndIsBannedFalseAndIdNotOrderByDateAsc(team, userId);
        if (oldest != null) {
          team.setManager(oldest);
        } else {
          team.setManager(null);
        }
      } else if (isMainManager && !hasNoSecondManager) {
        team.setManager(team.getSecondManager());
        team.setSecondManager(null);
      } else if (isSecondManager) {
        team.setSecondManager(null);
      }

      teamRepository.save(team);
      if (team.getManager() == null) {
        tournamentRegistrationRepository.deleteByTeam(team);
      }
    }
    selectionMatchService.handleMemberBanned(userId, callerId);
    teamMembershipRepository.findByMember(user)
        .ifPresent(teamMembershipRepository::delete);

    user.setBanned(true);
    user.setTeam(null);
    userRepository.save(user);
    return true;
  }

  /**
   * Find a user by email.
   *
   * @param email the email
   * @return the user or null if not found
   */
  public User findByEmail(String email) {
    return userRepository.findByEmail(email);
  }

  /**
   * Get the past team memberships of a user.
   *
   * @param userId the user ID
   * @return list of past membership DTOs, or null if user not found
   */
  public List<MembershipHistoryDto> getPastTeams(Long userId) {
    Optional<User> optionalUser = userRepository.findById(userId);
    if (optionalUser.isEmpty()) {
      return List.of();
    }
    return membershipHistoryRepository.findByMember(optionalUser.get()).stream()
        .map(h -> new MembershipHistoryDto(
            h.getTeam().getId(),
            h.getTeam().getName(),
            h.getLeftAt()
        ))
        .toList();
  }

  /**
   * Returns the unavailabilities of a member if the caller is their manager or second manager.
   *
   * @param member   the authenticated user making the request.
   * @param targetId the id of the member whose unavailabilities are requested.
   * @return the unavailabilities, or null if access is denied.
   */
  public Iterable<Unavailability> getUnavailabilitiesForMember(User member, Long targetId) {
    Optional<User> targetOpt = userRepository.findById(targetId);
    if (targetOpt.isEmpty()) {
      return null;
    }
    User target = targetOpt.get();
    Team team = target.getTeam();
    if (team == null) {
      return null;
    }
    boolean isManager = team.getManager() != null
        && team.getManager().getId().equals(member.getId());
    boolean isSecond = team.getSecondManager() != null
        && team.getSecondManager().getId().equals(member.getId());
    if (!isManager && !isSecond) {
      return null;
    }
    return unavailabilityRepository.findByUser(target);
  }

  /**
   * Get the match activity of a member.
   *
   * @param userId the user ID
   * @return list of match activity DTOs
   */
  public List<MemberActivityDto> getMemberActivity(Long userId) {
    Optional<User> optionalUser = userRepository.findById(userId);
    if (optionalUser.isEmpty()) {
      return List.of();
    }
    return selectionMatchRepository.findByMember(optionalUser.get()).stream()
        .map(s -> {
          var match = s.getMatch();
          var tournament = match.getTournament();
          Long selectedTeamId = s.getTeam().getId();
          // On récupère team1 et team2
          Long team1Id = null;
          String team1Name = null;
          Long team2Id = null;
          String team2Name = null;
          Integer team1Score = null;
          Integer team2Score = null;
          var parts = participationMatchRepository.findByMatchMatchId(match.getMatchId());
          if (parts.size() >= 2) {
            team1Id = parts.get(0).getTeam().getId();
            team1Name = parts.get(0).getTeam().getName();
            team2Id = parts.get(1).getTeam().getId();
            team2Name = parts.get(1).getTeam().getName();
            team1Score = parts.get(0).getScore();
            team2Score = parts.get(1).getScore();
          } else if (parts.size() == 1) {
            team1Id = parts.get(0).getTeam().getId();
            team1Name = parts.get(0).getTeam().getName();
          }
          // Déterminer le gagnant
          Long winnerTeamId = null;
          if (match.getState() == StateMatch.ENDED
              && team1Score != null && team2Score != null) {
            winnerTeamId = team1Score > team2Score ? team1Id : team2Id;
          }
          long totalRounds = matchRepository.findByTournamentId(tournament.getId()).stream()
              .mapToLong(Match::getRound)
              .max()
              .orElse(1L);
          return new MemberActivityDto(
              tournament.getId(),
              tournament.getName(),
              match.getRound(),
              totalRounds,
              match.getMatchId(),
              selectedTeamId,
              team1Id,
              team1Name,
              team2Id,
              team2Name,
              winnerTeamId,
              match.getState()
          );
        })
        .collect(java.util.stream.Collectors.toMap(
            MemberActivityDto::matchId,
            dto -> dto,
            (existing, replacement) -> replacement
        ))
        .values()
        .stream()
        .toList();
  }

}