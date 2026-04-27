package com.carpenter.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class GalleryItemRequest {
    private String title;
    private String description;
    private String category;
    private String roomType;
    private String materialsUsed;
    private String coverImage;
    private List<String> images;
    private String projectDuration;
    private String clientLocation;
    private Boolean featured;
    private Boolean active;
    private Integer displayOrder;
}
