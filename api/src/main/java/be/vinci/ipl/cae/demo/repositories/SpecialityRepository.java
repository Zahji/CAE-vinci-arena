package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Speciality;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Speciality repository.
 */
@Repository
public interface SpecialityRepository extends CrudRepository<Speciality, Long> {

  /**
   * Find a speciality by its name.
   *
   * @param name the speciality name
   * @return the speciality
   */
  Speciality findByName(String name);

  /**
   * Read all speciality names.
   *
   * @return speciality names ordered by id
   */
  @Query("SELECT s.name FROM Speciality s ORDER BY s.id")
  List<String> findAllNames();
}
