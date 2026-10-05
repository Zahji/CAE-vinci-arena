package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.TournamentDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.services.TournamentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller to handle Tournaments.
 */
@RestController
@RequestMapping("/tournaments")
public class TournamentController {

  private final TournamentService tournamentService;

  /**
   * Constructs the tournament controller.
   *
   * @param tournamentService the tournament service
   */
  public TournamentController(TournamentService tournamentService) {
    this.tournamentService = tournamentService;
  }

  /**
   * Returns every tournament, with optional filters.
   *
   * @param state the optional tournament state filter
   * @param teamName the optional team name filter
   * @param playerTag the optional player tag filter
   * @param authentication the optional authentication (null for unauthenticated users)
   * @return the list of tournaments
   */
  @GetMapping({"", "/"})
  public List<TournamentDto> getAllTournaments(
      @RequestParam(required = false) State state,
      @RequestParam(required = false) String teamName,
      @RequestParam(required = false) String playerTag,
      Authentication authentication
  ) {
    boolean isAdmin = authentication != null
        && authentication.getPrincipal() instanceof User u
        && u.isAdmin();
    if (!isAdmin && state == State.IN_PREPARATION) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Filtre non autorisé");
    }
    if (teamName != null && !teamName.isBlank() && playerTag != null && !playerTag.isBlank()) {
      return tournamentService.getTournamentsByTeamNameAndPlayerTag(teamName, playerTag, isAdmin);
    }
    if (teamName != null && !teamName.isBlank()) {
      return tournamentService.getTournamentsByTeamName(teamName, isAdmin);
    }
    if (playerTag != null && !playerTag.isBlank()) {
      return tournamentService.getTournamentsByPlayerTag(playerTag, isAdmin);
    }
    return tournamentService.getAllTournaments(state, isAdmin);
  }

  /**
   * Returns a tournament by id.
   *
   * @param tournamentId the tournament id
   * @param authentication the optional authentication (null for unauthenticated users)
   * @return the matching tournament
   */
  @GetMapping("/{tournamentId}")
  public TournamentDto getTournamentById(
      @PathVariable Long tournamentId,
      Authentication authentication
  ) {
    boolean isAdmin = false;
    if (authentication != null) {
      User user = (User) authentication.getPrincipal();
      isAdmin = user.isAdmin();
    }
    TournamentDto tournament = tournamentService.getTournamentById(tournamentId, isAdmin);
    if (tournament == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournoi non trouvé");
    }
    return tournament;
  }

  /**
   * Creates a tournament.
   *
   * @param tournamentDto the tournament payload
   * @return the created tournament
   */
  @PostMapping({"", "/"})
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public TournamentDto createTournament(@Valid @RequestBody TournamentDto tournamentDto) {
    TournamentDto created = tournamentService.createTournament(tournamentDto);
    if (created == null) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Un tournoi avec ce nom existe déjà");
    }
    return created;
  }

  /**
   * Updates a tournament.
   *
   * @param tournamentId the tournament id
   * @param tournamentDto the tournament payload
   * @return the updated tournament
   */
  @PutMapping("/{tournamentId}")
  @PreAuthorize("hasRole('ADMIN')")
  public TournamentDto updateTournament(
      @PathVariable Long tournamentId,
      @Valid @RequestBody TournamentDto tournamentDto
  ) {
    TournamentDto updatedTournament = tournamentService.updateTournament(tournamentId,
        tournamentDto);
    if (updatedTournament == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournoi non trouvé");
    }
    return updatedTournament;
  }

  /**
   * Deletes a tournament.
   *
   * @param tournamentId the tournament id
   */
  @DeleteMapping("/{tournamentId}")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTournament(@PathVariable Long tournamentId) {
    if (!tournamentService.deleteTournament(tournamentId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournoi non trouvé");
    }
  }
}
