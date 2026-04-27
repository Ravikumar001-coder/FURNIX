package com.carpenter.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GalleryItemResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String roomType;
    private String materialsUsed;
    private List<String> materialsList;   // parsed from materialsUsed
    private String coverImage;
    private List<String> images;
    private String projectDuration;
    private String clientLocation;
    private Boolean featured;
    private Boolean active;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}
