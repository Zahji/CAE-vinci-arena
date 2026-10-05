package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Unavailability;
import be.vinci.ipl.cae.demo.models.entities.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing unavailabilities.
 */
@Repository
public interface UnavailabilityRepository extends CrudRepository<Unavailability, Long> {

  /**
   * Finds all unavailabilities for a given user.
   *
   * @param user the user
   * @return the list of unavailabilities
   */
  Iterable<Unavailability> findByUser(User user);
}