package be.vinci.ipl.cae.demo.models.dtos;

/**
 * Credentials DTO.
 */
public class Credentials {

  private String email;
  private String password;

  /**
   * No-arg constructor.
   */
  public Credentials() {
    // empty for deserialization
  }

  /**
   * Constructor.
   */
  public Credentials(String email, String password) {
    this.email = email;
    this.password = password;
  }

  public String getEmail() {
    return email;
  }

  public String getPassword() {
    return password;
  }
}
