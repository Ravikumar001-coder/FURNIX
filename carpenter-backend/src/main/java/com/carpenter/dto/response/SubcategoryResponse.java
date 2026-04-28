package com.carpenter.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubcategoryResponse {
    private Long id;
    private String name;
    private String slug;
    private Integer displayOrder;
}
