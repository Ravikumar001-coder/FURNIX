package com.carpenter.repository;

import com.carpenter.model.Inquiry;
import com.carpenter.model.InquiryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    Page<Inquiry> findByEmailOrderByCreatedAtDesc(String email, Pageable pageable);

    @Query("SELECT i FROM Inquiry i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:keyword IS NULL OR " +
           " LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(i.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(i.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Inquiry> findWithFilters(@Param("status") InquiryStatus status,
                                  @Param("keyword") String keyword,
                                  Pageable pageable);

    long countByStatus(InquiryStatus status);

    java.util.Optional<Inquiry> findByIdempotencyKey(String idempotencyKey);
}
