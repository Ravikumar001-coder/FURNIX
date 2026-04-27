package com.carpenter.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuoteRequest {
    
    @NotNull(message = "Inquiry ID is required")
    private Long inquiryId;
    
    private Double discount = 0.0;
    
    private Double tax = 0.0;
    
    private LocalDateTime expiryDate;
    
    private String notes;
    
    @Valid
    @NotNull(message = "Quote items are required")
    private List<QuoteItemRequest> items;
}
