package com.carpenter.repository;

import com.carpenter.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByUsername(String username);

    boolean existsByUsername(String username);

    // JPQL Query: Update last login time
    // @Modifying = this query changes data (not just reads)
    // @Query = custom query when method naming isn't enough
    @Transactional
    @Modifying
    @Query("UPDATE Admin a SET a.lastLogin = :loginTime WHERE a.username = :username")
    void updateLastLogin(
        @Param("username") String username,
        @Param("loginTime") LocalDateTime loginTime
    );
}