package be.vinci.ipl.cae.demo.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import be.vinci.ipl.cae.demo.models.entities.MembershipHistory;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.MembershipHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MembershipHistoryServiceTest {

  @Mock
  private MembershipHistoryRepository membershipHistoryRepository;

  @InjectMocks
  private MembershipHistoryService membershipHistoryService;

  @Test
  void saveToHistorySavesCorrectEntity() {
    User member = new User();
    Team team = new Team();

    membershipHistoryService.saveToHistory(member, team);

    ArgumentCaptor<MembershipHistory> captor =
        ArgumentCaptor.forClass(MembershipHistory.class);
    verify(membershipHistoryRepository).save(captor.capture());

    MembershipHistory saved = captor.getValue();
    assert saved.getMember() == member;
    assert saved.getTeam() == team;
    assert saved.getLeftAt() != null;
  }
}