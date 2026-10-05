package be.vinci.ipl.cae.demo.models.dtos;

/**
 * AuthenticatedUser DTO.
 */
public class AuthenticatedUser {

  private Long id;
  private String email;
  private String tag;
  private boolean isAdmin;
  private Long teamId;
  private String token;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public String getTag() {
    return tag;
  }

  public boolean isAdmin() {
    return isAdmin;
  }

  public Long getTeamId() {
    return teamId;
  }

  public String getToken() {
    return token;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setTag(String tag) {
    this.tag = tag;
  }

  public void setAdmin(boolean isAdmin) {
    this.isAdmin = isAdmin;
  }

  public void setTeamId(Long teamId) {
    this.teamId = teamId;
  }

  public void setToken(String token) {
    this.token = token;
  }
}
