package com.carpenter.repository;

import com.carpenter.model.Category;
import com.carpenter.model.Subcategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubcategoryRepository extends JpaRepository<Subcategory, Long> {
    List<Subcategory> findByCategoryAndActiveTrueOrderByDisplayOrderAsc(Category category);
}
