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
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload image → Cloudinary → return URL
     */
    public String uploadImage(MultipartFile file, String folder) {
        validateImageFile(file);

        try {
            log.info("Uploading image: {} to folder: {}", file.getOriginalFilename(), folder);

            Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "folder",        folder,
                    "resource_type", "image",
                    "quality",       "auto",
                    "fetch_format",  "auto"
                )
            );

            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("Image upload failed: {}", e.getMessage());
            throw new RuntimeException("Image upload failed.");
        }
    }

    /**
     * Upload raw bytes (PDF) → Cloudinary → return full result map
     */
    public Map uploadFile(byte[] bytes, String fileName, String resourceType) throws IOException {
        log.info("Uploading raw file: {} (Type: {})", fileName, resourceType);
        return cloudinary.uploader().upload(
            bytes,
            ObjectUtils.asMap(
                "public_id",     fileName,
                "resource_type", "raw" // For PDFs and other files
            )
        );
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            String publicId = extractPublicId(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.warn("Could not delete file: {}", e.getMessage());
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new RuntimeException("Empty file");
        if (!file.getContentType().startsWith("image/")) throw new RuntimeException("Not an image");
    }

    private String extractPublicId(String imageUrl) {
        try {
            String[] parts = imageUrl.split("/upload/");
            String afterUpload = parts[1];
            String withoutVersion = afterUpload.replaceFirst("v\\d+/", "");
            int dotIndex = withoutVersion.lastIndexOf('.');
            return dotIndex > 0 ? withoutVersion.substring(0, dotIndex) : withoutVersion;
        } catch (Exception e) { return imageUrl; }
    }
}
