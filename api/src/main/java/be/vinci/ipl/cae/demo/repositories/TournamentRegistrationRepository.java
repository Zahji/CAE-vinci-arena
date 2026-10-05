package be.vinci.ipl.cae.demo.repositories;

import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistration;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistrationId;
import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing tournament registrations.
 */
@Repository
public interface TournamentRegistrationRepository
    extends CrudRepository<TournamentRegistration, TournamentRegistrationId> {

  /**
   * Find all registrations for a given tournament.
   *
   * @param tournament the tournament
   * @return list of registrations
   */
  List<TournamentRegistration> findByTournament(Tournament tournament);

  /**
   * Check if a team is already registered for a tournament.
   *
   * @param tournament the tournament
   * @param team the team
   * @return true if already registered
   */
  boolean existsByTournamentAndTeam(Tournament tournament, Team team);

  /**
   * Count registrations for a given tournament.
   *
   * @param tournament the tournament
   * @return number of registered teams
   */
  int countByTournament(Tournament tournament);

  /**
   * Find all registrations for a given team.
   *
   * @param team the team
   * @return list of registrations
   */
  List<TournamentRegistration> findByTeam(Team team);

  /**
   * Delete all registrations for a given team.
   *
   * @param team the team
   */
  void deleteByTeam(Team team);

  /**
   * Find all registrations where the team has the given name (case-insensitive).
   *
   * @param teamName the team name
   * @return list of registrations
   */
  List<TournamentRegistration> findByTeamNameIgnoreCase(String teamName);
}
