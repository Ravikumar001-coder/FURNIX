package com.carpenter.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Standard paginated response")
public class PageResponse<T> {

    @Schema(description = "Page content")
    private List<T> content;

    @Schema(example = "0")
    private int page;

    @Schema(example = "10")
    private int size;

    @Schema(example = "42")
    private long totalElements;

    @Schema(example = "5")
    private int totalPages;

    @Schema(example = "true")
    private boolean first;

    @Schema(example = "false")
    private boolean last;

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
