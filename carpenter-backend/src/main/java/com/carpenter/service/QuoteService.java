package com.carpenter.service;

import com.carpenter.dto.request.QuoteItemRequest;
import com.carpenter.dto.request.QuoteRequest;
import com.carpenter.dto.response.QuoteResponse;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.Inquiry;
import com.carpenter.model.Quote;
import com.carpenter.model.QuoteItem;
import com.carpenter.model.QuoteStatus;
import com.carpenter.repository.InquiryRepository;
import com.carpenter.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final InquiryRepository inquiryRepository;
    private final NotificationService notificationService;

    @Transactional
    public QuoteResponse createQuote(QuoteRequest request) {
        Inquiry inquiry = inquiryRepository.findById(request.getInquiryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry", request.getInquiryId()));

        Quote quote = Quote.builder()
                .inquiry(inquiry)
                .discount(request.getDiscount())
                .tax(request.getTax())
                .expiryDate(request.getExpiryDate())
                .notes(request.getNotes())
                .status(QuoteStatus.DRAFT)
                .build();

        updateQuoteItems(quote, request.getItems());
        calculateTotals(quote);

        Quote saved = quoteRepository.save(quote);
        return mapToResponse(saved);
    }

    @Transactional
    public QuoteResponse updateQuote(Long id, QuoteRequest request) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", id));

        quote.setDiscount(request.getDiscount());
        quote.setTax(request.getTax());
        quote.setExpiryDate(request.getExpiryDate());
        quote.setNotes(request.getNotes());

        quote.getItems().clear();
        updateQuoteItems(quote, request.getItems());
        calculateTotals(quote);

        Quote saved = quoteRepository.save(quote);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public QuoteResponse getQuote(Long id) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", id));
        return mapToResponse(quote);
    }

    @Transactional(readOnly = true)
    public QuoteResponse getQuoteByInquiry(Long inquiryId) {
        Quote quote = quoteRepository.findByInquiryId(inquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote for Inquiry", inquiryId));
        return mapToResponse(quote);
    }

    @Transactional
    public QuoteResponse updateStatus(Long id, QuoteStatus status) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", id));
        
        QuoteStatus oldStatus = quote.getStatus();
        quote.setStatus(status);
        Quote saved = quoteRepository.save(quote);

        if (status == QuoteStatus.SENT && oldStatus != QuoteStatus.SENT) {
            notificationService.notifyQuoteSent(
                saved.getInquiry().getEmail(), 
                saved.getInquiry().getName(), 
                saved.getId()
            );
        }

        return mapToResponse(saved);
    }

    private void updateQuoteItems(Quote quote, List<QuoteItemRequest> itemRequests) {
        for (QuoteItemRequest itemReq : itemRequests) {
            QuoteItem item = QuoteItem.builder()
                    .name(itemReq.getName())
                    .description(itemReq.getDescription())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(itemReq.getQuantity() * itemReq.getUnitPrice())
                    .quote(quote)
                    .build();
            quote.addItem(item);
        }
    }

    private void calculateTotals(Quote quote) {
        double subtotal = quote.getItems().stream()
                .mapToDouble(QuoteItem::getTotalPrice)
                .sum();
        
        quote.setSubtotal(subtotal);
        double total = subtotal - quote.getDiscount() + quote.getTax();
        quote.setTotalAmount(Math.max(0.0, total));
    }

    private QuoteResponse mapToResponse(Quote quote) {
        return QuoteResponse.builder()
                .id(quote.getId())
                .inquiryId(quote.getInquiry().getId())
                .subtotal(quote.getSubtotal())
                .discount(quote.getDiscount())
                .tax(quote.getTax())
                .totalAmount(quote.getTotalAmount())
                .status(quote.getStatus())
                .expiryDate(quote.getExpiryDate())
                .notes(quote.getNotes())
                .createdAt(quote.getCreatedAt())
                .updatedAt(quote.getUpdatedAt())
                .items(quote.getItems().stream().map(item -> 
                    QuoteResponse.QuoteItemResponse.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build()
                ).collect(Collectors.toList()))
                .build();
    }
}
