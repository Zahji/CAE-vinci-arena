package be.vinci.ipl.cae.demo.models.dtos;

/**
 * DTO representing a tournament registration (team enrolled in a tournament).
 */
public record TournamentRegistrationDto(
    Long tournamentId,
    String tournamentName,
    Long teamId,
    String teamName
) {}
