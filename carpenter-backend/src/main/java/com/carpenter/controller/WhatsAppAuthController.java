package com.carpenter.controller;

import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.AuthResponse;
import com.carpenter.model.RefreshToken;
import com.carpenter.service.WhatsAppAuthService;
import com.carpenter.service.RefreshTokenService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/whatsapp")
@RequiredArgsConstructor
public class WhatsAppAuthController {

    private final WhatsAppAuthService whatsappAuthService;
    private final RefreshTokenService refreshTokenService;

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

    private ResponseCookie buildRefreshCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path(refreshCookiePath)
                .maxAge(maxAgeSeconds)
                .build();
    }

    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<Void>> requestOtp(@RequestBody OtpRequest request) {
        whatsappAuthService.requestOtp(request.getPhoneNumber());
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully via WhatsApp"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@RequestBody OtpVerifyRequest request) {
        AuthResponse response = whatsappAuthService.verifyOtp(request.getPhoneNumber(), request.getCode());
        HttpHeaders headers = createRefreshCookieHeader(response.getUsername());
        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.success("Login successful", response));
    }

    @Data
    public static class OtpRequest {
        private String phoneNumber;
    }

    @Data
    public static class OtpVerifyRequest {
        private String phoneNumber;
        private String code;
    }
}
