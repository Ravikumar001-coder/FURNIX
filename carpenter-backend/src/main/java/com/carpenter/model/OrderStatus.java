package com.carpenter.model;

/**
 * Represents the lifecycle of a customer order.
 *
 * Flow:
 * PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
 *                  ↘ CANCELLED (can happen at any stage)
 *
 * This gives admin full control over order tracking.
 */
public enum OrderStatus {
    PENDING,        // Just submitted by customer
    CONFIRMED,      // Admin reviewed and accepted
    IN_PROGRESS,    // Work has started
    COMPLETED,      // Furniture is ready
    CANCELLED       // Order was cancelled
}