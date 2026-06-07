# Furnix — Production-Grade Database Architecture
### Version 1.0 | Senior Database Architecture Design Document

---

## Document Preamble

This document designs the complete database architecture for Furnix with one governing principle: **financial and operational data must be correct before it is fast**. Every design decision that trades correctness for performance is explicitly documented with its risk profile.

The database is the only component in Furnix that cannot be horizontally scaled trivially, cannot be redeployed in seconds, and whose corruption has irreversible business consequences. It deserves the most conservative, deliberate design of any system component.

---

# PART 1 — ENTITY IDENTIFICATION

---

## 1.1 Core Entity Map

```
ENTITY UNIVERSE:

Identity & Access Domain:
├── users                    (central identity record)
├── user_oauth_providers     (OAuth account links)
├── email_verifications      (pending email verification tokens)
├── refresh_tokens           (active session registry)
└── staff_profiles           (extended profile for staff roles)

Catalog Domain:
├── categories               (product taxonomy)
├── products                 (catalog items)
├── product_images           (media assets per product)
├── product_variants         (size/wood/finish combinations)
└── wood_types               (reference data: wood species)

Inquiry Domain:
├── inquiries                (custom furniture requests)
├── inquiry_images           (client reference images)
└── inquiry_messages         (admin/client communication thread)

Quotation Domain:
├── quotations               (formal price proposals)
├── quotation_line_items     (itemized pricing breakdown)
└── quotation_versions       (version history of quotations)

Order Domain:
├── orders                   (confirmed furniture orders)
├── order_status_history     (state machine transition log)
├── order_specifications     (versioned specification snapshots)
└── order_amendments         (mid-production change requests)

Payment Domain:
├── payment_milestones       (scheduled payment obligations)
├── payment_records          (actual payment transactions)
└── refund_records           (refund transactions)

Production Domain:
├── production_stages        (milestone definitions per order)
├── production_stage_updates (milestone progress log)
└── production_photos        (milestone evidence photos)

Delivery Domain:
├── delivery_schedules       (planned delivery events)
├── delivery_attempts        (each delivery attempt record)
└── delivery_proofs          (delivery confirmation evidence)

Notification Domain:
├── notification_log         (record of sent notifications)
└── notification_preferences (user communication preferences)

Audit Domain (separate schema):
├── audit_events             (immutable event log)
└── outbox_events            (transactional outbox for async events)

Reference/Configuration Domain:
├── finish_types             (reference data: finish options)
├── system_settings          (admin-configurable settings)
└── reference_sequences      (atomic reference number generation)
```

---

## 1.2 Relationship Map

```
OWNERSHIP HIERARCHY:

users (1) ──────────────────────► (N) inquiries
                                        │
users (1) ──────────────────────► (N) orders
                                        │
inquiries (1) ──────────────────► (0..1) quotations
                                              │
quotations (1) ─────────────────► (0..1) orders
                                              │
orders (1) ─────────────────────► (N) payment_milestones
                                  (N) production_stages
                                  (N) delivery_schedules
                                  (N) order_amendments
                                  (N) order_status_history
                                  (N) order_specifications

REFERENCE RELATIONSHIPS:
products (1) ───────────────────► (N) product_images
products (1) ───────────────────► (N) product_variants
categories (1) ─────────────────► (N) products
orders (0..1) ──────────────────► (1) products [standard orders only]

AUDIT RELATIONSHIPS:
Every entity mutation → audit_events (one-way, append-only)
Every domain event → outbox_events (consumed and marked published)
```

---

## 1.3 Ownership Boundaries

```
Boundary Rule: Each domain owns its tables.
Cross-domain reads: Via JOIN (acceptable — monolith).
Cross-domain writes: Via service layer only — never direct foreign key
writes across domain boundaries from another domain's service.

Domain         │ Owns Tables                    │ References (FK)
───────────────┼────────────────────────────────┼──────────────────────────
Identity       │ users, refresh_tokens, etc.    │ (root domain, no FKs in)
Catalog        │ products, categories, etc.     │ users (created_by)
Inquiry        │ inquiries, inquiry_images      │ users, products
Quotation      │ quotations, line_items         │ inquiries, users
Order          │ orders, order_status_history   │ quotations, users, products
Payment        │ payment_milestones, records    │ orders
Production     │ production_stages, photos      │ orders, users
Delivery       │ delivery_schedules, proofs     │ orders, users
Audit          │ audit_events, outbox_events    │ No FK constraints (decoupled)
```

---

# PART 2 — COMPLETE SCHEMA DESIGN

---

## 2.1 Identity & Access Domain

```sql
-- ============================================================
-- DATABASE: furnix_db
-- CHARACTER SET: utf8mb4 (full Unicode, emoji support)
-- COLLATION: utf8mb4_unicode_ci (case-insensitive, accent-aware)
-- STORAGE ENGINE: InnoDB (all tables — ACID, row locking)
-- ============================================================

CREATE DATABASE furnix_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE furnix_audit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE furnix_db;

-- ============================================================
-- REFERENCE DATA: Sequences for human-readable reference numbers
-- ============================================================
CREATE TABLE reference_sequences (
    entity_type     VARCHAR(20)  NOT NULL,
    year            SMALLINT     NOT NULL,
    last_value      BIGINT       NOT NULL DEFAULT 0,
    
    PRIMARY KEY (entity_type, year)
) ENGINE=InnoDB;

-- Pre-populate current year
INSERT INTO reference_sequences (entity_type, year) VALUES
    ('INQUIRY', YEAR(NOW())),
    ('QUOTATION', YEAR(NOW())),
    ('ORDER', YEAR(NOW()));

-- ============================================================
-- IDENTITY DOMAIN
-- ============================================================
CREATE TABLE users (
    id                  CHAR(36)        NOT NULL,
    email               VARCHAR(254)    NOT NULL,  -- RFC 5321 max email length
    email_verified      BOOLEAN         NOT NULL DEFAULT FALSE,
    password_hash       VARCHAR(60)     NULL,      -- BCrypt output is always 60 chars
                                                   -- NULL for OAuth-only accounts
    full_name           VARCHAR(200)    NOT NULL,
    phone_number        VARCHAR(20)     NULL,      -- E.164 format: +919876543210
    phone_verified      BOOLEAN         NOT NULL DEFAULT FALSE,
    role                ENUM(
                          'SUPER_ADMIN',
                          'ADMIN', 
                          'SHOP_MANAGER',
                          'DELIVERY_STAFF',
                          'CLIENT'
                        )               NOT NULL DEFAULT 'CLIENT',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    -- MFA
    mfa_enabled         BOOLEAN         NOT NULL DEFAULT FALSE,
    mfa_secret_enc      VARCHAR(500)    NULL,      -- Encrypted TOTP secret
    -- Account state
    failed_login_count  TINYINT         NOT NULL DEFAULT 0,
    locked_until        DATETIME        NULL,      -- Temporary lockout timestamp
    -- Version for JWT invalidation on role/password change
    token_version       INT             NOT NULL DEFAULT 1,
    -- Timestamps
    last_login_at       DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    -- Soft delete
    deleted_at          DATETIME        NULL,
    deleted_by          CHAR(36)        NULL,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role),
    KEY idx_users_active (is_active),
    KEY idx_users_role_active (role, is_active),
    -- Partial index simulation: active clients only
    KEY idx_users_client_active (role, is_active, created_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DESIGN NOTES:
-- 1. CHAR(36) for UUID: Fixed width, faster than VARCHAR for PK joins
-- 2. password_hash is NULL for OAuth users — prevents password login
-- 3. token_version invalidates all JWTs without a revocation list for:
--    password change, role change. JWT validator rejects if
--    token.version < user.token_version
-- 4. failed_login_count + locked_until implement progressive lockout
-- 5. mfa_secret_enc: encrypted at application layer before storage
--    (envelope encryption: KMS data key + AES-256-GCM)

CREATE TABLE user_oauth_providers (
    id                  CHAR(36)        NOT NULL,
    user_id             CHAR(36)        NOT NULL,
    provider            ENUM('GOOGLE', 'FACEBOOK', 'APPLE')
                                        NOT NULL,
    provider_user_id    VARCHAR(255)    NOT NULL,  -- Google sub claim
    provider_email      VARCHAR(254)    NOT NULL,
    access_token_enc    TEXT            NULL,      -- Encrypted, rotated on refresh
    refresh_token_enc   TEXT            NULL,
    token_expires_at    DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_oauth_provider_uid (provider, provider_user_id),
    KEY idx_oauth_user (user_id),
    
    CONSTRAINT fk_oauth_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE  -- If user deleted, remove OAuth links
        
) ENGINE=InnoDB;

CREATE TABLE email_verifications (
    id                  CHAR(36)        NOT NULL,
    user_id             CHAR(36)        NOT NULL,
    token_hash          VARCHAR(60)     NOT NULL,  -- BCrypt hash of raw token
    token_type          ENUM(
                          'REGISTRATION',
                          'EMAIL_CHANGE',
                          'PASSWORD_RESET'
                        )               NOT NULL,
    new_email           VARCHAR(254)    NULL,      -- Only for EMAIL_CHANGE type
    expires_at          DATETIME        NOT NULL,
    used_at             DATETIME        NULL,      -- Marked when consumed (not deleted)
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_ev_user (user_id),
    KEY idx_ev_expires (expires_at),  -- For cleanup job
    KEY idx_ev_type_user (token_type, user_id),
    
    CONSTRAINT fk_ev_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        
) ENGINE=InnoDB;

-- DESIGN NOTE: Tokens are NOT deleted after use — marked as used_at.
-- This supports audit trail and prevents token replay detection
-- from revealing "token already used" vs "token not found."
-- Cleanup job deletes records where: expires_at < NOW() - INTERVAL 7 DAY

CREATE TABLE refresh_tokens (
    id                  CHAR(36)        NOT NULL,
    user_id             CHAR(36)        NOT NULL,
    token_hash          VARCHAR(64)     NOT NULL,  -- SHA-256 of raw token (not BCrypt
                                                   -- BCrypt too slow for token lookup)
    device_hint         VARCHAR(200)    NULL,      -- Browser/device identifier
    ip_address_hash     VARCHAR(64)     NULL,      -- SHA-256 of IP (privacy)
    issued_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          DATETIME        NOT NULL,
    last_used_at        DATETIME        NULL,
    rotated_at          DATETIME        NULL,      -- When this token was rotated
    superseded_by       CHAR(36)        NULL,      -- FK to new token (for audit)
    revoked_at          DATETIME        NULL,
    revoke_reason       VARCHAR(100)    NULL,      -- 'PASSWORD_CHANGE', 'LOGOUT', etc.
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_rt_hash (token_hash),            -- Fast lookup by token value
    KEY idx_rt_user (user_id),
    KEY idx_rt_expires (expires_at),               -- Cleanup job
    KEY idx_rt_user_active (user_id, revoked_at),  -- Active sessions per user
    
    CONSTRAINT fk_rt_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        
) ENGINE=InnoDB;

-- DESIGN NOTE: SHA-256 for token lookup (fast), not BCrypt (slow).
-- BCrypt takes ~100ms — acceptable for password verify but not
-- for a lookup that happens on every API request.
-- Security: Raw token is 256-bit random. SHA-256 of random value
-- provides adequate protection even though SHA-256 is not bcrypt.
-- Attacker with DB access gets SHA-256 hash of unguessable random token.
```

---

## 2.2 Catalog Domain

```sql
CREATE TABLE categories (
    id                  CHAR(36)        NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    slug                VARCHAR(100)    NOT NULL,
    description         TEXT            NULL,
    parent_id           CHAR(36)        NULL,      -- Self-referential for sub-categories
    display_order       TINYINT         NOT NULL DEFAULT 0,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_category_slug (slug),
    KEY idx_category_parent (parent_id),
    KEY idx_category_active_order (is_active, display_order),
    
    CONSTRAINT fk_category_parent
        FOREIGN KEY (parent_id) REFERENCES categories(id)
        ON DELETE RESTRICT  -- Cannot delete category with sub-categories
        
) ENGINE=InnoDB;

CREATE TABLE wood_types (
    id                  CHAR(36)        NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    scientific_name     VARCHAR(200)    NULL,
    hardness_rating     TINYINT         NULL,      -- Janka hardness rating normalized 1-10
    price_tier          ENUM('BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY')
                                        NOT NULL,
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
    base_price          DECIMAL(12,2)   NOT NULL,  -- Starting price (may vary by options)
    -- Dimensions (stored in cm, displayed as needed)
    dim_length_cm       DECIMAL(8,2)    NULL,
    dim_width_cm        DECIMAL(8,2)    NULL,
    dim_height_cm       DECIMAL(8,2)    NULL,
    -- Lead time
    lead_time_days_min  SMALLINT        NOT NULL,
    lead_time_days_max  SMALLINT        NOT NULL,
    -- Status management
    status              ENUM(
                          'DRAFT',
                          'ACTIVE', 
                          'OUT_OF_SEASON',
                          'ARCHIVED'
                        )               NOT NULL DEFAULT 'DRAFT',
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    -- SEO
    meta_title          VARCHAR(70)     NULL,
    meta_description    VARCHAR(160)    NULL,
    -- Catalog management
    display_order       SMALLINT        NOT NULL DEFAULT 0,
    view_count          INT             NOT NULL DEFAULT 0,  -- Incremented on detail view
    inquiry_count       INT             NOT NULL DEFAULT 0,  -- Denormalized for sorting
    -- Ownership
    created_by          CHAR(36)        NOT NULL,
    -- Concurrency
    version             INT             NOT NULL DEFAULT 1,
    -- Timestamps
    published_at        DATETIME        NULL,      -- When first set to ACTIVE
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_slug (slug),
    KEY idx_product_category (category_id),
    KEY idx_product_status (status),
    KEY idx_product_status_featured (status, is_featured),
    KEY idx_product_status_price (status, base_price),
    KEY idx_product_status_created (status, created_at DESC),
    -- Composite for catalog listing (most common query)
    KEY idx_product_catalog (status, category_id, display_order, base_price),
    -- Full-text search
    FULLTEXT KEY ft_product_search (name, short_description, description),
    
    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_product_creator
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_product_price
        CHECK (base_price > 0),
    CONSTRAINT chk_product_leadtime
        CHECK (lead_time_days_max >= lead_time_days_min AND lead_time_days_min >= 1),
    CONSTRAINT chk_product_dimensions
        CHECK (
            (dim_length_cm IS NULL OR dim_length_cm > 0) AND
            (dim_width_cm IS NULL OR dim_width_cm > 0) AND
            (dim_height_cm IS NULL OR dim_height_cm > 0)
        )
        
) ENGINE=InnoDB;

-- DESIGN NOTE: view_count and inquiry_count are denormalized counters.
-- They are updated with: UPDATE products SET view_count = view_count + 1
-- This uses MySQL's atomic increment (no read-modify-write race condition).
-- These counters are eventually consistent (acceptable — they're for sorting,
-- not financial calculation).

CREATE TABLE product_wood_types (
    product_id          CHAR(36)        NOT NULL,
    wood_type_id        CHAR(36)        NOT NULL,
    price_adjustment    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
                                                   -- + or - from base_price
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    
    PRIMARY KEY (product_id, wood_type_id),
    KEY idx_pwt_wood (wood_type_id),
    
    CONSTRAINT fk_pwt_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pwt_wood
        FOREIGN KEY (wood_type_id) REFERENCES wood_types(id)
        ON DELETE RESTRICT
        
) ENGINE=InnoDB;

CREATE TABLE product_finish_types (
    product_id          CHAR(36)        NOT NULL,
    finish_type_id      CHAR(36)        NOT NULL,
    price_adjustment    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    
    PRIMARY KEY (product_id, finish_type_id),
    KEY idx_pft_finish (finish_type_id),
    
    CONSTRAINT fk_pft_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pft_finish
        FOREIGN KEY (finish_type_id) REFERENCES finish_types(id)
        ON DELETE RESTRICT
        
) ENGINE=InnoDB;

CREATE TABLE product_images (
    id                  CHAR(36)        NOT NULL,
    product_id          CHAR(36)        NOT NULL,
    cloudinary_public_id VARCHAR(300)   NOT NULL,
    cloudinary_version  BIGINT          NULL,      -- For cache busting
    alt_text            VARCHAR(300)    NULL,      -- Accessibility
    display_order       TINYINT         NOT NULL DEFAULT 0,
    is_primary          BOOLEAN         NOT NULL DEFAULT FALSE,
    width_px            SMALLINT        NULL,
    height_px           SMALLINT        NULL,
    file_size_bytes     INT             NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_pi_cloudinary_id (cloudinary_public_id),
    KEY idx_pi_product_order (product_id, display_order),
    KEY idx_pi_primary (product_id, is_primary),
    
    CONSTRAINT fk_pi_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
        
) ENGINE=InnoDB;
```

---

## 2.3 Inquiry Domain

```sql
CREATE TABLE inquiries (
    id                  CHAR(36)        NOT NULL,
    reference_number    VARCHAR(20)     NOT NULL,  -- INQ-2025-000001
    client_id           CHAR(36)        NOT NULL,
    assigned_admin_id   CHAR(36)        NULL,
    -- What they want
    furniture_type      VARCHAR(200)    NOT NULL,  -- Free-text description
    -- Dimensions (nullable — client may not know)
    dim_length_cm       DECIMAL(8,2)    NULL,
    dim_width_cm        DECIMAL(8,2)    NULL,
    dim_height_cm       DECIMAL(8,2)    NULL,
    wood_type_id        CHAR(36)        NULL,      -- NULL = "open to suggestion"
    finish_type_id      CHAR(36)        NULL,      -- NULL = "open to suggestion"
    wood_type_freetext  VARCHAR(200)    NULL,      -- If client types custom value
    finish_type_freetext VARCHAR(200)   NULL,
    -- Budget
    budget_min          DECIMAL(10,2)   NOT NULL,
    budget_max          DECIMAL(10,2)   NOT NULL,
    -- Timeline
    desired_delivery_dt DATE            NULL,
    -- Communication
    preferred_contact   ENUM(
                          'EMAIL',
                          'WHATSAPP',
                          'IN_APP'
                        )               NOT NULL DEFAULT 'EMAIL',
    additional_notes    TEXT            NULL,
    -- Product hint (if started from product page)
    product_hint_id     CHAR(36)        NULL,
    -- State machine
    status              ENUM(
                          'SUBMITTED',
                          'ACKNOWLEDGED',
                          'INFO_REQUESTED',
                          'QUOTE_PENDING',
                          'CONVERTED',
                          'REJECTED',
                          'CANCELLED',
                          'STALE'
                        )               NOT NULL DEFAULT 'SUBMITTED',
    -- Rejection details
    rejection_category  ENUM(
                          'BUDGET_TOO_LOW',
                          'TOO_COMPLEX',
                          'CAPACITY_FULL',
                          'OUTSIDE_SERVICE_AREA',
                          'DUPLICATE',
                          'OTHER'
                        )               NULL,
    rejection_message   TEXT            NULL,
    -- SLA tracking
    acknowledged_at     DATETIME        NULL,      -- When status changed to ACKNOWLEDGED
    -- Idempotency
    idempotency_key     VARCHAR(36)     NULL,      -- Client-generated UUID
    -- Concurrency
    version             INT             NOT NULL DEFAULT 1,
    -- Timestamps
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    -- Soft delete
    deleted_at          DATETIME        NULL,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_inquiry_ref (reference_number),
    UNIQUE KEY uq_inquiry_idempotency (idempotency_key),
    KEY idx_inq_client (client_id),
    KEY idx_inq_status (status),
    KEY idx_inq_status_created (status, created_at),
    -- SLA monitoring: find old unacknowledged inquiries
    KEY idx_inq_sla (status, acknowledged_at, created_at),
    KEY idx_inq_admin (assigned_admin_id),
    -- Admin dashboard: active inquiries sorted by age
    KEY idx_inq_dashboard (status, created_at DESC),
    
    CONSTRAINT fk_inq_client
        FOREIGN KEY (client_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_inq_admin
        FOREIGN KEY (assigned_admin_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_inq_wood
        FOREIGN KEY (wood_type_id) REFERENCES wood_types(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_inq_finish
        FOREIGN KEY (finish_type_id) REFERENCES finish_types(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_inq_product_hint
        FOREIGN KEY (product_hint_id) REFERENCES products(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_inq_budget
        CHECK (budget_max >= budget_min AND budget_min >= 0),
    CONSTRAINT chk_inq_dimensions
        CHECK (
            dim_length_cm IS NULL OR dim_length_cm > 0 AND
            dim_width_cm IS NULL OR dim_width_cm > 0 AND
            dim_height_cm IS NULL OR dim_height_cm > 0
        )
        
) ENGINE=InnoDB;

CREATE TABLE inquiry_images (
    id                      CHAR(36)    NOT NULL,
    inquiry_id              CHAR(36)    NOT NULL,
    cloudinary_public_id    VARCHAR(300) NOT NULL,
    original_filename       VARCHAR(255) NULL,
    file_size_bytes         INT         NULL,
    display_order           TINYINT     NOT NULL DEFAULT 0,
    uploaded_at             DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_ii_inquiry (inquiry_id),
    
    CONSTRAINT fk_ii_inquiry
        FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
        ON DELETE CASCADE
        
) ENGINE=InnoDB;

CREATE TABLE inquiry_messages (
    id                  CHAR(36)        NOT NULL,
    inquiry_id          CHAR(36)        NOT NULL,
    sender_id           CHAR(36)        NOT NULL,
    sender_role         ENUM('ADMIN', 'CLIENT')
                                        NOT NULL,
    message_type        ENUM(
                          'CLIENT_MESSAGE',
                          'ADMIN_MESSAGE',
                          'INFO_REQUEST',
                          'SYSTEM_NOTE'  -- Visible to admin only
                        )               NOT NULL,
    content             TEXT            NOT NULL,
    is_visible_to_client BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_im_inquiry_time (inquiry_id, created_at),
    
    CONSTRAINT fk_im_inquiry
        FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_im_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE RESTRICT
        
) ENGINE=InnoDB;
```

---

## 2.4 Quotation Domain

```sql
CREATE TABLE quotations (
    id                  CHAR(36)        NOT NULL,
    reference_number    VARCHAR(20)     NOT NULL,  -- QT-2025-000001
    inquiry_id          CHAR(36)        NOT NULL,
    client_id           CHAR(36)        NOT NULL,
    created_by_admin_id CHAR(36)        NOT NULL,
    version_number      SMALLINT        NOT NULL DEFAULT 1,
    status              ENUM(
                          'DRAFT',
                          'SENT',
                          'APPROVED',
                          'REVISION_REQUESTED',
                          'SUPERSEDED',
                          'EXPIRED',
                          'WITHDRAWN'
                        )               NOT NULL DEFAULT 'DRAFT',
    -- Specification (denormalized snapshot for this quote version)
    wood_type_id        CHAR(36)        NULL,
    finish_type_id      CHAR(36)        NULL,
    wood_type_label     VARCHAR(200)    NOT NULL,  -- Human label at quote time
    finish_type_label   VARCHAR(200)    NOT NULL,
    dim_length_cm       DECIMAL(8,2)    NULL,
    dim_width_cm        DECIMAL(8,2)    NULL,
    dim_height_cm       DECIMAL(8,2)    NULL,
    -- Pricing
    subtotal            DECIMAL(12,2)   NOT NULL,
    tax_amount          DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    discount_amount     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_amount        DECIMAL(12,2)   NOT NULL,
    -- Payment structure
    advance_percentage  DECIMAL(5,2)    NOT NULL,  -- e.g., 50.00
    milestone2_percentage DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    milestone2_trigger  ENUM(
                          'MATERIAL_PROCUREMENT',
                          'ROUGH_CUTTING',
                          'ASSEMBLY_JOINERY',
                          'FINISHING_POLISH',
                          'QUALITY_CHECK'
                        )               NULL,
    balance_percentage  DECIMAL(5,2)    NOT NULL,  -- Auto-calculated, stored for integrity
    -- Timeline
    lead_time_days      SMALLINT        NOT NULL,
    valid_until         DATE            NOT NULL,
    -- Narrative
    notes_to_client     TEXT            NULL,
    internal_notes      TEXT            NULL,      -- Never visible to client
    -- PDF
    pdf_cloudinary_id   VARCHAR(300)    NULL,
    pdf_generated_at    DATETIME        NULL,
    -- Approval tracking
    sent_at             DATETIME        NULL,
    approved_at         DATETIME        NULL,
    revision_requested_at DATETIME      NULL,
    revision_notes      TEXT            NULL,
    -- Previous version link
    supersedes_id       CHAR(36)        NULL,      -- FK to previous version
    -- Concurrency
    version             INT             NOT NULL DEFAULT 1,  -- OCC version
    -- Timestamps
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_quotation_ref (reference_number),
    -- Only one ACTIVE quotation per inquiry
    UNIQUE KEY uq_quotation_active_per_inquiry (
        inquiry_id, status
    ),  -- Note: UNIQUE on (inquiry_id, SENT/APPROVED) doesn't prevent
        -- multiple SUPERSEDED. Application must enforce this pattern.
        -- Use filtered unique index pattern: partial unique enforced in app
    KEY idx_quot_inquiry (inquiry_id),
    KEY idx_quot_client (client_id),
    KEY idx_quot_status (status),
    KEY idx_quot_valid_until (status, valid_until),  -- Expiry job
    KEY idx_quot_admin (created_by_admin_id),
    
    CONSTRAINT fk_quot_inquiry
        FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_quot_client
        FOREIGN KEY (client_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_quot_admin
        FOREIGN KEY (created_by_admin_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_quot_supersedes
        FOREIGN KEY (supersedes_id) REFERENCES quotations(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_quot_percentages
        CHECK (
            ROUND(advance_percentage + milestone2_percentage + balance_percentage, 2) = 100.00
        ),
    CONSTRAINT chk_quot_advance
        CHECK (advance_percentage >= 30.00 AND advance_percentage <= 70.00),
    CONSTRAINT chk_quot_total
        CHECK (total_amount = subtotal + tax_amount - discount_amount),
    CONSTRAINT chk_quot_positive
        CHECK (total_amount > 0 AND subtotal > 0)
        
) ENGINE=InnoDB;

-- DESIGN NOTE on unique quotation per inquiry:
-- Cannot use a true partial unique index in MySQL for "only one SENT/APPROVED
-- per inquiry." Solution: application-level enforcement + SELECT FOR UPDATE
-- + unique constraint at application boundary. The UNIQUE on reference_number
-- prevents duplicates via the sequence mechanism.

CREATE TABLE quotation_line_items (
    id                  CHAR(36)        NOT NULL,
    quotation_id        CHAR(36)        NOT NULL,
    line_number         TINYINT         NOT NULL,  -- Display order
    description         VARCHAR(500)    NOT NULL,
    quantity            DECIMAL(8,2)    NOT NULL DEFAULT 1,
    unit_price          DECIMAL(12,2)   NOT NULL,
    line_total          DECIMAL(12,2)   NOT NULL,  -- quantity × unit_price (stored)
    notes               VARCHAR(300)    NULL,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_qli_quotation_line (quotation_id, line_number),
    
    CONSTRAINT fk_qli_quotation
        FOREIGN KEY (quotation_id) REFERENCES quotations(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_qli_quantity
        CHECK (quantity > 0),
    CONSTRAINT chk_qli_price
        CHECK (unit_price >= 0),
    CONSTRAINT chk_qli_total
        CHECK (ABS(line_total - (quantity * unit_price)) < 0.01)
        -- Allow for rounding: line_total must match quantity × unit_price
        
) ENGINE=InnoDB;
```

---

## 2.5 Order Domain

```sql
CREATE TABLE orders (
    id                  CHAR(36)        NOT NULL,
    reference_number    VARCHAR(20)     NOT NULL,  -- ORD-2025-000001
    client_id           CHAR(36)        NOT NULL,
    -- Source (one of these, not both)
    quotation_id        CHAR(36)        NULL,      -- For custom orders
    product_id          CHAR(36)        NULL,      -- For standard catalog orders
    order_type          ENUM('STANDARD', 'CUSTOM')
                                        NOT NULL,
    -- Financial
    total_amount        DECIMAL(12,2)   NOT NULL,
    amount_paid         DECIMAL(12,2)   NOT NULL DEFAULT 0.00,  -- Denormalized, updated on payment
    amount_outstanding  DECIMAL(12,2)   GENERATED ALWAYS AS
                                        (total_amount - amount_paid) STORED,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    -- State machine
    status              ENUM(
                          'ADVANCE_PENDING',
                          'IN_PRODUCTION',
                          'MATERIAL_PROCUREMENT',
                          'ROUGH_CUTTING',
                          'ASSEMBLY_JOINERY',
                          'FINISHING_POLISH',
                          'QUALITY_CHECK',
                          'READY_FOR_DELIVERY',
                          'DELIVERY_SCHEDULED',
                          'DELIVERED',
                          'CLOSED',
                          'ON_HOLD',
                          'CANCELLED'
                        )               NOT NULL DEFAULT 'ADVANCE_PENDING',
    -- Hold details
    hold_reason         ENUM(
                          'MATERIAL_SHORTAGE',
                          'CLIENT_REQUEST',
                          'QUALITY_ISSUE',
                          'PAYMENT_PENDING',
                          'AMENDMENT_IN_PROGRESS',
                          'OTHER'
                        )               NULL,
    hold_message        VARCHAR(500)    NULL,
    hold_applied_at     DATETIME        NULL,
    hold_resolved_at    DATETIME        NULL,
    pre_hold_status     ENUM(           -- Status to return to after hold resolves
                          'IN_PRODUCTION',
                          'MATERIAL_PROCUREMENT',
                          'ROUGH_CUTTING',
                          'ASSEMBLY_JOINERY',
                          'FINISHING_POLISH',
                          'QUALITY_CHECK'
                        )               NULL,
    -- Timeline
    promised_delivery_dt DATE           NULL,
    actual_delivery_dt   DATE           NULL,
    warranty_expires_at  DATE           NULL,
    -- Cancellation
    cancelled_at        DATETIME        NULL,
    cancelled_by        CHAR(36)        NULL,
    cancellation_reason TEXT            NULL,
    -- Delivery address (snapshot at order time)
    delivery_address_line1  VARCHAR(300) NULL,
    delivery_address_line2  VARCHAR(300) NULL,
    delivery_city           VARCHAR(100) NULL,
    delivery_state          VARCHAR(100) NULL,
    delivery_pincode        VARCHAR(10)  NULL,
    delivery_notes          TEXT         NULL,
    -- Idempotency (from quote approval)
    idempotency_key         VARCHAR(36)  NULL,
    -- Concurrency control
    version             INT             NOT NULL DEFAULT 1,
    -- Timestamps
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_order_ref (reference_number),
    UNIQUE KEY uq_order_quotation (quotation_id),   -- One order per quotation
    UNIQUE KEY uq_order_idempotency (idempotency_key),
    KEY idx_ord_client (client_id),
    KEY idx_ord_status (status),
    KEY idx_ord_status_delivery (status, promised_delivery_dt),
    KEY idx_ord_type_status (order_type, status),
    -- Dashboard: active orders sorted by delivery date
    KEY idx_ord_dashboard (status, promised_delivery_dt ASC),
    -- Financial queries
    KEY idx_ord_financial (status, amount_outstanding),
    KEY idx_ord_created (created_at DESC),
    
    CONSTRAINT fk_ord_client
        FOREIGN KEY (client_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ord_quotation
        FOREIGN KEY (quotation_id) REFERENCES quotations(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ord_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ord_cancelled_by
        FOREIGN KEY (cancelled_by) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_ord_total
        CHECK (total_amount > 0),
    CONSTRAINT chk_ord_paid
        CHECK (amount_paid >= 0 AND amount_paid <= total_amount),
    CONSTRAINT chk_ord_type_source
        CHECK (
            (order_type = 'CUSTOM' AND quotation_id IS NOT NULL AND product_id IS NULL) OR
            (order_type = 'STANDARD' AND product_id IS NOT NULL)
        )
        
) ENGINE=InnoDB;

-- DESIGN NOTE: amount_outstanding is a GENERATED ALWAYS AS STORED column.
-- It is computed by MySQL on write and stored (not recalculated on every read).
-- This enables indexing on amount_outstanding and fast query for overdue payments.

CREATE TABLE order_status_history (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    previous_status     VARCHAR(50)     NOT NULL,  -- VARCHAR, not ENUM: preserves history
                                                    -- even if enum values change
    new_status          VARCHAR(50)     NOT NULL,
    changed_by_user_id  CHAR(36)        NOT NULL,
    changed_by_role     VARCHAR(30)     NOT NULL,
    note                TEXT            NULL,
    -- Was this an automatic transition (system) or manual (user)?
    transition_source   ENUM('MANUAL', 'SYSTEM', 'WEBHOOK')
                                        NOT NULL DEFAULT 'MANUAL',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_osh_order_time (order_id, created_at),
    KEY idx_osh_status (new_status),
    -- No FK on changed_by_user_id: history must persist even if user deleted
    -- (admin account deactivated should not orphan history)
    
    CONSTRAINT fk_osh_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE RESTRICT  -- Cannot delete order with status history
        
) ENGINE=InnoDB;

-- DESIGN NOTE: order_status_history is an append-only audit trail.
-- NO UPDATE or DELETE should ever occur on this table.
-- DB user for application should have: INSERT, SELECT only on this table.

CREATE TABLE order_specifications (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    version_number      SMALLINT        NOT NULL DEFAULT 1,
    spec_source         ENUM(
                          'INITIAL_QUOTATION',
                          'AMENDMENT',
                          'ADMIN_CORRECTION'
                        )               NOT NULL,
    -- Full specification snapshot (denormalized)
    wood_type_label     VARCHAR(200)    NOT NULL,
    finish_type_label   VARCHAR(200)    NOT NULL,
    dim_length_cm       DECIMAL(8,2)    NULL,
    dim_width_cm        DECIMAL(8,2)    NULL,
    dim_height_cm       DECIMAL(8,2)    NULL,
    -- Complete specification as JSON for flexibility
    full_spec_json      JSON            NOT NULL,
    -- Who established this version
    created_by          CHAR(36)        NOT NULL,
    amendment_id        CHAR(36)        NULL,
    is_current          BOOLEAN         NOT NULL DEFAULT TRUE,
    effective_from      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_os_order_current (order_id, is_current),
    KEY idx_os_order_version (order_id, version_number),
    
    CONSTRAINT fk_os_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_os_creator
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
        
) ENGINE=InnoDB;

CREATE TABLE order_amendments (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    requested_by        CHAR(36)        NOT NULL,  -- Usually client
    requested_by_role   ENUM('CLIENT', 'ADMIN')
                                        NOT NULL,
    description         TEXT            NOT NULL,
    -- Financial impact
    cost_delta          DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
                                                    -- + = more expensive
                                                    -- - = less expensive
    lead_time_delta_days SMALLINT       NOT NULL DEFAULT 0,
    -- Admin evaluation
    evaluated_by        CHAR(36)        NULL,
    admin_notes         TEXT            NULL,
    new_delivery_dt     DATE            NULL,       -- Proposed new delivery after amendment
    -- State
    status              ENUM(
                          'REQUESTED',
                          'EVALUATING',
                          'SENT_TO_CLIENT',
                          'ACCEPTED',
                          'REJECTED',
                          'EXPIRED'
                        )               NOT NULL DEFAULT 'REQUESTED',
    -- Response
    client_response_at  DATETIME        NULL,
    client_response_note TEXT           NULL,
    expires_at          DATETIME        NULL,      -- When client must respond by
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_oa_order (order_id),
    KEY idx_oa_status (status),
    
    CONSTRAINT fk_oa_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_oa_requester
        FOREIGN KEY (requested_by) REFERENCES users(id)
        ON DELETE RESTRICT
        
) ENGINE=InnoDB;
```

---

## 2.6 Payment Domain

```sql
CREATE TABLE payment_milestones (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    milestone_number    TINYINT         NOT NULL,  -- 1, 2, 3
    label               VARCHAR(100)    NOT NULL,  -- 'Advance Payment', 'Balance'
    percentage          DECIMAL(5,2)    NOT NULL,
    amount_due          DECIMAL(12,2)   NOT NULL,  -- Calculated and stored
    trigger_state       VARCHAR(50)     NULL,      -- Order state that makes this due
                                                    -- NULL = due immediately (advance)
    due_date            DATE            NULL,      -- Optional explicit due date
    status              ENUM(
                          'PENDING',
                          'OVERDUE',
                          'PARTIALLY_PAID',
                          'CONFIRMED',
                          'VOIDED',
                          'WAIVED'
                        )               NOT NULL DEFAULT 'PENDING',
    -- Payment tracking
    amount_received     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    -- Confirmed details (set when CONFIRMED)
    confirmed_by        CHAR(36)        NULL,
    confirmed_at        DATETIME        NULL,
    -- Void details
    voided_by           CHAR(36)        NULL,
    voided_at           DATETIME        NULL,
    void_reason         TEXT            NULL,
    -- Waiver details
    waived_by           CHAR(36)        NULL,
    waived_at           DATETIME        NULL,
    waive_reason        TEXT            NULL,
    -- Concurrency
    version             INT             NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_pm_order_number (order_id, milestone_number),
    KEY idx_pm_status (status),
    KEY idx_pm_order (order_id),
    -- Overdue detection
    KEY idx_pm_overdue (status, due_date),
    
    CONSTRAINT fk_pm_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_pm_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_pm_percentage
        CHECK (percentage > 0 AND percentage <= 100),
    CONSTRAINT chk_pm_amount
        CHECK (amount_due > 0 AND amount_received >= 0)
        
) ENGINE=InnoDB;

CREATE TABLE payment_records (
    id                  CHAR(36)        NOT NULL,
    milestone_id        CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,  -- Denormalized for query convenience
    amount              DECIMAL(12,2)   NOT NULL,
    currency            CHAR(3)         NOT NULL DEFAULT 'INR',
    payment_method      ENUM(
                          'CASH',
                          'BANK_TRANSFER',
                          'UPI',
                          'CHEQUE',
                          'GATEWAY',    -- Phase 2: online payment
                          'OTHER'
                        )               NOT NULL,
    payment_date        DATE            NOT NULL,  -- Actual payment date (admin-entered)
    reference_number    VARCHAR(200)    NULL,      -- Bank ref, UTR number, cheque no.
    -- Phase 2: Gateway fields
    gateway_name        VARCHAR(50)     NULL,      -- 'RAZORPAY', 'STRIPE'
    gateway_transaction_id VARCHAR(200) NULL,      -- For idempotency
    gateway_order_id    VARCHAR(200)    NULL,
    gateway_status      VARCHAR(50)     NULL,
    gateway_raw_response JSON           NULL,      -- Full webhook payload stored
    -- Manual recording details
    recorded_by         CHAR(36)        NOT NULL,
    recorded_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes               TEXT            NULL,
    -- This record itself may be voided (if entered in error)
    is_voided           BOOLEAN         NOT NULL DEFAULT FALSE,
    voided_by           CHAR(36)        NULL,
    voided_at           DATETIME        NULL,
    void_reason         TEXT            NULL,
    -- Idempotency
    idempotency_key     VARCHAR(36)     NULL,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_pr_gateway_txn (gateway_transaction_id),  -- Prevents double webhook
    UNIQUE KEY uq_pr_idempotency (idempotency_key),
    KEY idx_pr_milestone (milestone_id),
    KEY idx_pr_order (order_id),
    KEY idx_pr_date (payment_date),
    KEY idx_pr_method (payment_method),
    
    CONSTRAINT fk_pr_milestone
        FOREIGN KEY (milestone_id) REFERENCES payment_milestones(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_pr_recorder
        FOREIGN KEY (recorded_by) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_pr_amount
        CHECK (amount > 0)
        
) ENGINE=InnoDB;

CREATE TABLE refund_records (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    payment_record_id   CHAR(36)        NULL,      -- Which payment is being refunded
    amount              DECIMAL(12,2)   NOT NULL,
    reason              TEXT            NOT NULL,
    refund_method       ENUM(
                          'CASH',
                          'BANK_TRANSFER',
                          'UPI',
                          'GATEWAY_REVERSAL',
                          'OTHER'
                        )               NOT NULL,
    refund_date         DATE            NOT NULL,
    reference_number    VARCHAR(200)    NULL,
    approved_by         CHAR(36)        NOT NULL,  -- SUPER_ADMIN only
    processed_by        CHAR(36)        NOT NULL,
    notes               TEXT            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_rr_order (order_id),
    KEY idx_rr_payment (payment_record_id),
    
    CONSTRAINT fk_rr_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_rr_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_rr_amount
        CHECK (amount > 0)
        
) ENGINE=InnoDB;
```

---

## 2.7 Production Domain

```sql
CREATE TABLE production_stages (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    stage_name          ENUM(
                          'MATERIAL_PROCUREMENT',
                          'ROUGH_CUTTING',
                          'ASSEMBLY_JOINERY',
                          'FINISHING_POLISH',
                          'QUALITY_CHECK'
                        )               NOT NULL,
    stage_order         TINYINT         NOT NULL,  -- 1-5, execution sequence
    status              ENUM(
                          'PENDING',
                          'IN_PROGRESS',
                          'COMPLETED',
                          'SKIPPED'
                        )               NOT NULL DEFAULT 'PENDING',
    assigned_to         CHAR(36)        NULL,      -- Shop manager
    started_at          DATETIME        NULL,
    completed_at        DATETIME        NULL,
    estimated_duration_hours SMALLINT   NULL,
    notes               TEXT            NULL,
    version             INT             NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_ps_order_stage (order_id, stage_name),
    KEY idx_ps_order (order_id),
    KEY idx_ps_status (status),
    KEY idx_ps_assigned (assigned_to),
    
    CONSTRAINT fk_ps_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ps_assigned
        FOREIGN KEY (assigned_to) REFERENCES users(id)
        ON DELETE SET NULL
        
) ENGINE=InnoDB;

CREATE TABLE production_photos (
    id                  CHAR(36)        NOT NULL,
    stage_id            CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,  -- Denormalized
    cloudinary_public_id VARCHAR(300)   NOT NULL,
    caption             VARCHAR(500)    NULL,
    is_visible_to_client BOOLEAN        NOT NULL DEFAULT FALSE,
    uploaded_by         CHAR(36)        NOT NULL,
    uploaded_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_pp_stage (stage_id),
    KEY idx_pp_order (order_id),
    
    CONSTRAINT fk_pp_stage
        FOREIGN KEY (stage_id) REFERENCES production_stages(id)
        ON DELETE CASCADE
        
) ENGINE=InnoDB;
```

---

## 2.8 Delivery Domain

```sql
CREATE TABLE delivery_schedules (
    id                  CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    scheduled_date      DATE            NOT NULL,
    time_slot           ENUM(
                          'MORNING',    -- 9am-12pm
                          'AFTERNOON',  -- 12pm-4pm
                          'EVENING',    -- 4pm-7pm
                          'FLEXIBLE'
                        )               NOT NULL DEFAULT 'FLEXIBLE',
    assigned_staff_id   CHAR(36)        NULL,
    status              ENUM(
                          'SCHEDULED',
                          'RESCHEDULED',
                          'ATTEMPTED',
                          'COMPLETED',
                          'CANCELLED'
                        )               NOT NULL DEFAULT 'SCHEDULED',
    client_confirmed    BOOLEAN         NOT NULL DEFAULT FALSE,
    notes               TEXT            NULL,
    created_by          CHAR(36)        NOT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_ds_order (order_id),
    KEY idx_ds_date_slot (scheduled_date, time_slot),
    KEY idx_ds_staff_date (assigned_staff_id, scheduled_date),
    -- Prevent double-booking: one scheduled delivery per order at a time
    KEY idx_ds_order_status (order_id, status),
    
    CONSTRAINT fk_ds_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ds_staff
        FOREIGN KEY (assigned_staff_id) REFERENCES users(id)
        ON DELETE SET NULL
        
) ENGINE=InnoDB;

CREATE TABLE delivery_proofs (
    id                  CHAR(36)        NOT NULL,
    schedule_id         CHAR(36)        NOT NULL,
    order_id            CHAR(36)        NOT NULL,
    proof_type          ENUM('PHOTO', 'SIGNATURE', 'CLIENT_CONFIRMATION', 'ADMIN_SIGNOFF')
                                        NOT NULL,
    cloudinary_public_id VARCHAR(300)   NULL,      -- For PHOTO proof
    signature_data      TEXT            NULL,      -- Base64 SVG for SIGNATURE
    notes               TEXT            NULL,
    recorded_by         CHAR(36)        NOT NULL,
    recorded_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_dp_schedule (schedule_id),
    KEY idx_dp_order (order_id),
    
    CONSTRAINT fk_dp_schedule
        FOREIGN KEY (schedule_id) REFERENCES delivery_schedules(id)
        ON DELETE RESTRICT
        
) ENGINE=InnoDB;
```

---

## 2.9 Audit Domain (Separate Schema)

```sql
USE furnix_audit;

-- ============================================================
-- AUDIT LOG: Append-only. Application DB user has INSERT + SELECT only.
-- No UPDATE, DELETE permissions granted on this schema to app user.
-- ============================================================
CREATE TABLE audit_events (
    id                  CHAR(36)        NOT NULL,
    event_type          VARCHAR(100)    NOT NULL,  -- 'ORDER_STATE_CHANGED', etc.
    -- Actor
    actor_user_id       VARCHAR(36)     NULL,      -- VARCHAR not FK (decoupled)
    actor_role          VARCHAR(30)     NULL,
    actor_ip_hash       VARCHAR(64)     NULL,      -- SHA-256 of IP
    actor_user_agent    VARCHAR(500)    NULL,
    -- Target
    entity_type         VARCHAR(50)     NOT NULL,  -- 'ORDER', 'QUOTATION', etc.
    entity_id           VARCHAR(36)     NOT NULL,
    -- Change data capture
    previous_value      JSON            NULL,      -- State before change
    new_value           JSON            NULL,      -- State after change
    -- Context
    request_trace_id    VARCHAR(36)     NULL,      -- Correlation with application logs
    session_id          VARCHAR(36)     NULL,
    -- Metadata
    occurred_at         DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                                                   -- Millisecond precision
    server_instance     VARCHAR(50)     NULL,      -- Which server processed it
    
    PRIMARY KEY (id),
    KEY idx_ae_entity (entity_type, entity_id),
    KEY idx_ae_actor (actor_user_id),
    KEY idx_ae_event_type (event_type),
    KEY idx_ae_occurred (occurred_at DESC),
    KEY idx_ae_trace (request_trace_id)
    
    -- Intentionally NO foreign keys to furnix_db tables.
    -- Audit schema is decoupled. Even if main DB is rebuilt, audit survives.
    
) ENGINE=InnoDB;

-- ============================================================
-- OUTBOX: Transactional event publishing (written in same transaction as entity change)
-- Poller reads PUBLISHED=FALSE and pushes to message queue, marks PUBLISHED=TRUE
-- ============================================================
USE furnix_db;

CREATE TABLE outbox_events (
    id                  CHAR(36)        NOT NULL,
    event_type          VARCHAR(100)    NOT NULL,
    aggregate_type      VARCHAR(50)     NOT NULL,  -- 'ORDER', 'INQUIRY', etc.
    aggregate_id        VARCHAR(36)     NOT NULL,
    payload             JSON            NOT NULL,
    schema_version      VARCHAR(10)     NOT NULL DEFAULT '1.0',
    published           BOOLEAN         NOT NULL DEFAULT FALSE,
    published_at        DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Retry tracking
    attempt_count       TINYINT         NOT NULL DEFAULT 0,
    last_attempt_at     DATETIME        NULL,
    last_error          TEXT            NULL,
    
    PRIMARY KEY (id),
    -- Primary query pattern: unpublished events, ordered by creation
    KEY idx_ob_unpublished (published, created_at),
    KEY idx_ob_aggregate (aggregate_type, aggregate_id)
    
) ENGINE=InnoDB;

-- DESIGN NOTE: The poller executes:
-- SELECT * FROM outbox_events WHERE published = FALSE ORDER BY created_at LIMIT 100
-- FOR UPDATE SKIP LOCKED;  -- Skip rows locked by concurrent pollers (Phase 2)
-- This allows multiple poller instances without duplicate processing.
```

---

# PART 3 — READ/WRITE ANALYSIS

---

## 3.1 Write Pattern Analysis

```
HIGH-WRITE OPERATIONS (ranked by frequency):

Rank 1: Product view counter increment
  Table: products.view_count
  Frequency: Every product detail page view
  Pattern: UPDATE products SET view_count = view_count + 1 WHERE id = ?
  Risk: High contention on popular products
  Mitigation: 
    Phase 1: Direct atomic increment (MySQL handles row lock automatically)
    Phase 2: Batch increments in Redis, flush to MySQL every 5 minutes
    (Redis INCR is O(1), no DB write per page view)
  
Rank 2: Outbox event insertion
  Table: outbox_events
  Frequency: Every state change, payment, inquiry
  Pattern: INSERT (single row, very fast)
  Risk: Table grows unbounded without cleanup
  Mitigation: DELETE published events older than 48 hours (batch job)

Rank 3: Audit event insertion
  Table: audit_events (separate schema)
  Frequency: Every significant user action
  Pattern: INSERT (append-only, no contention)
  Risk: Table grows large over time
  Mitigation: Partitioning by month (see Part 7)

Rank 4: Order status history insertion
  Table: order_status_history
  Frequency: Each state transition
  Pattern: INSERT (append-only)
  Risk: None significant at Furnix scale

Rank 5: Refresh token operations
  Table: refresh_tokens
  Frequency: Every token refresh (every 15 minutes per active session)
  Pattern: INSERT new + UPDATE old (rotation)
  Risk: Table grows with old rotated tokens
  Mitigation: Soft-delete rotated tokens, cleanup job deletes after 30 days

LOW-FREQUENCY BUT CRITICAL WRITES:
  - Payment milestone confirmation (financial critical)
  - Order state transitions (business critical)
  - Quotation approval → order creation (atomic, multi-table)
```

---

## 3.2 Read Pattern Analysis

```
HIGH-READ OPERATIONS (ranked by frequency):

Rank 1: Product catalog listing
  Tables: products, product_images (primary image only)
  Frequency: Every page load by any visitor
  Query pattern:
    SELECT p.id, p.slug, p.name, p.base_price, p.status,
           pi.cloudinary_public_id as primary_image
    FROM products p
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
    WHERE p.status = 'ACTIVE'
      AND p.category_id = ?        -- Optional
      AND p.base_price BETWEEN ? AND ?  -- Optional
    ORDER BY p.is_featured DESC, p.display_order ASC
    LIMIT 12 OFFSET 0;
  
  Optimization: Cache this query result in Redis (5-minute TTL)
  Index used: idx_product_catalog (status, category_id, display_order, base_price)

Rank 2: Admin dashboard aggregate counts
  Query pattern (multiple queries executed in parallel):
    -- Active order count by status
    SELECT status, COUNT(*) FROM orders
    WHERE status NOT IN ('CLOSED', 'CANCELLED')
    GROUP BY status;
    
    -- Unacknowledged inquiries
    SELECT COUNT(*) FROM inquiries
    WHERE status = 'SUBMITTED'
    AND created_at < NOW() - INTERVAL 24 HOUR;
    
    -- Overdue payments
    SELECT COUNT(*) FROM payment_milestones
    WHERE status = 'PENDING'
    AND due_date < CURDATE();
  
  Optimization: 
    Phase 1: Direct query (indexed, fast at low volume)
    Phase 2: Pre-computed dashboard_summary table, updated on each state change

Rank 3: Order detail for admin management
  Tables: orders, order_status_history, payment_milestones,
          payment_records, production_stages, users (client)
  Optimization: @EntityGraph in JPA to prevent N+1
  Expected: One complex query with LEFT JOINs

Rank 4: Client order tracking
  Same as Rank 3 but with column filtering (exclude internal notes, payment refs)
  Frequency: High when orders are active (clients check daily)

Rank 5: JWT validation / user lookup
  Table: users (by id from JWT sub claim)
  Frequency: Every authenticated API request
  Query: SELECT id, role, is_active, token_version FROM users WHERE id = ?
  Optimization: Cache user auth context in Redis (TTL 5 minutes, invalidated on change)
```

---

## 3.3 Query Hotspot Analysis

```
HOTSPOT 1: products table during catalog browsing
  Problem: Frequent reads on same rows (featured products, popular categories)
  Solution: Redis cache for product listing (not individual product rows)
  MySQL: InnoDB buffer pool caches hot pages in memory
         At 200 products, entire table fits in 4MB of buffer pool
  
HOTSPOT 2: order status check during admin dashboard load
  Problem: COUNT queries on orders table at every dashboard refresh
  Solution: Phase 2: Materialized summary table
    CREATE TABLE dashboard_summary (
        id                  TINYINT PRIMARY KEY DEFAULT 1,
        orders_advance_pending INT NOT NULL DEFAULT 0,
        orders_in_production   INT NOT NULL DEFAULT 0,
        orders_ready_delivery  INT NOT NULL DEFAULT 0,
        inquiries_pending      INT NOT NULL DEFAULT 0,
        payments_overdue       INT NOT NULL DEFAULT 0,
        last_updated_at        DATETIME NOT NULL
    );
    -- Single row, updated by triggers or application on each state change
    -- Dashboard reads: SELECT * FROM dashboard_summary WHERE id = 1
    -- One row read, O(1), always fast

HOTSPOT 3: audit_events table (grows continuously)
  Problem: High insert volume, query slowdown as table grows
  Solution: Partition by month (see Part 7)
  Application impact: Query requires partition pruning hint or
    date range filter to avoid full partition scan
```

---

# PART 4 — INDEXING STRATEGY

---

## 4.1 Complete Index Design

```sql
-- ============================================================
-- PRODUCTS: Catalog queries
-- ============================================================
-- Primary access patterns:
-- 1. Catalog listing with filters + sort
-- 2. Slug lookup for product detail page
-- 3. Admin: list by status
-- 4. Full-text search

-- Already defined in CREATE TABLE:
-- UNIQUE KEY uq_product_slug (slug)
-- KEY idx_product_catalog (status, category_id, display_order, base_price)
-- KEY idx_product_status_featured (status, is_featured)
-- FULLTEXT KEY ft_product_search (name, short_description, description)

-- Additional: For admin product management list
CREATE INDEX idx_product_admin_list ON products(status, updated_at DESC);

-- For featured products widget (home page)
CREATE INDEX idx_product_featured ON products(is_featured, status, display_order)
  WHERE is_featured = TRUE;
-- Note: MySQL doesn't support partial indexes natively.
-- Functional equivalent: Covering index with is_featured as leading column.
-- The query optimizer will use is_featured = TRUE as range scan start.

-- ============================================================
-- ORDERS: The most queried business entity
-- ============================================================

-- Dashboard: Active orders by delivery urgency
CREATE INDEX idx_ord_active_delivery ON orders(status, promised_delivery_dt ASC)
  COMMENT 'Admin dashboard: orders sorted by delivery urgency';

-- Client portal: Client's own orders
CREATE INDEX idx_ord_client_recent ON orders(client_id, created_at DESC)
  COMMENT 'Client order history';

-- Financial reporting: Revenue queries
CREATE INDEX idx_ord_financial_report ON orders(
    status,
    created_at,
    total_amount,
    amount_paid
) COMMENT 'Revenue reporting queries';

-- ============================================================
-- PAYMENT MILESTONES: Financial monitoring
-- ============================================================

-- Overdue payment detection (runs every 15 minutes)
CREATE INDEX idx_pm_overdue_detect ON payment_milestones(
    status,
    due_date
) WHERE status = 'PENDING';
-- MySQL equivalent (no partial index): optimizer uses status='PENDING'
-- as range start if status is leading column, then date filter

-- Admin financial summary: outstanding amounts per order
CREATE INDEX idx_pm_outstanding ON payment_milestones(order_id, status, amount_due);

-- ============================================================
-- INQUIRIES: SLA monitoring
-- ============================================================

-- SLA job: Find inquiries past response SLA
CREATE INDEX idx_inq_sla_check ON inquiries(
    status,
    created_at
) COMMENT 'SLA monitoring: inquiries past 24h without acknowledgment';

-- Admin assignment queue
CREATE INDEX idx_inq_unassigned ON inquiries(status, assigned_admin_id, created_at)
  COMMENT 'Find unassigned open inquiries';

-- ============================================================
-- AUDIT EVENTS: Query by entity (most common audit query pattern)
-- ============================================================
CREATE INDEX idx_ae_entity_time ON audit_events(entity_type, entity_id, occurred_at DESC)
  COMMENT 'Entity history: all events for a specific order/quotation/etc.';

-- ============================================================
-- REFRESH TOKENS: Session management
-- ============================================================
-- Clean up expired tokens
CREATE INDEX idx_rt_cleanup ON refresh_tokens(expires_at, revoked_at)
  COMMENT 'Background job: find expired/revoked tokens for cleanup';
```

---

## 4.2 Index Cardinality Analysis

```
Index Effectiveness (Cardinality Ranges):

Column              │ Cardinality     │ Index Usefulness
────────────────────┼─────────────────┼────────────────────────────────────
users.id            │ Unique          │ Excellent (PK)
users.email         │ Unique          │ Excellent (login lookup)
orders.status       │ ~13 values      │ Medium alone; Good as leading col
                    │                 │ with high-cardinality following col
orders.client_id    │ Many unique     │ Excellent (client's orders)
orders.created_at   │ Nearly unique   │ Good for range queries
products.slug       │ Unique          │ Excellent (product detail lookup)
products.status     │ 4 values        │ Medium; use as leading col with
                    │                 │ category_id for good selectivity
payment_milestones  │                 │
  .status           │ 6 values        │ Medium; combine with order_id
inquiries.status    │ 8 values        │ Medium; combine with created_at

COMPOSITE INDEX DESIGN PRINCIPLE:
→ Leading column: Most frequently filtered column
→ Second column: Best discriminator for rows passing first filter
→ Include column: Avoid table lookup for common projections

Example: idx_product_catalog (status, category_id, display_order, base_price)
  Query: WHERE status='ACTIVE' AND category_id=? ORDER BY display_order
  → status: filters ~25% of rows (only ACTIVE)
  → category_id: filters to ~5-10% of remaining rows
  → display_order: already sorted, no filesort needed
  → base_price: covering (avoids table lookup for price filter)
  
COVERING INDEX STRATEGY:
For the most frequent catalog query, make it covering:
  All columns needed by the query are IN the index.
  MySQL never needs to visit the actual table row.
  
  CREATE INDEX idx_product_catalog_covering ON products(
      status,
      category_id,
      display_order,
      id,       -- For the JOINs
      name,     -- Displayed in listing
      base_price,
      is_featured
  );
  -- At 200 products: 200 × ~50 bytes ≈ 10KB index
  -- Fits trivially in InnoDB buffer pool
  -- At 10,000 products: 500KB — still fine
```

---

# PART 5 — CONSISTENCY & TRANSACTIONS

---

## 5.1 Transaction Boundary Definitions

```sql
-- ============================================================
-- TRANSACTION 1: Quotation Approval → Order Creation
-- ISOLATION: SERIALIZABLE (highest — prevents phantom reads)
-- This is the most critical transaction in Furnix.
-- ============================================================

START TRANSACTION;

-- Step 1: Lock the quotation row (prevents concurrent approvals)
SELECT id, status, valid_until, client_id, total_amount,
       advance_percentage, milestone2_percentage, balance_percentage,
       lead_time_days, version
FROM quotations
WHERE id = ?
FOR UPDATE;  -- Row-level exclusive lock

-- Step 2: Validate (inside transaction, after acquiring lock)
-- If status != 'SENT' or valid_until < CURDATE() → ROLLBACK, return error

-- Step 3: Generate order reference number (atomic)
UPDATE reference_sequences
SET last_value = last_value + 1
WHERE entity_type = 'ORDER' AND year = YEAR(NOW());

SELECT last_value FROM reference_sequences
WHERE entity_type = 'ORDER' AND year = YEAR(NOW());
-- Compose: ORD-{YEAR}-{LPAD(last_value, 6, '0')}

-- Step 4: Update quotation
UPDATE quotations
SET status = 'APPROVED',
    approved_at = NOW(),
    version = version + 1
WHERE id = ? AND version = {expected_version};  -- OCC check
-- If rows affected = 0: version conflict → ROLLBACK

-- Step 5: Create order
INSERT INTO orders (id, reference_number, client_id, quotation_id,
                    order_type, total_amount, status, idempotency_key, ...)
VALUES (UUID(), ?, ?, ?, 'CUSTOM', ?, 'ADVANCE_PENDING', ?, ...);

-- Step 6: Create payment milestones
INSERT INTO payment_milestones
    (id, order_id, milestone_number, label, percentage, amount_due, trigger_state, status)
VALUES
    (UUID(), {order_id}, 1, 'Advance Payment', {advance_pct},
     ROUND({total} * {advance_pct} / 100, 2), NULL, 'PENDING'),
    -- Conditional milestone 2:
    (UUID(), {order_id}, 2, 'Mid-Production Payment', {m2_pct},
     ROUND({total} * {m2_pct} / 100, 2), {m2_trigger}, 'PENDING'),
    (UUID(), {order_id}, 3, 'Balance Payment', {balance_pct},
     ROUND({total} * {balance_pct} / 100, 2), 'READY_FOR_DELIVERY', 'PENDING');

-- Step 7: Create initial specification snapshot
INSERT INTO order_specifications
    (id, order_id, version_number, spec_source, wood_type_label, finish_type_label,
     dim_length_cm, dim_width_cm, dim_height_cm, full_spec_json, created_by, is_current)
VALUES (UUID(), {order_id}, 1, 'INITIAL_QUOTATION', ?, ?, ?, ?, ?, ?, ?, TRUE);

-- Step 8: Update inquiry status
UPDATE inquiries
SET status = 'CONVERTED',
    version = version + 1
WHERE id = {inquiry_id} AND version = {expected_version};

-- Step 9: Write audit event (same transaction)
INSERT INTO furnix_audit.audit_events
    (id, event_type, actor_user_id, entity_type, entity_id, previous_value, new_value, occurred_at)
VALUES
    (UUID(), 'QUOTATION_APPROVED', {client_id}, 'QUOTATION', {quot_id},
     JSON_OBJECT('status', 'SENT'), JSON_OBJECT('status', 'APPROVED'), NOW(3)),
    (UUID(), 'ORDER_CREATED', {client_id}, 'ORDER', {order_id},
     NULL, JSON_OBJECT('status', 'ADVANCE_PENDING', 'total', {total}), NOW(3));

-- Step 10: Write outbox event (same transaction, published later)
INSERT INTO outbox_events
    (id, event_type, aggregate_type, aggregate_id, payload, published)
VALUES
    (UUID(), 'ORDER_CREATED', 'ORDER', {order_id},
     JSON_OBJECT('orderId', {order_id}, 'clientId', {client_id}, ...), FALSE);

COMMIT;

-- ============================================================
-- TRANSACTION 2: Payment Milestone Confirmation
-- ISOLATION: READ COMMITTED (sufficient — no phantom read risk)
-- ============================================================

START TRANSACTION;

-- Lock milestone row
SELECT id, status, amount_due, version
FROM payment_milestones
WHERE id = ? AND order_id = ?
FOR UPDATE;

-- Validate: status must be PENDING (re-check after lock)
-- If not PENDING: ROLLBACK → idempotent response

-- Record payment
INSERT INTO payment_records
    (id, milestone_id, order_id, amount, payment_method,
     payment_date, reference_number, recorded_by, idempotency_key)
VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?);

-- Update milestone
UPDATE payment_milestones
SET status = 'CONFIRMED',
    amount_received = ?,
    confirmed_by = ?,
    confirmed_at = NOW(),
    version = version + 1
WHERE id = ? AND version = {expected_version};

-- Update order amount_paid (denormalized but kept consistent within transaction)
UPDATE orders
SET amount_paid = amount_paid + ?,
    version = version + 1
WHERE id = ?;

-- Check if this triggers order state transition
-- (Application logic evaluates this, then may execute state transition in same TX)

-- Audit + Outbox (as above)

COMMIT;

-- ============================================================
-- TRANSACTION 3: Order State Transition
-- ISOLATION: READ COMMITTED
-- ============================================================

START TRANSACTION;

SELECT id, status, version
FROM orders
WHERE id = ?
FOR UPDATE;

-- Validate transition validity (application-level state machine check)
-- Validate actor authority

UPDATE orders
SET status = {new_status},
    version = version + 1,
    -- Set timestamps for specific terminal transitions:
    actual_delivery_dt = CASE WHEN {new_status} = 'DELIVERED' THEN CURDATE() ELSE actual_delivery_dt END,
    warranty_expires_at = CASE WHEN {new_status} = 'DELIVERED' THEN DATE_ADD(CURDATE(), INTERVAL 1 YEAR) ELSE warranty_expires_at END
WHERE id = ? AND version = {expected_version};

INSERT INTO order_status_history
    (id, order_id, previous_status, new_status, changed_by_user_id, changed_by_role, note)
VALUES (UUID(), ?, {old_status}, {new_status}, ?, ?, ?);

-- Audit + Outbox

COMMIT;
```

---

## 5.2 Isolation Level Matrix

```
Transaction                    │ Isolation Level   │ Justification
───────────────────────────────┼───────────────────┼────────────────────────────────
Quotation approval → Order     │ SERIALIZABLE      │ Must prevent phantom order from
creation                       │                   │ concurrent approval attempt
                               │                   │
Payment confirmation           │ READ COMMITTED    │ Row lock on milestone sufficient;
                               │                   │ no phantom read risk (we know
                               │                   │ exactly which row to lock)
                               │                   │
Order state transition         │ READ COMMITTED    │ Row lock on order sufficient
                               │                   │
Inquiry submission             │ READ COMMITTED    │ Idempotency key handles retries;
                               │                   │ no multi-row phantom risk
                               │                   │
Catalog reads                  │ READ UNCOMMITTED  │ Acceptable: slight staleness
                               │ (dirty reads OK)  │ in product listing does not
                               │                   │ affect orders or payments
                               │                   │
Admin dashboard aggregates     │ READ COMMITTED    │ Consistent counts, acceptable
                               │                   │ 60-second staleness with cache
                               │                   │
Audit log writes               │ READ COMMITTED    │ Append-only, no read required

MySQL Default: REPEATABLE READ
Override per connection/transaction as needed.
Application configures via Spring @Transactional(isolation = ...)
```

---

# PART 6 — AUDITABILITY

---

## 6.1 Audit Event Taxonomy

```
EVENTS THAT MUST BE AUDITED (zero tolerance for gaps):

Financial Events (immutable business record):
  PAYMENT_MILESTONE_CONFIRMED    → who, when, amount, method, reference
  PAYMENT_RECORD_VOIDED          → who, when, why (requires SUPER_ADMIN)
  REFUND_ISSUED                  → who approved, who processed, amount
  ORDER_AMOUNT_CHANGED           → who, when, before/after total
  QUOTATION_APPROVED             → client approval of financial commitment

State Events (operational record):
  ORDER_STATUS_CHANGED           → from, to, actor, reason, timestamp
  ORDER_CANCELLED                → actor, authority level, reason
  ORDER_HOLD_APPLIED/RELEASED    → actor, reason, duration
  ORDER_AMENDMENT_ACCEPTED       → specification change record

Security Events (threat detection):
  USER_LOGIN_SUCCESS             → actor, IP hash, device
  USER_LOGIN_FAILURE             → IP hash, email attempted, failure count
  USER_PASSWORD_CHANGED          → actor, sessions invalidated count
  USER_ROLE_CHANGED              → who changed whom, old/new role
  USER_ACCOUNT_DEACTIVATED       → who deactivated whom, reason
  RATE_LIMIT_EXCEEDED            → IP hash, endpoint, count
  UNAUTHORIZED_ACCESS_ATTEMPT    → actor, resource attempted

Administrative Events (governance):
  PRODUCT_PRICE_CHANGED          → who, product, old price, new price
  PRODUCT_STATUS_CHANGED         → who, product, old/new status
  SYSTEM_SETTING_CHANGED         → who, setting key, old/new value
  STAFF_ACCOUNT_CREATED          → who created whom, role assigned
  AUDIT_LOG_QUERIED              → who ran audit report, query params
  DATA_EXPORT_PERFORMED          → who, what data, timestamp
```

---

## 6.2 Soft Delete Strategy

```sql
-- ============================================================
-- SOFT DELETE IMPLEMENTATION
-- ============================================================
-- Entities with soft delete: users, products, inquiries
-- Entities WITHOUT soft delete (never delete): 
--   orders, payment_milestones, payment_records, 
--   order_status_history, quotations, audit_events

-- Soft delete implementation pattern:
-- 1. deleted_at DATETIME NULL (NULL = active, timestamp = deleted)
-- 2. deleted_by CHAR(36) NULL (who deleted it)
-- 3. All queries must include: AND deleted_at IS NULL
-- 4. JPA: @Where(clause = "deleted_at IS NULL") on entity

-- View for active users only (used by application by default):
CREATE VIEW active_users AS
    SELECT * FROM users WHERE deleted_at IS NULL;

CREATE VIEW active_products AS
    SELECT * FROM products WHERE deleted_at IS NULL AND status != 'ARCHIVED';

-- Soft delete procedure (enforces cascade logic):
DELIMITER //
CREATE PROCEDURE soft_delete_user(
    IN p_user_id CHAR(36),
    IN p_deleted_by CHAR(36)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check: user has no ACTIVE orders
    IF EXISTS (
        SELECT 1 FROM orders
        WHERE client_id = p_user_id
        AND status NOT IN ('CLOSED', 'CANCELLED', 'DELIVERED')
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with active orders';
    END IF;
    
    -- Soft delete: anonymize PII, preserve order history
    UPDATE users
    SET deleted_at = NOW(),
        deleted_by = p_deleted_by,
        email = CONCAT('deleted_', id, '@deleted.furnix'),
        full_name = '[Deleted User]',
        phone_number = NULL,
        password_hash = NULL,
        mfa_secret_enc = NULL,
        is_active = FALSE
    WHERE id = p_user_id;
    
    -- Revoke all active sessions
    UPDATE refresh_tokens
    SET revoked_at = NOW(),
        revoke_reason = 'ACCOUNT_DELETED'
    WHERE user_id = p_user_id AND revoked_at IS NULL;
    
    -- Audit
    INSERT INTO furnix_audit.audit_events
        (id, event_type, actor_user_id, entity_type, entity_id, occurred_at)
    VALUES
        (UUID(), 'USER_ACCOUNT_DELETED', p_deleted_by, 'USER', p_user_id, NOW(3));
    
    COMMIT;
END //
DELIMITER ;
```

---

## 6.3 Version History

```sql
-- ============================================================
-- VERSION HISTORY: Entities that need full change history
-- ============================================================

-- Quotation versions: Each revision creates a new quotation record
-- (linked via supersedes_id) rather than updating in place.
-- The full history is: 
--   SELECT * FROM quotations WHERE inquiry_id = ? ORDER BY version_number

-- Order specifications: Append-only, each amendment adds a new row
-- Current spec: WHERE order_id = ? AND is_current = TRUE
-- Full history: WHERE order_id = ? ORDER BY version_number

-- Product price history (Phase 2 enhancement):
CREATE TABLE product_price_history (
    id              CHAR(36)    NOT NULL,
    product_id      CHAR(36)    NOT NULL,
    old_price       DECIMAL(12,2) NOT NULL,
    new_price       DECIMAL(12,2) NOT NULL,
    changed_by      CHAR(36)    NOT NULL,
    change_reason   VARCHAR(500) NULL,
    effective_from  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_pph_product (product_id, effective_from DESC),
    
    CONSTRAINT fk_pph_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT
        
) ENGINE=InnoDB;

-- Trigger to auto-record price changes:
DELIMITER //
CREATE TRIGGER trg_product_price_history
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF OLD.base_price != NEW.base_price THEN
        INSERT INTO product_price_history
            (id, product_id, old_price, new_price, changed_by, effective_from)
        VALUES
            (UUID(), NEW.id, OLD.base_price, NEW.base_price,
             @current_user_id,  -- Set by application: SET @current_user_id = ?
             NOW());
    END IF;
END //
DELIMITER ;
-- DESIGN NOTE: Application must SET @current_user_id before each price-changing query
-- Alternatively: Application layer writes to price_history explicitly (more explicit)
-- Recommendation: Application layer (more transparent, easier to test)
```

---

# PART 7 — ARCHIVAL & RETENTION

---

## 7.1 Partitioning Strategy

```sql
-- ============================================================
-- PARTITION: audit_events (high-volume, time-series)
-- Partition by MONTH for efficient range queries and data lifecycle
-- ============================================================

-- MySQL requires partitioning column to be part of PRIMARY KEY
-- Restructure for partitioning:

CREATE TABLE audit_events_partitioned (
    id              CHAR(36)    NOT NULL,
    occurred_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    event_type      VARCHAR(100) NOT NULL,
    actor_user_id   VARCHAR(36) NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       VARCHAR(36) NOT NULL,
    previous_value  JSON        NULL,
    new_value       JSON        NULL,
    request_trace_id VARCHAR(36) NULL,
    actor_ip_hash   VARCHAR(64) NULL,
    server_instance VARCHAR(50) NULL,
    
    PRIMARY KEY (id, occurred_at),  -- occurred_at must be in PK for partitioning
    KEY idx_ae_entity (entity_type, entity_id, occurred_at),
    KEY idx_ae_actor (actor_user_id, occurred_at),
    KEY idx_ae_event (event_type, occurred_at)
    
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(occurred_at) * 100 + MONTH(occurred_at)) (
    PARTITION p_2025_01 VALUES LESS THAN (202502),
    PARTITION p_2025_02 VALUES LESS THAN (202503),
    PARTITION p_2025_03 VALUES LESS THAN (202504),
    -- ... monthly partitions
    PARTITION p_2025_12 VALUES LESS THAN (202601),
    PARTITION p_2026_01 VALUES LESS THAN (202602),
    -- ... continue monthly
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Monthly maintenance job adds new partition and removes old:
-- ALTER TABLE audit_events_partitioned
-- REORGANIZE PARTITION p_future INTO (
--     PARTITION p_2026_02 VALUES LESS THAN (202603),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- Archive old partitions to cold storage (after 1 year):
-- ALTER TABLE audit_events_partitioned EXCHANGE PARTITION p_2025_01
-- WITH TABLE audit_events_archive_2025_01;
-- Then mysqldump archive table → S3 Glacier
-- Then DROP TABLE audit_events_archive_2025_01;

-- PARTITION PRUNING BENEFIT:
-- Query: WHERE entity_id = ? AND occurred_at BETWEEN '2025-03-01' AND '2025-03-31'
-- MySQL reads ONLY p_2025_03 partition, skips all others.
-- At 1 million events/year → 83,333 events/month → 1 partition scan instead of 12.

-- ============================================================
-- PARTITION: order_status_history (append-only, time-series)
-- ============================================================
-- Apply same monthly partition strategy after Year 2 (when table
-- grows beyond 50,000 rows — before that, no partitioning needed)
```

---

## 7.2 Archival Strategy

```sql
-- ============================================================
-- ARCHIVAL PROCEDURE: Close old orders
-- ============================================================

-- Archive Definition:
-- An order is archivable when: status = 'CLOSED' AND warranty_expires_at < NOW()
-- Archival: Move to orders_archive table (identical structure)
-- Retention: orders_archive retained 7 years (legal compliance)

CREATE TABLE orders_archive LIKE orders;
-- Identical structure, different table, no active queries target it

-- Archival job (runs monthly):
DELIMITER //
CREATE PROCEDURE archive_closed_orders()
BEGIN
    DECLARE batch_size INT DEFAULT 500;
    DECLARE archived_count INT DEFAULT 0;
    
    -- Move in batches to avoid long-running transaction
    REPEAT
        START TRANSACTION;
        
        INSERT INTO orders_archive
        SELECT * FROM orders
        WHERE status = 'CLOSED'
          AND warranty_expires_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)
          AND deleted_at IS NULL
        LIMIT batch_size;
        
        SET archived_count = ROW_COUNT();
        
        DELETE FROM orders
        WHERE id IN (
            SELECT id FROM orders_archive
            WHERE warranty_expires_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)
        )
        LIMIT batch_size;
        
        COMMIT;
        
        -- Brief pause between batches (avoid DB pressure)
        DO SLEEP(0.1);
        
    UNTIL archived_count < batch_size END REPEAT;
    
END //
DELIMITER ;

-- ============================================================
-- COLD STORAGE: Long-term data lifecycle
-- ============================================================

-- Year 1-3: orders_archive in MySQL (warm — queryable)
-- Year 3-7: Export to S3 as compressed JSON (mysqldump --where="created_at < ...")
--           Queryable via AWS Athena (S3 + Parquet if needed)
-- Year 7+:  Delete from S3 (regulatory retention window expired)

-- Cloudinary media lifecycle:
-- Product images (archived products): Delete after 2 years
-- Inquiry reference images: Delete after 1 year from inquiry close
-- Production photos: Delete after order close + 1 year
-- Delivery proofs: Delete after order close + 3 years (dispute window)
```

---

# PART 8 — SCALING STRATEGY

---

## 8.1 Replication Configuration

```
MYSQL REPLICATION SETUP (Phase 2):

Primary (Write) → Replica (Read)

Replication type: Asynchronous (default MySQL)
Binlog format: ROW (most reliable for replica consistency)
  → STATEMENT format can produce inconsistencies for non-deterministic queries
  → ROW format logs actual data changes, never ambiguous

Primary server configuration (my.cnf):
  [mysqld]
  server-id = 1
  log-bin = mysql-bin
  binlog-format = ROW
  binlog-row-image = MINIMAL  # Log only changed columns (smaller binlog)
  expire-logs-days = 7        # Auto-cleanup old binlogs
  max-binlog-size = 256M
  sync-binlog = 1             # Flush binlog on every commit (safest)
  innodb-flush-log-at-trx-commit = 1  # Flush InnoDB log on commit

Replica server configuration (my.cnf):
  [mysqld]
  server-id = 2
  relay-log = relay-bin
  read-only = 1               # Replica accepts no writes from application
  super-read-only = 1         # Even SUPER users cannot write (prevents accidents)
  log-slave-updates = 1       # Replica also writes to its own binlog (chain replication)

Monitoring replication lag:
  SHOW SLAVE STATUS\G
  → Seconds_Behind_Master: Alert if > 30 seconds
  → Alert tool: pt-heartbeat (Percona toolkit)
    Inserts timestamp row on primary every second
    Replica measures lag by reading the timestamp row
    More accurate than SHOW SLAVE STATUS

Read routing in Spring:
  @Configuration
  public class RoutingDataSourceConfig {
    @Bean
    public DataSource routingDataSource(
        @Qualifier("primary") DataSource primary,
        @Qualifier("replica") DataSource replica
    ) {
        Map<Object, Object> targets = Map.of(
            DataSourceType.PRIMARY, primary,
            DataSourceType.REPLICA, replica
        );
        RoutingDataSource ds = new RoutingDataSource();
        ds.setTargetDataSources(targets);
        ds.setDefaultTargetDataSource(primary);
        return ds;
    }
  }
  
  // Route @Transactional(readOnly=true) to replica:
  @Transactional(readOnly = true)  // → Replica
  public List<ProductDTO> getProducts() { ... }
  
  @Transactional  // → Primary (default)
  public Order createOrder() { ... }
```

---

## 8.2 Caching Integration Strategy

```
CACHE LAYER INTEGRATION WITH DATABASE:

Layer 1: InnoDB Buffer Pool (in-MySQL cache)
  Size: 70% of DB server RAM (RDS sets this automatically)
  Contains: Hot table pages, index pages
  Effect: Hot product catalog (200 products) fits entirely in buffer pool
  No application configuration needed — automatic

Layer 2: Redis Cache (application-level)
  
  Cache-Aside pattern (lazy loading + TTL):
  
  Catalog products (read-heavy, changes rarely):
    Key: "catalog:{category}:{page}:{sort}:{price_min}:{price_max}"
    TTL: 300 seconds (5 minutes)
    Invalidation: On any product status/price/order change → delete pattern
    
  Product detail:
    Key: "product:slug:{slug}"
    TTL: 600 seconds (10 minutes)
    Invalidation: On product update → delete specific key
    
  User auth context (read on every request):
    Key: "user:auth:{user_id}"
    Value: {id, role, is_active, token_version}
    TTL: 300 seconds (5 minutes)
    Invalidation: On role change, account deactivate → delete key
    
  Dashboard summary (pre-computed):
    Key: "admin:dashboard:summary"
    TTL: 60 seconds
    Refresh: On any order state change or inquiry submission

Layer 3: Application-Level Cache (Caffeine — Phase 3 only)
  For: Reference data (wood_types, finish_types, categories)
  TTL: 3600 seconds (1 hour) — changes almost never
  Size: 1,000 entries maximum
  Effect: Zero DB reads for reference data after warmup
  
  @Cacheable("wood-types")
  public List<WoodTypeDTO> getAllWoodTypes() {
      return woodTypeRepository.findAllByIsAvailableTrue();
  }
  
  @CacheEvict(value = "wood-types", allEntries = true)
  public WoodType updateWoodType(UpdateWoodTypeCommand cmd) { ... }
```

---

# PART 9 — FAILURE & RECOVERY

---

## 9.1 Backup Strategy

```
BACKUP HIERARCHY:

Layer 1: RDS Automated Backups (continuous, managed)
  ─────────────────────────────────────────────────
  Type: Daily automated snapshot + binary log streaming
  Retention: 7 days (configurable up to 35 days)
  RPO: 5 minutes (point-in-time recovery from binary logs)
  RTO: 20-40 minutes (RDS restore from snapshot)
  Cost: Storage at ~$0.095/GB-month
  
  Point-in-time restore command:
  aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier furnix-prod \
    --target-db-instance-identifier furnix-recovery \
    --restore-time 2025-01-15T10:30:00Z

Layer 2: Manual Weekly Snapshot (before major changes)
  ─────────────────────────────────────────────────
  Before: Schema migrations, major feature deployments
  Trigger: Manual (part of deployment runbook)
  Retention: 30 days
  
Layer 3: Cross-Region Snapshot Copy (disaster recovery)
  ─────────────────────────────────────────────────
  Frequency: Daily (copy of RDS automated snapshot)
  Destination: Secondary AWS region (e.g., ap-south-1 → us-east-1)
  Cost: ~$0.02/GB-month for cross-region snapshot
  RTO for region failure: 30-60 minutes

Layer 4: Logical Backup (mysqldump for audit schema)
  ─────────────────────────────────────────────────
  Target: furnix_audit schema (separate from main DB backup)
  Frequency: Weekly
  Format: Compressed SQL dump to S3
  Retention: 5 years (audit compliance requirement)
  Command:
    mysqldump furnix_audit audit_events \
      --single-transaction \
      --compress \
      | gzip | aws s3 cp - s3://furnix-backups/audit/$(date +%Y-%m-%d).sql.gz

Backup Verification (critical — often skipped by teams):
  Weekly: Automated restore test to furnix-verify-{date} RDS instance
  Verify: Row counts match, spot-check 10 random orders
  Alert: If restore fails or row count differs by > 0.01%
  Delete: furnix-verify instance after verification (cost control)
```

---

## 9.2 Corruption Recovery Procedures

```
CORRUPTION SCENARIO 1: Single table corruption (InnoDB)
  Detection: Table returns errors on SELECT, CHECK TABLE reports damage
  
  Recovery procedure:
  1. Stop writes to affected table (application maintenance mode)
  2. Attempt InnoDB recovery:
     SET GLOBAL innodb_force_recovery = 1;
     SELECT * FROM corrupted_table INTO OUTFILE '/tmp/recovered.txt';
     SET GLOBAL innodb_force_recovery = 0;
  3. If recovery successful: restore from outfile
  4. If recovery fails: restore from point-in-time backup
     → Identify last clean timestamp before corruption
     → RDS restore to that timestamp
     → Replay application events from outbox_events (if not corrupt)

CORRUPTION SCENARIO 2: Index corruption (most common)
  Detection: Query returns wrong results, EXPLAIN shows unexpected plan
  
  Recovery procedure:
  1. OPTIMIZE TABLE {tablename};  -- Rebuilds index from data
  2. If OPTIMIZE fails: DROP INDEX + CREATE INDEX (data safe, only index lost)
  3. Verify: Run test queries, compare with backup data

CORRUPTION SCENARIO 3: Data integrity violation (application bug)
  Scenario: Bug causes incorrect amount_paid to be written
  
  Recovery procedure:
  1. Identify: SELECT o.id, o.amount_paid, SUM(pr.amount) as actual_paid
                FROM orders o
                LEFT JOIN payment_records pr ON pr.order_id = o.id AND NOT pr.is_voided
                GROUP BY o.id
                HAVING o.amount_paid != COALESCE(actual_paid, 0);
  
  2. Fix: Correction transaction (SUPER_ADMIN only)
     BEGIN;
     UPDATE orders SET amount_paid = {correct_value} WHERE id = ?;
     INSERT INTO furnix_audit.audit_events (...) -- Document the correction
     COMMIT;
  
  3. Prevent: Add CHECK CONSTRAINT or trigger to verify amount_paid
     integrity after each payment operation

CORRUPTION SCENARIO 4: Outbox events lost (JVM crash before publish)
  Detection: QUEUED orders that should have sent notifications
  
  Recovery procedure:
  1. Query: SELECT * FROM outbox_events WHERE published = FALSE
              AND created_at < NOW() - INTERVAL 5 MINUTE;
     → Any unpublished events > 5 minutes old = missed
  2. Re-publish manually: UPDATE outbox_events SET attempt_count = 0
              WHERE published = FALSE;
     → Outbox poller picks up on next run
  3. Deduplication: Consumer checks event_id before processing (idempotent)
```

---

# PART 10 — ORM & QUERY OPTIMIZATION RISKS

---

## 10.1 N+1 Problem Analysis

```java
// ============================================================
// N+1 PROBLEM LOCATIONS IN FURNIX
// ============================================================

// PROBLEM 1: Admin order list (most dangerous)
// ============================================================
// DANGEROUS CODE:
List<Order> orders = orderRepository.findByStatus(status);  // 1 query
for (Order order : orders) {
    order.getClient().getFullName();  // N queries (lazy load user per order)
    order.getPaymentMilestones().size();  // N queries (lazy load milestones)
}
// At 50 orders: 1 + 50 + 50 = 101 queries for one dashboard panel. UNACCEPTABLE.

// SOLUTION: @EntityGraph for admin order list
@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    
    @EntityGraph(attributePaths = {
        "client",
        "paymentMilestones"
    })
    @Query("SELECT o FROM Order o WHERE o.status IN :statuses ORDER BY o.promisedDeliveryDt ASC")
    List<Order> findActiveOrdersWithDetails(
        @Param("statuses") List<OrderStatus> statuses
    );
    // Result: 1 query with LEFT JOIN FETCH
    // Generated SQL:
    // SELECT o.*, u.*, pm.*
    // FROM orders o
    // LEFT JOIN users u ON u.id = o.client_id
    // LEFT JOIN payment_milestones pm ON pm.order_id = o.id
    // WHERE o.status IN (...)
    // ORDER BY o.promised_delivery_dt ASC
}

// PROBLEM 2: Product catalog with primary image
// ============================================================
// DANGEROUS CODE:
List<Product> products = productRepository.findByStatus("ACTIVE");
for (Product p : products) {
    p.getImages().stream()
     .filter(ProductImage::isPrimary)
     .findFirst();  // N queries to load all images per product
}

// SOLUTION: Custom projection with JOIN
@Query("""
    SELECT p, pi FROM Product p
    LEFT JOIN FETCH p.images pi
    ON pi.isPrimary = true
    WHERE p.status = 'ACTIVE'
    AND (:categoryId IS NULL OR p.categoryId = :categoryId)
    ORDER BY p.isFeatured DESC, p.displayOrder ASC
    """)
List<Product> findCatalogWithPrimaryImage(@Param("categoryId") String categoryId);

// BETTER SOLUTION: DTO projection (avoids full entity load)
@Query("""
    SELECT new com.furnix.catalog.dto.ProductListItemDTO(
        p.id, p.slug, p.name, p.basePrice, p.status,
        pi.cloudinaryPublicId
    )
    FROM Product p
    LEFT JOIN p.images pi ON pi.isPrimary = true
    WHERE p.status = 'ACTIVE'
    ORDER BY p.isFeatured DESC, p.displayOrder ASC
    """)
List<ProductListItemDTO> findCatalogProjection();
// Fetches ONLY the columns needed — not the full entity with TEXT description

// PROBLEM 3: Order detail page (complex aggregation)
// ============================================================
// Order detail loads: order + client + quotation + line_items +
//   payment_milestones + payment_records + production_stages + status_history

// SOLUTION: Separate queries for different aggregates
// (single @EntityGraph fetching everything creates Cartesian explosion)

// Query 1: Order + client + quotation (core order data)
@EntityGraph(attributePaths = {"client", "quotation", "quotation.lineItems"})
Optional<Order> findByIdWithCoreDetails(String id);

// Query 2: Payment state (separate query, not joined with above)
@Query("SELECT pm FROM PaymentMilestone pm LEFT JOIN FETCH pm.paymentRecords " +
       "WHERE pm.orderId = :orderId ORDER BY pm.milestoneNumber")
List<PaymentMilestone> findPaymentDetailsForOrder(@Param("orderId") String orderId);

// Query 3: Production progress
List<ProductionStage> findByOrderIdOrderByStageOrder(String orderId);

// Why separate queries instead of one big @EntityGraph:
// One query with all joins: SELECT ... FROM orders o
//   JOIN payment_milestones pm (3 rows)
//   JOIN payment_records pr (potentially 3 rows per milestone)
//   JOIN production_stages ps (5 rows)
// Result: 3 × 3 × 5 = 45 duplicate order rows (Cartesian product)
// 3 separate queries: 1 + 1 + 1 = 3 clean result sets
// 3 separate queries is FASTER and produces correct results.
```

---

## 10.2 Query Explosion Prevention

```java
// ============================================================
// PAGINATION: Preventing full table scans
// ============================================================

// DANGEROUS: Keyset pagination done wrong
@Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' ORDER BY p.id")
Page<Product> findAll(Pageable pageable);
// Problem at large offsets:
// LIMIT 12 OFFSET 10000 → MySQL scans 10,012 rows to return 12
// At 100,000 products: every late-page request scans most of table

// SOLUTION: Keyset (cursor) pagination
@Query("""
    SELECT p FROM Product p
    WHERE p.status = 'ACTIVE'
    AND (p.displayOrder > :lastDisplayOrder 
         OR (p.displayOrder = :lastDisplayOrder AND p.id > :lastId))
    ORDER BY p.displayOrder ASC, p.id ASC
    """)
List<Product> findNextPage(
    @Param("lastDisplayOrder") int lastDisplayOrder,
    @Param("lastId") String lastId,
    Pageable pageable  // Only LIMIT, no OFFSET
);
// Always O(1) regardless of page depth

// ============================================================
// BULK OPERATIONS: Avoiding one-at-a-time updates
// ============================================================

// DANGEROUS: Loop with individual updates
for (String orderId : orderIds) {
    orderRepository.findById(orderId).ifPresent(order -> {
        order.setStatus(PRODUCTION);
        orderRepository.save(order);  // N round trips
    });
}

// SOLUTION: Bulk update
@Modifying
@Query("UPDATE Order o SET o.status = :status WHERE o.id IN :ids")
int bulkUpdateStatus(@Param("ids") List<String> ids, @Param("status") OrderStatus status);
// Single query, N rows updated

// ============================================================
// JSON COLUMN QUERIES: Avoiding full table scan on JSON
// ============================================================

// DANGEROUS: Filter on JSON field without virtual column + index
SELECT * FROM orders WHERE JSON_EXTRACT(full_spec_json, '$.wood_type') = 'Teak';
// Full table scan — no index on JSON path

// SOLUTION: Generated column + index for frequently queried JSON paths
ALTER TABLE order_specifications
ADD COLUMN wood_type_extracted VARCHAR(200)
    GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(full_spec_json, '$.woodType'))) STORED;

CREATE INDEX idx_os_wood_type ON order_specifications(wood_type_extracted);

// Now query uses index:
SELECT * FROM order_specifications WHERE wood_type_extracted = 'Teak';

// ============================================================
// DECIMAL ARITHMETIC: Preventing floating point errors
// ============================================================

// DANGEROUS: Any floating point for money
double advance = totalAmount * 0.50;  // Floating point — NEVER

// CORRECT: BigDecimal in Java, DECIMAL(12,2) in MySQL
BigDecimal advanceAmount = totalAmount
    .multiply(advancePercentage)
    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

// Verify in DB: payment milestones always sum to order total
// Assertion (run by integrity check job weekly):
SELECT o.id, o.total_amount, SUM(pm.amount_due) as milestone_sum
FROM orders o
JOIN payment_milestones pm ON pm.order_id = o.id
GROUP BY o.id, o.total_amount
HAVING ABS(o.total_amount - milestone_sum) > 0.01;
-- Any result here = data integrity bug that must be investigated

// ============================================================
// SERIALIZATION OVERHEAD: Lazy vs Eager loading
// ============================================================

// JPA entity configuration:
@Entity
@Table(name = "orders")
public class Order {
    
    // LAZY by default for collections (correct):
    @OneToMany(mappedBy = "orderId", fetch = FetchType.LAZY)
    private List<PaymentMilestone> paymentMilestones;
    
    @OneToMany(mappedBy = "orderId", fetch = FetchType.LAZY)
    private List<OrderStatusHistory> statusHistory;
    
    // LAZY for @ManyToOne (override default EAGER):
    @ManyToOne(fetch = FetchType.LAZY)  // Default is EAGER — override!
    @JoinColumn(name = "client_id")
    private User client;
    
    // EAGER only for: simple value objects that are ALWAYS needed
    // with the parent entity. For Order, this is almost nothing.
}

// OPEN SESSION IN VIEW ANTI-PATTERN:
// spring.jpa.open-in-view=false  (set in application.properties)
// Default is TRUE — causes lazy loading in view layer (hidden N+1)
// Setting to FALSE forces all data loading in service layer (explicit, testable)
// This will break code that relies on lazy loading in controller/view.
// Fix: Ensure service layer fetches all needed data before returning DTO.
```

---

## 10.3 Schema Integrity Verification Queries

```sql
-- ============================================================
-- INTEGRITY CHECKS (run weekly by scheduled job)
-- ============================================================

-- Check 1: Payment milestone sums match order totals
SELECT o.reference_number, o.total_amount,
       SUM(pm.amount_due) as milestone_total,
       ABS(o.total_amount - SUM(pm.amount_due)) as discrepancy
FROM orders o
JOIN payment_milestones pm ON pm.order_id = o.id
GROUP BY o.id, o.total_amount
HAVING discrepancy > 0.01;
-- Expected result: 0 rows. Any row = critical data bug.

-- Check 2: Orders with confirmed payments beyond total
SELECT o.reference_number, o.total_amount, o.amount_paid,
       SUM(pr.amount) as actual_confirmed
FROM orders o
JOIN payment_milestones pm ON pm.order_id = o.id
JOIN payment_records pr ON pr.milestone_id = pm.id AND NOT pr.is_voided
GROUP BY o.id, o.total_amount, o.amount_paid
HAVING actual_confirmed > o.total_amount;
-- Expected result: 0 rows. Any row = overpayment bug.

-- Check 3: Orders with no specification snapshot
SELECT o.reference_number, o.order_type
FROM orders o
WHERE o.order_type = 'CUSTOM'
AND NOT EXISTS (
    SELECT 1 FROM order_specifications os
    WHERE os.order_id = o.id AND os.is_current = TRUE
)
AND o.status != 'CANCELLED';
-- Expected: 0 rows. Custom order without specification = data gap.

-- Check 4: Quotations with wrong percentage totals
SELECT reference_number,
       advance_percentage + milestone2_percentage + balance_percentage as total_pct
FROM quotations
WHERE ABS(advance_percentage + milestone2_percentage + balance_percentage - 100.00) > 0.01;
-- Expected: 0 rows. CHECK CONSTRAINT should prevent this, but verify.

-- Check 5: Orphaned payment records (milestone deleted but records exist)
SELECT pr.id, pr.order_id, pr.amount
FROM payment_records pr
LEFT JOIN payment_milestones pm ON pm.id = pr.milestone_id
WHERE pm.id IS NULL;
-- Expected: 0 rows. FK constraint should prevent this.

-- Check 6: Active sessions for deactivated users
SELECT u.email, COUNT(rt.id) as active_sessions
FROM users u
JOIN refresh_tokens rt ON rt.user_id = u.id
WHERE u.is_active = FALSE
AND rt.revoked_at IS NULL
AND rt.expires_at > NOW();
-- Expected: 0 rows. Deactivation must revoke all sessions.
```

---

## Summary: Database Architecture Decision Record

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE DECISION RECORD                             │
├───────────────────────────┬─────────────────────────────────────────────┤
│ Decision                  │ Choice & Reason                             │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Primary Key type          │ CHAR(36) UUID — security (no enumeration),  │
│                           │ distributed-safe, URL-safe                  │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Monetary storage          │ DECIMAL(12,2) — zero floating point risk    │
│                           │ for financial values                         │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Timestamp precision       │ DATETIME (not TIMESTAMP) — no 2038 problem  │
│                           │ DATETIME(3) for audit — millisecond events  │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Soft delete               │ deleted_at + deleted_by pattern on:         │
│                           │ users, products, inquiries                   │
│                           │ NEVER on: orders, payments, audit_events    │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Concurrency control       │ OCC (version column) for edits              │
│                           │ Pessimistic (SELECT FOR UPDATE) for         │
│                           │ state transitions and payments              │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Audit schema              │ Separate database (furnix_audit), app user  │
│                           │ has INSERT + SELECT only, no UPDATE/DELETE  │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Order state history       │ Separate append-only table, not a JSON      │
│                           │ column on orders — queryable, indexable      │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Reference numbers         │ Atomic sequence table — no COUNT(*) race    │
├───────────────────────────┼─────────────────────────────────────────────┤
│ JSON usage                │ JSON columns for flexible spec snapshots;   │
│                           │ generated columns for indexed JSON paths    │
├───────────────────────────┼─────────────────────────────────────────────┤
│ N+1 prevention            │ @EntityGraph + DTO projections +            │
│                           │ separate queries for large collections      │
│                           │ spring.jpa.open-in-view=false              │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Audit partitioning        │ Monthly RANGE partition on audit_events     │
│                           │ by YEAR*100+MONTH expression               │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Backup RPO                │ 5 minutes (binary log streaming via RDS)    │
│ Backup RTO                │ 20-40 minutes (RDS snapshot restore)        │
└───────────────────────────┴─────────────────────────────────────────────┘
```

---

*This database architecture document defines the complete data layer for Furnix. All schema decisions prioritize data integrity and operational correctness. No performance optimization that risks data integrity is acceptable. Every schema change after initial deployment must go through a migration review that includes: backward compatibility assessment, index impact analysis, and zero-downtime deployment verification.*