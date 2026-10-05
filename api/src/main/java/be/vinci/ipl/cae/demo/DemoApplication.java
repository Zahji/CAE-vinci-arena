package be.vinci.ipl.cae.demo;

import be.vinci.ipl.cae.demo.models.entities.Match;
import be.vinci.ipl.cae.demo.models.entities.ParticipationMatch;
import be.vinci.ipl.cae.demo.models.entities.ProfilePicture;
import be.vinci.ipl.cae.demo.models.entities.SelectionMatch;
import be.vinci.ipl.cae.demo.models.entities.Speciality;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.TeamMembership;
import be.vinci.ipl.cae.demo.models.entities.Tournament;
import be.vinci.ipl.cae.demo.models.entities.TournamentRegistration;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;
import be.vinci.ipl.cae.demo.models.enums.State;
import be.vinci.ipl.cae.demo.models.enums.StateMatch;
import be.vinci.ipl.cae.demo.repositories.MatchRepository;
import be.vinci.ipl.cae.demo.repositories.ParticipationMatchRepository;
import be.vinci.ipl.cae.demo.repositories.ProfilePictureRepository;
import be.vinci.ipl.cae.demo.repositories.SelectionMatchRepository;
import be.vinci.ipl.cae.demo.repositories.SpecialityRepository;
import be.vinci.ipl.cae.demo.repositories.TeamMembershipRepository;
import be.vinci.ipl.cae.demo.repositories.TeamRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRegistrationRepository;
import be.vinci.ipl.cae.demo.repositories.TournamentRepository;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import be.vinci.ipl.cae.demo.services.UserService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main class of the application.
 */
@SuppressWarnings("PMD.UseUtilityClass")
@SpringBootApplication
@EnableScheduling
public class DemoApplication {

  private static final String DEFAULT_PASSWORD = "password";
  private static final String TEAM_ALPHA = "TEAM_ALPHA";
  private static final String TEAM_OMEGA = "TEAM_OMEGA";
  private static final String TEAM_IOTA = "TEAM_IOTA";
  private static final String TEAM_DELTA = "TEAM_DELTA";
  private static final String TEAM_EPSILON = "TEAM_EPSILON";

  /**
   * Main method of the application.
   *
   * @param args the arguments
   */
  public static void main(String[] args) {
    System.out.println("CWD: " + System.getProperty("user.dir"));

    SpringApplication.run(DemoApplication.class, args);
  }

  @Bean
  @Order(1)
  CommandLineRunner seedSpecialities(SpecialityRepository specialityRepository) {
    return args -> {
      String[] names = {
          "Architecte", "Executeur", "Tacticien", "Gardien", "Catalyseur",
          "Perturbateur", "Guérisseur"
      };

      for (String name : names) {
        if (specialityRepository.findByName(name) == null) {
          Speciality speciality = new Speciality();
          speciality.setName(name);
          specialityRepository.save(speciality);
        }
      }
    };
  }

  @Bean
  @Order(2)
  CommandLineRunner seedProfilePictures(ProfilePictureRepository profilePictureRepository) {
    return args -> {
      String[] urls = {
          "https://api.dicebear.com/7.x/bottts/svg?seed=apple",
          "https://api.dicebear.com/7.x/bottts/svg?seed=banana",
          "https://api.dicebear.com/7.x/bottts/svg?seed=carrot",
          "https://api.dicebear.com/7.x/bottts/svg?seed=broccoli",
          "https://api.dicebear.com/7.x/bottts/svg?seed=tomato",
          "https://api.dicebear.com/7.x/bottts/svg?seed=potato",
          "https://api.dicebear.com/7.x/bottts/svg?seed=onion",
          "https://api.dicebear.com/7.x/bottts/svg?seed=pepper",
          "https://api.dicebear.com/7.x/bottts/svg?seed=lemon",
          "https://api.dicebear.com/7.x/bottts/svg?seed=cherry",
          "https://api.dicebear.com/7.x/bottts/svg?seed=grape",
          "https://api.dicebear.com/7.x/bottts/svg?seed=mango",
          "https://api.dicebear.com/7.x/bottts/svg?seed=kiwi",
          "https://api.dicebear.com/7.x/bottts/svg?seed=avocado",
          "https://api.dicebear.com/7.x/bottts/svg?seed=melon",
          "https://api.dicebear.com/7.x/bottts/svg?seed=pear",
          "https://api.dicebear.com/7.x/bottts/svg?seed=peach",
          "https://api.dicebear.com/7.x/bottts/svg?seed=plum",
          "https://api.dicebear.com/7.x/bottts/svg?seed=coconut",
          "https://api.dicebear.com/7.x/bottts/svg?seed=pumpkin"
      };

      for (String url : urls) {
        if (profilePictureRepository.findByUrl(url) == null) {
          ProfilePicture profilePicture = new ProfilePicture();
          profilePicture.setUrl(url);
          profilePictureRepository.save(profilePicture);
        }
      }
    };
  }

  @Bean
  @Order(3)
  CommandLineRunner seedUsers(
      UserService userService,
      UserRepository userRepository,
      ProfilePictureRepository profilePictureRepository,
      SpecialityRepository specialityRepository,
      TeamRepository teamRepository,
      TeamMembershipRepository teamMembershipRepository) {
    return args -> {
      final Team teamAlpha = findOrCreateTeam(teamRepository, TEAM_ALPHA);
      final Team teamOmega = findOrCreateTeam(teamRepository, TEAM_OMEGA);
      final Team teamIota = findOrCreateTeam(teamRepository, TEAM_IOTA);
      final Team teamDelta = findOrCreateTeam(teamRepository, TEAM_DELTA);
      final Team teamEpsilon = findOrCreateTeam(teamRepository, TEAM_EPSILON);

      User lea = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamAlpha,
          "lea@mail.com",
          "Lynx",
          "Tacticien",
          "https://api.dicebear.com/7.x/bottts/svg?seed=apple",
          true,
          LocalDate.parse("2025-11-12")
      );
      ensureAcceptedMembership(teamMembershipRepository, lea, teamAlpha);

      User tom = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamAlpha,
          "tom@mail.com",
          "Rogue",
          "Executeur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=banana",
          false,
          LocalDate.parse("2025-12-03")
      );
      ensureAcceptedMembership(teamMembershipRepository, tom, teamAlpha);

      User ines = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamAlpha,
          "ines@mail.com",
          "Pulse",
          "Guérisseur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=carrot",
          false,
          LocalDate.parse("2026-01-18")
      );
      ensureAcceptedMembership(teamMembershipRepository, ines, teamAlpha);

      User pol = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamAlpha,
          "pol@mail.com",
          "Wolf",
          "Architecte",
          "https://api.dicebear.com/7.x/bottts/svg?seed=melon",
          false,
          LocalDate.parse("2026-02-02")
      );
      ensureAcceptedMembership(teamMembershipRepository, pol, teamAlpha);

      User tibo = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamOmega,
          "tibo@mail.com",
          "Iron",
          "Gardien",
          "https://api.dicebear.com/7.x/bottts/svg?seed=broccoli",
          true,
          LocalDate.parse("2025-10-27")
      );
      ensureAcceptedMembership(teamMembershipRepository, tibo, teamOmega);

      User neo = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamOmega,
          "neo@mail.com",
          "Shade",
          "Catalyseur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=grape",
          false,
          LocalDate.parse("2025-10-30")
      );
      ensureAcceptedMembership(teamMembershipRepository, neo, teamOmega);

      User lisa = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamIota,
          "lisa@mail.com",
          "Storm",
          "Executeur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=tomato",
          false,
          LocalDate.parse("2026-01-10")
      );
      ensureAcceptedMembership(teamMembershipRepository, lisa, teamIota);

      User noa = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamIota,
          "noa@mail.com",
          "Flash",
          "Architecte",
          "https://api.dicebear.com/7.x/bottts/svg?seed=potato",
          false,
          LocalDate.parse("2026-02-02")
      );
      ensureAcceptedMembership(teamMembershipRepository, noa, teamIota);

      User tim = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamIota,
          "tim@mail.com",
          "Titi",
          "Gardien",
          "https://api.dicebear.com/7.x/bottts/svg?seed=onion",
          false,
          LocalDate.parse("2026-02-03")
      );
      ensureAcceptedMembership(teamMembershipRepository, tim, teamIota);

      User zoe = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamIota,
          "zoe@mail.com",
          "Vector",
          "Catalyseur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=pepper",
          false,
          LocalDate.parse("2026-02-04")
      );
      ensureAcceptedMembership(teamMembershipRepository, zoe, teamIota);

      User max = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamDelta,
          "max@mail.com",
          "Iron",
          "Gardien",
          "https://api.dicebear.com/7.x/bottts/svg?seed=lemon",
          false,
          LocalDate.parse("2026-03-12")
      );
      ensureAcceptedMembership(teamMembershipRepository, max, teamDelta);

      User ali = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamDelta,
          "ali@mail.com",
          "Putsh",
          "Perturbateur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=coconut",
          false,
          LocalDate.parse("2026-01-22")
      );
      ensureAcceptedMembership(teamMembershipRepository, ali, teamDelta);

      User zed = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamDelta,
          "zed@mail.com",
          "Zero",
          "Architecte",
          "https://api.dicebear.com/7.x/bottts/svg?seed=pear",
          true,
          LocalDate.parse("2025-12-11")
      );
      ensureAcceptedMembership(teamMembershipRepository, zed, teamDelta);

      User seb = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamDelta,
          "seb@mail.com",
          "Ice",
          "Guérisseur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=peach",
          true,
          LocalDate.parse("2026-03-01")
      );
      ensureAcceptedMembership(teamMembershipRepository, seb, teamDelta);

      // Tiago admin
      User tiago = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamEpsilon,
          "tiago.admin@mail.com",
          "Tiago",
          "Architecte",
          "https://api.dicebear.com/7.x/bottts/svg?seed=kiwi",
          true,
          LocalDate.parse("2026-04-24")
      );
      ensureAcceptedMembership(teamMembershipRepository, tiago, teamEpsilon);
      // Tiago admin

      User oli = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamDelta,
          "oli@mail.com",
          "Tiger",
          "Tacticien",
          "https://api.dicebear.com/7.x/bottts/svg?seed=plum",
          false,
          LocalDate.parse("2025-11-11")
      );
      ensureAcceptedMembership(teamMembershipRepository, oli, teamDelta);

      User fin = upsertDemoUser(
          userService,
          userRepository,
          profilePictureRepository,
          specialityRepository,
          teamDelta,
          "fin@mail.com",
          "Final",
          "Executeur",
          "https://api.dicebear.com/7.x/bottts/svg?seed=pumpkin",
          false,
          LocalDate.parse("2025-10-22")
      );
      ensureAcceptedMembership(teamMembershipRepository, fin, teamDelta);

      for (User responsible : new User[]{lea, tibo, lisa, noa, seb, max}) {
        clearManagerAssignments(teamRepository, responsible);
      }

      teamAlpha.setManager(lea);
      teamAlpha.setSecondManager(null);
      teamRepository.save(teamAlpha);

      teamOmega.setManager(tibo);
      teamOmega.setSecondManager(null);
      teamRepository.save(teamOmega);

      teamIota.setManager(lisa);
      teamIota.setSecondManager(noa);
      teamRepository.save(teamIota);

      teamDelta.setManager(seb);
      teamDelta.setSecondManager(max);
      teamRepository.save(teamDelta);

      teamEpsilon.setManager(null);
      teamEpsilon.setSecondManager(null);
      teamRepository.save(teamEpsilon);
    };
  }

  @Bean
  @Order(4)
  CommandLineRunner seedTournaments(
      TournamentRepository tournamentRepository,
      TournamentRegistrationRepository tournamentRegistrationRepository,
      TeamRepository teamRepository,
      UserRepository userRepository,
      MatchRepository matchRepository,
      ParticipationMatchRepository participationMatchRepository,
      SelectionMatchRepository selectionMatchRepository) {
    return args -> {
      if (tournamentRepository.count() == 0) {
        final LocalDateTime now = LocalDateTime.now();

        final Team teamAlpha = findOrCreateTeam(teamRepository, TEAM_ALPHA);
        final Team teamOmega = findOrCreateTeam(teamRepository, TEAM_OMEGA);
        final Team teamIota = findOrCreateTeam(teamRepository, TEAM_IOTA);
        final Team teamEpsilon = findOrCreateTeam(teamRepository, TEAM_EPSILON);
        final Team teamDelta = findOrCreateTeam(teamRepository, TEAM_DELTA);
        final Team teamSigma = findOrCreateTeam(teamRepository, "TEAM_SIGMA");
        final Team teamNova = findOrCreateTeam(teamRepository, "TEAM_NOVA");
        final Team teamZeta = findOrCreateTeam(teamRepository, "TEAM_ZETA");
        final Team teamKappa = findOrCreateTeam(teamRepository, "TEAM_KAPPA");
        final Team teamLambda = findOrCreateTeam(teamRepository, "TEAM_LAMBDA");
        final Team teamPhi = findOrCreateTeam(teamRepository, "TEAM_PHI");
        final Team teamRho = findOrCreateTeam(teamRepository, "TEAM_RHO");
        final Team teamTau = findOrCreateTeam(teamRepository, "TEAM_TAU");
        final Team teamOrion = findOrCreateTeam(teamRepository, "TEAM_ORION");
        final Team teamVega = findOrCreateTeam(teamRepository, "TEAM_VEGA");

        // Extra future tournament kept before Spring Arena so demo tournament IDs stay stable.
        Tournament tomorrowTournament = new Tournament();
        tomorrowTournament.setName("Tomorrow Cup");
        tomorrowTournament.setDescription(
            "Tournoi de préparation encore ouvert aux inscriptions");
        tomorrowTournament.setStartDate(LocalDate.of(2026, 6, 20));
        tomorrowTournament.setEndDate(LocalDate.of(2026, 6, 25));
        tomorrowTournament.setStartInscriptionDate(LocalDate.of(2026, 4, 15));
        tomorrowTournament.setEndInscriptionDate(LocalDate.of(2026, 6, 10));
        tomorrowTournament.setMaxTeams(8);
        tomorrowTournament.setState(State.PLANIFIED);
        tournamentRepository.save(tomorrowTournament);
        for (Team t : new Team[]{teamOmega, teamIota, teamEpsilon}) {
          registerTeam(tournamentRegistrationRepository, tomorrowTournament, t);
        }

        // --- Spring Arena Cup 2025 (8 places, 7 inscrites, winner: TEAM_OMEGA) ---
        Tournament springArena = new Tournament();
        springArena.setName("Spring Arena Cup 2025");
        springArena.setDescription(
            "Compétition printanière ouverte aux nouvelles teams émergentes");
        springArena.setStartDate(LocalDate.of(2025, 4, 15));
        springArena.setEndDate(LocalDate.of(2025, 4, 25));
        springArena.setStartInscriptionDate(LocalDate.of(2025, 3, 10));
        springArena.setEndInscriptionDate(LocalDate.of(2025, 4, 10));
        springArena.setMaxTeams(8);
        springArena.setState(State.FINISHED);
        springArena.setWinner("TEAM_OMEGA");
        tournamentRepository.save(springArena);
        for (Team t : new Team[]{teamOmega, teamAlpha, teamIota, teamDelta,
            teamSigma, teamNova, teamZeta}) {
          registerTeam(tournamentRegistrationRepository, springArena, t);
        }

        // --- Elite Championship 2025 (8 places, 6 inscrites, winner: TEAM_IOTA) ---
        Tournament elite2025 = new Tournament();
        elite2025.setName("Elite Championship 2025");
        elite2025.setDescription("Compétition élite réservée aux meilleures teams");
        elite2025.setStartDate(LocalDate.of(2025, 5, 15));
        elite2025.setEndDate(LocalDate.of(2025, 5, 30));
        elite2025.setStartInscriptionDate(LocalDate.of(2025, 4, 11));
        elite2025.setEndInscriptionDate(LocalDate.of(2025, 5, 11));
        elite2025.setMaxTeams(8);
        elite2025.setState(State.FINISHED);
        elite2025.setWinner("TEAM_IOTA");
        tournamentRepository.save(elite2025);
        for (Team t : new Team[]{teamIota, teamAlpha, teamOmega, teamDelta,
            teamSigma, teamNova}) {
          registerTeam(tournamentRegistrationRepository, elite2025, t);
        }

        // --- Summer Pro League 2025 (16 places, 14 inscrites, winner: TEAM_ALPHA) ---
        Tournament summerPro = new Tournament();
        summerPro.setName("Summer Pro League 2025");
        summerPro.setDescription(
            "Tournoi estival de haut niveau avec les meilleures teams");
        summerPro.setStartDate(LocalDate.of(2025, 7, 1));
        summerPro.setEndDate(LocalDate.of(2025, 7, 15));
        summerPro.setStartInscriptionDate(LocalDate.of(2025, 5, 25));
        summerPro.setEndInscriptionDate(LocalDate.of(2025, 6, 25));
        summerPro.setMaxTeams(16);
        summerPro.setState(State.FINISHED);
        summerPro.setWinner(TEAM_ALPHA);
        tournamentRepository.save(summerPro);
        for (Team t : new Team[]{teamIota, teamAlpha, teamOmega, teamDelta,
            teamSigma, teamNova, teamZeta, teamKappa, teamLambda,
            teamPhi, teamRho, teamTau, teamOrion, teamVega}) {
          registerTeam(tournamentRegistrationRepository, summerPro, t);
        }

        // --- Vinci Winter Clash 2026 (12 places, 12 inscrites, winner: TEAM_DELTA) ---
        Tournament vinciWinter = new Tournament();
        vinciWinter.setName("Vinci Winter Clash 2026");
        vinciWinter.setDescription(
            "Tournoi hivernal réunissant des équipes semi-professionnelles");
        vinciWinter.setStartDate(LocalDate.of(2026, 1, 10));
        vinciWinter.setEndDate(LocalDate.of(2026, 1, 20));
        vinciWinter.setStartInscriptionDate(LocalDate.of(2025, 12, 5));
        vinciWinter.setEndInscriptionDate(LocalDate.of(2026, 1, 5));
        vinciWinter.setMaxTeams(12);
        vinciWinter.setState(State.FINISHED);
        vinciWinter.setWinner(TEAM_DELTA);
        tournamentRepository.save(vinciWinter);
        for (Team t : new Team[]{teamAlpha, teamOmega, teamIota, teamDelta,
            teamSigma, teamNova, teamZeta, teamKappa, teamLambda,
            teamPhi, teamRho, teamTau}) {
          registerTeam(tournamentRegistrationRepository, vinciWinter, t);
        }

        // --- Spring Battle Series 2026 (8 places, 8 inscrites, ONGOING) ---
        Tournament springBattle = new Tournament();
        springBattle.setName("Spring Battle Series 2026");
        springBattle.setDescription(
            "Série printanière avec élimination directe et forte participation");
        springBattle.setStartDate(LocalDate.of(2026, 5, 4));
        springBattle.setEndDate(LocalDate.of(2026, 5, 12));
        springBattle.setStartInscriptionDate(LocalDate.of(2026, 4, 1));
        springBattle.setEndInscriptionDate(LocalDate.of(2026, 5, 1));
        springBattle.setMaxTeams(8);
        springBattle.setState(State.ONGOING);
        tournamentRepository.save(springBattle);
        for (Team t : new Team[]{teamDelta, teamIota, teamOmega, teamAlpha,
            teamSigma, teamNova, teamZeta, teamKappa}) {
          registerTeam(tournamentRegistrationRepository, springBattle, t);
        }

        // --- Vinci Easter Cup 2026 (8 places, 7 inscrites, winner: TEAM_DELTA) ---
        Tournament vinciEaster = new Tournament();
        vinciEaster.setName("Vinci Easter Cup 2026");
        vinciEaster.setDescription(
            "Tournoi de Pâques ouvert à toutes les teams actives");
        vinciEaster.setStartDate(LocalDate.of(2026, 4, 15));
        vinciEaster.setEndDate(LocalDate.of(2026, 4, 25));
        vinciEaster.setStartInscriptionDate(LocalDate.of(2026, 3, 8));
        vinciEaster.setEndInscriptionDate(LocalDate.of(2026, 4, 8));
        vinciEaster.setMaxTeams(8);
        vinciEaster.setState(State.FINISHED);
        vinciEaster.setWinner(TEAM_DELTA);
        tournamentRepository.save(vinciEaster);
        for (Team t : new Team[]{teamEpsilon, teamIota, teamDelta,
            teamSigma, teamNova, teamZeta, teamKappa}) {
          registerTeam(tournamentRegistrationRepository, vinciEaster, t);
        }

        // --- Elite Championship 2026 (10 places, 9 inscrites, PLANIFIED) ---
        Tournament elite2026 = new Tournament();
        elite2026.setName("Elite Championship 2026");
        elite2026.setDescription("Compétition élite réservée aux meilleures teams");
        elite2026.setStartDate(LocalDate.of(2026, 5, 16));
        elite2026.setEndDate(LocalDate.of(2026, 5, 30));
        elite2026.setStartInscriptionDate(LocalDate.of(2026, 4, 11));
        elite2026.setEndInscriptionDate(LocalDate.of(2026, 5, 13));
        elite2026.setMaxTeams(10);
        elite2026.setState(State.PLANIFIED);
        tournamentRepository.save(elite2026);
        for (Team t : new Team[]{teamAlpha, teamOmega, teamIota, teamSigma,
            teamNova, teamZeta, teamKappa, teamLambda, teamPhi}) {
          registerTeam(tournamentRegistrationRepository, elite2026, t);
        }

        User admin = requireUser(userRepository, "lea@mail.com");
        Map<String, List<User>> selectionsByTeamName = buildDemoSelectionsByTeamName(
            userRepository);

        seedTournamentBracket(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            springArena,
            admin,
            List.of(teamOmega, teamAlpha, teamIota, teamDelta, teamSigma,
                teamNova, teamZeta),
            LocalDateTime.of(2025, 4, 16, 14, 0),
            selectionsByTeamName
        );
        seedTournamentBracket(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            elite2025,
            admin,
            List.of(teamIota, teamAlpha, teamOmega, teamDelta, teamSigma,
                teamNova),
            LocalDateTime.of(2025, 5, 20, 15, 0),
            selectionsByTeamName
        );
        seedTournamentBracket(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            summerPro,
            admin,
            List.of(teamIota, teamAlpha, teamOmega, teamDelta, teamSigma,
                teamNova, teamZeta, teamKappa, teamLambda, teamPhi, teamRho,
                teamTau, teamOrion, teamVega),
            LocalDateTime.of(2025, 7, 3, 16, 0),
            selectionsByTeamName
        );
        seedTournamentBracket(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            vinciWinter,
            admin,
            List.of(teamAlpha, teamOmega, teamIota, teamDelta, teamSigma,
                teamNova, teamZeta, teamKappa, teamLambda, teamPhi, teamRho,
                teamTau),
            LocalDateTime.of(2026, 1, 12, 14, 0),
            selectionsByTeamName
        );
        seedTournamentBracket(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            springBattle,
            admin,
            List.of(teamDelta, teamIota, teamOmega, teamAlpha, teamSigma,
                teamNova, teamZeta, teamKappa),
            now.minusMinutes(20),
            selectionsByTeamName
        );
        seedTournamentBracket(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            vinciEaster,
            admin,
            List.of(teamEpsilon, teamIota, teamDelta, teamSigma, teamNova,
                teamZeta, teamKappa),
            LocalDateTime.of(2026, 4, 16, 14, 0),
            selectionsByTeamName
        );
        seedTournamentBracket(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            elite2026,
            admin,
            List.of(teamAlpha, teamOmega, teamIota, teamSigma, teamNova,
                teamZeta, teamKappa, teamLambda, teamPhi),
            LocalDateTime.of(2026, 5, 16, 14, 0),
            selectionsByTeamName
        );
        seedTiboHistoricalSelections(
            matchRepository,
            participationMatchRepository,
            selectionMatchRepository,
            userRepository,
            teamOmega,
            springArena,
            elite2025,
            summerPro
        );
      }
    };
  }

  private static void createSelection(
      SelectionMatchRepository repo, Match match, Team team, User member) {
    SelectionMatch selection = new SelectionMatch();
    selection.setMatch(match);
    selection.setTeam(team);
    selection.setMember(member);
    repo.save(selection);
  }

  private static Match createMatch(
      MatchRepository matchRepository,
      Tournament tournament,
      User admin,
      Long round,
      LocalDateTime startTime,
      StateMatch state) {
    Match match = new Match();
    match.setRound(round);
    match.setStartTime(startTime);
    match.setState(state);
    match.setTournament(tournament);
    match.setAdmin(admin);
    return matchRepository.save(match);
  }

  private static void createParticipation(
      ParticipationMatchRepository repo,
      Match match,
      Team team,
      int statusSelection,
      Integer score,
      boolean declaredForfeit) {
    ParticipationMatch participation = new ParticipationMatch();
    participation.setMatch(match);
    participation.setTeam(team);
    participation.setStatusSelection(statusSelection);
    participation.setScore(score);
    participation.setDeclaredForfeit(declaredForfeit);
    repo.save(participation);
  }

  private static Map<String, List<User>> buildDemoSelectionsByTeamName(
      UserRepository userRepository) {
    Map<String, List<User>> selectionsByTeamName = new HashMap<>();
    selectionsByTeamName.put(TEAM_OMEGA, List.of(
        requireUser(userRepository, "neo@mail.com")
    ));
    selectionsByTeamName.put(TEAM_ALPHA, List.of(
        requireUser(userRepository, "lea@mail.com"),
        requireUser(userRepository, "tom@mail.com"),
        requireUser(userRepository, "ines@mail.com"),
        requireUser(userRepository, "pol@mail.com")
    ));
    selectionsByTeamName.put(TEAM_IOTA, List.of(
        requireUser(userRepository, "lisa@mail.com"),
        requireUser(userRepository, "noa@mail.com"),
        requireUser(userRepository, "tim@mail.com"),
        requireUser(userRepository, "zoe@mail.com")
    ));
    selectionsByTeamName.put(TEAM_DELTA, List.of(
        requireUser(userRepository, "seb@mail.com"),
        requireUser(userRepository, "max@mail.com"),
        requireUser(userRepository, "ali@mail.com"),
        requireUser(userRepository, "zed@mail.com")
    ));
    return selectionsByTeamName;
  }

  private static void seedTiboHistoricalSelections(
      MatchRepository matchRepository,
      ParticipationMatchRepository participationMatchRepository,
      SelectionMatchRepository selectionMatchRepository,
      UserRepository userRepository,
      Team teamOmega,
      Tournament springArena,
      Tournament elite2025,
      Tournament summerPro) {
    User tibo = requireUser(userRepository, "tibo@mail.com");
    seedTiboSelectionsForTournament(
        matchRepository,
        participationMatchRepository,
        selectionMatchRepository,
        tibo,
        teamOmega,
        springArena,
        2
    );
    seedTiboSelectionsForTournament(
        matchRepository,
        participationMatchRepository,
        selectionMatchRepository,
        tibo,
        teamOmega,
        elite2025,
        1
    );
    seedTiboSelectionsForTournament(
        matchRepository,
        participationMatchRepository,
        selectionMatchRepository,
        tibo,
        teamOmega,
        summerPro,
        1
    );
  }

  private static void seedTiboSelectionsForTournament(
      MatchRepository matchRepository,
      ParticipationMatchRepository participationMatchRepository,
      SelectionMatchRepository selectionMatchRepository,
      User tibo,
      Team teamOmega,
      Tournament tournament,
      int selectionCount) {
    List<Match> omegaMatches = new ArrayList<>();
    matchRepository.findByTournamentId(tournament.getId()).forEach(match -> {
      if (match.getState() == StateMatch.ENDED
          && hasParticipation(participationMatchRepository, match, teamOmega)) {
        omegaMatches.add(match);
      }
    });

    omegaMatches.stream()
        .sorted(Comparator
            .comparing(Match::getRound)
            .thenComparing(Match::getMatchId))
        .limit(selectionCount)
        .forEach(match -> {
          createSelection(selectionMatchRepository, match, teamOmega, tibo);
          increaseSelectionCount(participationMatchRepository, match, teamOmega);
        });
  }

  private static boolean hasParticipation(
      ParticipationMatchRepository participationMatchRepository,
      Match match,
      Team team) {
    return participationMatchRepository.findByMatchMatchId(match.getMatchId()).stream()
        .anyMatch(participation -> participation.getTeam().getId().equals(team.getId()));
  }

  private static void increaseSelectionCount(
      ParticipationMatchRepository participationMatchRepository,
      Match match,
      Team team) {
    participationMatchRepository.findByMatchMatchId(match.getMatchId()).stream()
        .filter(participation -> participation.getTeam().getId().equals(team.getId()))
        .findFirst()
        .ifPresent(participation -> {
          participation.setStatusSelection(participation.getStatusSelection() + 1);
          participationMatchRepository.save(participation);
        });
  }

  private static void seedTournamentBracket(
      MatchRepository matchRepository,
      ParticipationMatchRepository participationMatchRepository,
      SelectionMatchRepository selectionMatchRepository,
      Tournament tournament,
      User admin,
      List<Team> registeredTeams,
      LocalDateTime firstStart,
      Map<String, List<User>> selectionsByTeamName) {
    if (tournament.getState() == State.FINISHED) {
      seedFinishedBracket(
          matchRepository,
          participationMatchRepository,
          selectionMatchRepository,
          tournament,
          admin,
          registeredTeams,
          firstStart,
          selectionsByTeamName
      );
      return;
    }

    boolean active = tournament.getState() == State.ONGOING;
    int firstRoundMatches = createFirstRound(
        matchRepository,
        participationMatchRepository,
        selectionMatchRepository,
        tournament,
        admin,
        registeredTeams,
        firstStart,
        selectionsByTeamName,
        active
    );
    createFuturePlaceholderRounds(
        matchRepository,
        tournament,
        admin,
        firstStart,
        firstRoundMatches
    );
  }

  private static void seedFinishedBracket(
      MatchRepository matchRepository,
      ParticipationMatchRepository participationMatchRepository,
      SelectionMatchRepository selectionMatchRepository,
      Tournament tournament,
      User admin,
      List<Team> registeredTeams,
      LocalDateTime firstStart,
      Map<String, List<User>> selectionsByTeamName) {
    List<Team> currentRoundTeams = new ArrayList<>(registeredTeams);
    long round = 1L;

    while (currentRoundTeams.size() > 1) {
      List<Team> nextRoundTeams = new ArrayList<>();
      LocalDateTime roundStart = firstStart.plusDays(round - 1L);

      for (int index = 0; index < currentRoundTeams.size(); index += 2) {
        Team team1 = currentRoundTeams.get(index);
        if (index + 1 >= currentRoundTeams.size()) {
          Match match = createMatch(
              matchRepository,
              tournament,
              admin,
              round,
              roundStart,
              StateMatch.ENDED
          );
          createParticipationWithSelections(
              participationMatchRepository,
              selectionMatchRepository,
              selectionsByTeamName,
              match,
              team1,
              null
          );
          nextRoundTeams.add(team1);
          continue;
        }

        Team team2 = currentRoundTeams.get(index + 1);
        Team winner = pickWinner(team1, team2, tournament.getWinner());
        Match match = createMatch(
            matchRepository,
            tournament,
            admin,
            round,
            roundStart,
            StateMatch.ENDED
        );
        createParticipationWithSelections(
            participationMatchRepository,
            selectionMatchRepository,
            selectionsByTeamName,
            match,
            team1,
            team1.equals(winner) ? 3 : 1
        );
        createParticipationWithSelections(
            participationMatchRepository,
            selectionMatchRepository,
            selectionsByTeamName,
            match,
            team2,
            team2.equals(winner) ? 3 : 1
        );
        nextRoundTeams.add(winner);
      }

      currentRoundTeams = nextRoundTeams;
      round++;
    }
  }

  private static int createFirstRound(
      MatchRepository matchRepository,
      ParticipationMatchRepository participationMatchRepository,
      SelectionMatchRepository selectionMatchRepository,
      Tournament tournament,
      User admin,
      List<Team> registeredTeams,
      LocalDateTime firstStart,
      Map<String, List<User>> selectionsByTeamName,
      boolean active) {
    int createdMatches = 0;

    for (int index = 0; index < registeredTeams.size(); index += 2) {
      StateMatch state = active ? ongoingFirstRoundState(createdMatches) : StateMatch.PLANIFIED;
      LocalDateTime start = active && state == StateMatch.PLANIFIED
          ? firstStart.plusHours(8)
          : firstStart;
      Match match = createMatch(
          matchRepository,
          tournament,
          admin,
          1L,
          start,
          state
      );
      Team team1 = registeredTeams.get(index);
      Team team2 = index + 1 < registeredTeams.size()
          ? registeredTeams.get(index + 1)
          : null;

      if (team2 == null) {
        createParticipationWithSelections(
            participationMatchRepository,
            selectionMatchRepository,
            selectionsByTeamName,
            match,
            team1,
            null
        );
      } else {
        Integer team1Score = active && state == StateMatch.ENDED ? 3 : null;
        Integer team2Score = active && state == StateMatch.ENDED ? 1 : null;
        createParticipationWithSelections(
            participationMatchRepository,
            selectionMatchRepository,
            selectionsByTeamName,
            match,
            team1,
            team1Score
        );
        createParticipationWithSelections(
            participationMatchRepository,
            selectionMatchRepository,
            selectionsByTeamName,
            match,
            team2,
            team2Score
        );
      }
      createdMatches++;
    }

    return createdMatches;
  }

  private static void createFuturePlaceholderRounds(
      MatchRepository matchRepository,
      Tournament tournament,
      User admin,
      LocalDateTime firstStart,
      int previousRoundMatches) {
    long round = 2L;
    int matchesInRound = nextRoundMatchCount(previousRoundMatches);

    while (matchesInRound > 0) {
      LocalDateTime roundStart = firstStart.plusDays(round - 1L);
      for (int index = 0; index < matchesInRound; index++) {
        createMatch(
            matchRepository,
            tournament,
            admin,
            round,
            roundStart,
            StateMatch.PLANIFIED
        );
      }

      if (matchesInRound == 1) {
        break;
      }
      matchesInRound = nextRoundMatchCount(matchesInRound);
      round++;
    }
  }

  private static int nextRoundMatchCount(int previousRoundMatches) {
    return previousRoundMatches <= 1 ? 0 : (previousRoundMatches + 1) / 2;
  }

  private static StateMatch ongoingFirstRoundState(int matchIndex) {
    if (matchIndex == 0) {
      return StateMatch.ONGOING;
    }
    return StateMatch.PLANIFIED;
  }

  private static Team pickWinner(Team team1, Team team2, String tournamentWinnerName) {
    if (team1.getName().equals(tournamentWinnerName)) {
      return team1;
    }
    if (team2.getName().equals(tournamentWinnerName)) {
      return team2;
    }
    return team1;
  }

  private static void createParticipationWithSelections(
      ParticipationMatchRepository participationMatchRepository,
      SelectionMatchRepository selectionMatchRepository,
      Map<String, List<User>> selectionsByTeamName,
      Match match,
      Team team,
      Integer score) {
    List<User> selectedMembers = selectionsByTeamName.getOrDefault(
        team.getName(),
        List.of()
    );
    createParticipation(
        participationMatchRepository,
        match,
        team,
        selectedMembers.size(),
        score,
        false
    );
    for (User member : selectedMembers) {
      createSelection(selectionMatchRepository, match, team, member);
    }
  }

  private static User upsertDemoUser(
      UserService userService,
      UserRepository userRepository,
      ProfilePictureRepository profilePictureRepository,
      SpecialityRepository specialityRepository,
      Team team,
      String email,
      String tag,
      String specialityName,
      String pictureUrl,
      boolean isAdmin,
      LocalDate date) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
      user = userService.createOne(
          email,
          DEFAULT_PASSWORD,
          isAdmin,
          tag,
          requireProfilePicture(profilePictureRepository, pictureUrl),
          requireSpeciality(specialityRepository, specialityName)
      );
    }

    user.setTag(tag);
    user.setAdmin(isAdmin);
    user.setSpeciality(requireSpeciality(specialityRepository, specialityName));
    user.setProfilePicture(requireProfilePicture(profilePictureRepository, pictureUrl));
    user.setDate(date);
    user.setTeam(team);
    return userRepository.save(user);
  }

  private static void ensureAcceptedMembership(
      TeamMembershipRepository teamMembershipRepository,
      User member,
      Team team) {
    TeamMembership membership = teamMembershipRepository.findByMember(member).orElseGet(() -> {
      TeamMembership newMembership = new TeamMembership();
      newMembership.setMember(member);
      return newMembership;
    });

    membership.setTeam(team);
    membership.setStatus(MembershipStatus.ACCEPTED);
    membership.setRejectionReason(null);
    teamMembershipRepository.save(membership);
  }

  private static void clearManagerAssignments(TeamRepository teamRepository, User user) {
    if (user == null || user.getId() == null) {
      return;
    }
    final Long userId = user.getId();
    teamRepository.findAll().forEach(team -> {
      boolean changed = false;

      if (team.getManager() != null && userId.equals(team.getManager().getId())) {
        team.setManager(null);
        changed = true;
      }

      if (team.getSecondManager() != null && userId.equals(team.getSecondManager().getId())) {
        team.setSecondManager(null);
        changed = true;
      }

      if (changed) {
        teamRepository.save(team);
      }
    });
  }

  private static User requireUser(UserRepository userRepository, String email) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
      throw new IllegalStateException("Missing user: " + email);
    }
    return user;
  }

  private static void registerTeam(
      TournamentRegistrationRepository repo, Tournament tournament, Team team) {
    if (repo.existsByTournamentAndTeam(tournament, team)) {
      return;
    }
    TournamentRegistration registration = new TournamentRegistration();
    registration.setTournament(tournament);
    registration.setTeam(team);
    repo.save(registration);
  }

  private static Team findOrCreateTeam(TeamRepository teamRepository, String name) {
    return teamRepository.findByNameIgnoreCase(name).orElseGet(() -> {
      Team team = new Team();
      team.setName(name);
      return teamRepository.save(team);
    });
  }

  private static Speciality requireSpeciality(
      SpecialityRepository specialityRepository,
      String name) {
    Speciality speciality = specialityRepository.findByName(name);
    if (speciality == null) {
      throw new IllegalStateException("Missing speciality: " + name);
    }
    return speciality;
  }

  private static ProfilePicture requireProfilePicture(
      ProfilePictureRepository profilePictureRepository,
      String url) {
    ProfilePicture profilePicture = profilePictureRepository.findByUrl(url);
    if (profilePicture == null) {
      throw new IllegalStateException("Missing profile picture: " + url);
    }
    return profilePicture;
  }
}
