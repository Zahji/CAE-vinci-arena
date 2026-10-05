package be.vinci.ipl.cae.demo.models.results;

import be.vinci.ipl.cae.demo.models.entities.Team;

/**
 * Outcome of a team mutation: either an updated team or an error message for the client.
 */
public record TeamOperationResult(Team team, String errorMessage) {

  /**
   * Successful mutation.
   */
  public static TeamOperationResult ok(Team team) {
    return new TeamOperationResult(team, null);
  }

  /**
   * Failed mutation; {@code team} is always null.
   */
  public static TeamOperationResult error(String message) {
    return new TeamOperationResult(null, message);
  }

  /**
   * Whether the operation completed successfully.
   *
   * @return true when the operation completed and {@link #team()} is non-null
   */
  public boolean success() {
    return team != null && errorMessage == null;
  }
}
