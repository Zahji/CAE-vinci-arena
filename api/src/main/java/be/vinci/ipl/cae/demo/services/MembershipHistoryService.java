package be.vinci.ipl.cae.demo.services;

import be.vinci.ipl.cae.demo.models.entities.MembershipHistory;
import be.vinci.ipl.cae.demo.models.entities.Team;
import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.repositories.MembershipHistoryRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

/**
 * Service for managing membership history.
 */
@Service
public class MembershipHistoryService {

  private final MembershipHistoryRepository membershipHistoryRepository;

  /**
   * Constructor for MembershipHistoryService.
   *
   * @param membershipHistoryRepository the membership history repository
   */
  public MembershipHistoryService(MembershipHistoryRepository membershipHistoryRepository) {
    this.membershipHistoryRepository = membershipHistoryRepository;
  }

  /**
   * Save a past membership to history.
   *
   * @param member the user who left
   * @param team the team they left
   */
  public void saveToHistory(User member, Team team) {
    MembershipHistory history = new MembershipHistory();
    history.setMember(member);
    history.setTeam(team);
    history.setLeftAt(LocalDate.now());
    membershipHistoryRepository.save(history);
  }
}