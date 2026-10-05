package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.MatchCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.MatchDto;
import be.vinci.ipl.cae.demo.models.dtos.MatchGenerateRequestDto;
import be.vinci.ipl.cae.demo.models.dtos.ParticipationMatchDto;
import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.services.MatchService;
import be.vinci.ipl.cae.demo.services.ParticipationMatchService;
import jakarta.validation.Valid;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * RestController for /matches/ and /matches.
 *
 */
@RestController
@RequestMapping("/tournaments/{tournamentId}/matches")
public class MatchController {

  private final MatchService matchService;
  private final ParticipationMatchService participationMatchService;

  /**
   * Constructor for Match Controller.
   *
   * @param matchService Match service
   */
  public MatchController(MatchService matchService,
      ParticipationMatchService participationMatchService) {
    this.matchService = matchService;
    this.participationMatchService = participationMatchService;
  }

  /**
   * Get all matches for a specific tournament.
   */
  @GetMapping
  public List<MatchDto> getMatchesByTournament(@PathVariable Long tournamentId) {
    Iterable<Match> matches = matchService.getMatchForTournament(tournamentId);
    return StreamSupport.stream(matches.spliterator(), false)
        .map(this::convertToDto)
        .collect(Collectors.toList());
  }

  /**
   * Get a single match by its ID.
   */
  @GetMapping("/{matchId}")
  public MatchDto getMatch(@PathVariable Long tournamentId,
      @PathVariable Long matchId) {
    Match match = matchService.getMatchById(matchId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    // Verify the match actually belongs to this tournament
    if (!match.getTournament().getId().equals(tournamentId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    return convertToDto(match);
  }

  /**
   * Create a new match under a tournament.
   */
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public MatchDto createMatch(@PathVariable Long tournamentId,
      @Valid @RequestBody MatchCreateDto dto) {
    // Enforce the tournamentId from the path, not the body
    dto.setTournamentId(tournamentId);

    Match match = matchService.buildMatch(dto)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Invalid tournament or admin ID"));

    return convertToDto(matchService.saveMatch(match));
  }

  /**
   * Update match state.
   * Valid transitions: PLANIFIED → ONGOING → ENDED
   *                               ↘ CONTESTED → ENDED
   */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{matchId}/state")
  public MatchDto updateMatchState(@PathVariable Long tournamentId,
      @PathVariable Long matchId,
      @RequestParam StateMatch newState) {

    // CPD-OFF
    Match match = matchService.getMatchById(matchId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    // CPD-ON

    if (!match.getTournament().getId().equals(tournamentId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    Match updated = matchService.updateMatchState(match, newState)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Invalid state transition from " + match.getState() + " to " + newState));

    return convertToDto(updated);
  }

  /**
   * Generate elimination bracket for a tournament.
   */
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/generate")
  @ResponseStatus(HttpStatus.CREATED)
  public List<MatchDto> generateMatches(@PathVariable Long tournamentId,
      @Valid @RequestBody MatchGenerateRequestDto dto,
      @AuthenticationPrincipal User user) {

    int minutesBetweenRounds = dto.getHoursBetweenRounds() * 60;

    String errorMessage =
        "Tournament must be in PLANIFIED state, generation allowed only "
        + "after inscription end date or when tournament is full, with at least 2 teams, "
            + "and no existing matches";

    List<Match> matches = matchService.generateEliminationBracket(
          tournamentId,
          user,
          dto.getStartDate(),
          minutesBetweenRounds
    ).orElseThrow(() -> new ResponseStatusException(
          HttpStatus.CONFLICT, errorMessage
    ));

    return matches.stream()
        .map(this::convertToDto)
        .collect(Collectors.toList());
  }

  private MatchDto convertToDto(Match match) {
    MatchDto dto = new MatchDto();
    dto.setMatchId(match.getMatchId());
    dto.setStartTime(match.getStartTime());
    dto.setRound(match.getRound());
    if (match.getTournament() != null) {
      dto.setTournamentId(match.getTournament().getId());
      dto.setTournamentName(match.getTournament().getName());
      Iterable<Match> allMatches =
          matchService.getMatchForTournament(match.getTournament().getId());
      long totalRounds = StreamSupport.stream(allMatches.spliterator(), false)
          .mapToLong(Match::getRound)
          .max()
          .orElse(1L);
      dto.setTotalRounds(totalRounds);
    }
    dto.setState(match.getState());
    if (match.getAdmin() != null) {
      dto.setAdminId(match.getAdmin().getId());
    }

    List<ParticipationMatchDto> participations = participationMatchService
        .getParticipationsByMatch(match.getMatchId())
        .stream()
        .sorted(Comparator.comparing(ParticipationMatchDto::getTeamId,
            Comparator.nullsLast(Long::compareTo)))
        .toList();

    dto.setScoreUpdatedAt(match.getScoreUpdatedAt());
    if (participations.size() == 1) {
      dto.setByeTeamId(participations.getFirst().getTeamId());
    } else if (participations.size() >= 2) {
      ParticipationMatchDto team1 = participations.get(0);
      ParticipationMatchDto team2 = participations.get(1);
      dto.setTeam1Id(team1.getTeamId());
      dto.setTeam1Name(team1.getTeamName());
      dto.setTeam1Score(toLong(team1.getScore()));
      dto.setTeam2Id(team2.getTeamId());
      dto.setTeam2Name(team2.getTeamName());
      dto.setTeam2Score(toLong(team2.getScore()));
      dto.setTeam1MotifRefuse(team1.getMotifRefuse());
      dto.setTeam2MotifRefuse(team2.getMotifRefuse());
      dto.setTeam1Forfeit(Boolean.TRUE.equals(team1.getDeclaredForfeit()));
      dto.setTeam2Forfeit(Boolean.TRUE.equals(team2.getDeclaredForfeit()));
    }
    return dto;
  }

  private Long toLong(Integer score) {
    return score == null ? null : score.longValue();
  }
}