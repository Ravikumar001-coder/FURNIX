package com.carpenter.service;

import com.carpenter.dto.request.QuoteCalculationRequest;
import com.carpenter.dto.request.QuoteItemRequest;
import com.carpenter.dto.request.QuoteLineItemRequest;
import com.carpenter.dto.request.QuoteRequest;
import com.carpenter.dto.response.QuoteCalculationResponse;
import com.carpenter.dto.response.QuoteLineItemResponse;
import com.carpenter.dto.response.QuoteResponse;
import com.carpenter.exception.InvalidQuoteException;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final QuoteRepository quoteRepository;
    private final InquiryRepository inquiryRepository;
    private final NotificationService notificationService;
    private final TaxConfigurationService taxConfigurationService;

    @Transactional(readOnly = true)
    public QuoteCalculationResponse calculateQuote(QuoteCalculationRequest request) {
        if (request == null) {
            throw new InvalidQuoteException("Quote request is required");
        }

        String currency = request.getCurrency();
        if (currency == null || currency.trim().isEmpty()) {
            throw new InvalidQuoteException("Currency is required");
        }

        List<QuoteLineItemRequest> items = request.getLineItems();
        if (items == null || items.isEmpty()) {
            throw new InvalidQuoteException("Line items are required");
        }

        List<QuoteLineItemResponse> responseItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (QuoteLineItemRequest item : items) {
            if (item == null) {
                throw new InvalidQuoteException("Line item is required");
            }
            if (item.getDescription() == null || item.getDescription().trim().isEmpty()) {
                throw new InvalidQuoteException("Line item description is required");
            }
            if (item.getQuantity() == null || item.getQuantity() < 1) {
                throw new InvalidQuoteException("Quantity must be >= 1");
            }
            if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidQuoteException("Unit price must be > 0");
            }

            BigDecimal unitPrice = scale(item.getUnitPrice());
            BigDecimal lineTotal = scale(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
            subtotal = subtotal.add(lineTotal);

            responseItems.add(QuoteLineItemResponse.builder()
                    .description(item.getDescription().trim())
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build());
        }

        BigDecimal discountAmount = request.getDiscountAmount() == null ? BigDecimal.ZERO : request.getDiscountAmount();
        discountAmount = scale(discountAmount);
        if (discountAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidQuoteException("Discount amount must be >= 0");
        }
        if (discountAmount.compareTo(subtotal) > 0) {
            throw new InvalidQuoteException("Discount amount cannot exceed subtotal");
        }

        BigDecimal gstRate = scale(taxConfigurationService.getGstRate());
        BigDecimal taxableBase = subtotal.subtract(discountAmount);
        BigDecimal taxRateFraction = gstRate.divide(ONE_HUNDRED, 6, ROUNDING);
        BigDecimal taxAmount = scale(taxableBase.multiply(taxRateFraction));
        BigDecimal grandTotal = scale(taxableBase.add(taxAmount));

        return QuoteCalculationResponse.builder()
                .lineItems(List.copyOf(responseItems))
                .subtotal(scale(subtotal))
                .taxRate(gstRate)
                .taxAmount(taxAmount)
                .discountAmount(discountAmount)
                .grandTotal(grandTotal)
                .currency(currency.trim())
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    @Transactional
    public QuoteResponse createQuote(QuoteRequest request) {
        Inquiry inquiry = inquiryRepository.findById(request.getInquiryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry", request.getInquiryId()));

        QuoteCalculationResponse calculation = calculateQuote(buildCalculationRequest(request));

        Quote quote = Quote.builder()
                .inquiry(inquiry)
                .discount(calculation.getDiscountAmount().doubleValue())
                .tax(calculation.getTaxAmount().doubleValue())
                .expiryDate(request.getExpiryDate())
                .notes(request.getNotes())
                .status(QuoteStatus.DRAFT)
                .build();

        updateQuoteItems(quote, request.getItems());
        quote.setSubtotal(calculation.getSubtotal().doubleValue());
        quote.setTotalAmount(calculation.getGrandTotal().doubleValue());

        Quote saved = quoteRepository.save(quote);
        return mapToResponse(saved);
    }

    @Transactional
    public QuoteResponse updateQuote(Long id, QuoteRequest request) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", id));

        QuoteCalculationResponse calculation = calculateQuote(buildCalculationRequest(request));

        quote.setDiscount(calculation.getDiscountAmount().doubleValue());
        quote.setTax(calculation.getTaxAmount().doubleValue());
        quote.setExpiryDate(request.getExpiryDate());
        quote.setNotes(request.getNotes());

        quote.getItems().clear();
        updateQuoteItems(quote, request.getItems());
        quote.setSubtotal(calculation.getSubtotal().doubleValue());
        quote.setTotalAmount(calculation.getGrandTotal().doubleValue());

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
            BigDecimal unitPrice = BigDecimal.valueOf(itemReq.getUnitPrice());
            BigDecimal totalPrice = scale(unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())));
            QuoteItem item = QuoteItem.builder()
                    .name(itemReq.getName())
                    .description(itemReq.getDescription())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(scale(unitPrice).doubleValue())
                    .totalPrice(totalPrice.doubleValue())
                    .quote(quote)
                    .build();
            quote.addItem(item);
        }
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

    private QuoteCalculationRequest buildCalculationRequest(QuoteRequest request) {
        if (request == null) {
            throw new InvalidQuoteException("Quote request is required");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new InvalidQuoteException("Line items are required");
        }
        List<QuoteLineItemRequest> items = request.getItems().stream()
                .map(item -> {
                    if (item.getQuantity() == null || item.getQuantity() < 1) {
                        throw new InvalidQuoteException("Quantity must be >= 1");
                    }
                    if (item.getUnitPrice() == null || item.getUnitPrice() <= 0) {
                        throw new InvalidQuoteException("Unit price must be > 0");
                    }
                    QuoteLineItemRequest mapped = new QuoteLineItemRequest();
                    String description = item.getName() != null && !item.getName().trim().isEmpty()
                            ? item.getName()
                            : item.getDescription();
                    mapped.setDescription(description == null ? "Item" : description);
                    mapped.setQuantity(item.getQuantity());
                    mapped.setUnitPrice(BigDecimal.valueOf(item.getUnitPrice()));
                    return mapped;
                })
                .collect(Collectors.toList());

        QuoteCalculationRequest calcRequest = new QuoteCalculationRequest();
        calcRequest.setLineItems(items);
        calcRequest.setDiscountAmount(request.getDiscount() == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(request.getDiscount()));
        calcRequest.setCurrency("INR");
        return calcRequest;
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(SCALE, ROUNDING);
    }
}
