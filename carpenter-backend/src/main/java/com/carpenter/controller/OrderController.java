package com.carpenter.controller;

import com.carpenter.dto.response.ApiResponse;
import com.carpenter.model.Order;
import com.carpenter.model.OrderState;
import com.carpenter.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/orders", "/api/v1/orders"})
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // Further endpoints for order management will be implemented in subsequent phases.
    // E.g., updating order status, retrieving order details, and payment management.

}
