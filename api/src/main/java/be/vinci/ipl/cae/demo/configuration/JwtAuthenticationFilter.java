package be.vinci.ipl.cae.demo.configuration;

import be.vinci.ipl.cae.demo.models.entities.User;
import be.vinci.ipl.cae.demo.services.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JwtAuthenticationFilter to handle user authentication.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final UserService userService;

  /**
   * Constructor for JwtAuthenticationFilter.
   *
   * @param userService the injected UserService.
   */
  public JwtAuthenticationFilter(UserService userService) {
    this.userService = userService;
  }

  /**
   * Filter to handle user authentication.
   *
   * @param request     the request.
   * @param response    the response.
   * @param filterChain the filter chain.
   * @throws ServletException the servlet exception.
   * @throws IOException      the IO exception.
   */
  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header == null || header.isBlank()) {
      filterChain.doFilter(request, response);
      return;
    }

    Map<String, Object> claims = userService.getJwtClaimsFromToken(header);


    if (claims == null) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired JWT");
      return;
    }

    System.out.println("JWT claims = " + claims);
    System.out.println("admin raw = " + claims.get("isAdmin"));
    System.out.println("admin type = "
        + (claims.get("isAdmin") != null ? claims.get("isAdmin").getClass().getName() : "null"));

    String email = (String) claims.get("email");

    Object adminClaim = claims.get("isAdmin");
    boolean isAdmin = Boolean.TRUE.equals(adminClaim);

    System.out.println("isAdmin resolved = " + isAdmin);
    System.out.println("authorities will include ROLE_ADMIN = " + isAdmin);

    User user = userService.readOneFromUsername(email);
    if (user == null) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "User not found");
      return;
    }

    List<GrantedAuthority> authorities = new ArrayList<>();
    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
    if (isAdmin) {
      authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(user, null, authorities);
    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authentication);

    filterChain.doFilter(request, response);
  }
}