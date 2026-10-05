package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Team;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Team repository.
 */
@Repository
public interface TeamRepository extends CrudRepository<Team, Long> {

  /**
   * Finds a team by its name (case-insensitive).
   *
   * @param name the name of the team
   * @return optional containing the team if found
   */
  Optional<Team> findByNameIgnoreCase(String name);
}