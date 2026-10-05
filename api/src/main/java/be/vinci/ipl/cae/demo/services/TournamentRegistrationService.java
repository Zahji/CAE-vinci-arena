package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.TeamActivityDto;
import be.vinci.ipl.cae.demo.models.dtos.TournamentRegistrationDto;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistration;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.models.results.TournamentRegistrationResult;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service for managing tournament registrations.
 */
@Service
public class TournamentRegistrationService {

  private static final int MIN_MEMBERS_REQUIRED = 4;

  private final TournamentRegistrationRepository tournamentRegistrationRepository;
  private final TeamService teamService;

  /**
   * Constructor for dependency injection.
   *
   * @param tournamentRegistrationRepository the registration repository
   * @param teamService the team service
   */
  public TournamentRegistrationService(
      TournamentRegistrationRepository tournamentRegistrationRepository,
      TeamService teamService
  ) {
    this.tournamentRegistrationRepository = tournamentRegistrationRepository;
    this.teamService = teamService;
  }

  /**
   * Register a team to a tournament.
   * Only the primary or secondary manager can register the team.
   *
   * @param tournament the tournament
   * @param team the team to register
   * @param user the authenticated user
   * @return result with DTO on success, or error details for the controller
   */
  @Transactional
  public TournamentRegistrationResult registerTeam(
      Tournament tournament, Team team, User user
  ) {
    String error = validateCanRegister(tournament, team, user);
    if (error != null) {
      boolean conflict = "La période d'inscription est finie".equals(error);
      return TournamentRegistrationResult.fail(error, conflict);
    }
    TournamentRegistration registration = buildRegistration(tournament, team);
    return TournamentRegistrationResult.ok(
        toDto(tournamentRegistrationRepository.save(registration)));
  }

  /**
   * Validates all conditions required to register a team.
   *
   * @return null if valid, otherwise a client-facing error message
   */
  private String validateCanRegister(Tournament tournament, Team team, User user) {
    String e = validateTeamIsActive(team);
    if (e != null) {
      return e;
    }
    e = validateIsManager(team, user);
    if (e != null) {
      return e;
    }
    e = validateTournamentIsOpen(tournament);
    if (e != null) {
      return e;
    }
    e = validateTeamHasEnoughMembers(team);
    if (e != null) {
      return e;
    }
    e = validateNotAlreadyRegistered(tournament, team);
    if (e != null) {
      return e;
    }
    return validateTournamentNotFull(tournament);
  }

  private String validateTeamIsActive(Team team) {
    if (team.getManager() == null) {
      return "Cette team n'a pas de responsable principal";
    }
    return null;
  }

  private String validateIsManager(Team team, User user) {
    boolean isPrimary = team.getManager().getId().equals(user.getId());
    boolean isSecond = team.getSecondManager() != null
        && team.getSecondManager().getId().equals(user.getId());
    if (!isPrimary && !isSecond) {
      return "Seul le responsable principal ou secondaire peut inscrire la team";
    }
    return null;
  }

  private String validateTournamentIsOpen(Tournament tournament) {
    String e = validateRegistrationPeriodIsOpen(tournament);
    if (e != null) {
      return e;
    }
    if (tournament.getState() != State.PLANIFIED) {
      return "Les inscriptions ne sont pas ouvertes pour ce tournoi";
    }
    return null;
  }

  private String validateRegistrationPeriodIsOpen(Tournament tournament) {
    if (tournament.getEndInscriptionDate() != null
        && tournament.getEndInscriptionDate().isBefore(LocalDate.now())) {
      return "La période d'inscription est finie";
    }
    return null;
  }

  private String validateTeamHasEnoughMembers(Team team) {
    int total = teamService.getManagersCount(team) + teamService.getAcceptedMembersCount(team);
    if (total < MIN_MEMBERS_REQUIRED) {
      return "La team doit avoir au moins " + MIN_MEMBERS_REQUIRED + " membres pour s'inscrire";
    }
    return null;
  }

  private String validateNotAlreadyRegistered(Tournament tournament, Team team) {
    if (tournamentRegistrationRepository.existsByTournamentAndTeam(tournament, team)) {
      return "Cette team est déjà inscrite à ce tournoi";
    }
    return null;
  }

  private String validateTournamentNotFull(Tournament tournament) {
    long count = tournamentRegistrationRepository.findByTournament(tournament).size();
    if (count >= tournament.getMaxTeams()) {
      return "Ce tournoi a atteint le nombre maximum d'équipes";
    }
    return null;
  }

  private TournamentRegistration buildRegistration(Tournament tournament, Team team) {
    TournamentRegistration registration = new TournamentRegistration();
    registration.setTournament(tournament);
    registration.setTeam(team);
    return registration;
  }

  /**
   * Get all registrations for a tournament.
   *
   * @param tournament the tournament
   * @return list of registration DTOs
   */
  public List<TournamentRegistrationDto> getRegistrations(Tournament tournament) {
    return tournamentRegistrationRepository.findByTournament(tournament).stream()
        .map(this::toDto)
        .toList();
  }

  /**
   * Get all tournament registrations for a team.
   *
   * @param team the team
   * @return list of registration DTOs
   */
  public List<TournamentRegistrationDto> getRegistrationsByTeam(Team team) {
    return tournamentRegistrationRepository.findByTeam(team).stream()
        .map(this::toDto)
        .toList();
  }

  /**
   * Get all tournament activities for a team.
   *
   * @param team the team
   * @return list of team activity DTOs
   */
  public List<TeamActivityDto> getTeamActivity(Team team) {
    return tournamentRegistrationRepository.findByTeam(team).stream()
        .map(this::toTeamActivityDto)
        .toList();
  }

  private TournamentRegistrationDto toDto(TournamentRegistration registration) {
    return new TournamentRegistrationDto(
        registration.getTournament().getId(),
        registration.getTournament().getName(),
        registration.getTeam().getId(),
        registration.getTeam().getName()
    );
  }

  private TeamActivityDto toTeamActivityDto(TournamentRegistration registration) {
    return new TeamActivityDto(
        registration.getTournament().getId(),
        registration.getTournament().getName(),
        registration.getTournament().getStartDate(),
        registration.getTournament().getEndDate()
    );
  }
}
