package be.vinci.ipl.cae.demo.models.dtos;

import be.vinci.ipl.cae.demo.models.enums.StateMatch;

/**
 * DTO representing a match activity for a member.
 *
 * @param tournamentId   the tournament id
 * @param tournamentName the tournament name
 * @param round          the round number
 * @param matchId        the match id
 * @param team1Id        the first team id
 * @param team1Name      the first team name
 * @param team2Id        the second team id
 * @param team2Name      the second team name
 * @param winnerTeamId   the id of the winning team (null if not finished)
 * @param state          the match state
 */
public record MemberActivityDto(
    Long tournamentId,
    String tournamentName,
    Long round,
    Long totalRounds,
    Long matchId,
    Long selectedTeamId,
    Long team1Id,
    String team1Name,
    Long team2Id,
    String team2Name,
    Long winnerTeamId,
    StateMatch state
) {}