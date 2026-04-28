package com.carpenter.controller;

import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.CategoryResponse;
import com.carpenter.dto.response.SubcategoryResponse;
import com.carpenter.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        List<CategoryResponse> categories = categoryService.getAllActiveCategories();
        return ResponseEntity.ok(ApiResponse.success("Categories fetched successfully", categories));
    }

    @GetMapping("/{slug}/subcategories")
    public ResponseEntity<ApiResponse<List<SubcategoryResponse>>> getSubcategories(@PathVariable String slug) {
        List<SubcategoryResponse> subcategories = categoryService.getSubcategoriesByCategorySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Subcategories fetched successfully", subcategories));
    }
}
