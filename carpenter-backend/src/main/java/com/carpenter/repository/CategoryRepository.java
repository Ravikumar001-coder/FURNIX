package com.carpenter.repository;

import com.carpenter.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueOrderByDisplayOrderAsc();
    Optional<Category> findBySlugAndActiveTrue(String slug);
}
