package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

/**
 * Match Dto for multiple matches.
 */
public class MatchGenerateRequestDto {
  @NotNull(message = "Start date is required")
  @FutureOrPresent(message = "Start date cannot be in the past")
  private LocalDateTime startDate;

  @NotNull(message = "Hours between rounds is required")
  @Positive(message = "Hours must be positive")
  private Integer hoursBetweenRounds;

  // CPD-OFF
  public LocalDateTime getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDateTime startDate) {
    this.startDate = startDate;
  }

  public Integer getHoursBetweenRounds() {
    return hoursBetweenRounds;
  }

  public void setHoursBetweenRounds(Integer hoursBetweenRounds) {
    this.hoursBetweenRounds = hoursBetweenRounds;
  }
  // CPD-ON
}
