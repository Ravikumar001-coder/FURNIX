package com.carpenter.repository;

import com.carpenter.model.Customer;
import com.carpenter.model.InquiryDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InquiryDraftRepository extends JpaRepository<InquiryDraft, Long> {
    Optional<InquiryDraft> findByCustomer(Customer customer);
    void deleteByCustomer(Customer customer);
}
