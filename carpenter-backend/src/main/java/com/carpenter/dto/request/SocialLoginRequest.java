package com.carpenter.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SocialLoginRequest {
    @NotBlank
    private String provider; // "GOOGLE" or "PHONE"
    
    @NotBlank
    private String token; // The actual OAuth token from Google / Provider
    
    private String providerId; // Can be null, fetched from token
    private String email;      // Can be null, fetched from token
    private String fullName;   // Can be null, fetched from token
}
