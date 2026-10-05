package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDate;

/**
 * Public user profile DTO exposing only non-sensitive data.
 *
 * @param id             the user id.
 * @param tag            the user tag.
 * @param speciality     the user speciality.
 * @param profilePicture the user profile picture URL.
 * @param date           the user creation date.
 * @param teamName       the user team name.
 * @param teamId         the user team id.
 */
public record UserPublicProfileDto(
    Long id,
    String tag,
    String speciality,
    String profilePicture,
    LocalDate date,
    String teamName,
    Long teamId,
    boolean isBanned
) {}
