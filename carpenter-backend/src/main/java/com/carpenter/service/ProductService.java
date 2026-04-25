package com.carpenter.service;

import com.carpenter.dto.request.ProductRequest;
import com.carpenter.dto.response.ProductResponse;
import com.carpenter.exception.BadRequestException;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.Product;
import com.carpenter.model.ProductCategory;
import com.carpenter.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "name", "price", "category"
    );

    private final ProductRepository productRepository;

    // ─── READ Operations ─────────────────────────────────────────

        @Transactional(readOnly = true)
        @Cacheable("products")
        public Page<ProductResponse> getAllProducts(
            ProductCategory category,
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

        Page<Product> products = productRepository.findActiveProducts(
            category,
            keyword == null ? null : keyword.trim(),
            pageable
        );

        return products.map(this::toResponse);
        }

    @Transactional(readOnly = true)
        public List<ProductResponse> getAllProductsLegacy(ProductCategory category) {

        List<Product> products;

        if (category != null) {
            log.info("Fetching products by category: {}", category);
            products = productRepository
                .findByCategoryAndActiveTrueOrderByCreatedAtDesc(category);
        } else {
            log.info("Fetching all active products");
            products = productRepository.findByActiveTrueOrderByCreatedAtDesc();
        }

        return products.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = findProductById(id);
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> searchProducts(String keyword) {
        log.info("Searching products with keyword: {}", keyword);

        return productRepository.searchProducts(keyword)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── WRITE Operations (Admin) ────────────────────────────────

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating product: {}", request.getName());

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .arModelUrl(request.getArModelUrl())
                .material(request.getMaterial())
                .dimensions(request.getDimensions())
                .finishOptions(request.getFinishOptions())
                .leadTime(request.getLeadTime())
                .inStock(request.getInStock() != null ? request.getInStock() : true)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Product saved = productRepository.save(product);
        log.info("Product created: id={}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Updating product: id={}", id);

        Product product = findProductById(id);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(request.getCategory());

        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getArModelUrl() != null) {
            product.setArModelUrl(request.getArModelUrl());
        }
        if (request.getMaterial() != null) product.setMaterial(request.getMaterial());
        if (request.getDimensions() != null) product.setDimensions(request.getDimensions());
        if (request.getFinishOptions() != null) product.setFinishOptions(request.getFinishOptions());
        if (request.getLeadTime() != null) product.setLeadTime(request.getLeadTime());
        if (request.getInStock() != null) product.setInStock(request.getInStock());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product updated = productRepository.save(product);
        log.info("Product updated: id={}", id);
        return toResponse(updated);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id) {
        log.info("Deleting product: id={}", id);

        Product product = findProductById(id);
        productRepository.delete(product);

        log.info("Product deleted: id={}", id);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse toggleProductStatus(Long id) {
        Product product = findProductById(id);
        product.setActive(!product.getActive());
        Product updated = productRepository.save(product);

        log.info("Product {} status toggled to: {}", id, updated.getActive());
        return toResponse(updated);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private Product findProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .category(p.getCategory())
                .imageUrl(p.getImageUrl())
                .arModelUrl(p.getArModelUrl())
                .material(p.getMaterial())
                .dimensions(p.getDimensions())
                .finishOptions(p.getFinishOptions())
                .leadTime(p.getLeadTime())
                .inStock(p.getInStock())
                .active(p.getActive())
                .createdAt(p.getCreatedAt())
                .build();
    }
}