package com.carpenter.model;

public enum OrderState {
    ADVANCE_PENDING("Advance Pending"),
    IN_PRODUCTION("In Production"),
    MATERIAL_PROCUREMENT("Material Procurement"),
    ROUGH_CUTTING("Rough Cutting"),
    ASSEMBLY_JOINERY("Assembly & Joinery"),
    FINISHING_POLISH("Finishing & Polish"),
    QUALITY_CHECK("Quality Check"),
    READY_FOR_DELIVERY("Ready for Delivery"),
    DELIVERY_SCHEDULED("Delivery Scheduled"),
    DELIVERED("Delivered"),
    CLOSED("Closed"),
    ON_HOLD("On Hold"),
    CANCELLED("Cancelled");

    private final String label;

    OrderState(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean isFinalState() {
        return this == DELIVERED || this == CLOSED || this == CANCELLED;
    }

    public boolean isProductionStage() {
        return this == MATERIAL_PROCUREMENT || 
               this == ROUGH_CUTTING || 
               this == ASSEMBLY_JOINERY || 
               this == FINISHING_POLISH || 
               this == QUALITY_CHECK;
    }
}
