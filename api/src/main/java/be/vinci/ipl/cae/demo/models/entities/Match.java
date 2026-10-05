package be.vinci.ipl.cae.demo.models.entities;


import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Represents a match with teams and resultat.
 */
@Entity
@Table(name = "matches")
public class Match {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "match_id")
  private Long matchId;

  @Column(name = "start_time")
  private LocalDateTime startTime;

  @Column(nullable = false)
  @NotNull
  private Long round;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 100)
  @NotNull
  private StateMatch state;

  @ManyToOne
  @JoinColumn(name = "tournament_id", nullable = false)
  private Tournament tournament;

  @ManyToOne
  @JoinColumn(name = "administrateur_id", nullable = false)
  private User admin;

  @Column(nullable = true)
  private LocalDateTime scoreUpdatedAt;

  public Long getMatchId() {
    return matchId;
  }

  public void setMatchId(Long matchId) {
    this.matchId = matchId;
  }

  public LocalDateTime getStartTime() {
    return startTime;
  }

  public void setStartTime(LocalDateTime startTime) {
    this.startTime = startTime;
  }

  public Long getRound() {
    return round;
  }

  public void setRound(Long round) {
    this.round = round;
  }

  public StateMatch getState() {
    return state;
  }

  public void setState(StateMatch state) {
    this.state = state;
  }

  public Tournament getTournament() {
    return tournament;
  }

  public void setTournament(Tournament tournament) {
    this.tournament = tournament;
  }

  public User getAdmin() {
    return admin;
  }

  public void setAdmin(User admin) {
    this.admin = admin;
  }

  public LocalDateTime getScoreUpdatedAt() {
    return scoreUpdatedAt;
  }

  public void setScoreUpdatedAt(LocalDateTime scoreUpdatedAt) {
    this.scoreUpdatedAt = scoreUpdatedAt;
  }
}
