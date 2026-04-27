package com.carpenter.repository;

import com.carpenter.model.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    
    Optional<OtpCode> findTopByPhoneNumberAndUsedOrderByCreatedAtDesc(String phoneNumber, boolean used);
    
    void deleteByExpiryTimeBefore(LocalDateTime time);
}
