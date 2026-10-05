package be.vinci.ipl.cae.demo.models.dtos;

/**
 * DTO for updating a user's password.
 *
 * @param oldPassword the current password to verify
 * @param newPassword the new password to set
 */
public record PasswordUpdateDto(String oldPassword, String newPassword) {}