package com.carpenter.controller;

import com.carpenter.dto.request.AuthRequest;
import com.carpenter.dto.request.ChangePasswordRequest;
import com.carpenter.dto.request.GoogleAuthRequest;
import com.carpenter.dto.request.RegisterRequest;
import com.carpenter.dto.request.SocialLoginRequest;
import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.AuthResponse;
import com.carpenter.dto.response.CurrentUserResponse;
import com.carpenter.exception.BadRequestException;
import com.carpenter.model.RefreshToken;
import com.carpenter.security.JwtUtils;
import com.carpenter.service.AuthService;
import com.carpenter.service.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth", "/api/v2/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtils jwtUtils;

    @Value("${app.auth.refresh-cookie.secure:false}")
    private boolean refreshCookieSecure;

    @Value("${app.auth.refresh-cookie.same-site:Lax}")
    private String refreshCookieSameSite;

    @Value("${app.auth.refresh-cookie.path:/api/auth}")
    private String refreshCookiePath;

    private HttpHeaders createRefreshCookieHeader(String username) {
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(username);
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE,
                buildRefreshCookie(refreshToken.getToken(), refreshTokenService.getRefreshTokenDurationSeconds()).toString());
        return headers;
    }

    private HttpHeaders clearRefreshCookieHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, buildRefreshCookie("", 0).toString());
        return headers;
    }

    private ResponseCookie buildRefreshCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path(refreshCookiePath)
                .maxAge(maxAgeSeconds)
                .build();
    }

    @Operation(summary = "Admin login")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                        \"success\": true,
                                        \"message\": \"Login successful\",
                                        \"data\": {
                                            \"token\": \"eyJ...\",
                                            \"tokenType\": \"Bearer\",
                                            \"username\": \"admin\",
                                            \"role\": \"ROLE_ADMIN\",
                                            \"expiresIn\": 900
                                        },
                                        \"timestamp\": \"2026-04-18T18:00:00\"
                                    }
                                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      \"username\": \"admin\",
                                      \"password\": \"admin123\"
                                    }
                                    """)))
            @Valid @RequestBody AuthRequest request) {

        AuthResponse response = authService.login(request);
        HttpHeaders headers = createRefreshCookieHeader(response.getUsername());
        return ResponseEntity.ok().headers(headers).body(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        HttpHeaders headers = createRefreshCookieHeader(response.getUsername());
        return ResponseEntity.ok().headers(headers).body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        AuthResponse response = authService.googleLogin(request.getToken());
        HttpHeaders headers = createRefreshCookieHeader(response.getUsername());
        return ResponseEntity.ok().headers(headers).body(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/social-login")
    public ResponseEntity<ApiResponse<AuthResponse>> socialLogin(@Valid @RequestBody SocialLoginRequest request) {
        AuthResponse response = authService.socialLogin(request);
        HttpHeaders headers = createRefreshCookieHeader(response.getUsername());
        return ResponseEntity.ok().headers(headers).body(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> me(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        CurrentUserResponse response = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Current user fetched", response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody com.carpenter.dto.request.UpdateProfileRequest request) {
        
        if (userDetails == null) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        
        CurrentUserResponse response = authService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String requestRefreshToken) {

        if (requestRefreshToken == null) {
            throw new BadRequestException("Refresh token is empty");
        }

        String username = refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUsername)
                .orElseThrow(() -> new BadRequestException("Refresh token is not in database"));

        AuthResponse response = authService.buildAuthResponse(username, jwtUtils.generateToken(username));
        HttpHeaders headers = createRefreshCookieHeader(username);

        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            @CookieValue(name = "refreshToken", required = false) String requestRefreshToken) {

        if (userDetails != null) {
            refreshTokenService.deleteByUsername(userDetails.getUsername());
        }

        if (requestRefreshToken != null && !requestRefreshToken.isBlank()) {
            refreshTokenService.deleteByToken(requestRefreshToken);
        }

        return ResponseEntity.ok()
                .headers(clearRefreshCookieHeader())
                .body(ApiResponse.success("Logged out successfully"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {

        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
