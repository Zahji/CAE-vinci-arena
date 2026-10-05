package be.vinci.ipl.cae.demo.models.dtos;

import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import java.time.LocalDateTime;

/**
 * Match Dto.
 */
public class MatchDto {
  private Long matchId;
  private LocalDateTime startTime;
  private Long round;
  private Long totalRounds;
  private StateMatch state;
  private Long tournamentId;
  private Long adminId;
  private Long team1Id;
  private Long team2Id;
  private Long byeTeamId;
  private String tournamentName;
  private String team1Name;
  private String team2Name;
  private Long team1Score;
  private Long team2Score;
  private LocalDateTime scoreUpdatedAt;
  private String team1MotifRefuse;
  private String team2MotifRefuse;
  private boolean team1Forfeit;
  private boolean team2Forfeit;
  
  /**
   * empty contructor.
   */
  public MatchDto() {
    //Jackson need this to create an empty object MatchDto that we will fulfill
  }

  /**
   * full constructor.
   *
   * @param matchId ID of a match
   * @param startTime time at which match starts
   * @param round what round it is
   * @param state what state it is
   * @param tournamentId ID of the tournament
   * @param adminId ID of the admin that manages the match
   */
  public MatchDto(Long matchId, LocalDateTime startTime, Long round,
      StateMatch state, Long tournamentId, Long adminId) {
    this.matchId = matchId;
    this.startTime = startTime;
    this.round = round;
    this.state = state;
    this.tournamentId = tournamentId;
    this.adminId = adminId;
  }

  // CPD-OFF
  public Long getMatchId() {
    return matchId;
  }

  public void setMatchId(Long matchId) {
    this.matchId = matchId;
  }

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

  public Long getTotalRounds() {
    return totalRounds;
  }

  public void setTotalRounds(Long totalRounds) {
    this.totalRounds = totalRounds;
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

  public Long getTeam1Id() {
    return team1Id;
  }

  public void setTeam1Id(Long team1Id) {
    this.team1Id = team1Id;
  }

  public Long getTeam2Id() {
    return team2Id;
  }

  public void setTeam2Id(Long team2Id) {
    this.team2Id = team2Id;
  }

  public Long getByeTeamId() {
    return byeTeamId;
  }

  public void setByeTeamId(Long byeTeamId) {
    this.byeTeamId = byeTeamId;
  }

  public String getTeam1Name() {
    return team1Name;
  }

  public void setTeam1Name(String team1Name) {
    this.team1Name = team1Name;
  }

  public String getTeam2Name() {
    return team2Name;
  }

  public void setTeam2Name(String team2Name) {
    this.team2Name = team2Name;
  }

  public Long getTeam1Score() {
    return team1Score;
  }

  public void setTeam1Score(Long team1Score) {
    this.team1Score = team1Score;
  }

  public Long getTeam2Score() {
    return team2Score;
  }

  public void setTeam2Score(Long team2Score) {
    this.team2Score = team2Score;
  }

  public LocalDateTime getScoreUpdatedAt() {
    return scoreUpdatedAt;
  }

  public void setScoreUpdatedAt(LocalDateTime scoreUpdatedAt) {
    this.scoreUpdatedAt = scoreUpdatedAt;
  }

  public String getTournamentName() {
    return tournamentName;
  }

  public void setTournamentName(String tournamentName) {
    this.tournamentName = tournamentName;
  }

  public String getTeam1MotifRefuse() {
    return team1MotifRefuse;
  }

  public void setTeam1MotifRefuse(String team1MotifRefuse) {
    this.team1MotifRefuse = team1MotifRefuse;
  }

  public String getTeam2MotifRefuse() {
    return team2MotifRefuse;
  }

  public void setTeam2MotifRefuse(String team2MotifRefuse) {
    this.team2MotifRefuse = team2MotifRefuse;
  }

  public boolean isTeam1Forfeit() {
    return team1Forfeit;
  }

  public void setTeam1Forfeit(boolean team1Forfeit) {
    this.team1Forfeit = team1Forfeit;
  }

  public boolean isTeam2Forfeit() {
    return team2Forfeit;
  }

  public void setTeam2Forfeit(boolean team2Forfeit) {
    this.team2Forfeit = team2Forfeit;
  }

  // CPD-ON
}