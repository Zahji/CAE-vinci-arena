package be.vinci.ipl.cae.demo.models.entities;

import java.io.Serializable;
import java.util.Objects;

/**
 * Represents Participation Match ID how it is created.
 */
public class ParticipationMatchId implements Serializable {

  private Long match;
  private Long team;

  /**
   * Empty constructor for creation participation match id.
   */
  public ParticipationMatchId() {
    //needed
  }

  /**
   * Contructor for creation participation match id.
   *
   * @param match match id
   * @param team team id
   */
  public ParticipationMatchId(Long match, Long team) {
    this.match = match;
    this.team = team;
  }

  public Long getMatch() {
    return match;
  }

  public void setMatch(Long match) {
    this.match = match;
  }

  public Long getTeam() {
    return team;
  }

  public void setTeam(Long team) {
    this.team = team;
  }

  //CPD-OFF
  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ParticipationMatchId that = (ParticipationMatchId) o;
    return Objects.equals(match, that.match) && Objects.equals(team, that.team);
  }
  //CPD-ON

  @Override
  public int hashCode() {
    return Objects.hash(match, team);
  }
}