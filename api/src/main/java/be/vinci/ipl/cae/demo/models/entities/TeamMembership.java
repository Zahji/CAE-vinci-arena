package be.vinci.ipl.cae.demo.models.entities;

import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Represents a user's membership in a team.
 */
@Entity
@Table(name = "teams_memberships")
public class TeamMembership {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "member_id", nullable = false)
  @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
  private User member;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "team_id", nullable = false)
  @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
  private Team team;

  @Column(nullable = true)
  private String rejectionReason;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MembershipStatus status = MembershipStatus.PENDING;

  public Long getId() {
    return id;
  }

  public User getMember() {
    return member;
  }

  public Team getTeam() {
    return team;
  }

  public String getRejectionReason() {
    return rejectionReason;
  }

  public MembershipStatus getStatus() {
    return status;
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

  public void setRejectionReason(String rejectionReason) {
    this.rejectionReason = rejectionReason;
  }

  public void setStatus(MembershipStatus status) {
    this.status = status;
  }
}
