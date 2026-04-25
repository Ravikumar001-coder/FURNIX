package com.carpenter.dto.response;

import com.carpenter.model.ProductCategory;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * What the client receives when requesting product data.
 *
 * Notice: No sensitive fields here.
 * The entity has updatedAt — we choose not to include it.
 * We control EXACTLY what the client sees.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private ProductCategory category;
    private String imageUrl;
    private String arModelUrl;
    private String categoryName;
    private String material;
    private String dimensions;
    private String finishOptions;
    private String leadTime;
    private Boolean inStock;
    private Boolean active;
    private LocalDateTime createdAt;
}