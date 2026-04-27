package com.carpenter.repository;

import com.carpenter.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByQuoteId(Long quoteId);
    Optional<Project> findByQuoteInquiryId(Long inquiryId);
}
