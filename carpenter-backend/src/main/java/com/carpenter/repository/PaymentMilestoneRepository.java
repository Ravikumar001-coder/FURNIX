package com.carpenter.repository;

import com.carpenter.model.PaymentMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentMilestoneRepository extends JpaRepository<PaymentMilestone, Long> {
    List<PaymentMilestone> findByOrderIdOrderByMilestoneNumberAsc(Long orderId);
}
