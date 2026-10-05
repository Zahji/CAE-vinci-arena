package be.vinci.ipl.cae.demo.models.enums;

/**
 * Admin user-management action that may trigger a notification to the affected user.
 */
public enum AdministrationActionType {
  PROMOTED,
  DEMOTED,
  /** Defensive value for unexpected branches and tests. */
  UNKNOWN
}
