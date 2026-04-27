package com.carpenter.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class InquiryDraftRequest {
    private Map<String, Object> content;
    private Long version;
}
