package be.vinci.ipl.cae.demo.models.results;

import be.vinci.ipl.cae.demo.models.dtos.AuthenticatedUser;

/**
 * Outcome of user self-registration: JWT payload on success, or a failure mode.
 *
 * @param user non-null when registration succeeded
 * @param emailAlreadyExists when true, email is already registered (HTTP 409)
 * @param badRequestMessage when non-null and not an email conflict, message for HTTP 400
 */
public record AuthRegisterResult(
    AuthenticatedUser user,
    boolean emailAlreadyExists,
    String badRequestMessage
) {

  /** Successful registration with JWT payload. */
  public static AuthRegisterResult ok(AuthenticatedUser user) {
    return new AuthRegisterResult(user, false, null);
  }

  /** Email is already registered. */
  public static AuthRegisterResult emailTaken() {
    return new AuthRegisterResult(null, true, null);
  }

  /** Invalid speciality, profile picture, or other client payload issue. */
  public static AuthRegisterResult invalidPayload(String message) {
    return new AuthRegisterResult(null, false, message);
  }

  /**
   * Indicates whether registration succeeded.
   *
   * @return true when {@link #user()} is non-null
   */
  public boolean success() {
    return user != null;
  }
}
