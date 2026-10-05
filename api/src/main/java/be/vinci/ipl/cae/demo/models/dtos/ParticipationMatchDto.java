package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * represents ParticipationMatch DTO.
 */
public class ParticipationMatchDto {

  private Long matchId;
  private Long teamId;
  private String teamName;
  private Boolean declaredForfeit;
  private Integer score;

  @Min(0)
  @Max(4)
  private Integer statusSelection;

  private String motifRefuse;

  // CPD-OFF
  public Long getMatchId() {
    return matchId;
  }

  public void setMatchId(Long matchId) {
    this.matchId = matchId;
  }

  public Long getTeamId() {
    return teamId;
  }

  public void setTeamId(Long teamId) {
    this.teamId = teamId;
  }

  public String getTeamName() {
    return teamName;
  }

  public void setTeamName(String teamName) {
    this.teamName = teamName;
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
  // CPD-ON
}