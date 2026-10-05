package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * User repository.
 */
@Repository
public interface UserRepository extends CrudRepository<User, Long> {

  /**
   * Find a user by its email.
   *
   * @param email the email
   * @return the user
   */
  User findByEmail(String email);

  /**
   * Finds all admin users.
   *
   * @return all admin users
   */
  Iterable<User> findAllByIsAdminTrue();

  /**
   * Checks if a user with the given tag already exists in the specified team.
   *
   * @param team the team to check
   * @param tag the tag to check for uniqueness
   * @return true if a user with the given tag exists in the team, false otherwise
   */
  boolean existsByTeamAndTag(Team team, String tag);

  /**
   * Finds all non-admin users.
   *
   * @return all non-admin users
   */
  Iterable<User> findAllByIsAdminFalse();

  /**
   * Counts all admin users.
   *
   * @return the number of admin users
   */
  long countByIsAdminTrue();

  /**
   * Find the oldest non-banned member of a team excluding a specific user.
   *
   * @param team the team
   * @param excludedId the user ID to exclude
   * @return the oldest matching user or null
   */
  User findFirstByTeamAndIsBannedFalseAndIdNotOrderByDateAsc(Team team, Long excludedId);

  /**
   * Find all users with the given tag (case-insensitive).
   *
   * @param tag the player tag
   * @return list of matching users
   */
  List<User> findByTagIgnoreCase(String tag);
}

