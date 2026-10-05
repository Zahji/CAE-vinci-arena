package be.vinci.ipl.cae.demo.models.dtos;

/**
 * DTO representing a member's selection for a match.
 */
public record SelectionMatchDto(
    Long matchId,
    Long teamId,
    Long memberId,
    String memberTag,
    String memberSpeciality
) {}
