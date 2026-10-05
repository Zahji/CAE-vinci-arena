package be.vinci.ipl.cae.demo.models.entities;

import be.vinci.ipl.cae.demo.models.enums.State;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Represents a tournament.
 */
@Entity
@Table(name = "tournaments")
public class Tournament {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true)
  private @NotNull @NotBlank String name;

  private @NotNull @NotBlank String description;

  private @NotNull LocalDate startDate;

  private @NotNull LocalDate endDate;

  private @NotNull LocalDate startInscriptionDate;

  private @NotNull LocalDate endInscriptionDate;

  @Min(value = 2, message = "Il doit y avoir au moins 2 équipes")
  private @NotNull int maxTeams;

  private @NotNull State state;

  private String winner;

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  public LocalDate getEndDate() {
    return endDate;
  }

  public void setEndDate(LocalDate endDate) {
    this.endDate = endDate;
  }

  public LocalDate getStartInscriptionDate() {
    return startInscriptionDate;
  }

  public void setStartInscriptionDate(LocalDate startInscriptionDate) {
    this.startInscriptionDate = startInscriptionDate;
  }

  public LocalDate getEndInscriptionDate() {
    return endInscriptionDate;
  }

  public void setEndInscriptionDate(LocalDate endInscriptionDate) {
    this.endInscriptionDate = endInscriptionDate;
  }

  public int getMaxTeams() {
    return maxTeams;
  }

  public void setMaxTeams(int maxTeams) {
    this.maxTeams = maxTeams;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public State getState() {
    return state;
  }

  public void setState(State state) {
    this.state = state;
  }

  public String getWinner() {
    return winner;
  }

  public void setWinner(String winner) {
    this.winner = winner;
  }
}
