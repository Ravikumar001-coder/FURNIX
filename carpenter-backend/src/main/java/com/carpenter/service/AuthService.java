package com.carpenter.service;

import com.carpenter.dto.request.AuthRequest;
import com.carpenter.dto.request.ChangePasswordRequest;
import com.carpenter.dto.request.RegisterRequest;
import com.carpenter.dto.request.SocialLoginRequest;
import com.carpenter.dto.response.AuthResponse;
import com.carpenter.dto.response.CurrentUserResponse;
import com.carpenter.exception.BadRequestException;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.Admin;
import com.carpenter.model.AuthProvider;
import com.carpenter.model.Customer;
import com.carpenter.repository.AdminRepository;
import com.carpenter.repository.CustomerRepository;
import com.carpenter.security.JwtUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public AuthResponse login(AuthRequest request) {
        String username = request.getUsername().trim();
        log.info("Login attempt: {}", username);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        try {
            adminRepository.updateLastLogin(userDetails.getUsername(), LocalDateTime.now());
        } catch (Exception ex) {
            log.debug("User is not an admin, skipping lastLogin update");
        }

        log.info("Login successful: {}", userDetails.getUsername());
        return buildAuthResponse(userDetails.getUsername(), jwtUtils.generateToken(userDetails.getUsername()));
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", null));

        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);
        log.info("Password changed for admin: {}", username);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (customerRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email is already in use");
        }

        Customer customer = Customer.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role("ROLE_USER")
                .provider(AuthProvider.LOCAL)
                .accountNonLocked(true)
                .build();

        customerRepository.save(customer);
        return buildAuthResponse(customer.getEmail(), jwtUtils.generateToken(customer.getEmail()));
    }

    @Transactional
    public AuthResponse googleLogin(String googleToken) {
        GoogleProfile profile = verifyGoogleToken(googleToken);
        Customer customer = findOrCreateGoogleCustomer(profile);
        return buildAuthResponse(customer.getEmail(), jwtUtils.generateToken(customer.getEmail()));
    }

    @Transactional
    public AuthResponse socialLogin(SocialLoginRequest request) {
        if ("GOOGLE".equalsIgnoreCase(request.getProvider())) {
            return googleLogin(request.getToken());
        }
        throw new BadRequestException("Only Google social login is supported");
    }

    @Transactional
    public CurrentUserResponse updateProfile(String identifier, com.carpenter.dto.request.UpdateProfileRequest request) {
        Customer customer = customerRepository.findByEmail(identifier)
                .or(() -> customerRepository.findByPhone(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("User", null));

        if (request.getFullName() != null) {
            customer.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            customer.setPhone(request.getPhone());
        }
        if (request.getProfilePicture() != null) {
            customer.setProfilePicture(request.getProfilePicture());
        }

        customerRepository.save(customer);
        log.info("Profile updated for user: {}", identifier);
        return getCurrentUser(identifier);
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(String identifier) {
        Admin admin = adminRepository.findByUsername(identifier).orElse(null);
        if (admin != null) {
            return CurrentUserResponse.builder()
                    .username(admin.getUsername())
                    .role(admin.getRole())
                    .fullName(admin.getUsername())
                    .provider(AuthProvider.LOCAL.name())
                    .build();
        }

        Customer customer = customerRepository.findByEmail(identifier)
                .or(() -> customerRepository.findByPhone(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("User", null));

        return CurrentUserResponse.builder()
                .username(customer.getEmail() != null ? customer.getEmail() : customer.getPhone())
                .role(customer.getRole())
                .fullName(customer.getFullName())
                .profilePicture(customer.getProfilePicture())
                .provider(customer.getProvider() != null ? customer.getProvider().name() : AuthProvider.LOCAL.name())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse buildAuthResponse(String identifier, String accessToken) {
        CurrentUserResponse currentUser = getCurrentUser(identifier);
        return AuthResponse.builder()
                .token(accessToken)
                .tokenType("Bearer")
                .username(currentUser.getUsername())
                .role(currentUser.getRole())
                .expiresIn(jwtUtils.getExpirationSeconds())
                .fullName(currentUser.getFullName())
                .profilePicture(currentUser.getProfilePicture())
                .provider(currentUser.getProvider())
                .build();
    }

    public AuthResponse buildAuthResponseFromCustomer(Customer customer, String accessToken) {
        return AuthResponse.builder()
                .token(accessToken)
                .tokenType("Bearer")
                .username(customer.getEmail() != null ? customer.getEmail() : customer.getPhone())
                .role(customer.getRole())
                .expiresIn(jwtUtils.getExpirationSeconds())
                .fullName(customer.getFullName())
                .profilePicture(customer.getProfilePicture())
                .provider(customer.getProvider() != null ? customer.getProvider().name() : AuthProvider.LOCAL.name())
                .build();
    }

    private GoogleProfile verifyGoogleToken(String token) {
        if (!StringUtils.hasText(googleClientId)) {
            throw new BadRequestException("Google client ID is not configured");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(token);
            if (idToken == null) {
                throw new BadRequestException("Invalid Google token");
            }

            Payload payload = idToken.getPayload();
            if (!isEmailVerified(payload)) {
                throw new BadRequestException("Google account email is not verified");
            }

            String email = normalizeEmail(payload.getEmail());
            if (!StringUtils.hasText(email)) {
                throw new BadRequestException("Google account email is missing");
            }

            String subject = normalizeNullable(payload.getSubject());
            if (!StringUtils.hasText(subject)) {
                throw new BadRequestException("Google account identifier is missing");
            }

            String name = normalizeNullable(safeToString(payload.get("name")));
            String picture = normalizeNullable(safeToString(payload.get("picture")));

            return new GoogleProfile(email, name, picture, subject);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Google token verification failed", ex);
            throw new BadRequestException("Google token verification failed");
        }
    }

    private Customer findOrCreateGoogleCustomer(GoogleProfile profile) {
        Customer customer = customerRepository.findByEmail(profile.email()).orElse(null);
        if (customer == null) {
            Customer created = Customer.builder()
                    .email(profile.email())
                    .fullName(profile.name())
                    .profilePicture(profile.picture())
                    .provider(AuthProvider.GOOGLE)
                    .providerId(profile.subject())
                    .role("ROLE_USER")
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .accountNonLocked(true)
                    .build();
            return customerRepository.save(created);
        }

        if (customer.getProvider() == AuthProvider.GOOGLE 
                && StringUtils.hasText(customer.getProviderId()) 
                && !customer.getProviderId().equals(profile.subject())) {
            log.warn("Google providerId mismatch for email {}. Updating from {} to {}", 
                    customer.getEmail(), customer.getProviderId(), profile.subject());
        }

        if (customer.getProvider() != AuthProvider.GOOGLE) {
            log.info("Linking existing account {} with Google provider", customer.getEmail());
            customer.setProvider(AuthProvider.GOOGLE);
        }

        customer.setProviderId(profile.subject());
        customer.setAccountNonLocked(true);

        if (!StringUtils.hasText(customer.getPassword())) {
            customer.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        }

        if (StringUtils.hasText(profile.name())) {
            customer.setFullName(profile.name());
        }
        if (StringUtils.hasText(profile.picture())) {
            customer.setProfilePicture(profile.picture());
        }

        return customerRepository.save(customer);
    }

    private boolean isEmailVerified(Payload payload) {
        try {
            Boolean fromGetter = payload.getEmailVerified();
            if (fromGetter != null) {
                return fromGetter;
            }
        } catch (Exception ignored) {
            // Some libraries expose email_verified only in payload map.
        }

        Object raw = payload.get("email_verified");
        if (raw instanceof Boolean boolValue) {
            return boolValue;
        }
        if (raw instanceof String stringValue) {
            return Boolean.parseBoolean(stringValue);
        }
        return false;
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static String safeToString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private record GoogleProfile(String email, String name, String picture, String subject) {
    }
}
