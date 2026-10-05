package be.vinci.ipl.cae.demo.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Represent participating team in a selected match.
 */
@Entity
@Table(name = "participations_match")
@IdClass(ParticipationMatchId.class)
public class ParticipationMatch {

  @Id
  @ManyToOne
  @JoinColumn(name = "match_id", nullable = false)
  @NotNull
  private Match match;

  @Id
  @ManyToOne
  @JoinColumn(name = "team_id", nullable = false)
  @NotNull
  private Team team;

  @Column(name = "declared_forfait", nullable = false)
  @NotNull
  private Boolean declaredForfeit = false;

  @Column(name = "score")
  private Integer score;

  @Column(name = "status_selection", nullable = false)
  @NotNull
  @Min(0)
  @Max(4)
  private Integer statusSelection;

  @Column(name = "motif_refuse", length = 500)
  private String motifRefuse;

  public Match getMatch() {
    return match;
  }

  public void setMatch(Match match) {
    this.match = match;
  }

  public Team getTeam() {
    return team;
  }

  public void setTeam(Team team) {
    this.team = team;
  }

  public Boolean getDeclaredForfeit() {
    return declaredForfeit;
  }

  public void setDeclaredForfeit(Boolean declaredForfeit) {
    this.declaredForfeit = declaredForfeit;
  }

  public Integer getScore() {
    return score;
  }

  public void setScore(Integer score) {
    this.score = score;
  }

  public Integer getStatusSelection() {
    return statusSelection;
  }

  public void setStatusSelection(Integer statusSelection) {
    this.statusSelection = statusSelection;
  }

  public String getMotifRefuse() {
    return motifRefuse;
  }

  public void setMotifRefuse(String motifRefuse) {
    this.motifRefuse = motifRefuse;
  }
}
