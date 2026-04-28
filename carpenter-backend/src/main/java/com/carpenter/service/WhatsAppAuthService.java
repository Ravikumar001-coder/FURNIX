package com.carpenter.service;

import com.carpenter.dto.response.AuthResponse;
import com.carpenter.exception.BadRequestException;
import com.carpenter.model.AuthProvider;
import com.carpenter.model.Customer;
import com.carpenter.model.OtpCode;
import com.carpenter.repository.CustomerRepository;
import com.carpenter.repository.OtpCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppAuthService {

    private final OtpCodeRepository otpCodeRepository;
    private final NotificationService notificationService;
    private final CustomerRepository customerRepository;
    private final AuthService authService;
    private final com.carpenter.security.JwtUtils jwtUtils;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private static final int OTP_EXPIRY_MINUTES = 5;

    @Transactional
    public void requestOtp(String phoneNumber) {
        // Clean phone number (remove spaces, etc.)
        String cleanPhone = phoneNumber.replaceAll("[^0-9]", "");
        if (cleanPhone.length() < 10) {
            throw new BadRequestException("Invalid phone number format");
        }

        // Generate 6 digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save OTP
        OtpCode otpCode = OtpCode.builder()
                .phoneNumber(cleanPhone)
                .code(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        otpCodeRepository.save(otpCode);

        // Send OTP via WhatsApp
        String message = String.format("Your Furnix verification code is: %s. Valid for %d minutes.", otp, OTP_EXPIRY_MINUTES);
        notificationService.sendWhatsApp(cleanPhone, message);
        
        log.info("OTP [{}] requested and sent to phone: {}", otp, cleanPhone);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AuthResponse verifyOtp(String phoneNumber, String code) {
        String cleanPhone = phoneNumber.replaceAll("[^0-9]", "");

        LocalDateTime now = LocalDateTime.now();
        int updated = otpCodeRepository.markUsedIfValid(cleanPhone, code.trim(), now);
        if (updated == 0) {
            OtpCode latest = otpCodeRepository.findTopByPhoneNumberOrderByCreatedAtDesc(cleanPhone)
                    .orElseThrow(() -> new BadRequestException("No OTP found for this number"));
            if (latest.getExpiryTime().isBefore(now)) {
                log.warn("OTP expired for phone: {}", cleanPhone);
                throw new BadRequestException("OTP has expired");
            }
            log.warn("Invalid OTP code provided for phone: {}", cleanPhone);
            throw new BadRequestException("Invalid OTP code");
        }

        // Find or create customer
        Customer customer = customerRepository.findByPhone(cleanPhone).orElseGet(() -> {
            log.info("Creating new customer for WhatsApp login: {}", cleanPhone);
            Customer newCustomer = Customer.builder()
                    .phone(cleanPhone)
                    .fullName(null) // User will be asked to complete this
                    .role("ROLE_USER")
                    .provider(AuthProvider.WHATSAPP)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .accountNonLocked(true)
                    .build();
            return customerRepository.save(newCustomer);
        });

        // Ensure provider is updated if it was previously different
        if (customer.getProvider() == AuthProvider.LOCAL && (customer.getPhone() == null || customer.getPhone().equals(cleanPhone))) {
            customer.setProvider(AuthProvider.WHATSAPP);
            customer.setPhone(cleanPhone);
            customerRepository.save(customer);
        }

        // Generate Token
        // Use email if available, otherwise phone
        String identifier = customer.getEmail() != null ? customer.getEmail() : customer.getPhone();
        String token = jwtUtils.generateToken(identifier);
        
        log.info("Successfully verified OTP and generated token for: {}", identifier);
        return authService.buildAuthResponseFromCustomer(customer, token);
    }
}
