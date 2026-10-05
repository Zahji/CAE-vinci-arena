package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.models.enums.AdministrationActionType;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Administration service.
 */
@Service
public class AdministrationService {

  private final UserRepository userRepository;
  private final NotificationService notificationService;

  /**
   * Administration Service ctor.
   *
   * @param userRepository the user repository
   */
  public AdministrationService(UserRepository userRepository,
                               NotificationService notificationService) {
    this.userRepository = userRepository;
    this.notificationService = notificationService;
  }

  public Iterable<User> getAllAdmins() {
    return userRepository.findAllByIsAdminTrue();
  }

  /**
   * Get all non-admin users.
   *
   * @return all non-admin users
   */
  public Iterable<User> getAllNonAdmins() {
    return userRepository.findAllByIsAdminFalse();
  }

  /**
   * Promote a user to admin.
   *
   * @param userId the user id
   * @return true if the user was promoted, false if the user does not exist
   */
  public boolean promoteToAdmin(Long userId) {
    Optional<User> user = userRepository.findById(userId);
    if (user.isEmpty()) {
      return false;
    }

    User userEntity = user.get();
    if (userEntity.isAdmin()) {
      return false;
    }

    userEntity.setAdmin(true);
    userRepository.save(userEntity);

    sendNotification(AdministrationActionType.PROMOTED, userEntity);
    return true;
  }

  /**
   * Demote an admin user to regular member.
   * If the caller is demoting themselves, there must be at least one other admin.
   *
   * @param userId   the user id to demote
   * @param callerId the id of the authenticated admin performing the action
   * @return {@code true} if demoted, {@code false} if user missing or not admin,
   *     {@code null} if the caller is the last admin and tries to demote themselves
   */
  public Boolean demoteFromAdmin(Long userId, Long callerId) {
    Optional<User> user = userRepository.findById(userId);
    if (user.isEmpty()) {
      return false;
    }

    User userEntity = user.get();
    if (!userEntity.isAdmin()) {
      return false;
    }

    if (userId.equals(callerId)) {
      long adminCount = userRepository.countByIsAdminTrue();
      if (adminCount <= 1) {
        return null;
      }
    }

    userEntity.setAdmin(false);
    userRepository.save(userEntity);

    sendNotification(AdministrationActionType.DEMOTED, userEntity);
    return true;
  }

  private void sendNotification(AdministrationActionType type, User user) {
    NotificationDto notificationDto = new NotificationDto();

    switch (type) {
      case PROMOTED -> {
        notificationDto.setObject("Vous avez été promu administrateur !");
        notificationDto.setMessage("Votre compte a été promu au rang d'administrateur. "
            + "Un grand pouvoir implique de grandes responsabilités :)");
      }
      case DEMOTED -> {
        notificationDto.setObject("Vous avez été rétrogradé.");
        notificationDto.setMessage("Votre statut d'administrateur a été révoqué.");
      }
      default -> {
        return;
      }
    }

    notificationDto.setType(NotificationType.GENERAL);
    notificationService.createNotification(user, notificationDto);
  }
}
