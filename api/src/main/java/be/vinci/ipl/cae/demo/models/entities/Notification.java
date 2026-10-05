package be.vinci.ipl.cae.demo.models.entities;

import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * Notification entity representing all user notifications + everything is not null.
 */

@Entity
@Table(name = "notifications")
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "notification_id")
  private Long notificationId;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;


  @Column(nullable = false, length = 100)
  @NotBlank
  private String object;


  @Column(nullable = false, length = 500)
  @NotBlank
  private String message;

  private  LocalDateTime createdAt;

  /**
   * Sets creation date before first persistence.
   */
  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }

  @Column(nullable = false)
  private boolean isRead = false;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private NotificationType type = NotificationType.GENERAL;

  @Column(nullable = true)
  private Long membershipId;

  public Long getNotificationId() {
    return notificationId;
  }

  public void setNotificationId(Long notificationId) {
    this.notificationId = notificationId;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
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

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
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
