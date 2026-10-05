package be.vinci.ipl.cae.demo.models.dtos;

import be.vinci.ipl.cae.demo.models.enums.MembershipStatus;

/**
 * DTO for TeamMembership responses.
 *
 * @param id the membership id
 * @param member the member user profile
 * @param team the team response
 * @param status the membership status
 * @param rejectionReason the rejection reason (nullable)
 */
public record TeamMembershipResponseDto(
    Long id,
    UserProfileDto member,
    TeamResponseDto team,
    MembershipStatus status,
    String rejectionReason
) {}
