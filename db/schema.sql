CREATE DATABASE IF NOT EXISTS carpenter_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS carpenter_audit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE carpenter_db;

CREATE TABLE reference_sequences (
    entity_type     VARCHAR(20)  NOT NULL,
    year            SMALLINT     NOT NULL,
    last_value      BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (entity_type, year)
) ENGINE=InnoDB;

INSERT IGNORE INTO reference_sequences (entity_type, year) VALUES
    ('INQUIRY', YEAR(NOW())),
    ('QUOTATION', YEAR(NOW())),
    ('ORDER', YEAR(NOW()));

CREATE TABLE users (
    id                  CHAR(36)        NOT NULL,
    email               VARCHAR(254)    NOT NULL,
    email_verified      BOOLEAN         NOT NULL DEFAULT FALSE,
    password_hash       VARCHAR(60)     NULL,
    full_name           VARCHAR(200)    NOT NULL,
    phone_number        VARCHAR(20)     NULL,
    phone_verified      BOOLEAN         NOT NULL DEFAULT FALSE,
    role                ENUM('SUPER_ADMIN', 'ADMIN', 'SHOP_MANAGER', 'DELIVERY_STAFF', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    mfa_enabled         BOOLEAN         NOT NULL DEFAULT FALSE,
    mfa_secret_enc      VARCHAR(500)    NULL,
    failed_login_count  TINYINT         NOT NULL DEFAULT 0,
    locked_until        DATETIME        NULL,
    token_version       INT             NOT NULL DEFAULT 1,
    last_login_at       DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,
    deleted_by          CHAR(36)        NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE user_oauth_providers (
    id                  CHAR(36)        NOT NULL,
    user_id             CHAR(36)        NOT NULL,
    provider            ENUM('GOOGLE', 'FACEBOOK', 'APPLE') NOT NULL,
    provider_user_id    VARCHAR(255)    NOT NULL,
    provider_email      VARCHAR(254)    NOT NULL,
    access_token_enc    TEXT            NULL,
    refresh_token_enc   TEXT            NULL,
    token_expires_at    DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE email_verifications (
    id                  CHAR(36)        NOT NULL,
    user_id             CHAR(36)        NOT NULL,
    token_hash          VARCHAR(60)     NOT NULL,
    token_type          ENUM('REGISTRATION', 'EMAIL_CHANGE', 'PASSWORD_RESET') NOT NULL,
    new_email           VARCHAR(254)    NULL,
    expires_at          DATETIME        NOT NULL,
    used_at             DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_ev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
    id                  CHAR(36)        NOT NULL,
    user_id             CHAR(36)        NOT NULL,
    token_hash          VARCHAR(64)     NOT NULL,
    device_hint         VARCHAR(200)    NULL,
    ip_address_hash     VARCHAR(64)     NULL,
    issued_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          DATETIME        NOT NULL,
    last_used_at        DATETIME        NULL,
    rotated_at          DATETIME        NULL,
    superseded_by       CHAR(36)        NULL,
    revoked_at          DATETIME        NULL,
    revoke_reason       VARCHAR(100)    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rt_hash (token_hash),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
    id                  CHAR(36)        NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    slug                VARCHAR(100)    NOT NULL,
    description         TEXT            NULL,
    parent_id           CHAR(36)        NULL,
    display_order       TINYINT         NOT NULL DEFAULT 0,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_category_slug (slug),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE wood_types (
    id                  CHAR(36)        NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    scientific_name     VARCHAR(200)    NULL,
    hardness_rating     TINYINT         NULL,
    price_tier          ENUM('BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY') NOT NULL,
    is_available        BOOLEAN         NOT NULL DEFAULT TRUE,
    display_order       TINYINT         NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_wood_name (name)
) ENGINE=InnoDB;

CREATE TABLE finish_types (
    id                  CHAR(36)        NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    description         VARCHAR(500)    NULL,
    is_available        BOOLEAN         NOT NULL DEFAULT TRUE,
    display_order       TINYINT         NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_finish_name (name)
) ENGINE=InnoDB;

CREATE TABLE products (
    id                  CHAR(36)        NOT NULL,
    slug                VARCHAR(200)    NOT NULL,
    name                VARCHAR(200)    NOT NULL,
    short_description   VARCHAR(500)    NULL,
    description         TEXT            NOT NULL,
    category_id         CHAR(36)        NOT NULL,
    base_price          DECIMAL(12,2)   NOT NULL,
    dim_length_cm       DECIMAL(8,2)    NULL,
    dim_width_cm        DECIMAL(8,2)    NULL,
    dim_height_cm       DECIMAL(8,2)    NULL,
    lead_time_days_min  SMALLINT        NOT NULL,
    lead_time_days_max  SMALLINT        NOT NULL,
    status              ENUM('DRAFT', 'ACTIVE', 'OUT_OF_SEASON', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    meta_title          VARCHAR(70)     NULL,
    meta_description    VARCHAR(160)    NULL,
    display_order       SMALLINT        NOT NULL DEFAULT 0,
    view_count          INT             NOT NULL DEFAULT 0,
    inquiry_count       INT             NOT NULL DEFAULT 0,
    created_by          CHAR(36)        NOT NULL,
    version             INT             NOT NULL DEFAULT 1,
    published_at        DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_slug (slug),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE product_wood_types (
    product_id          CHAR(36)        NOT NULL,
    wood_type_id        CHAR(36)        NOT NULL,
    price_adjustment    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    PRIMARY KEY (product_id, wood_type_id),
    CONSTRAINT fk_pwt_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pwt_wood FOREIGN KEY (wood_type_id) REFERENCES wood_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE product_finish_types (
    product_id          CHAR(36)        NOT NULL,
    finish_type_id      CHAR(36)        NOT NULL,
    price_adjustment    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    PRIMARY KEY (product_id, finish_type_id),
    CONSTRAINT fk_pft_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pft_finish FOREIGN KEY (finish_type_id) REFERENCES finish_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE product_images (
    id                  CHAR(36)        NOT NULL,
    product_id          CHAR(36)        NOT NULL,
    cloudinary_public_id VARCHAR(300)   NOT NULL,
    cloudinary_version  BIGINT          NULL,
    alt_text            VARCHAR(300)    NULL,
    display_order       TINYINT         NOT NULL DEFAULT 0,
    is_primary          BOOLEAN         NOT NULL DEFAULT FALSE,
    width_px            SMALLINT        NULL,
    height_px           SMALLINT        NULL,
    file_size_bytes     INT             NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pi_cloudinary_id (cloudinary_public_id),
    CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inquiries (
    id                  CHAR(36)        NOT NULL,
    reference_number    VARCHAR(20)     NOT NULL,
    client_id           CHAR(36)        NOT NULL,
    assigned_admin_id   CHAR(36)        NULL,
    furniture_type      VARCHAR(200)    NOT NULL,
    dim_length_cm       DECIMAL(8,2)    NULL,
    dim_width_cm        DECIMAL(8,2)    NULL,
    dim_height_cm       DECIMAL(8,2)    NULL,
    wood_type_id        CHAR(36)        NULL,
    finish_type_id      CHAR(36)        NULL,
    wood_type_freetext  VARCHAR(200)    NULL,
    finish_type_freetext VARCHAR(200)   NULL,
    budget_min          DECIMAL(10,2)   NOT NULL,
    budget_max          DECIMAL(10,2)   NOT NULL,
    desired_delivery_dt DATE            NULL,
    preferred_contact   ENUM('EMAIL', 'WHATSAPP', 'IN_APP') NOT NULL DEFAULT 'EMAIL',
    additional_notes    TEXT            NULL,
    product_hint_id     CHAR(36)        NULL,
    status              ENUM('SUBMITTED', 'ACKNOWLEDGED', 'INFO_REQUESTED', 'QUOTE_PENDING', 'CONVERTED', 'REJECTED', 'CANCELLED', 'STALE') NOT NULL DEFAULT 'SUBMITTED',
    rejection_category  ENUM('BUDGET_TOO_LOW', 'TOO_COMPLEX', 'CAPACITY_FULL', 'OUTSIDE_SERVICE_AREA', 'DUPLICATE', 'OTHER') NULL,
    rejection_message   TEXT            NULL,
    acknowledged_at     DATETIME        NULL,
    idempotency_key     VARCHAR(36)     NULL,
    version             INT             NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inquiry_ref (reference_number),
    CONSTRAINT fk_inq_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inq_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inq_product_hint FOREIGN KEY (product_hint_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE quotations (
    id                  CHAR(36)        NOT NULL,
    reference_number    VARCHAR(20)     NOT NULL,
    inquiry_id          CHAR(36)        NOT NULL,
    client_id           CHAR(36)        NOT NULL,
    created_by_admin_id CHAR(36)        NOT NULL,
    version_number      SMALLINT        NOT NULL DEFAULT 1,
    status              ENUM('DRAFT', 'SENT', 'APPROVED', 'REVISION_REQUESTED', 'SUPERSEDED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    wood_type_id        CHAR(36)        NULL,
    finish_type_id      CHAR(36)        NULL,
    wood_type_label     VARCHAR(200)    NOT NULL,
    finish_type_label   VARCHAR(200)    NOT NULL,
    dim_length_cm       DECIMAL(8,2)    NULL,
    dim_width_cm        DECIMAL(8,2)    NULL,
    dim_height_cm       DECIMAL(8,2)    NULL,
    subtotal            DECIMAL(12,2)   NOT NULL,
    tax_amount          DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    discount_amount     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_amount        DECIMAL(12,2)   NOT NULL,
    advance_percentage  DECIMAL(5,2)    NOT NULL,
    milestone2_percentage DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    milestone2_trigger  ENUM('MATERIAL_PROCUREMENT', 'ROUGH_CUTTING', 'ASSEMBLY_JOINERY', 'FINISHING_POLISH', 'QUALITY_CHECK') NULL,
    balance_percentage  DECIMAL(5,2)    NOT NULL,
    lead_time_days      SMALLINT        NOT NULL,
    valid_until         DATE            NOT NULL,
    notes_to_client     TEXT            NULL,
    internal_notes      TEXT            NULL,
    pdf_cloudinary_id   VARCHAR(300)    NULL,
    pdf_generated_at    DATETIME        NULL,
    sent_at             DATETIME        NULL,
    approved_at         DATETIME        NULL,
    revision_requested_at DATETIME      NULL,
    revision_notes      TEXT            NULL,
    supersedes_id       CHAR(36)        NULL,
    version             INT             NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_quotation_ref (reference_number),
    CONSTRAINT fk_quot_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quot_supersedes FOREIGN KEY (supersedes_id) REFERENCES quotations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE orders (
    id                  CHAR(36)        NOT NULL,
    reference_number    VARCHAR(20)     NOT NULL,
    client_id           CHAR(36)        NOT NULL,
    quotation_id        CHAR(36)        NULL,
    product_id          CHAR(36)        NULL,
    order_type          ENUM('STANDARD', 'CUSTOM') NOT NULL,
    total_amount        DECIMAL(12,2)   NOT NULL,
    amount_paid         DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    amount_outstanding  DECIMAL(12,2)   GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    status              ENUM('ADVANCE_PENDING', 'IN_PRODUCTION', 'MATERIAL_PROCUREMENT', 'ROUGH_CUTTING', 'ASSEMBLY_JOINERY', 'FINISHING_POLISH', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'DELIVERY_SCHEDULED', 'DELIVERED', 'CLOSED', 'ON_HOLD', 'CANCELLED') NOT NULL DEFAULT 'ADVANCE_PENDING',
    hold_reason         ENUM('MATERIAL_SHORTAGE', 'CLIENT_REQUEST', 'QUALITY_ISSUE', 'PAYMENT_PENDING', 'AMENDMENT_IN_PROGRESS', 'OTHER') NULL,
    hold_message        VARCHAR(500)    NULL,
    hold_applied_at     DATETIME        NULL,
    hold_resolved_at    DATETIME        NULL,
    pre_hold_status     ENUM('IN_PRODUCTION', 'MATERIAL_PROCUREMENT', 'ROUGH_CUTTING', 'ASSEMBLY_JOINERY', 'FINISHING_POLISH', 'QUALITY_CHECK') NULL,
    promised_delivery_dt DATE           NULL,
    actual_delivery_dt   DATE           NULL,
    warranty_expires_at  DATE           NULL,
    cancelled_at        DATETIME        NULL,
    cancelled_by        CHAR(36)        NULL,
    cancellation_reason TEXT            NULL,
    delivery_address_line1  VARCHAR(300) NULL,
    delivery_address_line2  VARCHAR(300) NULL,
    delivery_city           VARCHAR(100) NULL,
    delivery_state          VARCHAR(100) NULL,
    delivery_pincode        VARCHAR(10)  NULL,
    delivery_notes          TEXT         NULL,
    idempotency_key         VARCHAR(36)  NULL,
    version             INT             NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_order_ref (reference_number),
    UNIQUE KEY uq_order_quotation (quotation_id),
    CONSTRAINT fk_ord_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ord_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ord_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payment_milestones (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    milestone_number    TINYINT         NOT NULL,
    label               VARCHAR(100)    NOT NULL,
    percentage          DECIMAL(5,2)    NOT NULL,
    amount_due          DECIMAL(12,2)   NOT NULL,
    trigger_state       VARCHAR(50)     NULL,
    due_date            DATE            NULL,
    status              ENUM('PENDING', 'OVERDUE', 'PARTIALLY_PAID', 'CONFIRMED', 'VOIDED', 'WAIVED') NOT NULL DEFAULT 'PENDING',
    amount_received     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    confirmed_by        CHAR(36)        NULL,
    confirmed_at        DATETIME        NULL,
    voided_by           CHAR(36)        NULL,
    voided_at           DATETIME        NULL,
    void_reason         TEXT            NULL,
    waived_by           CHAR(36)        NULL,
    waived_at           DATETIME        NULL,
    waive_reason        TEXT            NULL,
    version             INT             NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pm_order_number (order_id, milestone_number),
    CONSTRAINT fk_pm_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
