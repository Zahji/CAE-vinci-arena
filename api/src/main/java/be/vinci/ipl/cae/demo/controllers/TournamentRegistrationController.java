package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.TournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.results.TournamentRegistrationResult;
import be.vinci.ipl.cae.demo.services.TeamService;
import be.vinci.ipl.cae.demo.services.TournamentRegistrationService;
import be.vinci.ipl.cae.demo.services.TournamentService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller to handle tournament registrations.
 */
@RestController
@RequestMapping("/tournaments")
public class TournamentRegistrationController {

  private final TournamentRegistrationService tournamentRegistrationService;
  private final TournamentService tournamentService;
  private final TeamService teamService;

  /**
   * Constructor for dependency injection.
   *
   * @param tournamentRegistrationService the registration service
   * @param tournamentService the tournament service
   * @param teamService the team service
   */
  public TournamentRegistrationController(
      TournamentRegistrationService tournamentRegistrationService,
      TournamentService tournamentService,
      TeamService teamService
  ) {
    this.tournamentRegistrationService = tournamentRegistrationService;
    this.tournamentService = tournamentService;
    this.teamService = teamService;
  }

  /**
   * Register the team of the authenticated manager to a tournament.
   *
   * @param authentication the authenticated manager
   * @param tournamentId the tournament id
   * @return the created registration DTO
   */
  @PreAuthorize("isAuthenticated()")
  @PostMapping("/{tournamentId}/registrations")
  @ResponseStatus(HttpStatus.CREATED)
  public TournamentRegistrationDto registerTeam(
      Authentication authentication,
      @PathVariable Long tournamentId
  ) {
    User user = (User) authentication.getPrincipal();
    TournamentRegistrationResult result = tournamentRegistrationService.registerTeam(
        getTournamentOrThrow(tournamentId), getUserTeamOrThrow(user), user);
    if (!result.success()) {
      if (result.conflict()) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, result.errorMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, result.errorMessage());
    }
    return result.registration();
  }

  /**
   * Get all teams registered to a tournament.
   *
   * @param tournamentId the tournament id
   * @return list of registration DTOs
   */
  @GetMapping("/{tournamentId}/registrations")
  public List<TournamentRegistrationDto> getRegistrations(@PathVariable Long tournamentId) {
    return tournamentRegistrationService.getRegistrations(getTournamentOrThrow(tournamentId));
  }

  private Tournament getTournamentOrThrow(Long tournamentId) {
    return tournamentService.getTournamentEntityById(tournamentId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournoi non trouvé"));
  }

  private Team getUserTeamOrThrow(User user) {
    if (user.getTeam() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Vous n'appartenez à aucune team");
    }
    return teamService.getTeamById(user.getTeam().getId())
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team non trouvée"));
  }
}
