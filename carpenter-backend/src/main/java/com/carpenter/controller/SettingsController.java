package com.carpenter.controller;

import com.carpenter.dto.response.ApiResponse;
import com.carpenter.exception.BadRequestException;
import com.carpenter.model.SiteSetting;
import com.carpenter.repository.SiteSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/settings", "/api/v1/settings"})
@RequiredArgsConstructor
public class SettingsController {

    private final SiteSettingRepository settingRepository;
    private static final int MAX_SETTING_VALUE_LENGTH = 4000;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Set<String> ALLOWED_SETTING_KEYS = Set.of(
            "brand.name",
            "brand.slogan",
            "brand.logo",
            "hero.title",
            "hero.subtitle",
            "contact.whatsapp",
            "contact.phone",
            "contact.phone.primary",
            "contact.phone.support",
            "contact.email",
            "contact.email.primary",
            "contact.email.support",
            "location.address",
            "location.city",
            "location.region",
            "location.mapEmbedUrl",
            "hours.weekdays",
            "hours.saturday",
            "hours.sunday",
            "hours.notes",
            "social.instagram",
            "social.facebook",
            "social.whatsapp_link",
            "stats.homesFurnished",
            "stats.deliveryReach",
            "stats.warrantyYears",
            "stats.serviceArea",
            "trust.points",
            "seo.title",
            "seo.description",
            "seo.keywords",
            "og.title",
            "og.description"
    );

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getAllSettings() {
        Map<String, String> settings = settingRepository.findAll().stream()
                .collect(Collectors.toMap(SiteSetting::getSettingKey, SiteSetting::getSettingValue));
        
        return ResponseEntity.ok(ApiResponse.success("Settings fetched", settings));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Void>> updateSettings(@RequestBody Map<String, String> settingsMap) {
        validateSettings(settingsMap);

        List<SiteSetting> settings = settingsMap.entrySet().stream()
                .map(entry -> new SiteSetting(entry.getKey(), normalizeValue(entry.getKey(), entry.getValue())))
                .collect(Collectors.toList());
        
        settingRepository.saveAll(settings);
        
        return ResponseEntity.ok(ApiResponse.success("Settings updated successfully"));
    }

    private void validateSettings(Map<String, String> settingsMap) {
        if (settingsMap == null || settingsMap.isEmpty()) {
            throw new BadRequestException("Settings payload cannot be empty");
        }

        List<String> unsupportedKeys = settingsMap.keySet().stream()
                .filter(key -> !ALLOWED_SETTING_KEYS.contains(key))
                .sorted()
                .toList();

        if (!unsupportedKeys.isEmpty()) {
            throw new BadRequestException(
                    "Unsupported setting keys: " + String.join(", ", unsupportedKeys)
            );
        }

        settingsMap.forEach((key, value) -> validateSettingValue(key, Objects.toString(value, "")));
    }

    private void validateSettingValue(String key, String value) {
        if (value.length() > MAX_SETTING_VALUE_LENGTH) {
            throw new BadRequestException("Setting value too long for key: " + key);
        }

        if (key.startsWith("contact.email")
                && !value.isBlank()
                && !EMAIL_PATTERN.matcher(value).matches()) {
            throw new BadRequestException("Invalid email format for key: " + key);
        }

        if ("contact.whatsapp".equals(key) && !value.isBlank()) {
            String digitsOnly = value.replaceAll("\\D", "");
            if (digitsOnly.length() < 8 || digitsOnly.length() > 15) {
                throw new BadRequestException("WhatsApp number must contain 8 to 15 digits");
            }
        }

        if ("brand.logo".equals(key) && !value.isBlank()) {
            boolean validLogoPath = value.startsWith("/")
                    || value.startsWith("http://")
                    || value.startsWith("https://");
            if (!validLogoPath) {
                throw new BadRequestException("brand.logo must be an absolute URL or a path starting with '/'");
            }
        }

        if ((key.startsWith("social.") || "location.mapEmbedUrl".equals(key))
                && !value.isBlank()
                && !(value.startsWith("http://") || value.startsWith("https://"))) {
            throw new BadRequestException("Setting " + key + " must be a valid http(s) URL");
        }
    }

    private String normalizeValue(String key, String value) {
        String normalizedValue = Objects.toString(value, "").trim();
        if ("contact.whatsapp".equals(key)) {
            return normalizedValue.replaceAll("\\D", "");
        }
        return normalizedValue;
    }
}
