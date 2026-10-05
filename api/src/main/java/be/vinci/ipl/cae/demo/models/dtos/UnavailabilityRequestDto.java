package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDate;

/**
 * DTO for creating a new unavailability.
 *
 * @param startDate the start date of the unavailability
 * @param endDate   the end date of the unavailability
 */
public record UnavailabilityRequestDto(LocalDate startDate, LocalDate endDate) {}