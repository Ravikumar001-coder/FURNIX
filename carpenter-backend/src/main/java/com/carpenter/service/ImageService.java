package com.carpenter.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    private final Cloudinary cloudinary;

    /**
     * Upload image → Cloudinary → return URL
     *
     * @param file   Image file from HTTP request
     * @param folder Cloudinary folder ("products" or "orders")
     * @return Cloudinary HTTPS URL
     */
    public String uploadImage(MultipartFile file, String folder) {
        validateImageFile(file);

        try {
            log.info("Uploading image: {} to folder: {}",
                file.getOriginalFilename(), folder);

            Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "folder",        folder,
                    "resource_type", "image",
                    "quality",       "auto",      // Auto-optimize quality
                    "fetch_format",  "auto"        // Auto-select best format (WebP, etc.)
                )
            );

            String imageUrl = (String) uploadResult.get("secure_url");
            log.info("Upload successful: {}", imageUrl);
            return imageUrl;

        } catch (IOException e) {
            log.error("Image upload failed: {}", e.getMessage());
            throw new RuntimeException("Image upload failed. Please try again.");
        }
    }

    /**
     * Delete image from Cloudinary when product is deleted
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;

        try {
            String publicId = extractPublicId(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Image deleted: {}", publicId);
        } catch (IOException e) {
            log.warn("Could not delete image: {}", e.getMessage());
        }
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select an image file");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed (jpg, png, webp)");
        }

        // Max 10MB (also enforced in application.properties)
        long maxSize = 10L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new RuntimeException("Image file is too large. Max 10MB allowed.");
        }
    }

    private String extractPublicId(String imageUrl) {
        // From: https://res.cloudinary.com/cloud/image/upload/v123456/products/abc.jpg
        // To:   products/abc
        try {
            String[] parts = imageUrl.split("/upload/");
            String afterUpload = parts[1];                          // v123456/products/abc.jpg
            String withoutVersion = afterUpload.replaceFirst("v\\d+/", ""); // products/abc.jpg
            int dotIndex = withoutVersion.lastIndexOf('.');
            return dotIndex > 0
                ? withoutVersion.substring(0, dotIndex)             // products/abc
                : withoutVersion;
        } catch (Exception e) {
            return imageUrl;  // Return as-is if parsing fails
        }
    }
}