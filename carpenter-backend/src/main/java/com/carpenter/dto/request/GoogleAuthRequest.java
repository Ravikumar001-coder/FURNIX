package com.carpenter.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {
    @NotBlank(message = "Google token is required")
    private String token;
}
