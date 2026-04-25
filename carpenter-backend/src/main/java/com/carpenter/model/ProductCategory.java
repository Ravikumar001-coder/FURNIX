package com.carpenter.model;

/**
 * Enum = a fixed list of allowed values.
 *
 * WHY ENUM instead of String?
 * - String "CHIAR" (typo) would save to DB with no error
 * - Enum CHIAR → compile-time error immediately
 * - Enums are SELF-DOCUMENTING (you know all possible values)
 */
public enum ProductCategory {
    CHAIR,
    TABLE,
    BED,
    CABINET,
    DOOR,
    WINDOW,
    SOFA,
    WARDROBE,
    CUSTOM
}