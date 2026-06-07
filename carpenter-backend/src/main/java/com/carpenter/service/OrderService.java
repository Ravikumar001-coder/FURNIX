package com.carpenter.service;

import com.carpenter.exception.ResourceNotFoundException;
import com.carpenter.model.*;
import com.carpenter.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;

    @Transactional
    public Order createOrderFromQuote(Quote quote) {
        log.info("Creating order from quote ID: {}", quote.getId());
        
        // Prevent creating multiple orders for same quote
        if (orderRepository.findByInquiryId(quote.getInquiry().getId()).isPresent()) {
            throw new IllegalStateException("Order already exists for this inquiry/quote.");
        }

        Order order = Order.builder()
                .referenceNumber(generateReferenceNumber("ORD"))
                .customer(quote.getInquiry().getCustomer())
                .inquiry(quote.getInquiry())
                .status(OrderState.ADVANCE_PENDING)
                .totalAmount(BigDecimal.valueOf(quote.getTotalAmount()))
                .amountPaid(BigDecimal.ZERO)
                .build();

        // Standard milestone template: 50% Advance, 30% Progress, 20% Delivery
        BigDecimal total = order.getTotalAmount();
        
        BigDecimal advancePct = new BigDecimal("50.00");
        BigDecimal progressPct = new BigDecimal("30.00");
        BigDecimal deliveryPct = new BigDecimal("20.00");

        PaymentMilestone m1 = PaymentMilestone.builder()
                .order(order)
                .milestoneNumber(1)
                .label("Advance Payment (50%)")
                .percentage(advancePct)
                .amountDue(total.multiply(advancePct).divide(new BigDecimal("100")))
                .dueDate(LocalDate.now().plusDays(3))
                .status("PENDING")
                .build();

        PaymentMilestone m2 = PaymentMilestone.builder()
                .order(order)
                .milestoneNumber(2)
                .label("Progress Payment (30%)")
                .percentage(progressPct)
                .amountDue(total.multiply(progressPct).divide(new BigDecimal("100")))
                .status("PENDING")
                .build();

        PaymentMilestone m3 = PaymentMilestone.builder()
                .order(order)
                .milestoneNumber(3)
                .label("Delivery Payment (20%)")
                .percentage(deliveryPct)
                .amountDue(total.multiply(deliveryPct).divide(new BigDecimal("100")))
                .status("PENDING")
                .build();

        order.getPaymentMilestones().add(m1);
        order.getPaymentMilestones().add(m2);
        order.getPaymentMilestones().add(m3);

        return orderRepository.save(order);
    }

    private String generateReferenceNumber(String prefix) {
        int year = LocalDate.now().getYear();
        String uuidSegment = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return String.format("%s-%d-%s", prefix, year, uuidSegment);
    }
}
