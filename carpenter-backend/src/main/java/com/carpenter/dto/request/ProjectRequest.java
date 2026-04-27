package com.carpenter.dto.request;

import com.carpenter.model.ProjectStage;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectRequest {
    private Long quoteId;
    private ProjectStage initialStage;
    private LocalDate startDate;
    private LocalDate expectedCompletionDate;
}
