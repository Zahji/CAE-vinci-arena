package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.SelectionMatchCreateDto;
import be.vinci.ipl.cae.demo.models.dtos.SelectionMatchDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.SelectionMatchService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller for match selections.
 */
@RestController
@RequestMapping("/tournaments/{tournamentId}/matches/{matchId}/participations/{teamId}/selections")
public class SelectionMatchController {

  private final SelectionMatchService selectionMatchService;

  /**
   * Constructor for dependency injection.
   *
   * @param selectionMatchService the selection match service
   */
  public SelectionMatchController(SelectionMatchService selectionMatchService) {
    this.selectionMatchService = selectionMatchService;
  }

  /**
   * Get all selections for a match and team.
   * Visible to team members and admins at all times.
   * Visible to everyone only after the match is ENDED and the score has been encoded.
   *
   * @param matchId the match id
   * @param teamId  the team id
   * @param caller  the authenticated user
   * @return list of selection DTOs
   */
  @GetMapping
  @PreAuthorize("permitAll()")
  public List<SelectionMatchDto> getSelections(
      @PathVariable Long matchId,
      @PathVariable Long teamId,
      @AuthenticationPrincipal(errorOnInvalidType = false) User caller) {
    if (!selectionMatchService.canViewSelections(matchId, teamId, caller)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    return selectionMatchService.getSelections(matchId, teamId);
  }

  /**
   * Add a member to the selection for a match and team.
   * Only the team manager or second manager can perform this action.
   *
   * @param matchId the match id
   * @param teamId  the team id
   * @param dto     the DTO containing the member id to add
   * @param caller  the authenticated user
   * @return the created selection DTO
   */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("isAuthenticated()")
  public SelectionMatchDto addSelection(
      @PathVariable Long matchId,
      @PathVariable Long teamId,
      @Valid @RequestBody SelectionMatchCreateDto dto,
      @AuthenticationPrincipal User caller) {
    SelectionMatchDto created =
        selectionMatchService.addSelection(matchId, teamId, dto.getMemberId(), caller);

    if (created == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    return created;
  }

  /**
   * Remove a member from the selection for a match and team.
   * Only the team manager or second manager can perform this action.
   *
   * @param matchId  the match id
   * @param teamId   the team id
   * @param memberId the id of the member to remove
   * @param caller   the authenticated user
   */
  @DeleteMapping("/{memberId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("isAuthenticated()")
  public void removeSelection(
      @PathVariable Long matchId,
      @PathVariable Long teamId,
      @PathVariable Long memberId,
      @AuthenticationPrincipal User caller) {
    boolean removed = selectionMatchService.removeSelection(matchId, teamId, memberId, caller);
    if (!removed) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
  }
}
