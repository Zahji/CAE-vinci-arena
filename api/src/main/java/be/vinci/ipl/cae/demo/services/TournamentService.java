package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.TournamentDto;
import be.vinci.ipl.cae.demo.models.entities.SelectionMatch;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistration;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.repositories.SelectionMatchRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import org.springframework.stereotype.Service;

/**
 * Service for managing tournaments.
 */
@Service
public class TournamentService {
  private final TournamentRepository tournamentRepository;
  private final TournamentRegistrationRepository tournamentRegistrationRepository;
  private final UserRepository userRepository;
  private final SelectionMatchRepository selectionMatchRepository;

  /**
   * Constructs the tournament service.
   *
   * @param tournamentRepository the tournament repository
   * @param tournamentRegistrationRepository the tournament registration repository
   * @param userRepository the user repository
   * @param selectionMatchRepository the selection match repository
   */
  public TournamentService(
      TournamentRepository tournamentRepository,
      TournamentRegistrationRepository tournamentRegistrationRepository,
      UserRepository userRepository,
      SelectionMatchRepository selectionMatchRepository) {
    this.tournamentRepository = tournamentRepository;
    this.tournamentRegistrationRepository = tournamentRegistrationRepository;
    this.userRepository = userRepository;
    this.selectionMatchRepository = selectionMatchRepository;
  }

  /**
   * Returns every tournament as DTOs.
   *
   * @param state the optional tournament state filter
   * @param isAdmin whether the caller is an admin
   * @return the list of tournaments
   */
  public List<TournamentDto> getAllTournaments(State state, boolean isAdmin) {
    Iterable<Tournament> tournaments =
        state == null ? tournamentRepository.findAll() : tournamentRepository.findByState(state);

    return StreamSupport.stream(tournaments.spliterator(), false)
        .filter(t -> isAdmin || t.getState() != State.IN_PREPARATION)
        .map(this::toTournamentDto)
        .collect(Collectors.toList());
  }

  /**
   * Returns a tournament by id.
   *
   * @param id the tournament id
   * @param isAdmin whether the caller is an admin
   * @return the tournament DTO, or {@code null} when absent or hidden
   */
  public TournamentDto getTournamentById(long id, boolean isAdmin) {
    Optional<Tournament> tournament = tournamentRepository.findById(id);
    if (tournament.isEmpty()) {
      return null;
    }
    Tournament t = tournament.get();
    if (!isAdmin && t.getState() == State.IN_PREPARATION) {
      return null;
    }
    return toTournamentDto(t);
  }

  /**
   * Creates a tournament from a DTO.
   *
   * @param tournamentDto the tournament payload
   * @return the created tournament DTO
   */
  public TournamentDto createTournament(TournamentDto tournamentDto) {
    if (tournamentRepository.findByNameIgnoreCase(tournamentDto.getName()).isPresent()) {
      return null;
    }
    Tournament tournament = new Tournament();
    copyDtoToTournament(tournamentDto, tournament);
    tournament.setState(State.IN_PREPARATION);
    return toTournamentDto(tournamentRepository.save(tournament));
  }

  /**
   * Updates an existing tournament.
   *
   * @param id the tournament id
   * @param tournamentDto the tournament payload
   * @return the updated tournament DTO, or {@code null} when absent or state transition invalid
   */
  public TournamentDto updateTournament(long id, TournamentDto tournamentDto) {
    Optional<Tournament> tournament = tournamentRepository.findById(id);
    if (tournament.isEmpty()) {
      return null;
    }

    Tournament tournamentToUpdate = tournament.get();
    State requestedState = tournamentDto.getState();
    if (requestedState == null) {
      if (tournamentToUpdate.getState() != State.IN_PREPARATION) {
        return null;
      }
      copyEditableFieldsToTournament(tournamentDto, tournamentToUpdate);
      return toTournamentDto(tournamentRepository.save(tournamentToUpdate));
    }

    if (!isValidStateTransition(tournamentToUpdate.getState(), requestedState)) {
      return null;
    }

    copyEditableFieldsToTournament(tournamentDto, tournamentToUpdate);
    tournamentToUpdate.setState(requestedState);
    return toTournamentDto(tournamentRepository.save(tournamentToUpdate));
  }

  private boolean isValidStateTransition(State from, State to) {
    if (from == to) {
      return true;
    }
    return switch (from) {
      case IN_PREPARATION -> to == State.PLANIFIED;
      case PLANIFIED -> to == State.ONGOING;
      case ONGOING -> to == State.FINISHED;
      case FINISHED -> false;
    };
  }

  /**
   * Deletes a tournament by id.
   *
   * @param id the tournament id
   * @return {@code true} when the tournament existed and was deleted
   */
  public boolean deleteTournament(long id) {
    Optional<Tournament> tournament = tournamentRepository.findById(id);
    if (tournament.isEmpty()) {
      return false;
    }

    tournamentRepository.delete(tournament.get());
    return true;
  }

  /**
   * Returns a tournament entity by id (used internally by other controllers).
   *
   * @param id the tournament id
   * @return an Optional containing the tournament entity, or empty if not found
   */
  public Optional<Tournament> getTournamentEntityById(long id) {
    return tournamentRepository.findById(id);
  }

  /**
   * Returns all tournaments where the given team name is registered.
   *
   * @param teamName the team name to search
   * @param isAdmin whether the caller is an admin
   * @return list of matching tournament DTOs
   */
  public List<TournamentDto> getTournamentsByTeamName(String teamName, boolean isAdmin) {
    return registrationsToDtos(
        tournamentRegistrationRepository.findByTeamNameIgnoreCase(teamName).stream(), isAdmin);
  }

  /**
   * Returns all tournaments where a player with the given tag was selected in a match.
   *
   * @param tag the player tag to search
   * @param isAdmin whether the caller is an admin
   * @return list of matching tournament DTOs
   */
  public List<TournamentDto> getTournamentsByPlayerTag(String tag, boolean isAdmin) {
    return selectionsToDtos(selectionsByTag(tag), isAdmin);
  }

  /**
   * Returns all tournaments where a player with the given tag was selected with the given team.
   *
   * @param teamName the team name to search
   * @param tag the player tag to search
   * @param isAdmin whether the caller is an admin
   * @return list of matching tournament DTOs
   */
  public List<TournamentDto> getTournamentsByTeamNameAndPlayerTag(
      String teamName, String tag, boolean isAdmin) {
    return selectionsToDtos(
        selectionsByTag(tag).filter(sel -> sel.getTeam().getName().equalsIgnoreCase(teamName)),
        isAdmin);
  }

  private Stream<SelectionMatch> selectionsByTag(String tag) {
    return userRepository.findByTagIgnoreCase(tag).stream()
        .flatMap(user -> selectionMatchRepository.findByMember(user).stream());
  }

  private List<TournamentDto> selectionsToDtos(Stream<SelectionMatch> selections, boolean isAdmin) {
    return selections
        .map(sel -> sel.getMatch().getTournament())
        .distinct()
        .filter(t -> isAdmin || t.getState() != State.IN_PREPARATION)
        .map(this::toTournamentDto)
        .toList();
  }

  private List<TournamentDto> registrationsToDtos(
      Stream<TournamentRegistration> registrations, boolean isAdmin) {
    return registrations
        .map(TournamentRegistration::getTournament)
        .distinct()
        .filter(t -> isAdmin || t.getState() != State.IN_PREPARATION)
        .map(this::toTournamentDto)
        .toList();
  }

  /**
   * Converts a tournament entity to a DTO.
   *
   * @param tournament the source entity
   * @return the mapped DTO
   */
  public TournamentDto toTournamentDto(Tournament tournament) {
    TournamentDto tournamentDto = new TournamentDto();
    tournamentDto.setId(tournament.getId());
    tournamentDto.setName(tournament.getName());
    tournamentDto.setDescription(tournament.getDescription());
    tournamentDto.setStartDate(tournament.getStartDate());
    tournamentDto.setEndDate(tournament.getEndDate());
    tournamentDto.setStartInscriptionDate(tournament.getStartInscriptionDate());
    tournamentDto.setEndInscriptionDate(tournament.getEndInscriptionDate());
    tournamentDto.setMaxTeams(tournament.getMaxTeams());
    tournamentDto.setState(tournament.getState());
    tournamentDto.setRegistrationsCount(
        tournamentRegistrationRepository.countByTournament(tournament));
    tournamentDto.setWinner(tournament.getWinner());

    return tournamentDto;
  }

  private void copyDtoToTournament(TournamentDto tournamentDto, Tournament tournament) {
    copyEditableFieldsToTournament(tournamentDto, tournament);
    tournament.setState(tournamentDto.getState());
  }

  private void copyEditableFieldsToTournament(TournamentDto tournamentDto, Tournament tournament) {
    tournament.setName(tournamentDto.getName());
    tournament.setDescription(tournamentDto.getDescription());
    tournament.setStartDate(tournamentDto.getStartDate());
    tournament.setEndDate(tournamentDto.getEndDate());
    tournament.setStartInscriptionDate(tournamentDto.getStartInscriptionDate());
    tournament.setEndInscriptionDate(tournamentDto.getEndInscriptionDate());
    tournament.setMaxTeams(tournamentDto.getMaxTeams());
  }

}
