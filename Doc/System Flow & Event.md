# Furnix — Distributed Systems & Workflow Engineering Analysis
### Version 1.0 | Classification: Engineering Architecture

---

## Document Preamble

This document analyzes Furnix not as a simple CRUD application but as a **distributed workflow system** where state correctness, event ordering, and concurrency control are safety-critical properties. A payment recorded against the wrong order state, a duplicate notification sent to a client, or a race condition on quote approval are not minor bugs — they are business-integrity failures.

Every section prioritizes **correctness over simplicity** and **operational reality over theoretical elegance**.

---

# PART 1 — USER FLOWS

---

## 1.1 Flow Catalog Overview

```
Primary Flows:
├── F-01: Guest Catalog Browsing
├── F-02: User Registration & Verification
├── F-03: Authentication (Password + OAuth)
├── F-04: Custom Inquiry Submission
├── F-05: Admin Inquiry Processing
├── F-06: Quotation Lifecycle
├── F-07: Standard Order Placement
├── F-08: Order Production Management
├── F-09: Payment Milestone Processing
├── F-10: Delivery Execution
└── F-11: Order Cancellation

Interrupt Flows:
├── F-I01: Mid-Production Order Amendment
├── F-I02: Material Shortage Hold
├── F-I03: Client Non-Payment Recovery
├── F-I04: Delivery Failure Recovery
└── F-I05: Dispute Resolution
```

---

## 1.2 F-01: Guest Catalog Browsing

**Actor:** Unauthenticated Visitor
**Precondition:** None
**Postcondition:** User has product information sufficient to decide on inquiry or standard order

```
Sequence:
──────────
1. Visitor requests catalog page
   → CDN serves cached catalog HTML shell
   → Browser requests product list API (public, no auth)
   → API checks Redis cache (TTL: 5 minutes)
       ├── Cache HIT: Return cached product list (< 50ms)
       └── Cache MISS: Query DB → populate cache → return result

2. Visitor applies filters (category, wood type, price)
   → Client-side filter parameters encoded as query string
   → New API request with filter params
   → API applies filters in DB query (indexed columns only)
   → Result returned and rendered

3. Visitor views product detail
   → Product detail API called with slug
   → API checks product status = ACTIVE (DB query)
   → Returns full product data including Cloudinary image URLs
   → Images served directly from Cloudinary CDN (not proxied)

4. Visitor decides to inquire
   → CTA click → redirect to /inquiry/new?product_hint={slug}
   → If unauthenticated: redirect to /login?return_to=/inquiry/new
   → return_to URL preserved through entire auth flow
   → After auth: form pre-populated with product hint data
```

**Hidden Complexity:**
- The `return_to` parameter must be validated server-side to prevent open redirect attacks
- Product hint data must be fetched fresh after authentication, not trusted from pre-auth URL params
- Cache invalidation must occur within 5 minutes of product status change or price update

---

## 1.3 F-02: User Registration & Email Verification

**Actor:** New Client
**Precondition:** Valid email address, not already registered

```
Sequence:
──────────
1. Client submits registration form
   → POST /api/auth/register
   → Server validates inputs (server-side, not trusting client validation)
   → Check email uniqueness:
       ├── Found as VERIFIED account → 409 Conflict
       ├── Found as UNVERIFIED account → resend verification, reset expiry
       └── Not found → proceed

2. Account creation (atomic transaction):
   BEGIN TRANSACTION
   → Insert USER record (email_verified=false, role=CLIENT)
   → Generate verification token (UUID v4, stored as BCrypt hash)
   → Insert EMAIL_VERIFICATION record (token_hash, expires_at = now + 48h)
   COMMIT

3. Verification email dispatch (outside transaction):
   → Push email job to notification queue
   → Queue worker picks up job, sends email via email service
   → If send fails: retry 3x with exponential backoff (30s, 2m, 10m)
   → If all retries fail: mark job as FAILED, alert admin (not client)

4. Client clicks verification link:
   → GET /api/auth/verify-email?token={raw_token}
   → Server finds UNVERIFIED record
   → BCrypt verify: raw_token against stored hash
   → Check not expired
   BEGIN TRANSACTION
   → Update USER: email_verified = true
   → Delete EMAIL_VERIFICATION record
   → Create initial SESSION (refresh token)
   COMMIT
   → Issue JWT access token
   → Redirect to post-registration destination

5. Token already used (replay attempt):
   → EMAIL_VERIFICATION record already deleted
   → Query returns null → 410 Gone
   → Log as security event
```

**Failure Scenarios:**

```
Scenario A: Database commits user but email queue fails
   → User exists but has no verification email
   → Client sees success UI (correct — account was created)
   → Resolution: "Resend verification email" link on login page
   → Resend checks: account exists AND is unverified → resend

Scenario B: Client clicks verification link twice (double-click)
   → First request: BEGIN TX → update user → delete token → COMMIT → issue JWT
   → Second request (milliseconds later): token record gone → 410
   → This is CORRECT behavior — second click is idempotent failure
   → UI shows "already verified" message not "error"

Scenario C: Verification link clicked after 48h expiry
   → Token record found (not yet cleaned up)
   → expiry check fails → 422
   → UI offers resend option
   → Background job cleans up expired verification records
```

---

## 1.4 F-04: Custom Inquiry Submission (Critical Flow)

**Actor:** Authenticated Client
**Precondition:** Email verified, phone present if WhatsApp selected
**Postcondition:** Inquiry record created, admin notified

```
Sequence:
──────────
Pre-flight checks (before showing form):
   → Verify client has < 3 OPEN inquiries
   → If limit reached: show existing inquiries with statuses
   → If not reached: show form

Step 1: Client fills multi-step form
   → Step data stored in browser sessionStorage after each step
   → No server calls until final submission (reduces partial state)

Step 2: Reference image selection
   → Images validated client-side (size, format) — NOT trusted server-side
   → Presigned upload URL requested from backend per image:
       POST /api/media/presigned-upload
       → Backend generates Cloudinary signed upload parameters
       → Returns signed upload data (expires in 5 minutes)
   → Client uploads directly to Cloudinary using signed params
   → Cloudinary returns public_id and URL for each image
   → Client stores these references locally

Step 3: Final submission
   POST /api/inquiries
   Body: {form_data, image_cloudinary_ids[]}

   Server processing (single transaction):
   BEGIN TRANSACTION
   → Re-validate inquiry limit (check again — not just relying on pre-flight)
   → Validate all input fields server-side
   → Validate Cloudinary IDs exist and belong to this upload session
   → Insert INQUIRY record
   → Insert INQUIRY_IMAGES records (linking inquiry to Cloudinary IDs)
   → Generate reference number: INQ-{YYYY}-{zero-padded sequence}
   COMMIT

   Post-transaction (async):
   → Push INQUIRY_SUBMITTED event to event queue
   → Event consumer 1: Send confirmation email to client
   → Event consumer 2: Send notification to admin (email + in-app)
   → Event consumer 3: Generate WhatsApp deep link if applicable
```

**Hidden Complexity — Reference Number Generation:**

```
Naive approach (WRONG):
   SELECT COUNT(*) FROM inquiries WHERE year = 2025
   → INQ-2025-{count+1}
   Problem: Race condition with concurrent submissions produces duplicates

Correct approach:
   Use database sequence object (MySQL: AUTO_INCREMENT on separate
   INQUIRY_SEQUENCE table, or application-level distributed counter)
   
   Option A: Sequence table (simplest, correct):
   BEGIN TRANSACTION
   → INSERT INTO REFERENCE_SEQUENCES (entity_type, year) 
     ON DUPLICATE KEY UPDATE last_value = last_value + 1
   → SELECT last_value FROM REFERENCE_SEQUENCES 
     WHERE entity_type='INQUIRY' AND year=2025
   → Use this value as the sequence number
   COMMIT (this lock scope is minimal — microseconds)

   Option B: Database sequence (if using PostgreSQL)
   → SELECT NEXTVAL('inquiry_sequence_2025')
   → Atomic, no lock contention
```

**Cloudinary Image Validation Problem:**

```
Problem: Client submits Cloudinary IDs from a PREVIOUS upload session
(i.e., re-uses IDs from an old form submission attempt)

Solution: 
→ When presigned URL is generated, store a mapping in Redis:
  Key: "upload_session:{session_id}:{cloudinary_public_id}"
  Value: {user_id, expires_at}
  TTL: 10 minutes

→ On inquiry submission, validate each submitted Cloudinary ID:
  1. Check Redis mapping exists
  2. Check mapping belongs to requesting user
  3. Check not expired
  4. If valid: proceed and delete Redis key (single-use)
  5. If invalid: reject entire submission with specific error

→ This prevents:
  - Users claiming ownership of other users' uploaded images
  - Re-use of upload slots from previous sessions
  - Orphaned Cloudinary uploads (unclaimed images cleaned by background job)
```

---

## 1.5 F-06: Quotation Lifecycle (Critical Flow)

**Actor:** Admin (create/send), Client (approve/reject)
**Dependencies:** Active inquiry, client account, payment term configuration

```
Full Sequence:
──────────────

Phase A: Admin Creates Quotation
   1. Admin opens inquiry → clicks "Create Quotation"
   2. System locks inquiry record for quotation creation:
      → Check: No ACTIVE quotation exists for this inquiry
      → Check: Inquiry is in ACKNOWLEDGED or INFO_REQUESTED state
      → If another admin already started a quotation: 409 with link to existing draft

   3. Admin fills quotation form:
      → Line items with quantities and unit prices
      → Payment terms (advance %, milestone %, balance %)
      → Lead time, validity period
      → Material specifications (captured as JSON snapshot)

   4. Admin saves as DRAFT:
      BEGIN TRANSACTION
      → Insert QUOTATION record (status=DRAFT, version=1)
      → Update INQUIRY status → QUOTE_PENDING
      → Write audit log entry
      COMMIT
      → Queue PDF generation job (async, non-blocking)

   5. Admin reviews and sends:
      → Trigger PDF generation if not yet complete, or use existing
      → POST /api/quotations/{id}/send
      BEGIN TRANSACTION
      → Update QUOTATION status: DRAFT → SENT
      → Record sent_at timestamp
      → Write audit log
      COMMIT
      → Push QUOTATION_SENT event to queue
      → Consumer: Email client with PDF attachment and approval link

Phase B: Client Approves Quotation
   1. Client clicks approval link in email
      → Deep link: /quotes/{quote_id}/review?token={one-time-view-token}
      → Token validates client identity without requiring active session
        (reduces friction — client may not be logged in)
      → After token validation: redirect to authenticated session

   2. Client reviews quotation detail page
      → System checks: quotation.valid_until >= today
      → If expired: show expiry message, offer "Request New Quote" CTA
      → Client clicks "Approve This Quotation"

   3. Approval confirmation modal:
      → Shows: total amount, advance amount due, payment instructions
      → Client clicks "Confirm Approval"

   4. Server processes approval (atomic, idempotent):
      POST /api/quotations/{id}/approve

      Idempotency check:
      → Check if ORDER already exists with this quotation_id
      → If yes: return existing order (idempotent response, not error)
      → If no: proceed

      BEGIN TRANSACTION (serializable isolation)
      → SELECT quotation FOR UPDATE (lock row)
      → Validate: status = SENT (not EXPIRED, SUPERSEDED, DRAFT)
      → Validate: valid_until >= NOW()
      → Validate: client_id matches authenticated user
      → Update QUOTATION: status → APPROVED, approved_at = NOW()
      → Create ORDER record:
          - Snapshot quotation data into specification_snapshot_json
          - Set status = ADVANCE_PENDING
          - Generate order reference number
          - Create PAYMENT_MILESTONE records from payment terms
      → Update INQUIRY: status → CONVERTED
      → Write audit log entries (quotation approved, order created)
      COMMIT

      Post-transaction:
      → Push ORDER_CREATED event to queue
      → Consumer 1: Email client with order confirmation and payment instructions
      → Consumer 2: Email admin with quote approval notification
      → Consumer 3: Update admin dashboard real-time (WebSocket push)
```

**Critical Race Condition — Dual Approval:**

```
Scenario: Client clicks approve button twice in rapid succession
(or network retry causes duplicate request)

Without protection:
   Request 1: SELECT quotation → status=SENT → CREATE order → COMMIT
   Request 2: SELECT quotation → status=SENT → CREATE order → COMMIT
   Result: Two orders created from one quotation

Protection (SELECT FOR UPDATE):
   Request 1: SELECT quotation FOR UPDATE → acquires row lock
   Request 2: SELECT quotation FOR UPDATE → BLOCKS (waits for lock)
   Request 1: UPDATE status=APPROVED → CREATE order → COMMIT → releases lock
   Request 2: Lock acquired → SELECT quotation → status=APPROVED (not SENT)
   → Idempotency check finds existing order
   → Returns existing order reference (not error)

Additional protection: Unique constraint on ORDER.quotation_id
   → Even if SELECT FOR UPDATE somehow fails, the unique constraint
     prevents duplicate orders at DB level (last resort safety net)
```

---

## 1.6 F-09: Payment Milestone Processing (Critical Flow)

**Actor:** Admin
**Precondition:** Order exists, milestone is in PENDING state

```
Sequence:
──────────
1. Admin navigates to order → payment section
   → Sees milestone list with: amount due, trigger state, current status
   → Selects "Record Payment" for a specific milestone

2. Admin fills payment form:
   → Payment method, reference number, amount received, date

3. Server validates and records:
   POST /api/orders/{orderId}/payments/{milestoneId}/confirm

   Validation layer:
   → Milestone exists and belongs to this order
   → Milestone status is PENDING (not already CONFIRMED)
   → Requesting user has ADMIN or SUPER_ADMIN role
   → Amount received matches expected OR admin explicitly marks partial

   BEGIN TRANSACTION (repeatable read isolation)
   → SELECT payment_milestone FOR UPDATE
   → Re-validate status = PENDING (double check after lock)
   → Insert PAYMENT_RECORD (amount, method, reference, confirmed_by, confirmed_at)
   → Update PAYMENT_MILESTONE: status → CONFIRMED
   → Check if this payment enables an order state transition:
       └── If milestone 1 (advance) CONFIRMED AND order in ADVANCE_PENDING:
           → Trigger order state transition: ADVANCE_PENDING → IN_PRODUCTION
           → Insert ORDER_STATUS_HISTORY record
   → Write audit log
   COMMIT

   Post-transaction:
   → Push PAYMENT_CONFIRMED event to queue
   → If order state changed: Push ORDER_STATUS_CHANGED event
   → Consumers: Email client, update admin dashboard real-time

4. State transition failure isolation:
   → If payment confirmation commits but state transition fails:
     → Payment is still recorded (correct — money was received)
     → Order state remains ADVANCE_PENDING
     → Alert logged for admin to manually trigger state transition
     → This is an acceptable inconsistency window (admin-resolvable)
     → NOT rolled back — rolling back payment record when money exists
       is MORE dangerous than leaving state slightly behind
```

---

## 1.7 F-I01: Mid-Production Order Amendment (Interrupt Flow)

**Actor:** Client requests change; Admin processes
**Precondition:** Order in IN_PRODUCTION state

```
This is the most complex interrupt flow because it affects:
- Production schedule (must pause or adjust)
- Pricing (may increase or decrease)
- Lead time (almost always increases)
- Client agreement (must be formally captured)

Sequence:
──────────
1. Client contacts admin via WhatsApp or in-app message
   → Admin manually creates AMENDMENT_REQUEST on the order:
     POST /api/orders/{id}/amendments
     Body: {description_of_change, requested_by: CLIENT}

2. System creates amendment record:
   → AMENDMENT status: DRAFT
   → Order status: IN_PRODUCTION → IN_PRODUCTION_HOLD (sub-state)
   → Hold reason: CLIENT_AMENDMENT_REQUEST
   → Admin notified: "Production paused pending amendment evaluation"

3. Admin evaluates impact and creates amendment quote:
   → Additional cost delta (can be positive or negative)
   → Additional lead time delta (days added to delivery)
   → Amendment description for client

4. Amendment sent to client:
   → AMENDMENT status: SENT
   → Client receives notification with: what changes, cost delta, new delivery date

5. Client responds:
   Branch A — Client Accepts Amendment:
   → POST /api/orders/{orderId}/amendments/{amendmentId}/accept
   BEGIN TRANSACTION
   → Update AMENDMENT: status → ACCEPTED
   → Update ORDER: 
       - Append amendment to specification_snapshot_json 
         (APPEND, not replace — preserves history)
       - Adjust total_amount by delta
       - Adjust expected_delivery_date
       - status → IN_PRODUCTION (removes hold)
   → If cost delta > 0: Create new PAYMENT_MILESTONE for additional amount
   → Write audit log (full before/after specification snapshot)
   COMMIT

   Branch B — Client Rejects Amendment:
   → Order continues with original specification
   → AMENDMENT status → REJECTED
   → ORDER status: IN_PRODUCTION_HOLD → IN_PRODUCTION
   → Admin notified: "Continue with original spec"

   Branch C — Client Does Not Respond (72h timeout):
   → System event triggers: AMENDMENT_RESPONSE_TIMEOUT
   → Admin alerted to escalate via direct communication
   → Order remains in HOLD until resolved
   → No automatic action (cannot assume intent)
```

**Why Specification History Must Be Append-Only:**

```
WRONG approach:
   ORDER.specification_snapshot_json = {new_specification}
   → Loses original agreed specification
   → Dispute: "I never agreed to those dimensions" — no evidence

CORRECT approach:
   ORDER.specification_history_json = [
     {version: 1, spec: {original...}, effective_from: "2025-01-01", source: "quotation_approval"},
     {version: 2, spec: {amendment...}, effective_from: "2025-02-01", source: "amendment_accepted", amendment_id: "..."}
   ]
   → Every version of agreed specification preserved
   → Timestamped and sourced
   → Legally defensible audit trail
```

---

# PART 2 — STATE TRANSITIONS

---

## 2.1 Complete Order State Machine

```
                    ┌─────────────────────┐
                    │   ADVANCE_PENDING   │◄──── Order Created
                    └──────────┬──────────┘      (from quote approval
                               │                  or standard order)
          Advance payment      │
          confirmed            │
                    ┌──────────▼──────────┐
                    │    IN_PRODUCTION    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ PRODUCTION_STAGES   │
                    │ (sequential sub-    │
                    │  states):           │
                    │  MATERIAL_PROCURE   │
                    │  ROUGH_CUTTING      │
                    │  ASSEMBLY_JOINERY   │
                    │  FINISHING_POLISH   │
                    │  QUALITY_CHECK      │
                    └──────────┬──────────┘
                               │ All stages complete
                    ┌──────────▼──────────┐
                    │ READY_FOR_DELIVERY  │
                    └──────────┬──────────┘
                               │ Delivery scheduled +
                               │ final payment confirmed
                    ┌──────────▼──────────┐
                    │ DELIVERY_SCHEDULED  │
                    └──────────┬──────────┘
                               │ Delivery executed
                    ┌──────────▼──────────┐
                    │     DELIVERED       │
                    └──────────┬──────────┘
                               │ 7 days elapsed or
                               │ manual close
                    ┌──────────▼──────────┐
                    │  CLOSED             │
                    │  (WARRANTY_ACTIVE)  │
                    └─────────────────────┘

HOLD pseudo-state (overlay, not replacement):
   Any state between IN_PRODUCTION and READY_FOR_DELIVERY
   can have a HOLD flag applied with reason.
   HOLD does not change the state — it adds a blocking condition.

CANCELLED terminal state:
   ├── From ADVANCE_PENDING: Full refund eligible
   ├── From IN_PRODUCTION: Partial refund per policy
   └── From any HOLD state: Determined by investigation
   Only SUPER_ADMIN can cancel from IN_PRODUCTION onwards.
```

---

## 2.2 Transition Rules (Formal Definition)

```
TRANSITION TABLE:

From State          │ To State              │ Guard Conditions                    │ Authority
────────────────────┼───────────────────────┼─────────────────────────────────────┼──────────────
ADVANCE_PENDING     │ IN_PRODUCTION         │ advance_milestone.status=CONFIRMED  │ Admin, System
ADVANCE_PENDING     │ CANCELLED             │ No production started               │ Admin, Client
IN_PRODUCTION       │ PRODUCTION_STAGE_*    │ Previous stage complete             │ Admin, Shop Mgr
PRODUCTION_STAGE_*  │ NEXT_STAGE            │ Explicit admin/shop_mgr action      │ Admin, Shop Mgr
QUALITY_CHECK       │ READY_FOR_DELIVERY    │ All stages complete, QC passed      │ Admin
READY_FOR_DELIVERY  │ DELIVERY_SCHEDULED    │ delivery_date set, final payment OK │ Admin
DELIVERY_SCHEDULED  │ DELIVERED             │ Proof uploaded OR admin sign-off    │ Admin, Delivery
DELIVERED           │ CLOSED                │ 7 days elapsed (auto) OR manual     │ System, Admin
IN_PRODUCTION       │ CANCELLED             │ SUPER_ADMIN authority only          │ Super Admin
ANY_HOLD_STATE      │ SAME_STATE (no hold)  │ Hold reason resolved                │ Admin

INVALID TRANSITIONS (explicitly rejected with 422):
   ADVANCE_PENDING → DELIVERED
   ADVANCE_PENDING → READY_FOR_DELIVERY
   IN_PRODUCTION → DELIVERED (must go through READY_FOR_DELIVERY)
   DELIVERED → IN_PRODUCTION (cannot un-deliver)
   CLOSED → ANY (terminal state — no transitions out)
   CANCELLED → ANY (terminal state — no transitions out)
   Any transition skipping intermediate required states
```

---

## 2.3 Quotation State Machine

```
         ┌───────────┐
         │   DRAFT   │◄──── Admin creates
         └─────┬─────┘
               │ Admin sends
         ┌─────▼─────┐
         │   SENT    │
         └─────┬─────┘
               │
    ┌──────────┼──────────────────┐
    │          │                  │
    ▼          ▼                  ▼
APPROVED  REVISION_REQUESTED   EXPIRED
(client   (client requests     (valid_until
 approves) changes)             date passed)
               │
               ▼
         New version created
         Previous version → SUPERSEDED
         New version starts at DRAFT
```

**Expiry Enforcement:**

```
Problem: Quotation expires at midnight but client is actively viewing it

Approach:
→ Expiry is checked at the moment of APPROVAL action, not at page load
→ Page load: Show "expires in X hours" warning (not blocking)
→ Approval click: Server checks valid_until >= NOW() before processing
→ If expired at click: Return 422 "This quotation has expired.
  Please request a new quotation."
→ Client can immediately request new quotation without starting from scratch
→ Admin can re-issue with updated valid_until in under 2 minutes
```

---

## 2.4 Inquiry State Machine

```
SUBMITTED
    │
    ├──► ACKNOWLEDGED (admin seen it)
    │         │
    │         ├──► INFO_REQUESTED (need more client details)
    │         │         │
    │         │         └──► SUBMITTED (client responds → re-enters queue)
    │         │
    │         └──► QUOTE_PENDING (admin begins quotation)
    │                   │
    │                   └──► CONVERTED (quotation approved, order created)
    │
    └──► REJECTED (admin declines)
         └── [TERMINAL — client can submit new inquiry, this one stays]

STALE (pseudo-state, read-only flag):
→ Applied when inquiry has been in SUBMITTED or INFO_REQUESTED 
  for > 72 hours without admin action
→ Visual indicator only — does not block any transitions
```

---

## 2.5 Rollback Logic

```
Rollback Philosophy:
→ Database transactions handle atomicity within a single operation
→ Cross-service rollbacks use compensating transactions
→ Saga pattern for multi-step operations

Compensating Transactions:

Scenario: Order creation succeeds but post-transaction email fails
   → No rollback of order (order is correct)
   → Email job re-queued for retry
   → Order exists in correct state regardless of notification status

Scenario: Admin records payment, order state update fails
   → Payment record committed (correct — money was received)
   → Order state update failed
   → Alert generated for admin
   → Admin manually triggers state transition
   → Compensating action: state correction (not data deletion)

Scenario: Cloudinary upload succeeds but inquiry save fails
   → Inquiry transaction rolled back
   → Cloudinary images are now orphaned
   → Compensating transaction: Background job queries 
     Cloudinary for images uploaded in last hour with no linked inquiry
   → Orphaned images flagged for cleanup after 24h grace period

Scenario: Quotation approved, order created, but reference number
   generation fails
   → This must NOT happen because:
     - Reference number generation is INSIDE the transaction
     - If it fails, ENTIRE transaction rolls back
     - Quotation stays in SENT state
     - Client sees error, retries
     - Idempotency check on retry finds no existing order → retries correctly

True Rollback Impossibility:
→ Once an email is sent, it cannot be unsent
→ Once a WhatsApp message is delivered, it cannot be recalled
→ Design principle: Ensure all external side effects happen AFTER 
  database transaction commits and are idempotent on retry
```

---

# PART 3 — EVENT ARCHITECTURE

---

## 3.1 Complete Event Inventory

```
Event Naming Convention: {ENTITY}_{PAST_TENSE_ACTION}
Category: DOMAIN events (not technical events)

USER DOMAIN:
├── USER_REGISTERED
├── USER_EMAIL_VERIFIED
├── USER_PASSWORD_CHANGED
├── USER_ACCOUNT_DEACTIVATED
├── USER_ROLE_CHANGED
└── USER_LOGIN_FAILED (>3 consecutive)

INQUIRY DOMAIN:
├── INQUIRY_SUBMITTED
├── INQUIRY_ACKNOWLEDGED
├── INQUIRY_INFO_REQUESTED
├── INQUIRY_RESPONDED (client provides additional info)
├── INQUIRY_REJECTED
├── INQUIRY_CONVERTED
└── INQUIRY_STALE (SLA timer expired — system-generated)

QUOTATION DOMAIN:
├── QUOTATION_CREATED
├── QUOTATION_SENT
├── QUOTATION_APPROVED
├── QUOTATION_REVISION_REQUESTED
├── QUOTATION_SUPERSEDED
└── QUOTATION_EXPIRED (system-generated on valid_until date)

ORDER DOMAIN:
├── ORDER_CREATED
├── ORDER_STATE_CHANGED (carries: from_state, to_state)
├── ORDER_HOLD_APPLIED
├── ORDER_HOLD_RELEASED
├── ORDER_AMENDMENT_REQUESTED
├── ORDER_AMENDMENT_ACCEPTED
├── ORDER_AMENDMENT_REJECTED
├── ORDER_CANCELLED
└── ORDER_DELIVERED

PAYMENT DOMAIN:
├── PAYMENT_MILESTONE_CONFIRMED
├── PAYMENT_MILESTONE_VOIDED
├── PAYMENT_MILESTONE_OVERDUE (system-generated)
└── PAYMENT_PARTIAL_RECEIVED

PRODUCTION DOMAIN:
├── PRODUCTION_MILESTONE_UPDATED
├── PRODUCTION_MILESTONE_PHOTO_UPLOADED
├── PRODUCTION_HOLD_MATERIAL_SHORTAGE
└── PRODUCTION_STAGE_COMPLETED

DELIVERY DOMAIN:
├── DELIVERY_SCHEDULED
├── DELIVERY_RESCHEDULED
├── DELIVERY_PROOF_UPLOADED
├── DELIVERY_COMPLETED
└── DELIVERY_FAILED_ATTEMPT

SYSTEM DOMAIN:
├── SLA_BREACH_INQUIRY_RESPONSE
├── SLA_BREACH_PAYMENT_OVERDUE
├── CAPACITY_THRESHOLD_REACHED
└── AUDIT_EXPORT_REQUESTED
```

---

## 3.2 Event Producers and Consumers

```
Event: INQUIRY_SUBMITTED
   Producer: InquiryService (after DB commit)
   Consumers:
   ├── NotificationService → Send confirmation email to client
   ├── NotificationService → Send alert email to all admins
   ├── RealtimeService → Push WebSocket event to admin channel
   └── AnalyticsService → Record inquiry event (Phase 3)
   Delivery: At-least-once
   Processing: Idempotent (event_id checked before processing)

Event: QUOTATION_APPROVED
   Producer: QuotationService (after order creation commits)
   Consumers:
   ├── NotificationService → Send order confirmation email to client
   ├── NotificationService → Send quote approval alert to assigned admin
   ├── RealtimeService → Push WebSocket to admin dashboard
   └── OrderService → [Already processed synchronously in same TX]
   Delivery: At-least-once
   Critical: This event must NOT be published before DB transaction commits

Event: PAYMENT_MILESTONE_CONFIRMED
   Producer: PaymentService (after payment record commits)
   Consumers:
   ├── NotificationService → Send payment receipt email to client
   ├── OrderService → Evaluate and execute order state transition
   ├── RealtimeService → Push WebSocket to client tracking page
   └── RealtimeService → Push WebSocket to admin dashboard
   Delivery: At-least-once
   Ordering: Must be processed in order per order_id

Event: ORDER_STATE_CHANGED
   Producer: OrderService (after state transition commits)
   Consumers:
   ├── NotificationService → Send status update email to client
   ├── RealtimeService → Push WebSocket to client (if connected)
   ├── RealtimeService → Push WebSocket to admin
   └── AnalyticsService → Record state transition (Phase 3)
   Delivery: At-least-once
   Idempotency: Check event_id before sending notification

Event: INQUIRY_STALE (System-Generated)
   Producer: ScheduledJobService (runs every 15 minutes)
   Consumers:
   ├── NotificationService → Alert Super Admin
   └── RealtimeService → Update admin dashboard SLA indicator
   Delivery: At-least-once
   Deduplication: Only emit once per inquiry per stale-period
```

---

## 3.3 Synchronous vs Asynchronous Operations

```
SYNCHRONOUS (blocking, part of HTTP request-response cycle):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ All database reads for page rendering
✓ Authentication and authorization checks
✓ Input validation
✓ Order state transition validation (guards)
✓ Database writes (core entity mutations)
✓ Idempotency key checks
✓ Optimistic lock version checks
✓ Reference number generation (inside transaction)

Returns to client: Operation result with new state

ASYNCHRONOUS (after HTTP response returned to client):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ All email notifications
✓ All WebSocket push notifications
✓ PDF generation for quotations
✓ Cloudinary image optimization/transformation
✓ Audit log writes (can be fire-and-forget with local buffer)
✓ Analytics event recording
✓ WhatsApp deep link generation
✓ SLA timer evaluations
✓ Orphaned media cleanup

Returns to client: "Operation accepted" — client polls or
receives WebSocket update when async work completes

NEVER ASYNC (operations that must be synchronous):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Payment state changes (money movement is synchronous)
✗ Order state transitions (state correctness is synchronous)
✗ Authentication token issuance
✗ Idempotency checks before writes
```

---

## 3.4 Event Queue Architecture

```
Phase 1 (MVP) — In-Process Event Queue:
────────────────────────────────────────
Spring Application Events (ApplicationEventPublisher)
→ Events published within same JVM
→ Listeners run in separate thread pool
→ Survives: individual listener failure
→ Does NOT survive: JVM restart (events in flight are lost)

Acceptable at MVP because:
→ Single server instance
→ Low event volume
→ Email retry handles notification failures
→ Admin can manually recover from lost events

Phase 2 — Persistent Message Queue:
─────────────────────────────────────
Recommended: Redis Streams or RabbitMQ

Queue design:
   furnix.notifications (email/WebSocket pushes)
   furnix.order-events (state machine transitions)
   furnix.system-alerts (SLA breaches, admin alerts)
   furnix.analytics (Phase 3, high volume, lossy acceptable)

Consumer Group Pattern:
   furnix.notifications queue
   → Consumer Group: notification-workers
       ├── Worker 1: Email notifications
       ├── Worker 2: WebSocket push
       └── Worker 3: SMS notifications (Phase 3)
   
   Each worker claims a message, processes it,
   acknowledges it. If worker dies mid-processing,
   message is re-delivered after visibility timeout.

Phase 3 — Event Streaming:
───────────────────────────
Consider Apache Kafka for:
→ Analytics event stream
→ Audit log stream (append-only, replicated)
→ Cross-service event bus if microservices extracted
NOT needed for Phase 1 or 2.
```

---

## 3.5 Retry and Failure Behavior

```
Retry Policy Matrix:

Event Type           │ Max Retries │ Backoff Strategy          │ Dead Letter?
─────────────────────┼─────────────┼───────────────────────────┼─────────────
Email notification   │ 5           │ Exponential: 30s,2m,8m,   │ Yes — DLQ
                     │             │ 30m, 2h                   │ admin alerted
WebSocket push       │ 1           │ No retry — client will    │ No — client
                     │             │ receive via polling        │ polls instead
PDF generation       │ 3           │ Linear: 1m, 5m, 15m       │ Yes — flag
                     │             │                           │ on quotation
Order state eval     │ 3           │ Immediate, 10s, 30s       │ Yes — admin
                     │             │                           │ must manually
                     │             │                           │ resolve
SLA check            │ 0           │ N/A (idempotent job       │ No — next
                     │             │ runs every 15min)         │ run catches it
Analytics write      │ 2           │ Linear: 5s, 30s           │ No — lossy
                     │             │                           │ acceptable

Dead Letter Queue (DLQ) Processing:
→ Failed events after max retries move to DLQ
→ DLQ monitored by admin alert (email to Super Admin)
→ Events in DLQ must be manually reviewed and either:
  a) Replayed (if root cause resolved)
  b) Discarded with documented reason
→ DLQ retention: 30 days
```

---

# PART 4 — REALTIME SYNCHRONIZATION

---

## 4.1 WebSocket Requirements by Role

```
ADMIN CHANNEL:
━━━━━━━━━━━━━
Connection URL: wss://api.furnix.com/ws/admin
Auth: JWT token in connection handshake header
Channel scope: All orders, all inquiries, all system events
Heartbeat: Server sends PING every 30s, client must PONG within 10s

Events pushed to admin channel:
├── INQUIRY_SUBMITTED (any new inquiry)
├── QUOTATION_APPROVED (quote approved by any client)
├── ORDER_STATE_CHANGED (any order)
├── PAYMENT_MILESTONE_CONFIRMED (any order)
├── SLA_BREACH_INQUIRY_RESPONSE (inquiry >24h unacknowledged)
├── ORDER_HOLD_APPLIED (any order goes on hold)
├── DELIVERY_PROOF_UPLOADED (any order)
└── SYSTEM_ALERT (capacity warnings, etc.)

CLIENT CHANNEL:
━━━━━━━━━━━━━━
Connection URL: wss://api.furnix.com/ws/client
Auth: JWT token in connection handshake
Channel scope: Only events related to authenticated client's own data

Events pushed to client channel:
├── INQUIRY_ACKNOWLEDGED (their inquiry only)
├── QUOTATION_SENT (their quotation only)
├── ORDER_STATE_CHANGED (their orders only)
├── PAYMENT_MILESTONE_CONFIRMED (their orders only)
├── DELIVERY_SCHEDULED (their orders only)
└── NEW_ADMIN_MESSAGE (their thread only — Phase 2)

SHOP MANAGER CHANNEL:
━━━━━━━━━━━━━━━━━━━━
Events pushed:
├── ORDER_STATE_CHANGED (production-relevant states only)
├── NEW_ORDER_IN_PRODUCTION (new order enters production queue)
└── ORDER_HOLD_APPLIED (hold on any in-production order)
```

---

## 4.2 Broadcast Strategy

```
Challenge: Multiple clients may be watching the same order
(e.g., client on tracking page + admin on dashboard simultaneously)

Strategy: Topic-based publish/subscribe

Topic Structure:
   order:{orderId}          → Events for specific order
   inquiry:{inquiryId}      → Events for specific inquiry  
   admin:all                → Broadcast to all connected admins
   user:{userId}            → Events for specific user (client channel)

WebSocket Server maintains:
   subscriptions = Map<TopicId, Set<WebSocketSession>>
   sessions = Map<SessionId, UserContext>

On event received from queue:
   1. Determine target topic(s)
   2. Look up subscribed sessions
   3. Filter by role permission (admin gets all, client gets own only)
   4. Send to each eligible session

Example: ORDER_STATE_CHANGED for ORD-2025-000001
   Topics to broadcast to:
   ├── order:ORD-2025-000001 (specific order watchers)
   ├── admin:all (all connected admins)
   └── user:{client_id} (the order's client if connected)
   
   Filtering:
   ├── Admin sessions: receive full event payload
   └── Client session: receive filtered payload 
       (exclude internal notes, payment references)

Scaling Problem (Phase 2+):
   → Multiple backend instances means WebSocket sessions 
     are distributed across instances
   → Instance A handles admin WebSocket
   → Event fires on Instance B (from API request)
   → Instance B has no WebSocket connection to this admin

Solution: Redis Pub/Sub as WebSocket message broker
   → All instances subscribe to Redis channels
   → When event fires on any instance:
       → Publish to Redis channel
       → All instances receive publication
       → Each instance delivers to its local WebSocket connections
   → No instance needs to know about others' sessions
```

---

## 4.3 WebSocket Reconnect Handling

```
Client-Side Reconnect State Machine:

          ┌──────────┐
          │CONNECTED │◄──────────────────────────┐
          └────┬─────┘                           │
               │ Connection drops                │
          ┌────▼──────────┐                      │
          │ RECONNECTING  │                      │
          │ attempt #1    │                      │ Success
          │ delay: 1s     │                      │
          └────┬──────────┘                      │
               │ Fails                           │
          ┌────▼──────────┐                      │
          │ RECONNECTING  │                      │
          │ attempt #2    ├──── Success ─────────┘
          │ delay: 2s     │
          └────┬──────────┘
               │ ...exponential: 4s, 8s, 30s, 60s
          ┌────▼──────────┐
          │  DISCONNECTED │ (max attempts reached or
          │  (degraded)   │  user manually dismisses)
          └───────────────┘
          Shows: "Live updates paused. [Reconnect] or refresh."

On Successful Reconnect — Reconciliation:
   1. Fetch current auth state → validate token still valid
   2. If token expired: redirect to login (do not silently fail)
   3. If token valid:
      → For admin: GET /api/dashboard/summary (full state refresh)
      → For client: GET /api/orders/{id} (specific order state refresh)
   4. Apply fetched state to UI (REST response overrides any stale WebSocket state)
   5. Resume WebSocket subscription

Events Missed During Disconnection:
   → NOT replayed via WebSocket
   → Fully recovered via REST API refresh in step 3
   → This is the correct design: REST API is the source of truth,
     WebSocket is only a push optimization
   → Client never needs to replay events to reconstruct state
```

---

## 4.4 Conflict Resolution Logic

```
Conflict Type 1: Optimistic Lock Conflict (Concurrent Edits)
─────────────────────────────────────────────────────────────
Scenario: Admin A and Admin B both open Order ORD-001 for editing.
Admin A saves first. Admin B's version is now stale.

Detection: ORDER table has `version` column (integer, increments on each write)
Admin B's request carries version=5 (what they loaded)
Server's current version=6 (Admin A already wrote)

Response to Admin B:
→ HTTP 409 Conflict
→ Body: {
    "error": "OPTIMISTIC_LOCK_CONFLICT",
    "currentVersion": 6,
    "yourVersion": 5,
    "changedFields": ["status", "updated_at"],
    "currentState": { ...current order data... }
  }

UI Response:
→ Show diff: "This order was updated by [Admin A] while you were editing."
→ Show: "Current state" vs "Your changes"
→ Options: "Use Current" / "Review and Merge" / "Discard My Changes"
→ No automatic merge (domain too sensitive for automated conflict resolution)

Conflict Type 2: WebSocket State vs REST State Divergence
───────────────────────────────────────────────────────────
Scenario: Admin receives WebSocket push that order is DELIVERED.
Admin's UI shows DELIVERED. Admin clicks a link that fetches order via REST.
REST returns IN_PRODUCTION (WebSocket was incorrect or from wrong version).

Resolution Rule: REST API response always wins over WebSocket state.
→ UI must overwrite local state with REST response
→ WebSocket is for push notifications only, not authoritative state

Conflict Type 3: Duplicate WebSocket Event
────────────────────────────────────────────
Scenario: WebSocket connection drops and reconnects.
Server resends event from queue that was already displayed.

Detection: Every WebSocket event carries a unique event_id (UUID)
Client maintains a Set of processed event_ids (last 100, in-memory)

Processing:
→ On receiving event: check Set for event_id
→ If found: discard silently
→ If not found: process, add to Set
→ Set is cleared on page reload (acceptable — stale UI data
  is refreshed by REST fetch on reconnect anyway)
```

---

# PART 5 — CONCURRENCY & CONSISTENCY

---

## 5.1 Race Condition Inventory

```
RC-01: Dual Quote Approval
   Scenario: Client clicks approve twice or network retries
   Risk: Two orders created from one quotation
   Solution: SELECT FOR UPDATE + unique constraint on ORDER.quotation_id
   Tested by: Load test with concurrent approval requests

RC-02: Payment Milestone Double-Confirmation
   Scenario: Admin clicks "Confirm Payment" twice
   Risk: Payment recorded twice, milestone confirmed twice
   Solution: SELECT FOR UPDATE on milestone, unique constraint prevents
             second CONFIRMED record for same milestone
   Tested by: Concurrent POST /payments/{milestoneId}/confirm requests

RC-03: Concurrent Order State Transition
   Scenario: Admin and automated trigger both attempt state transition
   Risk: State skipped or corrupted
   Solution: SELECT FOR UPDATE on order, state machine guards
             validated after lock acquired
   Tested by: Concurrent state transition requests

RC-04: Reference Number Collision
   Scenario: Two inquiries submitted simultaneously in same year
   Risk: Duplicate reference numbers
   Solution: Atomic sequence table with row-level locking
             OR database sequence object
   Tested by: Concurrent submission stress test

RC-05: Concurrent Inquiry Limit Check
   Scenario: Client submits three forms simultaneously
   Risk: All three pass the "< 3 open inquiries" check and are created
   Solution: Re-check limit inside transaction with SELECT FOR UPDATE
             on a user-level counter, OR unique constraint on (client_id, open_count)
   Tested by: Concurrent submission test from same client

RC-06: Product Archive While Order Exists
   Scenario: Admin archives product while client is placing standard order
   Risk: Order created for archived product
   Solution: Product status check inside order creation transaction,
             not just at order form load time

RC-07: JWT Token Refresh Race
   Scenario: Client makes two simultaneous API calls, both find expired
             access token, both attempt refresh simultaneously
   Risk: Refresh token rotated by first request; second request uses
         now-invalidated refresh token → forced logout
   Solution: Client-side serialization of refresh requests
             (queue pending requests behind a single refresh promise)
             Server-side: 30-second grace window for previous refresh token
             (allows in-flight requests that started before rotation to complete)
```

---

## 5.2 Locking Strategy

```
PESSIMISTIC LOCKING (SELECT FOR UPDATE):
Used when:
→ State transition validity depends on current state being unchanged
→ Financial records being modified
→ Resource allocation (delivery slots, capacity)
→ Reference number generation

Scope: Always as narrow as possible (single row, short transaction)
Timeout: 5 seconds maximum (prevents deadlocks from hanging)
Deadlock prevention: Always acquire locks in same order
  (ORDER before PAYMENT_MILESTONE, never reverse)

OPTIMISTIC LOCKING (version column):
Used when:
→ Admin editing order details (not state transitions)
→ Product catalog updates
→ Profile updates
→ Any edit where collision is rare but must be detected

Mechanism: version column incremented on every write
Client sends current version in update request
Server rejects if version mismatch (409)

NO LOCKING NEEDED:
→ Read-only queries (no lock)
→ Audit log writes (append-only, no conflict possible)
→ Session creation (unique constraint sufficient)
→ Analytics writes (eventual consistency acceptable)
```

---

## 5.3 Transactional Boundaries

```
Transaction Scope Guidelines:

SINGLE TRANSACTION (atomic unit):
─────────────────────────────────
✓ Order state change + status history record
✓ Payment milestone confirmation + payment record creation
✓ Quotation approval + order creation + inquiry status update
✓ User registration + verification token creation
✓ Order amendment acceptance + specification update + new milestone creation

NEVER IN ONE TRANSACTION:
──────────────────────────
✗ Database write + external API call (Cloudinary, email service)
  → External calls can hang indefinitely, holding DB lock
  → Solution: Write to DB, commit, then call external service async

✗ Multiple unrelated entity updates
  → Keep transactions focused on single aggregate

✗ Any transaction longer than 5 seconds
  → Decompose into multiple transactions with compensating actions

POST-TRANSACTION ACTIONS (always after COMMIT):
────────────────────────────────────────────────
→ Publish domain events to queue
→ Trigger async notifications
→ Initiate external API calls (Cloudinary, WhatsApp)
→ Update Redis cache

WHY this ordering matters:
→ If events published BEFORE commit and transaction rolls back:
  Consumers act on data that doesn't exist → inconsistency
→ If events published AFTER commit and publishing fails:
  Data is correct, event is eventually published via retry
→ Correct state in DB + delayed notification > Notification sent
  for data that was then rolled back
```

---

## 5.4 Consistency Guarantees

```
STRONG CONSISTENCY (same transaction):
→ Order state and status history always consistent
→ Payment milestone and order financial total always consistent
→ Quotation status and order existence always consistent
→ User role and permission set always consistent

EVENTUAL CONSISTENCY (acceptable lag):
→ Admin dashboard data (up to 60s stale via polling)
→ Client tracking page (up to 120s stale via polling)
→ PDF generation status on quotation (minutes to generate)
→ Cloudinary image processing (seconds to minutes)
→ Analytics aggregates (minutes to hours)
→ Email delivery confirmation (not tracked in real-time)

NEVER EVENTUALLY CONSISTENT (must be immediate):
→ Payment state (cannot show unpaid as paid or vice versa)
→ Order cancellation (client must not be able to approve
  a cancelled order's quotation)
→ Authentication state (deactivated user must not access system)
→ Authorization decisions (role changes must propagate promptly)
```

---

# PART 6 — FAILURE SCENARIOS

---

## 6.1 Network Interruption Scenarios

```
Scenario F-01: Client loses connection mid-inquiry form submission
────────────────────────────────────────────────────────────────
Network drops after client clicks "Submit" but before server receives request.

Client side:
→ Request times out (browser timeout: 30 seconds)
→ UI shows: "Connection lost. Your form data has been saved locally."
→ sessionStorage preserves all entered data
→ Retry button visible
→ On retry: server receives request fresh

Server side:
→ Request never arrived → no state change
→ No action needed

Resolution: Client retries with same data. Server processes as new submission.
Concern: If request DID arrive but response was lost (partial network failure):
→ Server created inquiry but client never saw confirmation
→ Client retries → server creates DUPLICATE inquiry
→ Prevention: Client-generated idempotency key sent with request
  Key: UUID generated when client starts the form (stored in sessionStorage)
  Server: Check idempotency_key before inserting
  If found: Return existing inquiry (idempotent)
  If not found: Create new inquiry

Scenario F-02: Network drops during payment recording
────────────────────────────────────────────────────
Admin clicks "Confirm Payment" — server processes and commits — response lost.

Admin side:
→ Request times out
→ Admin unsure if payment was recorded
→ Clicks again (retry)

Server side (without idempotency):
→ First request: CONFIRMED payment
→ Second request: Finds milestone already CONFIRMED → returns 409
→ Admin sees error, confused

Server side (with idempotency):
→ First request: CONFIRMED payment, returns 200 with payment record ID
→ Second request: Finds milestone already CONFIRMED
→ Returns 200 with SAME payment record (idempotent success)
→ Admin sees confirmation, no confusion

Implementation: Every payment confirmation carries admin-generated
idempotency key (form render generates UUID, included in POST body)
```

---

## 6.2 Partial Write Scenarios

```
Scenario F-03: Order creation commits but PDF generation fails
──────────────────────────────────────────────────────────────
Quotation approved → Order created (DB commit) → PDF queue job fails.

State:
→ Order exists in ADVANCE_PENDING state (CORRECT)
→ Client email sent (from ORDER_CREATED event) (CORRECT)
→ Quotation PDF not yet generated (INCORRECT state for PDF flag)

Resolution:
→ PDF generation has its own retry queue (3 attempts)
→ Order record has flag: quotation_pdf_status (PENDING/GENERATED/FAILED)
→ If all retries fail: Admin sees "PDF generation failed" warning
→ Admin can re-trigger PDF generation manually
→ Client can still approve — PDF is a convenience, not a gate

Scenario F-04: Image uploaded to Cloudinary but inquiry save fails
───────────────────────────────────────────────────────────────────
Client uploads 3 images → all succeed on Cloudinary →
DB transaction for inquiry fails (e.g., validation error, duplicate key).

State:
→ 3 images exist on Cloudinary (paid storage, no owner)
→ Inquiry does not exist in DB
→ Client's upload session tokens in Redis still valid (not consumed)

Resolution:
→ Since transaction failed, upload session Redis keys were NOT deleted
→ Client can retry inquiry submission within the session window (5 min)
→ Client resubmits: same Cloudinary IDs referenced → Redis keys validated → succeed
→ If client abandons: session expires after 5 minutes
→ Background job runs every 4 hours: finds Cloudinary images in
  staging folder with no linked inquiry and session expired
→ Deletes orphaned images from Cloudinary
→ Logs deletion for audit

Scenario F-05: Order state updated but audit log write fails
────────────────────────────────────────────────────────────
Order state changes to DELIVERED (DB commit) → audit log write fails.

This is a critical failure because audit completeness is a requirement.

Options:
Option A: Audit log in same transaction as state change
   → Pro: Always consistent
   → Con: Audit log writes slow down all state changes
   → Suitable for MVP (volume is low)

Option B: Audit log in separate async write after commit
   → Pro: Fast state changes
   → Con: Audit log can miss events if async write fails
   → Requires: Reliable queue, DLQ, manual audit log repair process

Recommendation for Furnix:
→ MVP: Option A (synchronous, same transaction) — simplicity matters
→ Phase 2+: Extract audit log to separate append-only schema,
  write synchronously but to different DB schema not same table
  as business entities (separation without async risk)
```

---

## 6.3 Duplicate Event Scenarios

```
Scenario F-06: ORDER_STATE_CHANGED event delivered twice to consumer
─────────────────────────────────────────────────────────────────────
At-least-once delivery means consumers WILL receive duplicates.
Email consumer receives ORDER_STATE_CHANGED event twice.

Without deduplication:
→ Client receives two identical "Your order is ready for delivery" emails
→ Client is confused, admin looks unprofessional

With deduplication:
→ Each event has a globally unique event_id (UUID v4)
→ Email consumer maintains a Redis Set: "processed_event_ids"
  Key: "email_consumer:processed:{event_id}"
  TTL: 24 hours (events older than 24h cannot be duplicated in practice)
→ Before processing: check Redis for event_id
→ If found: skip (already processed)
→ If not found: process, then SET event_id in Redis

This pattern applied to ALL event consumers:
   NotificationConsumer → Redis deduplication
   RealtimeConsumer (WebSocket) → Client-side event_id deduplication
   OrderStateConsumer → DB idempotency check (payment milestone status)
   AnalyticsConsumer → Lossy, no deduplication needed

Scenario F-07: Payment webhook received twice from payment gateway (Phase 2)
──────────────────────────────────────────────────────────────────────────────
Payment gateway sends webhook for payment success. Network issue causes retry.
Two webhook calls arrive for same payment transaction.

Without idempotency:
→ Payment recorded twice → financial record corrupted

With idempotency:
→ Webhook carries gateway_transaction_id (unique per payment)
→ DB has unique constraint on PAYMENT_RECORDS.gateway_transaction_id
→ First webhook: INSERT succeeds
→ Second webhook: INSERT fails with unique constraint violation
→ Handler catches constraint violation, returns 200 to gateway
  (200 tells gateway "received, stop retrying")
→ No duplicate record created
→ Idempotent by design
```

---

## 6.4 Out-of-Order Event Scenarios

```
Scenario F-08: ORDER_STATE_CHANGED events arrive out of order
──────────────────────────────────────────────────────────────
Timeline:
T1: Order changes IN_PRODUCTION → READY_FOR_DELIVERY (event E1 published)
T2: Admin corrects and changes back (if allowed) — edge case
T3: Event E1 arrives at consumer AFTER a subsequent event

For Furnix, this is largely prevented by design:
→ Order state machine is strictly enforced
→ Most transitions are irreversible
→ State is not reconstructed from events (state is stored in DB)
→ Events are only for notifications, not state reconstruction

However, WebSocket push can deliver out of order:
→ Two state changes happen quickly
→ Event E1 (older) arrives at client WebSocket after E2 (newer)
→ UI might briefly show older state

Prevention:
→ Each event carries: {state_sequence_number, occurred_at}
→ UI applies a rule: "Never apply an event with sequence number
  less than current displayed state's sequence number"
→ Stale event is discarded silently
→ Client's UI shows correct latest state

For notification consumers (email):
→ Email for older state arrives after email for newer state
→ Client receives "In Production" email AFTER "Ready for Delivery" email
→ Prevention: Consumers check current order state before sending
  "Is the current state still consistent with this notification?"
  If state has moved past: suppress the outdated notification
```

---

## 6.5 Stale State Scenarios

```
Scenario F-09: Admin dashboard shows stale order count
────────────────────────────────────────────────────────
Admin has dashboard open. Another admin accepts a new order.
First admin's dashboard shows old count for 60 seconds (polling interval).

This is ACCEPTABLE for Furnix because:
→ 60-second staleness on aggregate counts is operationally tolerable
→ The individual order detail is always fresh (fetched on click)
→ Critical actions (payment, state change) always re-fetch before processing

NOT acceptable scenarios:
→ Admin sees "ADVANCE_PENDING" and clicks "Mark as In Production"
  without realizing another admin already did this
→ Prevention: State transition request includes expected_current_state
  Server validates: current_state == expected_current_state
  If mismatch: 409 with current state in response
  Admin sees fresh state, makes informed decision

Scenario F-10: Client viewing quotation after admin supersedes it
─────────────────────────────────────────────────────────────────
Client has quotation page open (Quote v1).
Admin creates Quote v2 and supersedes Quote v1.
Client still sees Quote v1 and clicks "Approve".

Server-side handling:
→ Approval endpoint validates: quotation.status = SENT
→ Quote v1 is now SUPERSEDED (not SENT)
→ Server returns 422: "This quotation has been superseded.
  Please review the new quotation."
→ Client is redirected to Quote v2
→ UI shows: "A revised quotation is available. [View Quote v2]"

This works correctly because validation happens server-side at the
moment of the action, not at page load time.
```

---

# PART 7 — SCALABILITY CONCERNS

---

## 7.1 High-Frequency Event Analysis

```
At MVP Scale (100 active orders):
→ Events per day estimate:
  Order state changes: ~50/day (0.5 per order)
  Payment confirmations: ~20/day
  Inquiry submissions: ~10/day
  Admin dashboard polls: ~1,440/day (1/minute if admin is active)
  Total: ~1,520 meaningful events/day
  → Trivially handled by single instance

At Phase 2 Scale (500 active orders):
→ Events per day estimate:
  Order state changes: ~250/day
  Payment confirmations: ~100/day
  Admin dashboard polls: ~7,200/day (multiple admins)
  WebSocket heartbeats: ~86,400/day (1/30s × admin sessions)
  Total: ~94,000 events/day
  → Still manageable on single instance with connection pooling

At Phase 3 Scale (2,000 active orders):
→ WebSocket heartbeats alone: ~345,600/day
→ Dashboard polls: ~43,200/day
→ Email notifications: ~5,000/day
→ Recommendation: Separate WebSocket server from API server
  WebSocket server: stateful, scaled horizontally with Redis Pub/Sub
  API server: stateless, scaled horizontally behind load balancer
```

---

## 7.2 Event Queue Pressure

```
Pressure Point 1: Notification burst after batch order update
Scenario: Admin runs batch status update (10 orders → READY_FOR_DELIVERY)
→ 10 ORDER_STATE_CHANGED events published simultaneously
→ Each triggers client email + admin WebSocket push
→ 20 tasks hit queue simultaneously

Without queue: Email service rate limits exceeded
With queue: Tasks processed at sustainable rate (e.g., 5/second)
Queue absorbs burst, processes at controlled rate

Pressure Point 2: SLA check job creates event flood
Scenario: SLA check job runs at 9am, finds 15 stale inquiries
→ 15 INQUIRY_STALE events published at once
→ Each triggers admin notification

Mitigation: SLA events deduplicated per inquiry per day
(not emitted again if already emitted today)
Batch them into one "15 inquiries are overdue" summary email

Pressure Point 3: PDF generation during business hours
Scenario: 5 quotations sent simultaneously, all trigger PDF generation
PDF generation is CPU and memory intensive

Mitigation:
→ PDF generation in dedicated thread pool (max 2 concurrent)
→ Excess jobs queued in Redis job queue
→ Admin sees "PDF generating..." placeholder
→ PDF ready notification sent via WebSocket when complete
```

---

## 7.3 Realtime Scaling Bottlenecks

```
Bottleneck 1: WebSocket connection state on single server
─────────────────────────────────────────────────────────
Problem: 500 concurrent WebSocket connections on one JVM
→ Each connection holds a thread (or virtual thread in Java 21)
→ Memory footprint: ~5MB per 1,000 connections (low risk at Phase 2)
→ Thread pool exhaustion at ~1,000 connections on single server

Solution Path:
→ Java 21 Virtual Threads (Project Loom): dramatically reduces thread overhead
→ Allows tens of thousands of WebSocket connections per instance
→ Recommended: Upgrade to Java 21 early and configure virtual thread executor

Bottleneck 2: Redis Pub/Sub message fan-out
───────────────────────────────────────────
Problem: At scale, every event published to Redis is received
by every WebSocket server instance even if they have no
relevant subscribers.

Mitigation:
→ Use Redis Streams instead of Pub/Sub for better consumer group management
→ Per-topic subscription (not all-topics on all instances)
→ Filter events at WebSocket server before fan-out to clients

Bottleneck 3: Dashboard aggregate query at scale
─────────────────────────────────────────────────
Problem: Admin dashboard executes several aggregate queries:
→ COUNT(*) of active orders by state
→ SUM of pending payment amounts
→ COUNT(*) of unacknowledged inquiries
→ Date-range delivery calendar

At 10,000 orders, these queries slow down.

Mitigation:
→ Phase 1: Direct queries acceptable (< 1,000 orders)
→ Phase 2: Materialized view or pre-computed summary table
  Updated on each order state change
  Dashboard reads from summary table (single row, ultra-fast)
  Summary table written by event consumer, not main transaction
```

---

## 7.4 State Synchronization Overhead

```
Overhead 1: Optimistic lock version management
→ Every write increments version column
→ Every concurrent edit check reads version
→ At high write frequency: version conflicts increase, causing UX friction

Mitigation:
→ Segment write-heavy entities into sub-entities
  (e.g., ORDER_PRODUCTION_DETAILS separate from ORDER core record)
→ Concurrent edits on different sub-entities don't conflict

Overhead 2: Session token validation on every request
→ Every authenticated API call validates JWT + checks if session is revoked
→ Revocation check requires Redis lookup (is this token's jti in revoked set?)
→ At 100 req/s: 100 Redis lookups/s (trivially fast, < 1ms each)
→ At 10,000 req/s: Still fine for Redis, not a bottleneck

Overhead 3: Audit log writes on every state change
→ Every order state change writes to audit log
→ Synchronous write (same transaction) adds latency
→ At MVP scale (< 100 changes/day): negligible
→ At Phase 3 scale (10,000 changes/day): still < 100ms additional
→ Only becomes a problem at millions of events/day (far beyond Furnix scope)
```

---

# PART 8 — RECOMMENDATIONS

---

## 8.1 Event-Driven Architecture Recommendations

```
Recommendation 1: Transactional Outbox Pattern (Phase 2)
─────────────────────────────────────────────────────────
Problem with naive event publishing:
   DB commit → publish event to queue

Risk: DB commits, then server crashes before publishing event.
Event is permanently lost.

Transactional Outbox solution:
   BEGIN TRANSACTION
   → Write entity change to DB
   → Write event record to OUTBOX table (same DB, same transaction)
   COMMIT

   Separate poller process (runs every 1 second):
   → SELECT * FROM OUTBOX WHERE published = false LIMIT 100
   → For each: publish to message queue
   → On successful publish: UPDATE OUTBOX SET published = true
   → On failure: retry (event still in OUTBOX as published=false)

Benefits:
→ Event publishing is atomic with DB change (same transaction)
→ Event is never lost (persisted in DB before publishing)
→ Survives server restarts
→ Natural audit trail of all published events

OUTBOX table structure:
   id (UUID), event_type, payload_json, 
   aggregate_id, aggregate_type,
   created_at, published (boolean), published_at

Recommendation 2: Command vs Event Separation
──────────────────────────────────────────────
Commands: Express intent ("ConfirmPayment", "TransitionOrderState")
→ Synchronous, validated, rejected if invalid
→ Return result immediately

Events: Express what happened ("PaymentConfirmed", "OrderStateChanged")
→ Asynchronous, always valid (happened in past)
→ Consumers react, cannot reject

Furnix API design:
   POST /api/orders/{id}/transitions (Command: change state)
   → Validates, executes, persists, returns new state
   → Also writes event to OUTBOX (async delivery)

   GET /api/orders/{id}/history (Events: what happened)
   → Returns ordered list of state transitions (from history table)

Recommendation 3: Event Schema Versioning
──────────────────────────────────────────
Events will evolve as features are added.
Consumers should not break when new fields are added to events.

Event envelope:
{
  "schema_version": "1.0",
  "event_id": "uuid",
  "event_type": "ORDER_STATE_CHANGED",
  "occurred_at": "ISO-8601",
  "payload": { ...versioned per schema_version... }
}

Consumer strategy:
→ Consumers declare which schema versions they support
→ Unknown fields are ignored (forward compatibility)
→ Missing required fields cause consumer to use defaults
   or move event to DLQ for manual review
```

---

## 8.2 Queueing Recommendations

```
Phase 1 MVP — Spring Application Events (in-process):
──────────────────────────────────────────────────────
Technology: Spring ApplicationEventPublisher
Pros: Zero infrastructure, simple to implement
Cons: Lost on JVM restart, no persistence, no distribution
Suitable for: < 50 events/day, single server, acceptable reliability

Implementation:
@Service
class InquiryService {
    @Autowired ApplicationEventPublisher events;
    
    public Inquiry submit(SubmitInquiryCommand cmd) {
        Inquiry inquiry = // ... create and save
        events.publishEvent(new InquirySubmittedEvent(inquiry));
        return inquiry;
    }
}

@Component
class InquiryNotificationListener {
    @Async // runs in separate thread pool
    @TransactionalEventListener(phase = AFTER_COMMIT) // only fires after TX commits
    public void onInquirySubmitted(InquirySubmittedEvent event) {
        emailService.sendConfirmation(event.getInquiry());
    }
}

KEY: @TransactionalEventListener(phase = AFTER_COMMIT)
→ Ensures listener only fires if the publishing transaction committed
→ Prevents notifications for rolled-back operations

Phase 2 — Redis Streams:
─────────────────────────
Technology: Redis Streams with Consumer Groups
Pros: Persistent (survives restarts), distributed, consumer groups
Cons: Redis operational overhead, no built-in DLQ

Queue names:
  furnix:notifications    (email, WebSocket push)
  furnix:order-events     (state machine consumers)
  furnix:system-alerts    (SLA, capacity warnings)

Consumer group setup:
  XGROUP CREATE furnix:notifications email-workers $ MKSTREAM
  XGROUP CREATE furnix:notifications websocket-workers $ MKSTREAM

Phase 3 — Evaluate RabbitMQ or managed queue service:
───────────────────────────────────────────────────────
If Redis Streams become operationally complex:
→ RabbitMQ: Better DLQ support, message routing, management UI
→ Amazon SQS + SNS: Managed, no operational overhead, fan-out
→ Decision driven by infrastructure team's operational capability
```

---

## 8.3 State Management Recommendations

```
Recommendation 1: State Machine as Explicit Service
────────────────────────────────────────────────────
Do NOT implement state transition logic scattered across controllers.
Implement a dedicated OrderStateMachineService:

class OrderStateMachineService {
    
    // Define allowed transitions
    private static final Map<OrderState, Set<OrderState>> TRANSITIONS = Map.of(
        ADVANCE_PENDING, Set.of(IN_PRODUCTION, CANCELLED),
        IN_PRODUCTION, Set.of(MATERIAL_PROCUREMENT, CANCELLED),
        // ... all transitions
    );
    
    // Define authority requirements per transition
    private static final Map<TransitionKey, Set<Role>> TRANSITION_AUTHORITY = Map.of(
        new TransitionKey(IN_PRODUCTION, CANCELLED), Set.of(SUPER_ADMIN),
        // ... 
    );
    
    @Transactional
    public Order transition(Order order, OrderState targetState, 
                           User actor, String note) {
        // Guard 1: Is transition valid?
        validateTransition(order.getStatus(), targetState);
        
        // Guard 2: Does actor have authority?
        validateAuthority(order.getStatus(), targetState, actor.getRole());
        
        // Guard 3: Are business preconditions met?
        validatePreconditions(order, targetState);
        
        // Execute transition
        OrderState previousState = order.getStatus();
        order.setStatus(targetState);
        order.setVersion(order.getVersion() + 1);
        
        Order saved = orderRepository.save(order);
        
        // Record history (same transaction)
        statusHistoryRepository.save(new OrderStatusHistory(
            order.getId(), previousState, targetState, actor.getId(), note
        ));
        
        // Publish event (via OUTBOX, same transaction)
        outboxRepository.save(new OutboxEvent(
            "ORDER_STATE_CHANGED",
            Map.of("orderId", order.getId(), 
                   "from", previousState, 
                   "to", targetState)
        ));
        
        return saved;
    }
}

Recommendation 2: Specification Snapshot at Order Creation
────────────────────────────────────────────────────────────
When order is created from quotation:
→ Copy ALL relevant quotation data into ORDER.specification_snapshot_json
→ This snapshot is immutable (append-only on amendment)
→ Even if quotation record is later modified or superseded,
  the order's agreed specification is preserved in the snapshot
→ This is the legally binding record of what was agreed

Snapshot must include:
{
  "captured_at": "ISO-8601",
  "source": "quotation_id:QT-2025-000001",
  "version": 1,
  "dimensions": {"length": 180, "width": 80, "height": 75, "unit": "cm"},
  "wood_type": "Teak Grade A",
  "finish": "Natural Polish - 3 coats",
  "line_items": [...],
  "total_amount": 85000.00,
  "payment_terms": {...},
  "lead_time_days": 45,
  "agreed_delivery_by": "2025-04-01"
}

Recommendation 3: Idempotency Key Infrastructure
─────────────────────────────────────────────────
All write operations that can be retried should support idempotency keys.

Client generates: UUID v4 at the start of each operation
Client sends: X-Idempotency-Key header on all POST/PUT requests

Server stores: Redis key "idempotency:{key}" with response body, TTL 24h
Server logic:
   1. Check Redis for idempotency key
   2. If found: return cached response (exact same response as original)
   3. If not found: process, store response in Redis, return response

Applicable endpoints:
   POST /api/inquiries (inquiry submission)
   POST /api/quotations/{id}/approve (quote approval)
   POST /api/orders/{id}/payments/{milestoneId}/confirm (payment)
   POST /api/orders/{id}/transitions (state change)
```

---

## 8.4 Operational Safeguards

```
Safeguard 1: Circuit Breaker for External Services
───────────────────────────────────────────────────
External services (Cloudinary, email, WhatsApp) can fail.
Circuit breaker prevents cascading failures.

States: CLOSED (normal) → OPEN (failing) → HALF-OPEN (testing)

Config (Resilience4j):
   Email service circuit breaker:
   → Open after: 5 failures in 30 seconds
   → Stay open for: 60 seconds
   → Test with: 1 request in half-open state

When email circuit is OPEN:
→ Email jobs queued in database (not lost)
→ Queue processed when circuit closes
→ Admin alerted of email delivery degradation

Safeguard 2: Database Connection Pool Monitoring
─────────────────────────────────────────────────
HikariCP (Spring Boot default) configuration:
   maximumPoolSize: 20 (Phase 1), 50 (Phase 2)
   connectionTimeout: 3000ms (fail fast, don't queue forever)
   idleTimeout: 600000ms
   maxLifetime: 1800000ms

Alerts:
→ Pool utilization > 80%: Warning alert
→ Connection acquisition timeout: Error alert + log
→ Pool exhaustion: Critical alert + circuit breaker consideration

Safeguard 3: Graceful Shutdown
────────────────────────────────
When server is shutting down for deployment:
→ Stop accepting new WebSocket connections
→ Drain existing WebSocket connections (send GOING_AWAY frame)
→ Allow in-flight HTTP requests to complete (up to 30s)
→ Flush outbox events to queue
→ Close DB connections cleanly

Spring Boot configuration:
   server.shutdown=graceful
   spring.lifecycle.timeout-per-shutdown-phase=30s

Safeguard 4: Health Check Layering
────────────────────────────────────
/actuator/health → Overall system health (for load balancer)
/actuator/health/db → Database connectivity
/actuator/health/redis → Redis connectivity
/actuator/health/email → Email service connectivity
/actuator/health/cloudinary → Cloudinary API connectivity

Load balancer: Only routes to instances where /actuator/health returns 200
If database is down: /actuator/health returns 503 → 
  load balancer removes instance from rotation

Safeguard 5: Rate Limit with Client Identity
─────────────────────────────────────────────
Rate limits applied at multiple levels:
→ IP-level: Prevents anonymous abuse
→ User-level: Prevents authenticated abuse
→ Endpoint-level: Tighter limits on expensive operations

Implementation (Spring + Redis):
   Bucket4j library with Redis backend
   Configurations:
   POST /api/auth/login: 10 req/min per IP
   POST /api/inquiries: 5 req/hour per user
   POST /api/media/presigned-upload: 20 req/min per user
   GET /api/products: 200 req/min per IP (public, generous)
   GET /api/orders/*: 60 req/min per user

When rate limit exceeded:
→ HTTP 429 Too Many Requests
→ Retry-After header: seconds until limit resets
→ X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
→ Log rate limit events for abuse pattern analysis
```

---

## Summary: Critical Engineering Decisions

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION SUMMARY                             │
├─────────────────────────┬───────────────────────────────────────┤
│ Decision                │ Recommendation                        │
├─────────────────────────┼───────────────────────────────────────┤
│ Event delivery Phase 1  │ @TransactionalEventListener AFTER_    │
│                         │ COMMIT (in-process, Spring Events)    │
├─────────────────────────┼───────────────────────────────────────┤
│ Event delivery Phase 2  │ Transactional Outbox + Redis Streams  │
├─────────────────────────┼───────────────────────────────────────┤
│ Concurrency control     │ Pessimistic lock (SELECT FOR UPDATE)  │
│                         │ for state transitions and payments;   │
│                         │ Optimistic lock for content edits     │
├─────────────────────────┼───────────────────────────────────────┤
│ Idempotency             │ Client-generated UUID keys on all     │
│                         │ write operations; Redis cache for     │
│                         │ response deduplication               │
├─────────────────────────┼───────────────────────────────────────┤
│ WebSocket scaling       │ Redis Pub/Sub as broker between       │
│                         │ WebSocket server instances           │
├─────────────────────────┼───────────────────────────────────────┤
│ State authority         │ REST API is source of truth;          │
│                         │ WebSocket is push optimization only   │
├─────────────────────────┼───────────────────────────────────────┤
│ Rollback strategy       │ Compensating transactions for cross-  │
│                         │ service failures; never roll back     │
│                         │ committed payment records             │
├─────────────────────────┼───────────────────────────────────────┤
│ Audit log               │ Synchronous write in same transaction │
│                         │ at MVP; extract to append-only schema │
│                         │ at Phase 2                           │
├─────────────────────────┼───────────────────────────────────────┤
│ Reference numbers       │ Atomic sequence table with row-level  │
│                         │ locking; never COUNT(*)-based         │
├─────────────────────────┼───────────────────────────────────────┤
│ Specification history   │ Append-only JSON array on order;      │
│                         │ never overwrite agreed specification  │
└─────────────────────────┴───────────────────────────────────────┘
```

---

*This analysis represents the complete distributed systems and workflow engineering specification for Furnix. All implementation decisions should be validated against these specifications before development begins on any feature that involves state transitions, event propagation, or concurrent access.*