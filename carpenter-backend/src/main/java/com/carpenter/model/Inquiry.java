package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a custom furniture inquiry (project brief) submitted by a customer.
 */
@Entity
@Table(name = "inquiries",
       indexes = {
           @Index(name = "idx_inquiry_status", columnList = "status_v2"),
           @Index(name = "idx_inquiry_email", columnList = "email"),
           @Index(name = "idx_inquiry_created", columnList = "created_at")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Customer Info ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String area;

    // ─── Project Requirements ────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "piece_type", length = 50)
    private PieceType pieceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", length = 50)
    private RoomType roomType;

    // Can store WxHxD or JSON format
    @Column(length = 255)
    private String dimensions;

    @Column(name = "material_preference", length = 100)
    private String materialPreference;

    @Column(name = "finish_preference", length = 100)
    private String finishPreference;

    @Column(name = "budget_min")
    private Double budgetMin;

    @Column(name = "budget_max")
    private Double budgetMax;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Timeline timeline;

    @Column(name = "site_visit_required")
    private Boolean siteVisitRequired;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Can store a comma separated list of URLs or a single URL for MVP
    @Column(name = "reference_images", columnDefinition = "TEXT")
    private String referenceImages;

    // ─── Admin Fields ────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "status_v2", nullable = false, length = 50)
    @Builder.Default
    private InquiryStatus status = InquiryStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    @Builder.Default
    private InquiryPriority priority = InquiryPriority.MEDIUM;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "idempotency_key", unique = true, length = 100)
    private String idempotencyKey;

    // ─── Timestamps ──────────────────────────────────────
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
