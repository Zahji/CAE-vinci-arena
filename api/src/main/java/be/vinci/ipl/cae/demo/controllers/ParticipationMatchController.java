package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.ParticipationMatchCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.ParticipationMatchDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.services.ParticipationMatchService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
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
 * Rest Control for /participations.
 */
@RestController
@RequestMapping("/tournaments/{tournamentId}/matches/{matchId}/participations")
public class ParticipationMatchController {

  private final ParticipationMatchService participationService;
  private final TeamRepository teamRepository;
  private final TournamentRepository tournamentRepository;
  private final TournamentRegistrationRepository tournamentRegistrationRepository;

  /**
   * Controller for Participation Controller.
   *
   * @param participationService participation Service
   * @param teamRepository team Repository
   * @param tournamentRepository tournament Repository
   * @param tournamentRegistrationRepository tournament registration Repository
   */
  public ParticipationMatchController(ParticipationMatchService participationService,
      TeamRepository teamRepository,
      TournamentRepository tournamentRepository,
      TournamentRegistrationRepository tournamentRegistrationRepository) {
    this.participationService = participationService;
    this.teamRepository = teamRepository;
    this.tournamentRepository = tournamentRepository;
    this.tournamentRegistrationRepository = tournamentRegistrationRepository;
  }

  /**
   * Get all participations for a match.
   */
  @GetMapping
  public List<ParticipationMatchDto> getParticipationsByMatch(@PathVariable Long matchId) {
    return participationService.getParticipationsByMatch(matchId);
  }

  /**
   * Get single participation.
   */
  @GetMapping("/{teamId}")
  public ParticipationMatchDto getParticipation(@PathVariable Long matchId,
      @PathVariable Long teamId) {
    return participationService.getParticipation(matchId, teamId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  /**
   * Create participation (team registers for match).
   * Admin only.
   */
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ParticipationMatchDto createParticipation(@PathVariable Long matchId,
      @Valid @RequestBody ParticipationMatchCreateDto dto) {

    // Override matchId from path to ensure consistency
    dto.setMatchId(matchId);

    return participationService.createParticipation(dto)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Team already registered or invalid IDs"));
  }

  /**
   * Update score.
   * Admin only. Forbidden if the admin's team is registered in the tournament.
   */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{teamId}/score")
  public ParticipationMatchDto updateScore(@PathVariable Long tournamentId,
      @PathVariable Long matchId,
      @PathVariable Long teamId,
      @RequestParam Integer score,
      @AuthenticationPrincipal User user) {

    Team adminTeam = user.getTeam();
    if (adminTeam != null) {
      Tournament tournament = tournamentRepository.findById(tournamentId)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
      if (tournamentRegistrationRepository.existsByTournamentAndTeam(tournament, adminTeam)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Admin cannot encode score when their team is registered in the tournament");
      }
    }

    return participationService.updateScore(matchId, teamId, score)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Match not ongoing/contested or participation not found"));
  }

  /**
   * Contest score.
   * Only team responsibles can contest.
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/{teamId}/contest")
  public ParticipationMatchDto contestScore(@PathVariable Long matchId,
      @PathVariable Long teamId,
      @RequestParam String reason,
      @AuthenticationPrincipal User user) {

    if (!isTeamResponsible(user, teamId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Only team responsibles can contest score");
    }

    return participationService.contestScore(matchId, teamId, reason)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Already contested or participation not found"));
  }

  /**
   * Check if user is team responsible (responsable1 or responsable2).
   */
  private boolean isTeamResponsible(User user, Long teamId) {
    Optional<Team> teamOpt = teamRepository.findById(teamId);
    if (teamOpt.isEmpty()) {
      return false;
    }

    Team team = teamOpt.get();
    Long userId = user.getId();

    return (team.getManager() != null && userId.equals(team.getManager().getId()))
        || (team.getSecondManager() != null && userId.equals(team.getSecondManager().getId()));
  }

  /**
   * Declare forfeit.
   */
  @PreAuthorize("isAuthenticated()")
  @PatchMapping("/{teamId}/forfeit")
  public ParticipationMatchDto declareForfeit(@PathVariable Long matchId,
      @PathVariable Long teamId,
      @RequestParam boolean forfeit,
      @AuthenticationPrincipal User user) {

    if (!isTeamResponsible(user, teamId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Only Team responsible can declare forfeit");
    }

    return participationService.declareForfeit(matchId, teamId, forfeit)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }
}