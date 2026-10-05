
package be.vinci.ipl.cae.demo.models.dtos;

import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object for Notification entities.
 * Used to transfer notification data between layers without exposing the entity.
 */

public class NotificationDto {

  @NotNull
  private Long userId;

  @NotBlank
  @Size(max = 100)
  private String object;

  @NotBlank
  @Size(max = 500)
  private String message;

  private boolean isRead;

  private NotificationType type = NotificationType.GENERAL;

  private Long membershipId;

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  // CPD-OFF
  public String getObject() {
    return object;
  }

  public void setObject(String object) {
    this.object = object;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public boolean isIsRead() {
    return isRead;
  }

  public void setIsRead(boolean isRead) {
    this.isRead = isRead;
  }

  public NotificationType getType() {
    return type;
  }

  public void setType(NotificationType type) {
    this.type = type;
  }

  public Long getMembershipId() {
    return membershipId;
  }

  public void setMembershipId(Long membershipId) {
    this.membershipId = membershipId;
  }

  // CPD-ON
}