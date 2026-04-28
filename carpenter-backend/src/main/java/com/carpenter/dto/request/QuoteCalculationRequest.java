package com.carpenter.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class QuoteCalculationRequest {

    @Valid
    @NotEmpty(message = "Line items are required")
    private List<QuoteLineItemRequest> lineItems;

    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "0.00", message = "Discount amount must be >= 0")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @NotBlank(message = "Currency is required")
    private String currency = "INR";
}
