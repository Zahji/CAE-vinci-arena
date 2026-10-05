package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.SelectionMatch;
import be.vinci.ipl.cae.demo.models.entities.SelectionMatchId;
import be.vinci.ipl.cae.demo.models.entities.User;
import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing match selections.
 */
@Repository
public interface SelectionMatchRepository
    extends CrudRepository<SelectionMatch, SelectionMatchId> {

  /**
   * Find all selections for a given match and team.
   *
   * @param matchId the match id
   * @param teamId  the team id
   * @return list of selections
   */
  List<SelectionMatch> findByMatchMatchIdAndTeamId(Long matchId, Long teamId);

  /**
   * Find all selections for a given member.
   *
   * @param member the member
   * @return list of selections
   */
  List<SelectionMatch> findByMember(User member);

  /**
   * Count selections for a given match and team.
   *
   * @param matchId the match id
   * @param teamId  the team id
   * @return number of selections
   */
  int countByMatchMatchIdAndTeamId(Long matchId, Long teamId);

  /**
   * Check if a member is already selected for a given match and team.
   *
   * @param matchId  the match id
   * @param teamId   the team id
   * @param memberId the member id
   * @return true if already selected
   */
  boolean existsByMatchMatchIdAndTeamIdAndMemberId(Long matchId, Long teamId, Long memberId);

  /**
   * Delete a selection for a given match, team and member.
   *
   * @param matchId  the match id
   * @param teamId   the team id
   * @param memberId the member id
   */
  void deleteByMatchMatchIdAndTeamIdAndMemberId(Long matchId, Long teamId, Long memberId);
}
