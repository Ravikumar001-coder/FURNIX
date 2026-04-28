package com.carpenter.controller;

import com.carpenter.dto.request.QuoteCalculationRequest;
import com.carpenter.dto.request.QuoteRequest;
import com.carpenter.dto.response.ApiResponse;
import com.carpenter.dto.response.QuoteCalculationResponse;
import com.carpenter.dto.response.QuoteResponse;
import com.carpenter.model.QuoteStatus;
import com.carpenter.service.QuoteService;
import com.carpenter.service.PdfService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/quotes", "/api/v1/quotes"})
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;
    private final PdfService pdfService;
    private final com.carpenter.repository.QuoteRepository quoteRepository; // For direct entity access in download

    @PostMapping
    public ResponseEntity<ApiResponse<QuoteResponse>> createQuote(@Valid @RequestBody QuoteRequest request) {
        QuoteResponse response = quoteService.createQuote(request);
        return ResponseEntity.ok(ApiResponse.success("Quote created successfully", response));
    }

    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<ApiResponse<QuoteCalculationResponse>> calculateQuote(
            @Valid @RequestBody QuoteCalculationRequest request) {
        QuoteCalculationResponse response = quoteService.calculateQuote(request);
        return ResponseEntity.ok(ApiResponse.success("Quote calculated successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuoteResponse>> getQuote(@PathVariable Long id) {
        QuoteResponse response = quoteService.getQuote(id);
        return ResponseEntity.ok(ApiResponse.success("Quote fetched successfully", response));
    }

    @GetMapping("/inquiry/{inquiryId}")
    public ResponseEntity<ApiResponse<QuoteResponse>> getQuoteByInquiry(@PathVariable Long inquiryId) {
        QuoteResponse response = quoteService.getQuoteByInquiry(inquiryId);
        return ResponseEntity.ok(ApiResponse.success("Quote fetched successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuoteResponse>> updateQuote(@PathVariable Long id, @Valid @RequestBody QuoteRequest request) {
        QuoteResponse response = quoteService.updateQuote(id, request);
        return ResponseEntity.ok(ApiResponse.success("Quote updated successfully", response));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<QuoteResponse>> sendQuote(@PathVariable Long id) {
        QuoteResponse response = quoteService.updateStatus(id, QuoteStatus.SENT);
        return ResponseEntity.ok(ApiResponse.success("Quote marked as SENT", response));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<QuoteResponse>> acceptQuote(@PathVariable Long id) {
        QuoteResponse response = quoteService.updateStatus(id, QuoteStatus.ACCEPTED);
        return ResponseEntity.ok(ApiResponse.success("Quote marked as ACCEPTED", response));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<QuoteResponse>> rejectQuote(@PathVariable Long id) {
        QuoteResponse response = quoteService.updateStatus(id, QuoteStatus.REJECTED);
        return ResponseEntity.ok(ApiResponse.success("Quote marked as REJECTED", response));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadQuote(@PathVariable Long id) throws java.io.IOException {
        com.carpenter.model.Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new com.carpenter.exception.ResourceNotFoundException("Quote", id));
        
        byte[] pdfBytes = pdfService.generateQuotePdf(quote);
        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(pdfBytes);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Quote_" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(resource);
    }
}
