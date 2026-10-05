package be.vinci.ipl.cae.demo.controllers;

import be.vinci.ipl.cae.demo.repositories.SpecialityRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SpecialityController to expose speciality options.
 */
@RestController
@RequestMapping("/specialities")
public class SpecialityController {

  private final SpecialityRepository specialityRepository;

  /**
   * Constructor for SpecialityController.
   *
   * @param specialityRepository the injected SpecialityRepository.
   */
  public SpecialityController(SpecialityRepository specialityRepository) {
    this.specialityRepository = specialityRepository;
  }

  /**
   * Get all available speciality names.
   *
   * @return list of speciality names
   */
  @GetMapping
  public List<String> readAll() {
    return specialityRepository.findAllNames();
  }
}
