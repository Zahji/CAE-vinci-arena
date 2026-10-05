package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.enums.AdministrationActionType;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.UserRepository;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdministrationServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private AdministrationService administrationService;

  @Test
  void getAllAdminsReturnsRepositoryAdmins() {
    Iterable<User> admins = List.of(new User(), new User());
    when(userRepository.findAllByIsAdminTrue()).thenReturn(admins);

    Iterable<User> result = administrationService.getAllAdmins();

    assertSame(admins, result);
    verify(userRepository).findAllByIsAdminTrue();
  }

  @Test
  void getAllNonAdminsReturnsRepositoryNonAdmins() {
    Iterable<User> nonAdmins = List.of(new User(), new User());
    when(userRepository.findAllByIsAdminFalse()).thenReturn(nonAdmins);

    Iterable<User> result = administrationService.getAllNonAdmins();

    assertSame(nonAdmins, result);
    verify(userRepository).findAllByIsAdminFalse();
  }

  @Test
  void promoteToAdminReturnsFalseWhenUserNotFound() {
    when(userRepository.findById(1L)).thenReturn(Optional.empty());

    boolean result = administrationService.promoteToAdmin(1L);

    assertFalse(result);
    verify(userRepository, never()).save(any());
    verify(notificationService, never()).createNotification(any(), any());
  }

  @Test
  void promoteToAdminReturnsFalseWhenAlreadyAdmin() {
    User user = new User();
    user.setAdmin(true);
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));

    boolean result = administrationService.promoteToAdmin(1L);

    assertFalse(result);
    verify(userRepository, never()).save(any());
    verify(notificationService, never()).createNotification(any(), any());
  }

  @Test
  void promoteToAdminPromotesUserAndSendsNotification() {
    User user = new User();
    user.setAdmin(false);
    when(userRepository.findById(2L)).thenReturn(Optional.of(user));

    boolean result = administrationService.promoteToAdmin(2L);

    assertTrue(result);
    assertTrue(user.isAdmin());
    verify(userRepository).save(user);
    verify(notificationService).createNotification(any(User.class), any(NotificationDto.class));
  }

  @Test
  void demoteFromAdminReturnsFalseWhenUserNotFound() {
    when(userRepository.findById(1L)).thenReturn(Optional.empty());

    Boolean result = administrationService.demoteFromAdmin(1L, 99L);

    assertEquals(Boolean.FALSE, result);
    verify(userRepository, never()).save(any());
    verify(notificationService, never()).createNotification(any(), any());
  }

  @Test
  void demoteFromAdminReturnsFalseWhenNotAdmin() {
    User user = new User();
    user.setAdmin(false);
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));

    Boolean result = administrationService.demoteFromAdmin(1L, 99L);

    assertEquals(Boolean.FALSE, result);
    verify(userRepository, never()).save(any());
    verify(notificationService, never()).createNotification(any(), any());
  }

  @Test
  void demoteFromAdminDemotesUserAndSendsNotification() {
    User user = new User();
    user.setAdmin(true);
    when(userRepository.findById(2L)).thenReturn(Optional.of(user));

    Boolean result = administrationService.demoteFromAdmin(2L, 99L);

    assertEquals(Boolean.TRUE, result);
    assertFalse(user.isAdmin());
    verify(userRepository).save(user);
    verify(notificationService).createNotification(any(User.class), any(NotificationDto.class));
  }

  @Test
  void demoteFromAdminReturnsNullWhenCallerIsLastAdmin() {
    User user = new User();
    user.setAdmin(true);
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(userRepository.countByIsAdminTrue()).thenReturn(1L);

    assertNull(administrationService.demoteFromAdmin(1L, 1L));

    verify(userRepository, never()).save(any());
    verify(notificationService, never()).createNotification(any(), any());
  }

  @Test
  void demoteFromAdminAllowsSelfDemotionWhenOtherAdminsExist() {
    User user = new User();
    user.setAdmin(true);
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(userRepository.countByIsAdminTrue()).thenReturn(2L);

    Boolean result = administrationService.demoteFromAdmin(1L, 1L);

    assertEquals(Boolean.TRUE, result);
    assertFalse(user.isAdmin());
    verify(userRepository).save(user);
    verify(notificationService).createNotification(any(User.class), any(NotificationDto.class));
  }

  @Test
  void sendNotificationDoesNothingWhenActionTypeIsUnknown() throws Exception {
    User user = new User();

    Method sendNotification = AdministrationService.class.getDeclaredMethod(
        "sendNotification", AdministrationActionType.class, User.class);
    sendNotification.setAccessible(true);

    sendNotification.invoke(administrationService, AdministrationActionType.UNKNOWN, user);

    verify(notificationService, never()).createNotification(any(), any());
  }
}

