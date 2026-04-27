package com.carpenter.dto.response;

import com.carpenter.model.ProjectStage;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private Long quoteId;
    private String customerName;
    private ProjectStage currentStage;
    private LocalDate startDate;
    private LocalDate expectedCompletionDate;
    private LocalDate actualCompletionDate;
    private List<UpdateResponse> updates;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class UpdateResponse {
        private Long id;
        private ProjectStage stage;
        private String comment;
        private String imageUrl;
        private LocalDateTime createdAt;
    }
}
