package com.carpenter.dto.response;

import lombok.*;

/**
 * Admin dashboard statistics response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalProducts;
    private long activeProducts;

    private long totalOrders;
    private long pendingOrders;
    private long confirmedOrders;
    private long inProgressOrders;
    private long completedOrders;
    private long cancelledOrders;
}
