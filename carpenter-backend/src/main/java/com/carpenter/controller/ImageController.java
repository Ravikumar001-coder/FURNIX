package com.carpenter.controller;

import com.carpenter.dto.response.ApiResponse;
import com.carpenter.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping({"/api/images", "/api/v1/images", "/api/v2/images"})
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    /**
     * POST /api/images/upload
     * ADMIN ONLY
     *
     * Content-Type: multipart/form-data
     * Params:
     *   file   = the image file
     *   folder = "products" or "orders" (optional, default: products)
     *
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "imageUrl": "https://res.cloudinary.com/..."
     *   }
     * }
     *
     * Usage Flow:
     * 1. Admin picks image in React UI
     * 2. React sends it to this endpoint
     * 3. We upload to Cloudinary
     * 4. Return URL to React
     * 5. React uses this URL in the product create/update form
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file")                       MultipartFile file,
            @RequestParam(defaultValue = "products")    String folder) {

        String imageUrl = imageService.uploadImage(file, folder);

        return ResponseEntity.ok(
            ApiResponse.success(
                "Image uploaded successfully",
                Map.of("imageUrl", imageUrl)
            )
        );
    }
}