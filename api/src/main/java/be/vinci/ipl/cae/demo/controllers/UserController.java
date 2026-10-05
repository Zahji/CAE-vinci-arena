package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.MemberActivityDto;
import be.vinci.ipl.cae.demo.models.dtos.MembershipHistoryDto;
import be.vinci.ipl.cae.demo.models.dtos.PasswordUpdateDto;
import be.vinci.ipl.cae.demo.models.dtos.UnavailabilityRequestDto;
import be.vinci.ipl.cae.demo.models.dtos.UserProfileDto;
import be.vinci.ipl.cae.demo.models.dtos.UserPublicProfileDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.UserService;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
 * UserController to handle user profile.
 */
@RestController
@RequestMapping("/users")
public class UserController {

  private final UserService userService;

  /**
   * Constructor for UserController.
   *
   * @param userService the injected UserService.
   */
  public UserController(UserService userService) {
    this.userService = userService;
  }

  /**
   * Get the profile of the authenticated user.
   *
   * @param authentication the Spring Security authentication object.
   * @return the user profile.
   */
  @PreAuthorize("isAuthenticated()")
  @GetMapping("/me")
  public UserProfileDto getMyProfile(Authentication authentication) {
    User user = (User) authentication.getPrincipal();

    if (user == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    return toUserProfile(user);
  }

  /**
   * Updates the password of the authenticated user.
   *
   * @param authentication the Spring Security authentication object.
   * @param passwordUpdate the old and new passwords.
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/me/password")
  public void updatePassword(Authentication authentication,
                             @RequestBody PasswordUpdateDto passwordUpdate) {
    User user = (User) authentication.getPrincipal();
    boolean success = userService.updatePassword(
        user.getEmail(),
        passwordUpdate.oldPassword(),
        passwordUpdate.newPassword()
    );
    if (!success) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Retrieves all unavailabilities of the authenticated user.
   *
   * @param authentication the Spring Security authentication object.
   * @return the list of unavailabilities.
   */
  @PreAuthorize("isAuthenticated()")
  @GetMapping("/me/unavailabilities")
  public Iterable<Unavailability> getUnavailabilities(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    return userService.getUnavailabilities(user);
  }

  /**
   * Adds a new unavailability for the authenticated user.
   *
   * @param authentication the Spring Security authentication object.
   * @param request        the unavailability dates.
   * @return the created unavailability.
   */
  @PreAuthorize("isAuthenticated()")
  @PostMapping("/me/unavailabilities")
  @ResponseStatus(HttpStatus.CREATED)
  public Unavailability addUnavailability(
      Authentication authentication,
      @RequestBody UnavailabilityRequestDto request
  ) {
    User user = (User) authentication.getPrincipal();
    return userService.addUnavailability(user, request);
  }

  /**
   * Updates the speciality of the authenticated user.
   *
   * @param authentication the Spring Security authentication object.
   * @param body           the request body containing the speciality name.
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/me/speciality")
  public void updateSpeciality(Authentication authentication,
                               @RequestBody Map<String, String> body) {
    User user = (User) authentication.getPrincipal();
    boolean success = userService.updateSpeciality(user, body.get("specialityName"));
    if (!success) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Updates the profile picture of the authenticated user.
   *
   * @param authentication the Spring Security authentication object.
   * @param body the request body containing the profile picture URL.
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/me/profile-picture")
  public void updateProfilePicture(Authentication authentication,
                                   @RequestBody Map<String, String> body) {
    User user = (User) authentication.getPrincipal();
    boolean success = userService.updateProfilePicture(user, body.get("profilePictureUrl"));
    if (!success) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Get the public profiles of all users.
   *
   * @return the list of public user profiles.
   */
  @GetMapping
  public List<UserPublicProfileDto> getAllUsers() {
    return StreamSupport.stream(userService.getAllUsers().spliterator(), false)
        .map(this::toPublicProfile)
        .toList();
  }

  /**
   * Get the public profile of a user by id.
   *
   * @param id the user id.
   * @return the public user profile.
   */
  @GetMapping("/{id}")
  public UserPublicProfileDto getUserById(@PathVariable Long id) {
    User user = userService.findUser(id).orElse(null);
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return toPublicProfile(user);
  }

  /**
   * Get the unavailabilities of a member (only for their manager or second manager).
   *
   * @param member the authenticated user.
   * @param id the target member id.
   * @return the list of unavailabilities.
   */
  @GetMapping("/{id}/unavailabilities")
  @PreAuthorize("isAuthenticated()")
  public Iterable<Unavailability> getMemberUnavailabilities(
      @AuthenticationPrincipal User member,
      @PathVariable Long id) {
    Iterable<Unavailability> result = userService.getUnavailabilitiesForMember(member, id);
    if (result == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    return result;
  }

  /**
   * Converts a User to a UserPublicProfileDto.
   *
   * @param user the user entity
   * @return the public user profile
   */
  private UserPublicProfileDto toPublicProfile(User user) {
    //CPD-OFF
    var team = user.getTeam();
    return new UserPublicProfileDto(
        user.getId(),
        user.getTag(),
        user.getSpeciality() != null ? user.getSpeciality().getName() : null,
        user.getProfilePicture() != null ? user.getProfilePicture().getUrl() : null,
        user.getDate(),
        team != null ? team.getName() : null,
        team != null ? team.getId() : null,
        user.isBanned()
    );
    //CPD-ON
  }

  /**
   * Converts a User to a UserProfile.
   *
   * @param user the user entity
   * @return the user profile
   */
  private UserProfileDto toUserProfile(User user) {
    //CPD-OFF
    Team team = user.getTeam();
    boolean isManager = team != null && (
        (team.getManager() != null && team.getManager().getId().equals(user.getId()))
            || (team.getSecondManager() != null
            && team.getSecondManager().getId().equals(user.getId()))
    );
    return new UserProfileDto(
        user.getId(),
        user.getEmail(),
        user.getTag(),
        user.getSpeciality() != null ? user.getSpeciality().getName() : null,
        user.getProfilePicture() != null ? user.getProfilePicture().getUrl() : null,
        user.getDate(),
        team != null ? team.getName() : null,
        team != null ? team.getId() : null,
        isManager
    );
    //CPD-ON
  }

  /**
   * Ban a user by ID.
   *
   * @param authentication the authenticated admin
   * @param id the user ID to ban
   */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/ban")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void banUser(Authentication authentication, @PathVariable Long id) {
    User requester = (User) authentication.getPrincipal();
    if (!requester.isAdmin()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    boolean success = userService.banUser(id, requester.getId());
    if (!success) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Get the past teams of a user.
   *
   * @param id the user id
   * @return the list of past team memberships
   */
  @GetMapping("/{id}/past-teams")
  public List<MembershipHistoryDto> getPastTeams(@PathVariable Long id) {
    if (userService.findUser(id).isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return userService.getPastTeams(id);
  }

  /**
   * Get the match activity of a member.
   *
   * @param id the user id
   * @return the list of match activities
   */
  @GetMapping("/{id}/member-activity")
  public List<MemberActivityDto> getMemberActivity(@PathVariable Long id) {
    if (userService.findUser(id).isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return userService.getMemberActivity(id);
  }
}