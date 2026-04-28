package com.carpenter.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories",
       uniqueConstraints = {
           @UniqueConstraint(name = "uq_categories_slug", columnNames = "slug")
       },
       indexes = {
           @Index(name = "idx_categories_active_order", columnList = "active, display_order")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 120)
    private String slug;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Subcategory> subcategories = new ArrayList<>();
}
