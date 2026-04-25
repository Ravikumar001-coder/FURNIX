package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a custom furniture order from a customer.
 *
 * Note: We use @Table(name = "orders") but "orders" is fine.
 * Some databases have "order" as a reserved keyword,
 * so "orders" (plural) is safer.
 */
@Entity
@Table(name = "orders",
       indexes = {
           @Index(name = "idx_order_status",   columnList = "status"),
           @Index(name = "idx_order_email",    columnList = "email"),
           @Index(name = "idx_order_created",  columnList = "created_at"),
           @Index(name = "idx_order_idempotency", columnList = "idempotency_key")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Customer Info ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    // ─── Order Details ───────────────────────────────────
    @Column(name = "product_type", nullable = false, length = 100)
    private String productType;

    @Column(name = "custom_description", columnDefinition = "TEXT")
    private String customDescription;

    // Reference image uploaded by customer
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // ─── Admin Notes ─────────────────────────────────────
    // Admin can add notes about this order
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    // Used to guarantee safe retries from clients.
    @Column(name = "idempotency_key", unique = true, length = 120)
    private String idempotencyKey;

    // ─── Status ──────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

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