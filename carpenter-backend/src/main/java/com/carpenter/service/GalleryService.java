package com.carpenter.service;

import com.carpenter.dto.request.GalleryItemRequest;
import com.carpenter.dto.response.GalleryItemResponse;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.GalleryItem;
import com.carpenter.repository.GalleryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GalleryService {

    private final GalleryRepository galleryRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<GalleryItemResponse> getGallery(
            String category, String roomType, String material, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("featured").descending()
                .and(Sort.by("displayOrder").ascending())
                .and(Sort.by("createdAt").descending()));

        // Normalize empty strings to null for the query
        String catFilter = (category == null || category.isBlank()) ? null : category;
        String roomFilter = (roomType == null || roomType.isBlank()) ? null : roomType;
        String matFilter = (material == null || material.isBlank()) ? null : material;

        return galleryRepository.findWithFilters(catFilter, roomFilter, matFilter, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public GalleryItemResponse getById(Long id) {
        GalleryItem item = galleryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery item", id));
        return mapToResponse(item);
    }

    @Transactional(readOnly = true)
    public List<GalleryItemResponse> getFeatured() {
        return galleryRepository.findByActiveTrueAndFeaturedTrueOrderByDisplayOrderAsc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public GalleryItemResponse create(GalleryItemRequest request) {
        GalleryItem item = buildFromRequest(request, new GalleryItem());
        return mapToResponse(galleryRepository.save(item));
    }

    @Transactional
    public GalleryItemResponse update(Long id, GalleryItemRequest request) {
        GalleryItem item = galleryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery item", id));
        buildFromRequest(request, item);
        return mapToResponse(galleryRepository.save(item));
    }

    @Transactional
    public void delete(Long id) {
        GalleryItem item = galleryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery item", id));
        item.setActive(false);
        galleryRepository.save(item);
    }

    // ── Private helpers ───────────────────────────────────────

    private GalleryItem buildFromRequest(GalleryItemRequest req, GalleryItem item) {
        item.setTitle(req.getTitle());
        item.setDescription(req.getDescription());
        item.setCategory(req.getCategory());
        item.setRoomType(req.getRoomType());
        item.setMaterialsUsed(req.getMaterialsUsed());
        item.setCoverImage(req.getCoverImage());
        item.setProjectDuration(req.getProjectDuration());
        item.setClientLocation(req.getClientLocation());

        if (req.getFeatured() != null) item.setFeatured(req.getFeatured());
        if (req.getActive() != null) item.setActive(req.getActive());
        if (req.getDisplayOrder() != null) item.setDisplayOrder(req.getDisplayOrder());

        // Serialize images list to JSON string
        if (req.getImages() != null) {
            try {
                item.setImages(objectMapper.writeValueAsString(req.getImages()));
            } catch (Exception e) {
                log.warn("Failed to serialize images list", e);
            }
        }
        return item;
    }

    private GalleryItemResponse mapToResponse(GalleryItem item) {
        // Deserialize images JSON string back to list
        List<String> imagesList = Collections.emptyList();
        if (item.getImages() != null && !item.getImages().isBlank()) {
            try {
                imagesList = objectMapper.readValue(item.getImages(), new TypeReference<>() {});
            } catch (Exception e) {
                log.warn("Could not parse images JSON for item {}", item.getId());
            }
        }

        // Parse comma-separated materials into a clean list
        List<String> materialsList = Collections.emptyList();
        if (item.getMaterialsUsed() != null && !item.getMaterialsUsed().isBlank()) {
            materialsList = Arrays.stream(item.getMaterialsUsed().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        return GalleryItemResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .category(item.getCategory())
                .roomType(item.getRoomType())
                .materialsUsed(item.getMaterialsUsed())
                .materialsList(materialsList)
                .coverImage(item.getCoverImage())
                .images(imagesList)
                .projectDuration(item.getProjectDuration())
                .clientLocation(item.getClientLocation())
                .featured(item.getFeatured())
                .active(item.getActive())
                .displayOrder(item.getDisplayOrder())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
