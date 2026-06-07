package com.carpenter.repository;

import com.carpenter.model.Order;
import com.carpenter.model.OrderState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByReferenceNumber(String referenceNumber);
    
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
    
    Optional<Order> findByInquiryId(Long inquiryId);

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:keyword IS NULL OR " +
           " LOWER(o.referenceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(o.customer.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(o.customer.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Order> findWithFilters(@Param("status") OrderState status,
                                @Param("keyword") String keyword,
                                Pageable pageable);

    long countByStatus(OrderState status);
}
