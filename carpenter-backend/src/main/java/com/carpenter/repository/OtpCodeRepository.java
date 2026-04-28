package com.carpenter.repository;

import com.carpenter.model.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.time.LocalDateTime;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    
    Optional<OtpCode> findTopByPhoneNumberAndUsedOrderByCreatedAtDesc(String phoneNumber, boolean used);

    Optional<OtpCode> findTopByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);

    @Modifying
    @Query("UPDATE OtpCode o SET o.used = true " +
           "WHERE o.phoneNumber = :phoneNumber " +
           "AND o.code = :code " +
           "AND o.used = false " +
           "AND o.expiryTime > :now")
    int markUsedIfValid(@Param("phoneNumber") String phoneNumber,
                        @Param("code") String code,
                        @Param("now") LocalDateTime now);
    
    void deleteByExpiryTimeBefore(LocalDateTime time);
}
