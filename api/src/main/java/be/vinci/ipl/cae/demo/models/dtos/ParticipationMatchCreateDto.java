package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Represents participation match dto, when we create a new participant.
 */
public class ParticipationMatchCreateDto {

  private Long matchId;

  @NotNull(message = "Team ID is required")
  private Long teamId;

  @NotNull(message = "Status selection is required")
  @Min(0)
  @Max(4)
  private Integer statusSelection;

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

  public Integer getStatusSelection() {
    return statusSelection;
  }

  public void setStatusSelection(Integer statusSelection) {
    this.statusSelection = statusSelection;
  }
  // CPD-ON
}