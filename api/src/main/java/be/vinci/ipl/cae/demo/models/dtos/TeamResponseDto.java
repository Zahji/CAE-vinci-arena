package be.vinci.ipl.cae.demo.models.dtos;

/**
 * DTO returned when a team is created.
 *
 * @param id the team id
 * @param name the team name
 * @param manager the manager
 * @param secondManager the second manager
 * @param managersCount the number of managers
 * @param membersCount the number of members
 */
public record TeamResponseDto(
    Long id,
    String name,
    UserProfileDto manager,
    UserProfileDto secondManager,
    int managersCount,
    int membersCount
) {}
