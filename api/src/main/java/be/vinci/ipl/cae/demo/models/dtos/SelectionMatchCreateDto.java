package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.NotNull;

/**
 * DTO for creating a selection for a match.
 */
public class SelectionMatchCreateDto {

  @NotNull(message = "Member ID is required")
  private Long memberId;

  public Long getMemberId() {
    return memberId;
  }

  public void setMemberId(Long memberId) {
    this.memberId = memberId;
  }
}
