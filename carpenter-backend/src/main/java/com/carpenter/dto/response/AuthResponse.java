package com.carpenter.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "AuthResponse", description = "Authentication result")
public class AuthResponse {
    @Schema(example = "eyJhbGciOiJIUzI1NiJ9...")
    private String token;
    @Schema(example = "Bearer")
    private String tokenType = "Bearer";
    @Schema(example = "admin")
    private String username;
    @Schema(example = "ROLE_ADMIN")
    private String role;
    @Schema(example = "86400")
    private long expiresIn;   // seconds until token expires

    // New profile fields
    private String fullName;
    private String profilePicture;
    private String provider;
}