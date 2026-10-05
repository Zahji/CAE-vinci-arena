package be.vinci.ipl.cae.demo.models.dtos;

import java.time.LocalDate;

/**
 * UserProfile DTO.
 */
public class UserProfileDto {

  private Long id;
  private String email;
  private String tag;
  private String speciality;
  private String profilePicture;
  private LocalDate date;
  private String teamName;
  private boolean isManager;
  private Long teamId;

  /**
   * Constructor for UserProfile.
   *
   * @param id the user id.
   * @param email the user email.
   * @param tag            the user tag.
   * @param speciality     the user speciality.
   * @param profilePicture the user profile picture.
   * @param date           the user date creation profil
   * @param teamName       the user team
   * @param isManager      the user manager
   */
  public UserProfileDto(Long id, String email, String tag, String speciality,
                        String profilePicture, LocalDate date, String teamName,
                        Long teamId, boolean isManager) {
    this.id = id;
    this.email = email;
    this.tag = tag;
    this.speciality = speciality;
    this.profilePicture = profilePicture;
    this.date = date;
    this.teamName = teamName;
    this.isManager = isManager;
    this.teamId = teamId;
  }

  public Long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getTag() {
    return tag;
  }

  public String getSpeciality() {
    return speciality;
  }

  public String getProfilePicture() {
    return profilePicture;
  }

  public LocalDate getDate() {
    return date;
  }

  public String getTeamName() {
    return teamName;
  }

  public boolean getIsManager() {
    return isManager;
  }

  public Long getTeamId() {
    return teamId;
  }
}