package com.carpenter.controller;

import com.carpenter.dto.response.ApiResponse;
import com.carpenter.model.SiteSetting;
import com.carpenter.repository.SiteSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/settings", "/api/v1/settings"})
@RequiredArgsConstructor
public class SettingsController {

    private final SiteSettingRepository settingRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getAllSettings() {
        Map<String, String> settings = settingRepository.findAll().stream()
                .collect(Collectors.toMap(SiteSetting::getSettingKey, SiteSetting::getSettingValue));
        
        return ResponseEntity.ok(ApiResponse.success("Settings fetched", settings));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Void>> updateSettings(@RequestBody Map<String, String> settingsMap) {
        List<SiteSetting> settings = settingsMap.entrySet().stream()
                .map(entry -> new SiteSetting(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
        
        settingRepository.saveAll(settings);
        
        return ResponseEntity.ok(ApiResponse.success("Settings updated successfully"));
    }
}
