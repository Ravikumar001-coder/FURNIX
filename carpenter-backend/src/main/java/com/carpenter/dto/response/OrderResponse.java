package com.carpenter.dto.response;

import com.carpenter.model.OrderStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String customerName;
    private String phone;
    private String email;
    private String address;
    private String productType;
    private String customDescription;
    private String imageUrl;
    private String adminNotes;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}