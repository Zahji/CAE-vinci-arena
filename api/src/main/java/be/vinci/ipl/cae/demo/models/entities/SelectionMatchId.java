package be.vinci.ipl.cae.demo.models.entities;

import java.util.Objects;

/**
 * Composite primary key for SelectionMatch.
 */
public class SelectionMatchId {

  private Long match;
  private Long team;
  private Long member;

  /** Constructor. */
  //CPD-OFF
  public SelectionMatchId() {
    // Required by JPA
  }

  /**
   * Constructs a composite primary key with the given match, team and member ids.
   *
   * @param match  the match id
   * @param team   the team id
   * @param member the member id
   */
  public SelectionMatchId(Long match, Long team, Long member) {
    this.match = match;
    this.team = team;
    this.member = member;
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

  public Long getMember() {
    return member;
  }

  public void setMember(Long member) {
    this.member = member;
  }
  //CPD-ON

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof SelectionMatchId that)) {
      return false;
    }
    return Objects.equals(match, that.match)
        && Objects.equals(team, that.team)
        && Objects.equals(member, that.member);
  }

  @Override
  public int hashCode() {
    return Objects.hash(match, team, member);
  }
}
