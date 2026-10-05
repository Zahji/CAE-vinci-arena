package be.vinci.ipl.cae.demo.models.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

/**
 * Represents a team with a primary and secondary manager.
 */
@Entity
@Table(name = "teams")
public class Team {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  @NotBlank
  private String name;

  @OneToOne
  @JoinColumn(name = "manager_id", nullable = true)
  @JsonIgnore
  private User manager;

  @OneToOne
  @JoinColumn(name = "second_manager_id", nullable = true)
  @JsonIgnore
  private User secondManager;

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public User getManager() {
    return manager;
  }

  public User getSecondManager() {
    return secondManager;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setManager(User manager) {
    this.manager = manager;
  }

  public void setSecondManager(User secondManager) {
    this.secondManager = secondManager;
  }
}
