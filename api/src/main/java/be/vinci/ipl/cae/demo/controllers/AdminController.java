package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.UserProfileDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.AdministrationService;
import java.util.List;
import java.util.stream.StreamSupport;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * RestController pour /administrators.
 */
@RestController
@RequestMapping("/administrators")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  private final AdministrationService administrationService;

  /**
   * Administration controller ctor.
   *
   * @param administrationService the administration service
   */
  public AdminController(AdministrationService administrationService) {
    this.administrationService = administrationService;
  }

  /**
   * Returns all admin profiles.
   *
   * @return the list of admin profiles
   */
  @GetMapping({"", "/"})
  public List<UserProfileDto> getAllAdmins() {
    return StreamSupport.stream(administrationService.getAllAdmins().spliterator(), false)
        .map(this::toUserProfile)
        .toList();
  }

  /**
   * Returns all non-admin user profiles.
   *
   * @return the list of non-admin user profiles
   */
  @GetMapping("/non-admins")
  public List<UserProfileDto> getAllNonAdmins() {
    return StreamSupport.stream(administrationService.getAllNonAdmins().spliterator(), false)
        .map(this::toUserProfile)
        .toList();
  }

  /**
   * Promotes a user to admin.
   *
   * @param userId the user id to promote
   */
  @PostMapping("/{userId}")
  @ResponseStatus(HttpStatus.OK)
  public void promoteToAdmin(@PathVariable Long userId) {
    boolean promoted = administrationService.promoteToAdmin(userId);
    if (!promoted) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found or already admin");
    }
  }

  /**
   * Demotes an admin user to regular member.
   * An admin may demote themselves only if at least one other admin exists.
   *
   * @param userId the user id to demote
   * @param caller the authenticated admin user
   */
  @DeleteMapping("/{userId}")
  @ResponseStatus(HttpStatus.OK)
  public void demoteFromAdmin(@PathVariable Long userId, @AuthenticationPrincipal User caller) {
    Boolean demoted = administrationService.demoteFromAdmin(userId, caller.getId());
    if (demoted == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Cannot demote yourself when you are the last admin");
    }
    if (!demoted) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found or not admin");
    }
  }

  /**
   * Converts a User to a UserProfile.
   *
   * @param user the user entity
   * @return the user profile
   */
  private UserProfileDto toUserProfile(User user) {
    //CPD-OFF
    var team = user.getTeam();
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
        user.getTeam() != null ? user.getTeam().getName() : null,
        null,
        isManager
    );
    //CPD-ON
  }
}
