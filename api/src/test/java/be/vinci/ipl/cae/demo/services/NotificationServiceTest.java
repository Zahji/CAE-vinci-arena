package be.vinci.ipl.cae.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import be.vinci.ipl.cae.demo.models.dtos.NotificationDto;
import be.vinci.ipl.cae.demo.models.entities.Notification;
import be.vinci.ipl.cae.demo.models.enums.NotificationType;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.NotificationRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

  @Mock
  private NotificationRepository repository;

  @InjectMocks
  private NotificationService notificationService;

  private User mockUser;
  private Notification mockNotification;
  private NotificationDto mockDto;

  @BeforeEach
  void setUp() {
    mockUser = new User();
    ReflectionTestUtils.setField(mockUser, "id", 1L);

    mockNotification = new Notification();
    mockNotification.setUser(mockUser);
    mockNotification.setObject("Test subject");
    mockNotification.setMessage("Test message");
    mockNotification.setType(NotificationType.WELCOME);
    mockNotification.setIsRead(false);

    mockDto = new NotificationDto();
    mockDto.setUserId(1L);
    mockDto.setObject("Test subject");
    mockDto.setMessage("Test message");
    mockDto.setType(NotificationType.WELCOME);
  }

  // -------------------------------------------------------------------------
  // getNotificationsForUser
  // -------------------------------------------------------------------------

  @Test
  void getNotificationsForUserReturnsNotificationsOrderedByDate() {
    List<Notification> notifications = List.of(mockNotification);
    when(repository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(notifications);

    Iterable<Notification> result = notificationService.getNotificationsForUser(1L);

    assertSame(notifications, result);
    verify(repository).findByUserIdOrderByCreatedAtDesc(1L);
  }

  @Test
  void getNotificationsForUserReturnsEmptyListWhenNoNotifications() {
    List<Notification> empty = List.of();
    when(repository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(empty);

    Iterable<Notification> result = notificationService.getNotificationsForUser(1L);

    assertNotNull(result);
    assertSame(empty, result);
  }

  // -------------------------------------------------------------------------
  // getNotificationById
  // -------------------------------------------------------------------------

  @Test
  void getNotificationByIdReturnsNotificationWhenFound() {
    when(repository.findByNotificationIdAndUserId(10L, 1L))
        .thenReturn(Optional.of(mockNotification));

    Optional<Notification> result = notificationService.getNotificationById(10L, 1L);

    assertTrue(result.isPresent());
    assertSame(mockNotification, result.get());
  }

  @Test
  void getNotificationByIdReturnsEmptyWhenNotFound() {
    when(repository.findByNotificationIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

    Optional<Notification> result = notificationService.getNotificationById(99L, 1L);

    assertTrue(result.isEmpty());
  }

  // -------------------------------------------------------------------------
  // markNotificationAsRead
  // -------------------------------------------------------------------------

  @Test
  void markNotificationAsReadSetsIsReadTrueAndSaves() {
    notificationService.markNotificationAsRead(mockNotification);

    assertTrue(mockNotification.isIsRead());
    verify(repository).save(mockNotification);
  }

  // -------------------------------------------------------------------------
  // buildNotification
  // -------------------------------------------------------------------------

  @Test
  void buildNotificationMapsAllFieldsCorrectly() {
    Notification result = notificationService.buildNotification(mockUser, mockDto);

    assertSame(mockUser, result.getUser());
    assertEquals("Test subject", result.getObject());
    assertEquals("Test message", result.getMessage());
    assertEquals(NotificationType.WELCOME, result.getType());
  }

  @Test
  void buildNotificationSetsMembershipIdWhenTypeIsTeamInvitation() {
    mockDto.setType(NotificationType.TEAM_INVITATION);
    mockDto.setMembershipId(42L);

    Notification result = notificationService.buildNotification(mockUser, mockDto);

    assertEquals(42L, result.getMembershipId());
  }

  @Test
  void buildNotificationDoesNotSetMembershipIdWhenTypeIsNotTeamInvitation() {
    mockDto.setType(NotificationType.WELCOME);
    mockDto.setMembershipId(42L);

    Notification result = notificationService.buildNotification(mockUser, mockDto);

    assertNull(result.getMembershipId());
  }

  // -------------------------------------------------------------------------
  // saveNotification
  // -------------------------------------------------------------------------

  @Test
  void saveNotificationReturnsPersistedNotification() {
    when(repository.save(mockNotification)).thenReturn(mockNotification);

    Notification result = notificationService.saveNotification(mockNotification);

    assertSame(mockNotification, result);
    verify(repository).save(mockNotification);
  }

  // -------------------------------------------------------------------------
  // createNotification
  // -------------------------------------------------------------------------

  @Test
  void createNotificationBuildsAndSavesWithCorrectFields() {
    when(repository.save(any(Notification.class))).thenAnswer(invocation ->
        invocation.getArgument(0));

    Notification result = notificationService.createNotification(mockUser, mockDto);

    ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
    verify(repository).save(captor.capture());
    assertSame(mockUser, captor.getValue().getUser());
    assertEquals("Test subject", captor.getValue().getObject());
    assertEquals("Test message", captor.getValue().getMessage());
    assertEquals(NotificationType.WELCOME, captor.getValue().getType());
    assertSame(result, captor.getValue());
  }
}