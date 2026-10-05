package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

/**
 * Represents a past membership of a user in a team.
 */
@Entity
@Table(name = "membership_history")
public class MembershipHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "member_id", nullable = false)
  private User member;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "team_id", nullable = false)
  private Team team;

  @Column(nullable = false)
  private LocalDate leftAt;

  //CPD-OFF
  public Long getId() {
    return id;
  }

  public User getMember() {
    return member;
  }

  public Team getTeam() {
    return team;
  }

  public LocalDate getLeftAt() {
    return leftAt;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setMember(User member) {
    this.member = member;
  }

  public void setTeam(Team team) {
    this.team = team;
  }

  public void setLeftAt(LocalDate leftAt) {
    this.leftAt = leftAt;
  }
  //CPD-ON
}