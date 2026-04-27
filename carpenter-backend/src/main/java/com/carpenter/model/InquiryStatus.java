package com.carpenter.model;

import java.util.Arrays;
import java.util.List;

/**
 * Full lifecycle of a custom carpentry inquiry.
 */
public enum InquiryStatus {
    NEW("New Inquiry"),
    UNDER_REVIEW("Under Review"),
    QUOTE_SENT("Quote Sent"),
    NEGOTIATION("Negotiation"),
    ACCEPTED("Accepted"),
    REJECTED("Rejected"),
    SITE_VISIT_SCHEDULED("Site Visit Scheduled"),
    IN_PRODUCTION("In Production"),
    READY_FOR_DELIVERY("Ready for Delivery"),
    DELIVERED("Delivered"),
    CLOSED("Closed");

    private final String label;

    InquiryStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean isFinalState() {
        return this == REJECTED || this == CLOSED;
    }

    public boolean canTransitionTo(InquiryStatus nextStatus) {
        if (nextStatus == null) return false;
        if (this == nextStatus) return true;
        
        // Final states cannot transition to anything else
        if (this.isFinalState()) return false;
        
        // REJECTED can be triggered from early stages
        if (nextStatus == REJECTED) {
            return this == NEW || this == UNDER_REVIEW || this == QUOTE_SENT || this == NEGOTIATION;
        }

        switch (this) {
            case NEW:
                return nextStatus == UNDER_REVIEW || nextStatus == REJECTED;
            case UNDER_REVIEW:
                return nextStatus == QUOTE_SENT || nextStatus == REJECTED;
            case QUOTE_SENT:
                return nextStatus == NEGOTIATION || nextStatus == ACCEPTED || nextStatus == REJECTED;
            case NEGOTIATION:
                return nextStatus == QUOTE_SENT || nextStatus == ACCEPTED || nextStatus == REJECTED;
            case ACCEPTED:
                return nextStatus == SITE_VISIT_SCHEDULED || nextStatus == IN_PRODUCTION;
            case SITE_VISIT_SCHEDULED:
                return nextStatus == IN_PRODUCTION;
            case IN_PRODUCTION:
                return nextStatus == READY_FOR_DELIVERY;
            case READY_FOR_DELIVERY:
                return nextStatus == DELIVERED;
            case DELIVERED:
                return nextStatus == CLOSED;
            default:
                return false;
        }
    }
}
