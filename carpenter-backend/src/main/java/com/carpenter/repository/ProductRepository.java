package com.carpenter.repository;

import com.carpenter.model.Product;
import com.carpenter.model.ProductCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // All active products ordered by newest first
    List<Product> findByActiveTrueOrderByCreatedAtDesc();

    // Filter by category (active only)
    List<Product> findByCategoryAndActiveTrueOrderByCreatedAtDesc(
        ProductCategory category
    );

    // Search by name (case insensitive)
    List<Product> findByNameContainingIgnoreCaseAndActiveTrue(String keyword);

    @Query("""
        SELECT p FROM Product p
        WHERE p.active = true
        AND (:category IS NULL OR p.category = :category)
        AND (
            :keyword IS NULL OR :keyword = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        """)
    Page<Product> findActiveProducts(
        @Param("category") ProductCategory category,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    // Count active products
    long countByActiveTrue();

    // Custom JPQL for search across name AND description
    @Query("""
        SELECT p FROM Product p
        WHERE p.active = true
        AND (
            LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR
            LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        ORDER BY p.createdAt DESC
        """)
    List<Product> searchProducts(@Param("keyword") String keyword);
}