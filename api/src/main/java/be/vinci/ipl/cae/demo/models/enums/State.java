package be.vinci.ipl.cae.demo.models.enums;

/**
  * Represents the lifecycle state of a project.
  */
public enum State {
  IN_PREPARATION("En préparation"),
  ONGOING("En cours"),
  FINISHED("Terminé"),
  PLANIFIED("Planifié");

  private final String displayName;

  State(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return displayName;
  }
}

