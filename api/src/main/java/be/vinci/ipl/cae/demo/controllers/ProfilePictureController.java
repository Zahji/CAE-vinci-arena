package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.repositories.ProfilePictureRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ProfilePictureController to expose profile picture options.
 */
@RestController
@RequestMapping("/profile-pictures")
public class ProfilePictureController {

  private final ProfilePictureRepository profilePictureRepository;

  /**
   * Constructor for ProfilePictureController.
   *
   * @param profilePictureRepository the injected ProfilePictureRepository.
   */
  public ProfilePictureController(ProfilePictureRepository profilePictureRepository) {
    this.profilePictureRepository = profilePictureRepository;
  }

  /**
   * Get all available profile picture URLs.
   *
   * @return list of profile picture URLs
   */
  @GetMapping
  public List<String> readAll() {
    return profilePictureRepository.findAllUrls();
  }
}