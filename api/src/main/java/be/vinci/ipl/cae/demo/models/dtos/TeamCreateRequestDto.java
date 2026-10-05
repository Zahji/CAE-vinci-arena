package be.vinci.ipl.cae.demo.models.dtos;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload for creating a new team.
 */
public class TeamCreateRequestDto {

  @NotBlank(message = "Le nom de l'équipe est obligatoire")
  private String name;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}