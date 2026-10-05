package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDate;

/**
 * DTO representing a tournament in which a team participates (past, ongoing, or future).
 */
public record TeamActivityDto(
    Long tournamentId,
    String tournamentName,
    LocalDate startDate,
    LocalDate endDate
) {}
