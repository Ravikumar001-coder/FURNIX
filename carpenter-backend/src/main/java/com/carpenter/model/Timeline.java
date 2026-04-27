package com.carpenter.model;

/** Customer's urgency / expected delivery timeline. */
public enum Timeline {
    URGENT,      // Needed ASAP (within ~1 week)
    TWO_WEEKS,   // Within 2 weeks
    ONE_MONTH,   // Within 1 month
    FLEXIBLE     // No hard deadline
}
