package com.carpenter.dto.request;

import com.carpenter.model.PieceType;
import com.carpenter.model.RoomType;
import com.carpenter.model.Timeline;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class InquiryRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Enter a valid phone number (10-15 digits)")
    private String phone;

    private String address;
    private String city;
    private String area;

    @NotNull(message = "Please select the type of piece")
    private PieceType pieceType;

    private RoomType roomType;
    private String dimensions;
    private String materialPreference;
    private String finishPreference;

    @Positive(message = "Minimum budget must be positive")
    private Double budgetMin;

    @Positive(message = "Maximum budget must be positive")
    private Double budgetMax;

    private Timeline timeline;
    private Boolean siteVisitRequired;

    @NotBlank(message = "Please describe your project")
    private String description;

    private java.util.List<String> referenceImages;

    private String idempotencyKey;

    @AssertTrue(message = "Maximum budget must be greater than or equal to minimum budget")
    public boolean isValidBudgetRange() {
        if (budgetMin != null && budgetMax != null) {
            return budgetMax >= budgetMin;
        }
        return true;
    }
}
