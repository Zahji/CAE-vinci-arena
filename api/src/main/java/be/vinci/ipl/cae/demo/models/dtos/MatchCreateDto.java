package be.vinci.ipl.cae.demo.models.dtos;

import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

/**
 * Match create Dto for creating a specific match (not used).
 */
public class MatchCreateDto {

  @NotNull(message = "Start time is required")
  @FutureOrPresent(message = "Start time cannot be in the past")
  private LocalDateTime startTime;

  @NotNull(message = "Round number is required")
  @Positive(message = "Round must be positive")
  private Long round;

  @NotNull(message = "Status is required")
  private StateMatch state;

  private Long tournamentId;

  @NotNull(message = "Admin user ID is required")
  private Long adminId;

  // CPD-OFF
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

  public Long getTournamentId() {
    return tournamentId;
  }

  public void setTournamentId(Long tournamentId) {
    this.tournamentId = tournamentId;
  }

  public Long getAdminId() {
    return adminId;
  }

  public void setAdminId(Long adminId) {
    this.adminId = adminId;
  }
  // CPD-ON
}
