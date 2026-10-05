package be.vinci.ipl.cae.demo.models.results;

import be.vinci.ipl.cae.demo.models.dtos.TournamentRegistrationDto;

/**
 * Outcome of attempting to register a team to a tournament.
 *
 * @param registration non-null on success
 * @param errorMessage non-null on failure (message for the HTTP client)
 * @param conflict when true and failed, maps to HTTP 409 (e.g. inscription closed)
 */
public record TournamentRegistrationResult(
    TournamentRegistrationDto registration,
    String errorMessage,
    boolean conflict
) {

  /** Successful registration. */
  public static TournamentRegistrationResult ok(TournamentRegistrationDto dto) {
    return new TournamentRegistrationResult(dto, null, false);
  }

  /** Failed registration with client message and optional conflict flag. */
  public static TournamentRegistrationResult fail(String message, boolean conflict) {
    return new TournamentRegistrationResult(null, message, conflict);
  }

  /**
   * Indicates whether tournament registration succeeded.
   *
   * @return true when {@link #registration()} is non-null
   */
  public boolean success() {
    return registration != null && errorMessage == null;
  }
}
