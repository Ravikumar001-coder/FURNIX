package com.carpenter.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuoteCalculationResponse {
    private List<QuoteLineItemResponse> lineItems;
    private BigDecimal subtotal;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal grandTotal;
    private String currency;
    private LocalDateTime calculatedAt;
}
