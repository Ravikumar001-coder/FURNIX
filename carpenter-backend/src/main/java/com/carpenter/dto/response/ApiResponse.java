package com.carpenter.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

/**
 * STANDARD WRAPPER for ALL API responses.
 *
 * Every single API returns this format:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... },
 *   "timestamp": "2024-01-15T10:30:00"
 * }
 *
 * @JsonInclude(NON_NULL) = don't include null fields in JSON output.
 * If data is null, it won't appear in the response at all.
 *
 * <T> = Generic Type. This class works with ANY data type.
 * ApiResponse<ProductResponse>  → data field holds ProductResponse
 * ApiResponse<List<OrderResponse>> → data field holds list of orders
 * ApiResponse<Void>             → no data (just success/message)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // ─── Factory Methods (shortcuts) ─────────────────────

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}