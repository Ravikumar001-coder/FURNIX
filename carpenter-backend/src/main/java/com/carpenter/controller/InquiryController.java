package com.carpenter.controller;

import com.carpenter.dto.request.InquiryRequest;
import com.carpenter.dto.request.InquiryStatusRequest;
import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.InquiryResponse;
import com.carpenter.dto.response.PageResponse;
import com.carpenter.model.InquiryStatus;
import com.carpenter.service.InquiryService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/inquiries", "/api/v1/inquiries"})
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;
    private final com.carpenter.service.InquiryDraftService draftService;

    @Operation(summary = "Save inquiry draft", description = "Customer saves their partial form data.")
    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<Void>> saveDraft(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody com.carpenter.dto.request.InquiryDraftRequest draftRequest) {
        draftService.saveDraft(userDetails.getUsername(), draftRequest.getContent(), draftRequest.getVersion());
        return ResponseEntity.ok(ApiResponse.success("Draft saved", null));
    }

    @Operation(summary = "Get inquiry draft", description = "Customer retrieves their saved partial form data.")
    @GetMapping("/draft")
    public ResponseEntity<ApiResponse<com.carpenter.model.InquiryDraft>> getDraft(
            @AuthenticationPrincipal UserDetails userDetails) {
        return draftService.getDraft(userDetails.getUsername())
                .map(draft -> ResponseEntity.ok(ApiResponse.success("Draft fetched", draft)))
                .orElse(ResponseEntity.ok(ApiResponse.success("No draft found", null)));
    }

    @Operation(summary = "Delete inquiry draft", description = "Customer clears their saved draft.")
    @DeleteMapping("/draft")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(
            @AuthenticationPrincipal UserDetails userDetails) {
        draftService.deleteDraft(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Draft deleted", null));
    }

    @Operation(summary = "Create an inquiry", description = "Customer submits a custom furniture project brief.")
    @PostMapping
    public ResponseEntity<ApiResponse<InquiryResponse>> createInquiry(@Valid @RequestBody InquiryRequest request) {
        InquiryResponse response = inquiryService.createInquiry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inquiry submitted successfully", response));
    }

    @Operation(summary = "Get all inquiries (paginated)", description = "Admin can list inquiries with filters.")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<InquiryResponse>>> getAllInquiries(
            @RequestParam(required = false) InquiryStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Page<InquiryResponse> inquiries = inquiryService.getAllInquiries(status, keyword, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Inquiries fetched successfully", PageResponse.from(inquiries)));
    }

    @Operation(summary = "Get my inquiries", description = "Customer can list their own inquiries.")
    @GetMapping("/my-inquiries")
    public ResponseEntity<ApiResponse<PageResponse<InquiryResponse>>> getMyInquiries(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<InquiryResponse> inquiries = inquiryService.getInquiriesForCustomer(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success("My inquiries fetched successfully", PageResponse.from(inquiries)));
    }

    @Operation(summary = "Get my inquiry by ID", description = "Customer can view their own inquiry details.")
    @GetMapping("/my-inquiries/{id}")
    public ResponseEntity<ApiResponse<InquiryResponse>> getMyInquiryById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        InquiryResponse response = inquiryService.getCustomerInquiryById(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("My inquiry fetched successfully", response));
    }

    @Operation(summary = "Get inquiry by ID", description = "Admin can view full inquiry details.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InquiryResponse>> getInquiryById(@PathVariable Long id) {
        InquiryResponse response = inquiryService.getInquiryById(id);
        return ResponseEntity.ok(ApiResponse.success("Inquiry fetched successfully", response));
    }

    @Operation(summary = "Update inquiry status", description = "Admin can update status, priority, and notes.")
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<InquiryResponse>> updateInquiryStatus(
            @PathVariable Long id,
            @Valid @RequestBody InquiryStatusRequest request) {

        InquiryResponse response = inquiryService.updateInquiryStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Inquiry status updated", response));
    }

    @Operation(summary = "Delete inquiry", description = "Admin can delete an inquiry record.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteInquiry(@PathVariable Long id) {
        inquiryService.deleteInquiry(id);
        return ResponseEntity.ok(ApiResponse.success("Inquiry deleted successfully", null));
    }
}
