package com.carpenter.model;

import java.util.Arrays;
import java.util.List;

/**
 * Full lifecycle of a custom carpentry inquiry.
 */
public enum InquiryStatus {
    SUBMITTED("Submitted"),
    ACKNOWLEDGED("Acknowledged"),
    INFO_REQUESTED("Info Requested"),
    QUOTE_PENDING("Quote Pending"),
    REJECTED("Rejected");

    private final String label;

    InquiryStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean isFinalState() {
        return this == REJECTED;
    }

    public boolean canTransitionTo(InquiryStatus nextStatus) {
        if (nextStatus == null) return false;
        if (this == nextStatus) return true;
        
        // Final states cannot transition to anything else
        if (this.isFinalState()) return false;
        
        // REJECTED can be triggered from early stages
        if (nextStatus == REJECTED) {
            return true;
        }

        switch (this) {
            case SUBMITTED:
                return nextStatus == ACKNOWLEDGED;
            case ACKNOWLEDGED:
                return nextStatus == INFO_REQUESTED || nextStatus == QUOTE_PENDING;
            case INFO_REQUESTED:
                return nextStatus == SUBMITTED; // Client responds, goes back to submitted
            case QUOTE_PENDING:
                // After quote pending, it transitions to quotation lifecycle
                return false;
            default:
                return false;
        }
    }
}
