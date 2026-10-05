package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;
import be.vinci.ipl.cae.demo.models.dtos.Credentials;
import be.vinci.ipl.cae.demo.models.dtos.UserDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.results.AuthRegisterResult;
import be.vinci.ipl.cae.demo.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * AuthController to handle user authentication.
 */
@RestController
@RequestMapping("/auths")
public class AuthController {

  private final UserService userService;

  /**
   * Constructor for AuthController.
   *
   * @param userService the injected UserService.
   */
  public AuthController(UserService userService) {
    this.userService = userService;
  }

  private boolean isInvalidCredentials(Credentials credentials) {
    return credentials == null
        || credentials.getEmail() == null
        || credentials.getEmail().isBlank()
        || credentials.getPassword() == null
        || credentials.getPassword().isBlank();
  }

  private boolean isInvalidRegisterRequest(UserDto userDto) {
    return userDto == null
        || userDto.getEmail() == null
        || userDto.getEmail().isBlank()
        || userDto.getPassword() == null
        || userDto.getPassword().isBlank()
        || userDto.getTag() == null
        || userDto.getTag().isBlank()
        || userDto.getSpeciality() == null
        || userDto.getSpeciality().isBlank()
        || userDto.getProfilePicture() == null
        || userDto.getProfilePicture().isBlank();
  }

  /**
   * Register a new user.
   *
  * @param userDto the user payload from the request body.
   * @return the authenticated user.
   */
  @PostMapping("/register")
  public AuthenticatedUser register(@Valid @RequestBody UserDto userDto) {
    if (isInvalidRegisterRequest(userDto)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }

    AuthRegisterResult outcome = userService.register(
        userDto.getEmail(),
        userDto.getPassword(),
        userDto.getTag(),
        userDto.getSpeciality(),
        userDto.getProfilePicture());

    if (outcome.success()) {
      return outcome.user();
    }
    if (outcome.emailAlreadyExists()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT);
    }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, outcome.badRequestMessage());
  }

  /**
   * Refreshes the JWT token for the currently authenticated user.
   * Reads the latest user state from the database to reflect any role changes.
   *
   * @param caller the authenticated user
   * @return a new AuthenticatedUser with a fresh token
   */
  @GetMapping("/refresh")
  @PreAuthorize("isAuthenticated()")
  public AuthenticatedUser refresh(@AuthenticationPrincipal User caller) {
    return userService.createJwtToken(
        caller.getId(),
        caller.getEmail(),
        caller.getTag(),
        caller.isAdmin(),
        caller.getTeam() == null ? null : caller.getTeam().getId()
    );
  }

  /**
   * Login a user.
   *
   * @param credentials the user credentials from the request body
   * @return the authenticated user.
   */
  @PostMapping("/login")
  public AuthenticatedUser login(@Valid @RequestBody Credentials credentials) {
    if (isInvalidCredentials(credentials)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }

    User user = userService.findByEmail(credentials.getEmail());
    if (user != null && user.isBanned()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    AuthenticatedUser authenticatedUser = userService.login(
        credentials.getEmail(), credentials.getPassword());

    if (authenticatedUser == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }

    return authenticatedUser;
  }

}
