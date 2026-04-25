package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents an admin user who can manage the system.
 *
 * SECURITY RULES:
 * - Password is NEVER stored as plain text
 * - BCrypt hash is stored (irreversible)
 * - Even if DB is hacked, passwords can't be read
 */
@Entity
@Table(name = "admins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    // NEVER expose this in API responses!
    @Column(nullable = false)
    private String password;

    // Spring Security needs "ROLE_" prefix
    // Example: "ROLE_ADMIN"
    @Column(nullable = false, length = 30)
    private String role;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}