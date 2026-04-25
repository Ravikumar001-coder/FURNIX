package com.carpenter.controller;

import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.DashboardStats;
import com.carpenter.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin", "/api/v2/admin"})
@RequiredArgsConstructor
public class AdminController {

    private final OrderService orderService;

    /**
     * GET /api/admin/dashboard
     * ADMIN ONLY
     *
     * Returns complete dashboard statistics:
     * - Total products / Active products
     * - Order counts by status
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {

        DashboardStats stats = orderService.getDashboardStats();

        return ResponseEntity.ok(
            ApiResponse.success(
                "Dashboard loaded for: " + userDetails.getUsername(),
                stats
            )
        );
    }
}
