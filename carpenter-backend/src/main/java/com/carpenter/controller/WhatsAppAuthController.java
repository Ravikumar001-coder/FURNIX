package com.carpenter.controller;

import com.carpenter.dto.response.AuthResponse;
import com.carpenter.service.WhatsAppAuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/whatsapp")
@RequiredArgsConstructor
public class WhatsAppAuthController {

    private final WhatsAppAuthService whatsappAuthService;

    @PostMapping("/request-otp")
    public ResponseEntity<String> requestOtp(@RequestBody OtpRequest request) {
        whatsappAuthService.requestOtp(request.getPhoneNumber());
        return ResponseEntity.ok("OTP sent successfully via WhatsApp");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody OtpVerifyRequest request) {
        AuthResponse response = whatsappAuthService.verifyOtp(request.getPhoneNumber(), request.getCode());
        return ResponseEntity.ok(response);
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
