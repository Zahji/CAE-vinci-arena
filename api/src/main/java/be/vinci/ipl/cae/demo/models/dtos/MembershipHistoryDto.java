package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDate;

/**
 * DTO for a past team membership.
 *
 * @param teamId   the team id
 * @param teamName the team name
 * @param leftAt   the date the user left the team
 */
public record MembershipHistoryDto(
    Long teamId,
    String teamName,
    LocalDate leftAt
) {}