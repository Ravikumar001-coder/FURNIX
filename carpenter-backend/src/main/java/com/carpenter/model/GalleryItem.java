package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Portfolio Gallery Item — represents a completed work showcase.
 * NO pricing. This is purely about demonstrating craftsmanship.
 */
@Entity
@Table(name = "gallery_items",
       indexes = {
           @Index(name = "idx_gallery_category", columnList = "category"),
           @Index(name = "idx_gallery_active", columnList = "active")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GalleryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Primary category (LIVING_ROOM, BEDROOM, KITCHEN, etc.)
     */
    @Column(nullable = false, length = 50)
    private String category;

    /**
     * Room type where this piece belongs
     */
    @Column(name = "room_type", length = 50)
    private String roomType;

    /**
     * Comma-separated list of materials (e.g., "Teak, Rosewood, Brass Hardware")
     */
    @Column(name = "materials_used", columnDefinition = "TEXT")
    private String materialsUsed;

    /**
     * Primary showcase image (displayed in grid)
     */
    @Column(name = "cover_image", length = 500)
    private String coverImage;

    /**
     * JSON array of image URLs stored as TEXT for multi-image support
     * Format: ["url1", "url2", ...]
     */
    @Column(name = "images", columnDefinition = "TEXT")
    private String images;

    /**
     * e.g., "3 months", "Custom dimensions", "Client testimonial snippet"
     */
    @Column(name = "project_duration", length = 100)
    private String projectDuration;

    @Column(name = "client_location", length = 100)
    private String clientLocation;

    @Column(name = "featured")
    @Builder.Default
    private Boolean featured = false;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

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
