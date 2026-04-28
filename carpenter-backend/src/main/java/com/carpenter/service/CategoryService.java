package com.carpenter.service;

import com.carpenter.dto.response.CategoryResponse;
import com.carpenter.dto.response.SubcategoryResponse;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.Category;
import com.carpenter.model.Subcategory;
import com.carpenter.repository.CategoryRepository;
import com.carpenter.repository.SubcategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubcategoryResponse> getSubcategoriesByCategorySlug(String slug) {
        Category category = categoryRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));

        return subcategoryRepository.findByCategoryAndActiveTrueOrderByDisplayOrderAsc(category).stream()
                .map(this::toSubcategoryResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse toCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .displayOrder(category.getDisplayOrder())
                .build();
    }

    private SubcategoryResponse toSubcategoryResponse(Subcategory subcategory) {
        return SubcategoryResponse.builder()
                .id(subcategory.getId())
                .name(subcategory.getName())
                .slug(subcategory.getSlug())
                .displayOrder(subcategory.getDisplayOrder())
                .build();
    }
}
