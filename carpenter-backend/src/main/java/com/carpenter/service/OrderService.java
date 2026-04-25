package com.carpenter.service;

import com.carpenter.dto.request.OrderRequest;
import com.carpenter.dto.request.OrderStatusRequest;
import com.carpenter.dto.response.DashboardStats;
import com.carpenter.dto.response.OrderCreateResult;
import com.carpenter.dto.response.OrderResponse;
import com.carpenter.exception.BadRequestException;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.Order;
import com.carpenter.model.OrderStatus;
import com.carpenter.repository.OrderRepository;
import com.carpenter.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "updatedAt", "customerName", "email", "status"
    );

    private final OrderRepository   orderRepository;
    private final ProductRepository productRepository;

    // ─── Customer Operations ─────────────────────────────────────

    @Transactional
    public OrderCreateResult createOrder(OrderRequest request, String idempotencyKey) {
        log.info("New order from: {} | {}", request.getCustomerName(), request.getEmail());

        String normalizedKey = normalizeIdempotencyKey(idempotencyKey);
        if (normalizedKey != null) {
            Order existingOrder = orderRepository.findByIdempotencyKey(normalizedKey).orElse(null);
            if (existingOrder != null) {
                log.info("Idempotent replay detected for key={}, returning order id={}", normalizedKey, existingOrder.getId());
                return OrderCreateResult.builder()
                        .order(toResponse(existingOrder))
                        .newlyCreated(false)
                        .build();
            }
        }

        Order order = Order.builder()
                .customerName(request.getCustomerName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .productType(request.getProductType())
                .customDescription(request.getCustomDescription())
                .imageUrl(request.getImageUrl())
                .idempotencyKey(normalizedKey)
                .status(OrderStatus.PENDING)
                .build();

        Order saved = orderRepository.save(order);
        log.info("Order created: id={}", saved.getId());
            return OrderCreateResult.builder()
                .order(toResponse(saved))
                .newlyCreated(true)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersForCustomer(String email, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderRepository.findByEmail(email, pageable)
                .map(this::toResponse);
    }

    // ─── Admin Operations ────────────────────────────────────────

        @Transactional(readOnly = true)
        public Page<OrderResponse> getAllOrders(
            OrderStatus status,
            String keyword,
            int page,
            int size,
            String sortBy,
            String sortDir) {

            if (page < 0) {
                throw new BadRequestException("Page must be 0 or greater");
            }
            if (size < 1 || size > 100) {
                throw new BadRequestException("Size must be between 1 and 100");
            }
            if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
                throw new BadRequestException("Invalid sortBy field: " + sortBy);
            }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir)
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        return orderRepository.findOrders(status, keyword == null ? null : keyword.trim(), pageable)
            .map(this::toResponse);
        }

    @Transactional(readOnly = true)
        public List<OrderResponse> getAllOrdersLegacy(OrderStatus status) {
        List<Order> orders;

        if (status != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }

        return orders.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        return toResponse(findOrderById(id));
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatusRequest request) {
        log.info("Updating order {} status to: {}", id, request.getStatus());

        Order order = findOrderById(id);
        order.setStatus(request.getStatus());

        if (request.getAdminNotes() != null) {
            order.setAdminNotes(request.getAdminNotes());
        }

        Order updated = orderRepository.save(order);
        log.info("Order {} updated to: {}", id, request.getStatus());
        return toResponse(updated);
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = findOrderById(id);
        orderRepository.delete(order);
        log.info("Order deleted: id={}", id);
    }

    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        return DashboardStats.builder()
                .totalProducts(productRepository.count())
                .activeProducts(productRepository.countByActiveTrue())
                .totalOrders(orderRepository.count())
                .pendingOrders(orderRepository.countByStatus(OrderStatus.PENDING))
                .confirmedOrders(orderRepository.countByStatus(OrderStatus.CONFIRMED))
                .inProgressOrders(orderRepository.countByStatus(OrderStatus.IN_PROGRESS))
                .completedOrders(orderRepository.countByStatus(OrderStatus.COMPLETED))
                .cancelledOrders(orderRepository.countByStatus(OrderStatus.CANCELLED))
                .build();
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private Order findOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    private String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null) {
            return null;
        }

        String normalized = idempotencyKey.trim();
        if (normalized.length() > 120) {
            throw new BadRequestException("Idempotency-Key cannot exceed 120 characters");
        }
        return normalized.isEmpty() ? null : normalized;
    }

    private OrderResponse toResponse(Order o) {
        return OrderResponse.builder()
                .id(o.getId())
                .customerName(o.getCustomerName())
                .phone(o.getPhone())
                .email(o.getEmail())
                .address(o.getAddress())
                .productType(o.getProductType())
                .customDescription(o.getCustomDescription())
                .imageUrl(o.getImageUrl())
                .adminNotes(o.getAdminNotes())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}