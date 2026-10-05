package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Service for managing notification-related HTTP requests.
 */
@Service
public class NotificationService {

  private final NotificationRepository repository;

  /**
   * Constructor for NotificationService.
   *
   * @param repository     the notification repository
   */

  public NotificationService(NotificationRepository repository) {
    this.repository = repository;
  }

  /**
   * Get all notifications for a specific user.
   *
   * @param userId the user ID
   * @return list of notifications
   */
  public Iterable<Notification> getNotificationsForUser(Long userId) {
    return repository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  /**
   * Get a notification by its ID and user ID.
   *
   * @param notificationId the notification ID
   * @param userId         the user ID
   * @return the notification if found
   */
  public Optional<Notification> getNotificationById(Long notificationId, Long userId) {
    return repository.findByNotificationIdAndUserId(notificationId, userId);
  }

  /**
   * Mark a notification as read.
   *
   * @param notification the notification ID
   */
  public void markNotificationAsRead(Notification notification) {
    notification.setIsRead(true);
    repository.save(notification);
  }

  /**
   * Set membership ID if notification is a team invitation.
   *
   * @param notif the notification
   * @param dto   the notification data
   */
  private void setMembershipIfInvitation(Notification notif, NotificationDto dto) {
    if (dto.getType() == NotificationType.TEAM_INVITATION) {
      notif.setMembershipId(dto.getMembershipId());
    }
  }

  /**
   * Build a notification for a user.
   *
   * @param user the user
   * @param dto  the notification data
   * @return the built notification
   */
  public Notification buildNotification(User user, NotificationDto dto) {
    Notification notif = new Notification();
    notif.setUser(user);
    notif.setObject(dto.getObject());
    notif.setMessage(dto.getMessage());
    notif.setType(dto.getType());
    setMembershipIfInvitation(notif, dto);
    return notif;
  }

  /**
   * Save a notification.
   *
   * @param notification the notification to save
   * @return the saved notification
   */
  public Notification saveNotification(Notification notification) {
    return repository.save(notification);
  }

  /**
   * Build and save a notification for a user.
   *
   * @param user the user
   * @param dto  the notification data
   * @return the saved notification
   */
  public Notification createNotification(User user, NotificationDto dto) {
    return saveNotification(buildNotification(user, dto));
  }
}