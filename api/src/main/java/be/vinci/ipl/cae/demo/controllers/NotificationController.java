package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.NotificationService;
import be.vinci.ipl.cae.demo.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * RestController pour /notifications/ et /notifications.
 */
@PreAuthorize("isAuthenticated()")
@RestController
@RequestMapping("/notifications")
public class NotificationController {

  private final NotificationService service;
  private final UserService userService;

  /**
   * Constructor for NotificationController.
   *
   * @param service the notification service
   * @param userService the user service
   */
  public NotificationController(NotificationService service, UserService userService) {
    this.service = service;
    this.userService = userService;
  }

  /**
   * Get all notifications for the current user.
   *
   * @return list of notifications
   */
  @GetMapping({"/", ""})
  public Iterable<Notification> getNotifications(@AuthenticationPrincipal User user) {
    return service.getNotificationsForUser(user.getId());
  }

  /**
   * Get a single notification by its ID.
   *
   * @param id the notification ID
   * @return the notification
   */
  @GetMapping("/{id}")
  public Notification getNotification(@PathVariable Long id, @AuthenticationPrincipal User user) {
    return service.getNotificationById(id, user.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  /**
   * Mark a notification as read.
   *
   * @param id the notification ID
   */
  @PostMapping("/{id}/read")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void markAsRead(@PathVariable Long id, @AuthenticationPrincipal User user) {
    service.markNotificationAsRead(getNotification(id, user));
  }

  /**
   * Create a new notification.
   *
   * @param notificationDto the notification data
   * @return the created notification
   */
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/")
  @ResponseStatus(HttpStatus.CREATED)
  public Notification createNotification(@Valid @RequestBody NotificationDto notificationDto) {
    User user = userService.findUser(notificationDto.getUserId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    return service.saveNotification(service.buildNotification(user, notificationDto));
  }
}