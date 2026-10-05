package be.vinci.ipl.cae.demo.models.entities;

import java.util.Objects;

/**
 * Composite primary key for TournamentRegistration.
 */
public class TournamentRegistrationId {

  private Long tournament;
  private Long team;

  /** Constructor. */
  public TournamentRegistrationId() {
    // Required by JPA
  }

  /**
   * Constructs a composite primary key with the given tournament and team ids.
   *
   * @param tournament the tournament id
   * @param team the team id
   */
  public TournamentRegistrationId(Long tournament, Long team) {
    this.tournament = tournament;
    this.team = team;
  }

  public Long getTournament() {
    return tournament;
  }

  public void setTournament(Long tournament) {
    this.tournament = tournament;
  }

  public Long getTeam() {
    return team;
  }

  public void setTeam(Long team) {
    this.team = team;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof TournamentRegistrationId that)) {
      return false;
    }
    return Objects.equals(tournament, that.tournament) && Objects.equals(team, that.team);
  }

  @Override
  public int hashCode() {
    return Objects.hash(tournament, team);
  }
}
