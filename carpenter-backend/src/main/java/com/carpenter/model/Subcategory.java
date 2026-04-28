package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subcategories",
       uniqueConstraints = {
           @UniqueConstraint(name = "uq_subcategories_category_slug", columnNames = {"category_id", "slug"})
       },
       indexes = {
           @Index(name = "idx_subcategories_category", columnList = "category_id"),
           @Index(name = "idx_subcategories_active_order", columnList = "active, display_order")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subcategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String slug;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
