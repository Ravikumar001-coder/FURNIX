package com.carpenter.dto.request;

import com.carpenter.model.ProductCategory;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 150, message = "Name must be 2–150 characters")
    private String name;

    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "1.00", message = "Price must be at least 1.00")
    @DecimalMax(value = "9999999.99", message = "Price is too high")
    private BigDecimal price;

    @NotNull(message = "Category is required")
    private ProductCategory category;

    // Optional: set after Cloudinary upload
    private String imageUrl;
    private String arModelUrl;

    private String material;
    private String dimensions;
    private String finishOptions;
    private String leadTime;
    private Boolean inStock = true;

    // Optional: admin can hide a product
    private Boolean active = true;
}