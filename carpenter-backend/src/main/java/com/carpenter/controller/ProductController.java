package com.carpenter.controller;

import com.carpenter.dto.request.ProductRequest;
import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.PageResponse;
import com.carpenter.dto.response.ProductResponse;
import com.carpenter.model.ProductCategory;
import com.carpenter.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping({"/api/products", "/api/v1/products", "/api/v2/products"})
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * GET /api/products
     * GET /api/products?category=CHAIR
     *
     * PUBLIC — customers can view all products
     */
    @Operation(
        summary = "List products (paginated)",
        description = "Returns active products with optional category/keyword filter, pagination, and sorting."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Products fetched successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid query parameters",
            content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    })
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Page<ProductResponse> products = productService.getAllProducts(
            category,
            keyword,
            page,
            size,
            sortBy,
            sortDir
        );

        return ResponseEntity.ok(
            ApiResponse.success("Products fetched successfully", PageResponse.from(products))
        );
    }

    /**
     * GET /api/products/{id}
     * PUBLIC
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @PathVariable Long id) {

        ProductResponse product = productService.getProductById(id);

        return ResponseEntity.ok(
            ApiResponse.success("Product fetched successfully", product)
        );
    }

    /**
     * GET /api/products/search?q=dining
     * PUBLIC — customers can search
     */
    @Operation(summary = "Search products", description = "Legacy search endpoint. Use paginated list endpoint for advanced filtering.")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> searchProducts(
            @RequestParam("q") String keyword) {

        List<ProductResponse> products = productService.searchProducts(keyword);

        return ResponseEntity.ok(
            ApiResponse.success("Search results", products)
        );
    }

    /**
     * POST /api/products
     * ADMIN ONLY
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {

        ProductResponse product = productService.createProduct(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("Product created successfully", product));
    }

    /**
     * PUT /api/products/{id}
     * ADMIN ONLY
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        ProductResponse product = productService.updateProduct(id, request);

        return ResponseEntity.ok(
            ApiResponse.success("Product updated successfully", product)
        );
    }

    /**
     * DELETE /api/products/{id}
     * ADMIN ONLY
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long id) {

        productService.deleteProduct(id);

        return ResponseEntity.ok(
            ApiResponse.success("Product deleted successfully")
        );
    }

    /**
     * PATCH /api/products/{id}/toggle
     * ADMIN ONLY — show/hide a product without deleting
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<ProductResponse>> toggleStatus(
            @PathVariable Long id) {

        ProductResponse product = productService.toggleProductStatus(id);

        return ResponseEntity.ok(
            ApiResponse.success("Product status updated", product)
        );
    }
}