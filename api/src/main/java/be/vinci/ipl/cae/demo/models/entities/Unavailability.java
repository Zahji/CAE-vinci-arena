package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

/**
 * Unavailability entity.
 */
@Entity
@Table(name = "unavailabilities")
public class Unavailability {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private LocalDate startDate;

  @Column(nullable = false)
  private LocalDate endDate;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  @JsonIgnoreProperties({"password", "speciality", "hibernateLazyInitializer", "handler"})
  private User user;

  /**
   * Get the unavailability id.
   *
   * @return the id.
   */
  public Long getId() {
    return id;
  }

  /**
   * Get the start date.
   *
   * @return the start date.
   */
  public LocalDate getStartDate() {
    return startDate;
  }

  /**
   * Get the end date.
   *
   * @return the end date.
   */
  public LocalDate getEndDate() {
    return endDate;
  }

  /**
   * Get the user.
   *
   * @return the user.
   */
  public User getUser() {
    return user;
  }

  /**
   * Set the start date.
   *
   * @param startDate the start date.
   */
  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  /**
   * Set the end date.
   *
   * @param endDate the end date.
   */
  public void setEndDate(LocalDate endDate) {
    this.endDate = endDate;
  }

  /**
   * Set the user.
   *
   * @param user the user.
   */
  public void setUser(User user) {
    this.user = user;
  }
}