package com.carpenter.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OrderRequest {

    @NotBlank(message = "Your name is required")
    @Size(min = 2, max = 100, message = "Name must be 2–100 characters")
    private String customerName;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^[+]?[0-9]{10,15}$",
        message = "Enter a valid phone number (10-15 digits)"
    )
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Address is required")
    @Size(min = 10, message = "Please provide full address")
    private String address;

    @NotBlank(message = "Please specify what furniture you need")
    @Size(min = 2, max = 100, message = "Product type must be 2–100 characters")
    private String productType;

    // Optional: detailed requirements
    private String customDescription;

    // Optional: reference image URL (set after upload)
    private String imageUrl;
}