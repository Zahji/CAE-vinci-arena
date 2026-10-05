package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.ProfilePicture;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Profile picture repository.
 */
@Repository
public interface ProfilePictureRepository extends CrudRepository<ProfilePicture, Long> {

  /**
   * Find a profile picture by its URL.
   *
   * @param url the profile picture URL
   * @return the profile picture
   */
  ProfilePicture findByUrl(String url);

  /**
   * Read all profile picture URLs.
   *
   * @return profile picture URLs ordered by id
   */
  @Query("SELECT p.url FROM ProfilePicture p ORDER BY p.id")
  List<String> findAllUrls();
}