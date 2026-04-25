package com.carpenter.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * Runs on EVERY request, ONCE per request.
 *
 * Responsibility: Check if request has a valid JWT.
 * If yes: authenticate the user in Spring's Security Context.
 * If no:  let it pass — Security Config decides if route requires auth.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. Extract token from "Authorization: Bearer <token>" header
            String token = extractToken(request);

            // 2. If token exists and is valid
            if (token != null && jwtUtils.validateToken(token)) {

                // 3. Get username from token
                String username = jwtUtils.extractUsername(token);

                // 4. Load user from database
                UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

                // 5. Create authentication object
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );

                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 6. Set authentication in context
                // Now Spring Security knows this request is from an authenticated admin
                SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("Cannot set admin authentication: {}", e.getMessage());
        }

        // 7. Always continue the filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT from Authorization header.
     * Header format: "Bearer eyJhbGciOiJIUzI1NiJ9..."
     */
    private String extractToken(HttpServletRequest request) {
        String headerValue = request.getHeader("Authorization");

        if (StringUtils.hasText(headerValue) && headerValue.startsWith("Bearer ")) {
            return headerValue.substring(7);  // Remove "Bearer " prefix
        }
        return null;
    }
}