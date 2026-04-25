package com.carpenter.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
@Slf4j
public class JwtUtils {

    @Value("${jwt.secret:${app.jwt.secret:}}")
    private String jwtSecret;

    @Value("${jwt.access-expiration-ms:${app.jwt.expiration:900000}}")
    private long jwtExpiration;   // milliseconds

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generate JWT token for a given username.
     */
    public String generateToken(String username) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extract username from token.
     */
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Get expiration time in seconds (for AuthResponse).
     */
    public long getExpirationSeconds() {
        return jwtExpiration / 1000;
    }

    /**
     * Check if token is valid (not expired, not tampered).
     */
    public boolean validateToken(String token) {
        try {
            getClaims(token);  // throws if invalid
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired");
        } catch (UnsupportedJwtException e) {
            log.warn("JWT token is unsupported");
        } catch (MalformedJwtException e) {
            log.warn("JWT token is malformed");
        } catch (IllegalArgumentException e) {
            log.warn("JWT token is empty or null");
        }
        return false;
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
