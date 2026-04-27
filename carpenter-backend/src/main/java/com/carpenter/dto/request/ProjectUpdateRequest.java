package com.carpenter.dto.request;

import com.carpenter.model.ProjectStage;
import lombok.Data;

@Data
public class ProjectUpdateRequest {
    private ProjectStage stage;
    private String comment;
    private String imageUrl;
}
