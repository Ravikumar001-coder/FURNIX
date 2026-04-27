package com.carpenter.repository;

import com.carpenter.model.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface QuoteRepository extends JpaRepository<Quote, Long> {
    Optional<Quote> findByInquiryId(Long inquiryId);
}
