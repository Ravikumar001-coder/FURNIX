package com.carpenter.service;

import com.carpenter.model.Customer;
import com.carpenter.model.InquiryDraft;
import com.carpenter.repository.CustomerRepository;
import com.carpenter.repository.InquiryDraftRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InquiryDraftService {

    private final InquiryDraftRepository draftRepository;
    private final CustomerRepository customerRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void saveDraft(String username, Map<String, Object> content, Long version) {
        Customer customer = customerRepository.findByEmail(username)
                .or(() -> customerRepository.findByPhone(username))
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        InquiryDraft draft = draftRepository.findByCustomer(customer)
                .orElse(InquiryDraft.builder().customer(customer).version(-1L).build());

        // Conflict Detection: Reject if incoming version is NOT greater than current
        if (version <= draft.getVersion()) {
            throw new com.carpenter.exception.ConflictException("Version conflict: server has v" + draft.getVersion());
        }

        try {
            draft.setContent(objectMapper.writeValueAsString(content));
            draft.setVersion(version);
            draftRepository.save(draft);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize draft content", e);
        }
    }

    public Optional<InquiryDraft> getDraft(String username) {
        Customer customer = customerRepository.findByEmail(username)
                .or(() -> customerRepository.findByPhone(username))
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        return draftRepository.findByCustomer(customer);
    }

    @Transactional
    public void deleteDraft(String username) {
        Customer customer = customerRepository.findByEmail(username)
                .or(() -> customerRepository.findByPhone(username))
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        draftRepository.deleteByCustomer(customer);
    }
}
