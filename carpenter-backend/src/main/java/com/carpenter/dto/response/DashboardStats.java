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

    private long totalInquiries;
    private long submittedInquiries;
    private long acknowledgedInquiries;
    private long infoRequestedInquiries;
    private long quotePendingInquiries;
    private long rejectedInquiries;

    private long inProductionOrders;
    private long deliveredOrders;
}
