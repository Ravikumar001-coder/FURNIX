package com.carpenter.controller;

import com.carpenter.dto.request.OrderRequest;
import com.carpenter.dto.request.OrderStatusRequest;
import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.DashboardStats;
import com.carpenter.dto.response.OrderCreateResult;
import com.carpenter.dto.response.OrderResponse;
import com.carpenter.dto.response.PageResponse;
import com.carpenter.model.OrderStatus;
import com.carpenter.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/orders", "/api/v1/orders", "/api/v2/orders"})
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/orders
     * PUBLIC — customer submits an order
     *
     * Request Body:
     * {
     *   "customerName": "John Smith",
     *   "phone": "01234567890",
     *   "email": "john@email.com",
     *   "address": "123 Main Street",
     *   "productType": "Dining Table",
     *   "customDescription": "8 seater, walnut wood"
     * }
     */
    @Operation(
        summary = "Create order",
        description = "Creates a customer order. Provide Idempotency-Key header to safely retry without duplicates."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Order created"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Idempotent replay returned existing order"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error",
            content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    })
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                required = true,
                content = @Content(
                    mediaType = "application/json",
                    examples = @io.swagger.v3.oas.annotations.media.ExampleObject(value = """
                        {
                        "customerName": "John Smith",
                        "phone": "01234567890",
                        "email": "john@email.com",
                        "address": "123 Main Street, Dhaka",
                        "productType": "Dining Table",
                        "customDescription": "8 seater, walnut wood",
                        "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1/orders/ref.png"
                        }
                        """)))
            @Valid @org.springframework.web.bind.annotation.RequestBody OrderRequest request) {

        OrderCreateResult result = orderService.createOrder(request, idempotencyKey);
        HttpStatus status = result.isNewlyCreated() ? HttpStatus.CREATED : HttpStatus.OK;
        String message = result.isNewlyCreated()
                ? "Order submitted! We will contact you within 24 hours."
                : "Idempotent replay detected. Returning existing order.";

        return ResponseEntity
            .status(status)
            .body(ApiResponse.success(
                message,
                result.getOrder()
            ));
    }

    /**
     * GET /api/orders
     * GET /api/orders?status=PENDING
     * ADMIN ONLY
     */
    @Operation(
        summary = "List orders (paginated)",
        description = "Returns orders with optional status and keyword filter, plus pagination and sorting."
    )
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Page<OrderResponse> orders = orderService.getAllOrders(
                status,
                keyword,
                page,
                size,
                sortBy,
                sortDir
        );

        return ResponseEntity.ok(
            ApiResponse.success("Orders fetched successfully", PageResponse.from(orders))
        );
    }

    /**
     * GET /api/orders/my-orders
     * CUSTOMER ONLY
     */
    @Operation(summary = "Get my orders")
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<OrderResponse> orders = orderService.getOrdersForCustomer(
                userDetails.getUsername(), page, size
        );

        return ResponseEntity.ok(
            ApiResponse.success("My orders fetched successfully", PageResponse.from(orders))
        );
    }

    /**
     * GET /api/orders/{id}
     * ADMIN ONLY
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id) {

        OrderResponse order = orderService.getOrderById(id);

        return ResponseEntity.ok(
            ApiResponse.success("Order fetched successfully", order)
        );
    }

    /**
     * GET /api/orders/stats
     * ADMIN ONLY — dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboardStats() {

        DashboardStats stats = orderService.getDashboardStats();

        return ResponseEntity.ok(
            ApiResponse.success("Dashboard stats", stats)
        );
    }

    /**
     * PUT /api/orders/{id}/status
     * ADMIN ONLY — update order status
     *
     * Request Body:
     * {
     *   "status": "IN_PROGRESS",
     *   "adminNotes": "Started working on the dining table"
     * }
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request) {

        OrderResponse order = orderService.updateOrderStatus(id, request);

        return ResponseEntity.ok(
            ApiResponse.success("Order status updated", order)
        );
    }

    /**
     * DELETE /api/orders/{id}
     * ADMIN ONLY
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(
            @PathVariable Long id) {

        orderService.deleteOrder(id);

        return ResponseEntity.ok(
            ApiResponse.success("Order deleted successfully")
        );
    }
}