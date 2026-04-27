package com.carpenter.dto.response;

import com.carpenter.model.InquiryPriority;
import com.carpenter.model.InquiryStatus;
import com.carpenter.model.PieceType;
import com.carpenter.model.RoomType;
import com.carpenter.model.Timeline;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String area;

    private PieceType pieceType;
    private RoomType roomType;
    private String dimensions;
    private String materialPreference;
    private String finishPreference;

    private Double budgetMin;
    private Double budgetMax;
    private Timeline timeline;
    private Boolean siteVisitRequired;
    private String description;
    private java.util.List<String> referenceImages;

    private InquiryStatus status;
    private InquiryPriority priority;
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
