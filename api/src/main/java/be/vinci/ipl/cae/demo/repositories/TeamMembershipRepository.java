package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing team memberships.
 */
@Repository
public interface TeamMembershipRepository extends CrudRepository<TeamMembership, Long> {

  /**
   * Find all memberships of a given team.
   *
   * @param team the team
   * @return list of memberships
   */
  List<TeamMembership> findByTeam(Team team);

  /**
   * Find the membership of a specific member.
   *
   * @param member the member
   * @return optional membership (a member can only belong to one team)
   */
  Optional<TeamMembership> findByMember(User member);

  /**
   * Find a membership by team and member.
   *
   * @param team the team
   * @param member the member
   * @return optional membership
   */
  Optional<TeamMembership> findByTeamAndMember(Team team, User member);

  /**
   * Find the member and its membership status.
   *
   * @param member the member
   * @param status the status
   * @return the matching TeamMembership if found, empty otherwise
   */
  Optional<TeamMembership> findByMemberAndStatus(User member, MembershipStatus status);

  /**
   * Find all memberships of a team with the given status.
   *
   * @param team the team
   * @param status the membership status (PENDING, ACCEPTED, REFUSED)
   * @return list of memberships with the specified status
   */
  List<TeamMembership> findByTeamAndStatus(Team team, MembershipStatus status);
}