package com.carpenter.service;

import com.carpenter.dto.request.InquiryRequest;
import com.carpenter.dto.request.InquiryStatusRequest;
import com.carpenter.dto.response.InquiryResponse;
import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.Customer;
import com.carpenter.model.Inquiry;
import com.carpenter.model.InquiryStatus;
import com.carpenter.repository.CustomerRepository;
import com.carpenter.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final NotificationService notificationService;
    private final CustomerRepository customerRepository;
    private final com.carpenter.repository.ProductRepository productRepository;

    @Transactional
    public InquiryResponse createInquiry(InquiryRequest request) {
        // Idempotency check
        if (request.getIdempotencyKey() != null) {
            java.util.Optional<Inquiry> existing = inquiryRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return mapToResponse(existing.get());
            }
        }

        Customer customer = customerRepository.findByEmail(request.getEmail()).orElse(null);

        Inquiry inquiry = Inquiry.builder()
                .customer(customer)
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .area(request.getArea())
                .pieceType(request.getPieceType())
                .roomType(request.getRoomType())
                .dimensions(request.getDimensions())
                .materialPreference(request.getMaterialPreference())
                .finishPreference(request.getFinishPreference())
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .timeline(request.getTimeline())
                .siteVisitRequired(request.getSiteVisitRequired())
                .description(request.getDescription())
                .referenceImages(request.getReferenceImages() != null ? String.join(",", request.getReferenceImages()) : null)
                .status(InquiryStatus.NEW)
                .idempotencyKey(request.getIdempotencyKey())
                .build();

        Inquiry saved = inquiryRepository.save(inquiry);
        notificationService.notifyInquiryReceived(saved.getEmail(), saved.getName());
        return mapToResponse(saved);
    }

    public Page<InquiryResponse> getAllInquiries(InquiryStatus status, String keyword, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Inquiry> inquiries = inquiryRepository.findWithFilters(status, keyword, pageable);
        return inquiries.map(this::mapToResponse);
    }

    public Page<InquiryResponse> getInquiriesForCustomer(String email, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Inquiry> inquiries = inquiryRepository.findByEmailOrderByCreatedAtDesc(email, pageable);
        return inquiries.map(this::mapToResponse);
    }

    public InquiryResponse getInquiryById(Long id) {
        Inquiry inquiry = findInquiryEntity(id);
        return mapToResponse(inquiry);
    }

    public InquiryResponse getCustomerInquiryById(Long id, String email) {
        Inquiry inquiry = findInquiryEntity(id);
        if (inquiry.getEmail() == null || !inquiry.getEmail().equalsIgnoreCase(email)) {
            throw new ResourceNotFoundException("Inquiry", id);
        }
        return mapToResponse(inquiry);
    }

    @Transactional
    public InquiryResponse updateInquiryStatus(Long id, InquiryStatusRequest request) {
        Inquiry inquiry = findInquiryEntity(id);

        if (request.getStatus() != null) {
            if (!inquiry.getStatus().canTransitionTo(request.getStatus())) {
                throw new IllegalArgumentException("Invalid status transition from " + inquiry.getStatus().name() + " to " + request.getStatus().name());
            }
            inquiry.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            inquiry.setPriority(request.getPriority());
        }
        if (request.getAdminNotes() != null) {
            inquiry.setAdminNotes(request.getAdminNotes());
        }

        Inquiry saved = inquiryRepository.save(inquiry);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteInquiry(Long id) {
        Inquiry inquiry = findInquiryEntity(id);
        inquiryRepository.delete(inquiry);
    }

    private Inquiry findInquiryEntity(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry", id));
    }

    private InquiryResponse mapToResponse(Inquiry inquiry) {
        return InquiryResponse.builder()
                .id(inquiry.getId())
                .name(inquiry.getName())
                .email(inquiry.getEmail())
                .phone(inquiry.getPhone())
                .address(inquiry.getAddress())
                .city(inquiry.getCity())
                .area(inquiry.getArea())
                .pieceType(inquiry.getPieceType())
                .roomType(inquiry.getRoomType())
                .dimensions(inquiry.getDimensions())
                .materialPreference(inquiry.getMaterialPreference())
                .finishPreference(inquiry.getFinishPreference())
                .budgetMin(inquiry.getBudgetMin())
                .budgetMax(inquiry.getBudgetMax())
                .timeline(inquiry.getTimeline())
                .siteVisitRequired(inquiry.getSiteVisitRequired())
                .description(inquiry.getDescription())
                .referenceImages(inquiry.getReferenceImages() != null && !inquiry.getReferenceImages().isEmpty() 
                    ? java.util.Arrays.asList(inquiry.getReferenceImages().split(",")) 
                    : java.util.Collections.emptyList())
                .status(inquiry.getStatus())
                .priority(inquiry.getPriority())
                .adminNotes(inquiry.getAdminNotes())
                .createdAt(inquiry.getCreatedAt())
                .build();
    }

    public com.carpenter.dto.response.DashboardStats getDashboardStats() {
        return com.carpenter.dto.response.DashboardStats.builder()
                .totalProducts(productRepository.count())
                .activeProducts(productRepository.countByActiveTrue())
                .totalInquiries(inquiryRepository.count())
                .newInquiries(inquiryRepository.countByStatus(InquiryStatus.NEW))
                .underReviewInquiries(inquiryRepository.countByStatus(InquiryStatus.UNDER_REVIEW))
                .quoteSentInquiries(inquiryRepository.countByStatus(InquiryStatus.QUOTE_SENT))
                .acceptedInquiries(inquiryRepository.countByStatus(InquiryStatus.ACCEPTED))
                .inProductionInquiries(inquiryRepository.countByStatus(InquiryStatus.IN_PRODUCTION))
                .deliveredInquiries(inquiryRepository.countByStatus(InquiryStatus.DELIVERED))
                .build();
    }
}
