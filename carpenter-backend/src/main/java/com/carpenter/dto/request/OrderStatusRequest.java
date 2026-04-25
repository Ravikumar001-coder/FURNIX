package com.carpenter.dto.request;

import com.carpenter.model.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Used when admin updates the order status.
 * Separate DTO keeps the API clean and explicit.
 */
@Data
public class OrderStatusRequest {

    @NotNull(message = "Status is required")
    private OrderStatus status;

    // Optional admin note when changing status
    private String adminNotes;
}
