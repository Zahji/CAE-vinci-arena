package be.vinci.ipl.cae.demo.utils;

import be.vinci.ipl.cae.demo.models.entities.User;

/**
 * Utility class for common entity comparisons.
 */
public final class EntityUtils {

  private EntityUtils() {
  }

  /**
   * Checks if two users are the same by ID.
   *
   * @param firstUser the first user
   * @param secondUser the second user
   * @return true if both users share the same ID
   */
  public static boolean sameUser(User firstUser, User secondUser) {
    return firstUser != null
        && secondUser != null
        && firstUser.getId() != null
        && firstUser.getId().equals(secondUser.getId());
  }
}
