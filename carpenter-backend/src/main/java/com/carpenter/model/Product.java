package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a furniture product in the portfolio.
 *
 * WHY BigDecimal for price, not double or float?
 *
 * double: 0.1 + 0.2 = 0.30000000000000004 (floating point error)
 * BigDecimal: 0.1 + 0.2 = 0.3 (exact)
 *
 * For money, ALWAYS use BigDecimal. Never use double/float.
 */
@Entity
@Table(name = "products",
       indexes = {
           // Database index on category for faster filtering
           @Index(name = "idx_product_category", columnList = "category")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)  // Saves "CHAIR" in DB, not 0
    @Column(nullable = false, length = 30)
    private ProductCategory category;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "ar_model_url", length = 500)
    private String arModelUrl;

    @Column(length = 100)
    private String material;

    @Column(length = 100)
    private String dimensions;

    @Column(length = 100)
    private String finishOptions;

    @Column(name = "lead_time", length = 50)
    private String leadTime;

    @Column(name = "in_stock", nullable = false)
    @Builder.Default
    private Boolean inStock = true;

    // Is this product active/visible to customers?
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

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