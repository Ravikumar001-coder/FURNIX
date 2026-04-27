package com.carpenter.controller;

import com.carpenter.dto.request.GalleryItemRequest;
import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.GalleryItemResponse;
import com.carpenter.service.GalleryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    /** Public: browse the portfolio */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<GalleryItemResponse>>> getGallery(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String material,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(
            ApiResponse.success("Gallery fetched", galleryService.getGallery(category, roomType, material, page, size))
        );
    }

    /** Public: featured items for homepage */
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<GalleryItemResponse>>> getFeatured() {
        return ResponseEntity.ok(ApiResponse.success("Featured items", galleryService.getFeatured()));
    }

    /** Public: single gallery item detail */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GalleryItemResponse>> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Gallery item", galleryService.getById(id)));
    }

    /** Admin only: create */
    @PostMapping
    public ResponseEntity<ApiResponse<GalleryItemResponse>> create(@RequestBody GalleryItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Gallery item created", galleryService.create(request)));
    }

    /** Admin only: update */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GalleryItemResponse>> update(
            @PathVariable Long id, @RequestBody GalleryItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Gallery item updated", galleryService.update(id, request)));
    }

    /** Admin only: soft delete */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        galleryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Gallery item removed"));
    }
}
