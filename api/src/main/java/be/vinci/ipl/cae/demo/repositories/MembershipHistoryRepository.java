package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.MembershipHistory;
import be.vinci.ipl.cae.demo.models.entities.User;
import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for membership history.
 */
@Repository
public interface MembershipHistoryRepository extends CrudRepository<MembershipHistory, Long> {

  /**
   * Find all past memberships of a given user.
   *
   * @param member the user
   * @return list of past memberships
   */
  List<MembershipHistory> findByMember(User member);
}