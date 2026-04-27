package com.carpenter.dto.response;

import com.carpenter.model.QuoteStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuoteResponse {
    private Long id;
    private Long inquiryId;
    private Double subtotal;
    private Double discount;
    private Double tax;
    private Double totalAmount;
    private QuoteStatus status;
    private LocalDateTime expiryDate;
    private String notes;
    private List<QuoteItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class QuoteItemResponse {
        private Long id;
        private String name;
        private String description;
        private Integer quantity;
        private Double unitPrice;
        private Double totalPrice;
    }
}
