package com.carpenter.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "CurrentUserResponse", description = "Authenticated user profile")
public class CurrentUserResponse {
    private String username;
    private String role;
    private String fullName;
    private String profilePicture;
    private String provider;
}
