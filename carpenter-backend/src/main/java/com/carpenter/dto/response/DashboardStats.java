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
    private long newInquiries;
    private long underReviewInquiries;
    private long quoteSentInquiries;
    private long acceptedInquiries;
    private long inProductionInquiries;
    private long deliveredInquiries;
}
