package com.carpenter.dto.request;

import com.carpenter.model.InquiryPriority;
import com.carpenter.model.InquiryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InquiryStatusRequest {

    @NotNull(message = "Status is required")
    private InquiryStatus status;

    private InquiryPriority priority;

    private String adminNotes;
}
