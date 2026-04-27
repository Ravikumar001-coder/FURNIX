package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = true, length = 100)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(nullable = false, length = 30)
    private String role; // e.g. "ROLE_USER"

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "provider_id")
    private String providerId;

    @Builder.Default
    @Column(name = "account_non_locked")
    private Boolean accountNonLocked = true;

    @Builder.Default
    @Column(name = "failed_attempt")
    private Integer failedAttempt = 0;

    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    private String profilePicture;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (provider == null) {
            provider = AuthProvider.LOCAL;
        }
    }
}
