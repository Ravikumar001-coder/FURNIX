package com.carpenter.repository;

import com.carpenter.model.Order;
import com.carpenter.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // All orders newest first
    List<Order> findAllByOrderByCreatedAtDesc();

    // Filter by status
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    // Find orders by customer email (Paginated)
    Page<Order> findByEmail(String email, Pageable pageable);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    @Query("""
        SELECT o FROM Order o
        WHERE (:status IS NULL OR o.status = :status)
        AND (
            :keyword IS NULL OR :keyword = ''
            OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(o.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(o.productType) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        """)
    Page<Order> findOrders(
        OrderStatus status,
        String keyword,
        Pageable pageable
    );

    // Count by each status (for dashboard)
    long countByStatus(OrderStatus status);

    // All pending + confirmed orders (for admin attention)
    @Query("""
        SELECT o FROM Order o
        WHERE o.status IN ('PENDING', 'CONFIRMED')
        ORDER BY o.createdAt ASC
        """)
    List<Order> findActiveOrders();
}