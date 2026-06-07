# Furnix — Product Requirements Document (PRD)
### Version 1.0 | Classification: Internal Engineering & Product

---

## Document Control

| Field | Value |
|---|---|
| Product Name | Furnix |
| Document Version | 1.0 |
| Status | Draft — Pending Engineering Review |
| Target Release | MVP Phase 1 |
| Primary Stakeholder | Business Owner / Master Admin |
| Document Owner | Product Management |
| Last Updated | 2025 |

---

# PART 1 — PRODUCT VISION

---

## 1.1 Core Mission

Furnix exists to transform an artisanal woodworking business from an informally managed, WhatsApp-dependent operation into a structured, digitally governed platform — without destroying the personal, craft-first character that makes artisanal businesses valuable to their clients.

The mission is not to build generic e-commerce software for furniture. The mission is to build a **domain-accurate operations platform** that happens to have a customer-facing storefront.

---

## 1.2 Business Objectives

| Objective | Measurable Target | Time Horizon |
|---|---|---|
| Reduce admin time spent on order status communication | Reduce by 60% within 3 months of launch | Phase 1 |
| Eliminate lost inquiries due to WhatsApp thread overload | Zero unrecorded inquiries after system adoption | Phase 1 |
| Provide accurate payment milestone tracking | 100% of active orders have payment state in system | Phase 1 |
| Enable client self-service order tracking | 70% of clients use tracking instead of calling | Phase 2 |
| Expose production capacity to prevent over-commitment | Admin sees live capacity utilization before accepting orders | Phase 2 |
| Generate business analytics for pricing decisions | Monthly revenue and product performance reports available | Phase 3 |

---

## 1.3 Problem Statement

An artisanal woodworking business manages its entire operational lifecycle — from client inquiry through production through delivery — across a fragmented set of non-integrated tools:

- **WhatsApp** for all client communication, negotiation, design approvals, and delivery coordination
- **Physical notebooks or spreadsheets** for order tracking and payment records
- **Instagram** as the primary product catalog and discovery surface
- **Verbal agreements and informal photographs** as the sole record of design specifications
- **Memory and phone calls** as the notification and follow-up system

The consequences of this operational model at any meaningful business volume are:

1. Inquiries are missed or responded to too late, causing revenue leakage
2. Payment records are inaccurate or disputed because no authoritative ledger exists
3. Design disagreements at delivery have no documented resolution path
4. The business owner cannot scale because they are personally the system
5. Client experience is anxiety-inducing — no visibility, no tracking, no certainty
6. Workshop capacity is invisible, causing over-commitment and delivery failures

---

## 1.4 Why Current Solutions Fail

| Solution | Why It Fails for This Domain |
|---|---|
| **Shopify** | Models all products as inventory. Bespoke furniture has no inventory. The add-to-cart → pay → ship model does not map to a 6-week bespoke production cycle |
| **Etsy** | Handles discovery but abandons the seller after the inquiry. No production management, no payment milestones, no client tracking |
| **Houzz Pro** | Built for interior designers managing projects, not for manufacturers managing production. Expensive and complex for a small artisan business |
| **Generic CRMs (HubSpot, Zoho)** | Model leads and deals, not orders with production states, payment milestones, material dependencies, and delivery scheduling |
| **WhatsApp alone** | No structured data, no searchability, no concurrent access, no state tracking, no audit trail, no notification automation |
| **Google Sheets** | No real-time multi-user state management, no client-facing interface, no notification system, breaks at any meaningful scale |

**The fundamental gap:** No existing product models the bespoke furniture production lifecycle as a first-class domain with production states, payment milestones, design version history, capacity management, and a premium client experience simultaneously.

---

# PART 2 — PRODUCT SCOPE

---

## 2.1 MVP Scope (Phase 1)

The MVP validates one primary hypothesis:

> *Digitizing the inquiry-to-delivery workflow creates enough operational value for the business owner and enough trust for the client that both parties adopt the platform voluntarily.*

### Included in MVP

| Feature Area | Included Capabilities |
|---|---|
| Public Catalog | Product listing, category filtering, high-resolution images, product detail page |
| Custom Inquiry | Structured inquiry form with requirement capture, reference image upload |
| Standard Order | Order placement for catalog items with specification selection |
| Admin Dashboard | Order management, inquiry management, status update controls |
| Order State Management | Full state machine from inquiry through delivery |
| Payment Milestone Tracking | Manual payment recording by admin per milestone |
| Client Order Tracking | Read-only order status and milestone view for authenticated clients |
| Basic Notification | Email notification on inquiry receipt, status change, payment confirmation |
| Authentication | JWT-based email/password auth, Google OAuth |
| Admin Product Management | Create, update, archive catalog products with image upload |
| WhatsApp Integration | Deep-link generation from inquiry to WhatsApp conversation |
| Communication Log | Admin note-taking on orders, visible to client as structured updates |
| Basic Audit Trail | Event log for order state changes and payment records |

---

## 2.2 Phase-Wise Expansion

### Phase 2 — Operational Maturity (3–6 months post-MVP)

| Feature | Justification |
|---|---|
| Workshop capacity management | Prevents over-commitment as order volume grows |
| Real-time WebSocket notifications | Replaces polling-based status checks |
| Delivery scheduling system | Prevents double-booking, enables delivery staff access |
| Quotation builder with versioning | Replaces manual quote creation, captures approval formally |
| Automated payment reminders | Reduces admin follow-up burden |
| Client communication thread (in-app) | Reduces WhatsApp dependency, keeps record in system |
| Role-based staff access (Shop Manager, Delivery) | Enables delegation without full admin access |
| Production milestone photo upload | Visual production evidence, reduces delivery disputes |

### Phase 3 — Scale & Intelligence (6–12 months post-MVP)

| Feature | Justification |
|---|---|
| AR product visualization | Premium differentiation, reduces returns and dissatisfaction |
| WhatsApp Business API integration | Bidirectional sync between WhatsApp and Furnix records |
| B2B Interior Designer portal | Separate account type with multi-project management |
| Business analytics dashboard | Revenue, product performance, capacity utilization reporting |
| Automated payment gateway (Razorpay/Stripe) | Manual payment confirmation does not scale |
| Inventory and material tracking | Material shortage detection and procurement alerts |
| Client testimonial and portfolio system | Converts delivered orders into marketing assets |

### Phase 4 — Platform Expansion (12+ months)

| Feature | Justification |
|---|---|
| Multi-workshop / multi-location support | Business expansion scenario |
| Supplier management module | Material procurement digitization |
| Warranty claim management | Post-delivery lifecycle management |
| Mobile app (React Native) | Field access for delivery staff and client convenience |
| Public API for third-party integrations | Ecosystem expansion |

---

## 2.3 Explicit Non-Goals

The following are explicitly out of scope and must not be designed around even partially in Phase 1 or Phase 2:

| Non-Goal | Reason |
|---|---|
| Marketplace functionality (multiple vendors) | Furnix serves one business, not a marketplace |
| Automated shipping / courier integration | Furniture delivery is a scheduled service, not parcel shipping |
| Real-time inventory deduction | No pre-made inventory exists in bespoke production |
| Customer-to-customer reviews (public) | Brand control concern at early stage |
| Subscription or SaaS licensing to other businesses | Out of current commercial scope |
| Financial accounting / bookkeeping integration | Separate tool domain, creates scope creep |
| AI-powered design generation | Technically premature, domain-inappropriate for artisanal brand |

---

## 2.4 Feature Prioritization Rationale

Prioritization follows the **Operational Value First** principle:

```
Tier 1 — Business Survival Features
(Without these, the platform creates negative value)
├── Order state tracking
├── Inquiry capture and management
├── Payment milestone recording
└── Admin order dashboard

Tier 2 — Trust and Retention Features
(Without these, clients do not return)
├── Client order tracking view
├── Communication log / status updates
├── Email notifications on key events
└── Order audit trail

Tier 3 — Efficiency Features
(These multiply admin productivity)
├── Quotation builder
├── Automated reminders
├── Role-based staff access
└── Delivery scheduling

Tier 4 — Differentiation Features
(These create competitive advantage)
├── AR visualization
├── WhatsApp API integration
├── B2B portal
└── Analytics dashboard
```

---

# PART 3 — USER ROLES & PERMISSIONS

---

## 3.1 User Role Definitions

### Role 1: Super Admin (Business Owner)

**Description:** The business owner. Has unrestricted access to every system capability. Cannot be restricted by any other role. Only one Super Admin account exists per deployment.

**Created by:** System initialization / first-run setup

**Cannot be deleted or demoted** by any in-system action.

---

### Role 2: Admin (Operations Manager)

**Description:** A trusted staff member delegated operational authority. Can manage orders and inquiries but cannot access financial reporting or system configuration.

**Created by:** Super Admin only

**Maximum accounts:** Configurable by Super Admin (default: 5)

---

### Role 3: Shop Manager (Production Lead)

**Description:** Workshop floor staff. Can view and update production milestones but cannot modify orders, quotations, or payment records.

**Created by:** Super Admin or Admin

**Maximum accounts:** Configurable (default: 10)

---

### Role 4: Delivery Staff

**Description:** Field delivery personnel. Can view their assigned delivery schedule and mark deliveries as complete with proof upload. Cannot view any unassigned orders.

**Created by:** Super Admin or Admin

**Maximum accounts:** Configurable (default: 10)

---

### Role 5: Registered Client (B2C)

**Description:** An end customer who has created an account. Can place orders, track their own orders, communicate with admin, and manage their profile. Cannot see any other client's data under any circumstance.

**Created by:** Self-registration via sign-up or Google OAuth

---

### Role 6: Guest / Unauthenticated Visitor

**Description:** A visitor who has not authenticated. Can browse the public catalog and view product details. Cannot place orders or submit inquiries without authenticating.

**Created by:** Anonymous session

---

## 3.2 Permission Matrix

| Permission | Super Admin | Admin | Shop Manager | Delivery | Client | Guest |
|---|---|---|---|---|---|---|
| View public catalog | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit inquiry | ✅ | ✅ | — | — | ✅ | ❌ |
| Place standard order | ✅ | ✅ | — | — | ✅ | ❌ |
| View own orders | ✅ | ✅ | — | — | ✅ | ❌ |
| View ALL orders | ✅ | ✅ | ✅ (read) | ❌ | ❌ | ❌ |
| Update order status | ✅ | ✅ | Milestones only | Delivery only | ❌ | ❌ |
| Create/edit quotation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve quotation | ✅ | — | — | — | ✅ (own) | ❌ |
| Record payment | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View payment records | ✅ | ✅ | ❌ | ❌ | Own only | ❌ |
| Manage product catalog | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View production queue | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upload milestone photos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View delivery schedule | ✅ | ✅ | ❌ | Own only | ❌ | ❌ |
| Mark delivery complete | ✅ | ✅ | ❌ | ✅ (assigned) | ❌ | ❌ |
| View financial reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage staff accounts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage system settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ (read) | ❌ | ❌ | ❌ | ❌ |
| Export data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3.3 Admin Hierarchy

```
Super Admin
    │
    ├──► Admin (Operations)
    │        │
    │        ├──► Shop Manager
    │        └──► Delivery Staff
    │
    └──► [Cannot delegate Super Admin privileges]

Client accounts exist in a parallel hierarchy with no crossover
```

**Hierarchy Rules:**
- A role can only create accounts at a lower level than itself
- A role cannot modify permissions of accounts at the same or higher level
- Super Admin is the only role that can deactivate Admin accounts
- Deactivated accounts lose session access within 60 seconds via token invalidation

---

## 3.4 Operational Authority Levels

| Authority | Who Holds It |
|---|---|
| Accepting/rejecting inquiries | Super Admin, Admin |
| Issuing quotations | Super Admin, Admin |
| Closing/cancelling orders | Super Admin only |
| Issuing refunds | Super Admin only |
| Overriding order state | Super Admin only |
| Changing product pricing | Super Admin only |
| System configuration | Super Admin only |
| Staff account management | Super Admin only |
| Production milestone updates | Super Admin, Admin, Shop Manager |
| Delivery confirmation | Super Admin, Admin, Delivery Staff |

---

# PART 4 — FUNCTIONAL REQUIREMENTS

---

## FR-01: User Authentication

### FR-01.1: Email and Password Registration

**Description:**
A new user can create an account using their email address and a password. The account requires email verification before full access is granted.

**Inputs:**
- Full name (required, 2–100 characters)
- Email address (required, valid format, unique in system)
- Password (required, minimum 8 characters, must contain uppercase, lowercase, number, special character)
- Phone number (optional at registration, required before order placement)

**Outputs:**
- User account created with ROLE_CLIENT by default
- Verification email sent within 30 seconds
- Session token NOT issued until email is verified
- Unverified account record created with 48-hour expiry

**Validation Rules:**
- Email uniqueness checked against existing verified AND unverified accounts
- Password entropy validated server-side, not just client-side
- Rate limit: Maximum 5 registration attempts per IP per hour
- Phone number format validation if provided (E.164 format)

**Failure Handling:**
- Duplicate email: Return 409 with message "An account with this email already exists"
- Weak password: Return 422 with specific character requirement missing
- Email delivery failure: Queue for retry with 3 attempts over 10 minutes; if all fail, surface error to user with manual resend option
- Rate limit exceeded: Return 429 with retry-after header

**Dependencies:**
- Email delivery service (SendGrid or equivalent)
- Password hashing (BCrypt with cost factor 12 minimum)
- Token generation for email verification link

**Edge Cases:**
- User registers with email that exists as an unverified account → resend verification email, reset 48-hour timer
- User registers with email that was previously deactivated → surface specific error, do not reveal deactivation reason
- Registration succeeds but email service is down → store verification token, queue email, inform user to check spam or try again

**Acceptance Criteria:**
- [ ] Account is not accessible before email verification
- [ ] Duplicate email produces 409, not 500
- [ ] Verification link expires after 48 hours
- [ ] Verification link is single-use (invalidated after first click)
- [ ] Rate limiting is enforced and tested

---

### FR-01.2: Google OAuth Authentication

**Description:**
Users and admins can authenticate using their Google account. On first OAuth login, an account is automatically created if the email does not already exist.

**Inputs:**
- Google ID token (from Google OAuth flow)

**Outputs:**
- If new user: account created, JWT issued, user redirected to profile completion
- If existing user: JWT issued, user redirected to their intended destination
- If email exists as password account: accounts linked, user informed

**Validation Rules:**
- Google ID token verified against Google's public keys server-side
- Token expiry checked
- Email from Google must be verified by Google (email_verified: true)
- Admin accounts cannot be created via OAuth — only promoted by Super Admin after creation

**Failure Handling:**
- Invalid or expired Google token: Return 401, prompt user to retry OAuth flow
- Google service unavailable: Return 503 with "Authentication service temporarily unavailable"
- Email from Google is unverified: Reject with clear explanation

**Edge Cases:**
- User authenticates via Google with an email that has an existing password account → merge accounts, preserve all existing data, inform user that both methods now work
- User revokes Google access from Google's side → their Furnix session remains valid until JWT expiry; next login attempt fails, password login still works

**Acceptance Criteria:**
- [ ] OAuth login completes in under 3 seconds for successful case
- [ ] Account merge handles duplicate email without data loss
- [ ] Admin cannot be created through OAuth flow without explicit promotion

---

### FR-01.3: JWT Session Management

**Description:**
All authenticated sessions are managed via short-lived access tokens and long-lived refresh tokens.

**Token Configuration:**
- Access token TTL: 15 minutes
- Refresh token TTL: 7 days (rolling)
- Refresh token rotation: New refresh token issued on every use, old one immediately invalidated
- Maximum concurrent sessions per user: 3 (configurable by Super Admin)

**Failure Handling:**
- Expired access token with valid refresh token: Silent refresh, user experience uninterrupted
- Expired refresh token: Force re-authentication, preserve user's current page/state for post-login redirect
- Refresh token used twice (replay attack detected): Immediately invalidate all sessions for that user, require re-authentication

**Edge Cases:**
- User changes password while logged in on another device → all existing refresh tokens invalidated within 60 seconds
- Admin deactivates user account → active sessions invalidated at next token validation check (max 15-minute lag)
- User logs out on one device while active on another → only that device's refresh token invalidated

**Acceptance Criteria:**
- [ ] Access token cannot be used after expiry
- [ ] Refresh token rotation prevents replay attacks
- [ ] Password change invalidates all sessions except the requesting session

---

## FR-02: Product Catalog

### FR-02.1: Product Listing (Public)

**Description:**
The public catalog displays all active products with filtering and search. No authentication required to view.

**Inputs:**
- Filter parameters: category, wood_type, price_range, availability_status
- Sort parameters: price_asc, price_desc, newest, featured
- Search query: Full-text search against product name and description
- Pagination: page number, page size (default 12, max 48)

**Outputs:**
- Paginated list of products with: thumbnail, name, starting price, wood type, availability indicator
- Total count for pagination
- Applied filter summary

**Validation Rules:**
- Price range: min must be less than max
- Page size cannot exceed 48
- Search query maximum length: 200 characters
- Invalid filter values silently ignored (not rejected) — degrade gracefully

**Failure Handling:**
- Database query timeout (>3 seconds): Return cached result if available, else return 503
- Empty result set: Return 200 with empty array and helpful message, not 404
- Malformed filter parameters: Return 400 with field-level error detail

**Dependencies:**
- Product catalog cache (Redis or equivalent) — cache TTL: 5 minutes
- Cloudinary for image URLs (CDN-served, not proxied through backend)

**Edge Cases:**
- All products in a category are archived → category filter returns empty with message, not error
- Product price updated while user is browsing → user sees cached price until next cache refresh; no guarantee of real-time price display on listing page
- Search query contains SQL injection attempt → parameterized query prevents execution, request logged as security event

**Acceptance Criteria:**
- [ ] Catalog loads within 1.5 seconds on first load, 800ms on subsequent (cached)
- [ ] Search returns results within 1 second for up to 500 products
- [ ] Filtering combinations all return valid responses
- [ ] Empty states display contextual message, not blank page

---

### FR-02.2: Product Detail Page (Public)

**Description:**
Individual product page displaying full product information, all images, specifications, and calls to action.

**Inputs:**
- Product ID or URL slug

**Outputs:**
- Full product details: name, description, dimensions, wood type(s) available, finish options, base price, lead time estimate
- Image gallery (up to 10 images)
- AR model link (Phase 3)
- Related products (up to 4)
- CTA: "Order This" (standard order) or "Request Custom Version" (custom inquiry pre-filled)

**Validation Rules:**
- Product must have ACTIVE status to be publicly accessible
- If product is ARCHIVED: return 404 (do not reveal archived status publicly)
- Slug must be URL-safe, unique, auto-generated from product name

**Failure Handling:**
- Product not found or archived: 404 with catalog redirect suggestion
- Image load failure: Fallback to placeholder, do not break page layout
- Related products query failure: Page loads without related products section, no error shown to user

**Edge Cases:**
- Client bookmarks a product URL and returns after the product is archived → 404 with message "This product is no longer available. Browse our current collection."
- Admin updates product while client is viewing it → client sees stale data until page refresh (acceptable for Phase 1)

**Acceptance Criteria:**
- [ ] Page loads within 2 seconds including first meaningful paint
- [ ] Archived products return 404 from public routes
- [ ] All image slots have graceful fallback

---

### FR-02.3: Admin Product Management

**Description:**
Admin interface for creating, editing, publishing, and archiving products in the catalog.

**Inputs (Create/Edit):**
- Product name (required, 3–150 characters)
- Description (required, 20–5000 characters, rich text)
- Category (required, from predefined category list)
- Wood types available (required, multi-select from defined list)
- Finish options available (required, multi-select)
- Base price (required, positive decimal, up to 2 decimal places)
- Dimensions: length, width, height (optional, in centimeters)
- Lead time estimate (required, integer days, minimum 7)
- Images (required minimum 1, maximum 10, each max 10MB, formats: JPG, PNG, WEBP)
- Is Featured flag (boolean)
- Status: DRAFT, ACTIVE, ARCHIVED

**Outputs:**
- Product record created/updated in database
- Images uploaded to Cloudinary, URLs stored
- URL slug auto-generated and confirmed unique
- Audit log entry created

**Validation Rules:**
- Base price minimum: 1.00
- At least one image required before product can be set to ACTIVE
- Product cannot be ACTIVE without at least one wood type and one finish option
- Slug uniqueness enforced at database level with unique constraint
- Image dimensions minimum: 800x800 pixels (enforced to maintain quality)
- Image upload: virus scan if feasible, content type validation mandatory

**Failure Handling:**
- Cloudinary upload failure: Retry up to 3 times; if all fail, surface error to admin, do not partially save product with broken image references
- Slug collision: Auto-append numeric suffix (e.g., -2, -3)
- Partial save failure (DB transaction fails after image upload): Cloudinary images must be marked for cleanup via background job; product record rolled back

**Edge Cases:**
- Admin edits a product that has active orders referencing it → changes to price do not retroactively affect existing orders; changes to name and description update immediately
- Admin archives a product with pending orders → pending orders continue; product removed from public catalog; admin notified of affected orders
- Duplicate product name (not slug): Allowed with warning, not blocked

**Acceptance Criteria:**
- [ ] Product is never publicly visible while in DRAFT status
- [ ] Archive does not delete product or its order history
- [ ] Image upload failure produces clear error, no orphaned records
- [ ] Price changes on active products are logged with before/after values

---

## FR-03: Custom Inquiry System

### FR-03.1: Inquiry Submission

**Description:**
Authenticated clients submit a structured request for a custom furniture piece. This initiates the order lifecycle.

**Inputs:**
- Client account (authenticated, required)
- Furniture type description (required, 10–1000 characters)
- Dimensions required: length, width, height (optional but encouraged)
- Preferred wood type (optional, from defined list or "Open to suggestion")
- Preferred finish (optional, from defined list or "Open to suggestion")
- Budget range: min and max (required)
- Desired delivery date (optional, must be at least 14 days from submission)
- Reference images (optional, max 5 images, max 5MB each)
- Additional notes (optional, max 2000 characters)
- Preferred contact method: email, WhatsApp, or in-app (required)

**Outputs:**
- Inquiry record created with status: SUBMITTED
- Inquiry reference number generated (format: INQ-YYYY-NNNNNN)
- Client receives confirmation email with reference number and expected response time
- Admin receives notification (email + in-app) with inquiry summary
- WhatsApp deep link generated if client selected WhatsApp as contact method

**Validation Rules:**
- Budget min must be less than budget max
- Budget min must be at least 500 (minimum viable furniture order)
- Desired delivery date must be parseable and in the future (minimum +14 days)
- Reference images validated for format (JPG, PNG, WEBP) and size server-side
- Client cannot have more than 3 OPEN inquiries simultaneously (prevents spam)
- Phone number must be verified in client profile if WhatsApp contact is selected

**Failure Handling:**
- Image upload fails for one of multiple images: Save successful images, notify client which image failed, allow re-upload without re-submitting entire form
- Admin notification delivery fails: Inquiry is saved successfully; notification queued for retry; inquiry visible in admin dashboard regardless
- Client hits 3-inquiry limit: Return 422 with message showing current open inquiry IDs and their statuses

**Dependencies:**
- Client must have verified email
- Client profile phone number required for WhatsApp contact method
- Cloudinary for reference image storage

**Edge Cases:**
- Client submits inquiry then immediately cancels it before admin sees it → allow cancellation within 30 minutes of submission if status is still SUBMITTED
- Client submits duplicate inquiry for very similar furniture within 48 hours → system flags for admin review (similarity detection is manual in Phase 1, automated in Phase 3)
- Admin is on vacation / unavailable → inquiry sits in SUBMITTED state; SLA timer visible on admin dashboard to highlight aging inquiries

**Acceptance Criteria:**
- [ ] Inquiry reference number is unique and immutable
- [ ] Client receives confirmation within 60 seconds of submission
- [ ] Admin notification reaches dashboard within 30 seconds
- [ ] 3-inquiry limit enforced per client at database level, not only UI level
- [ ] Reference images stored securely and accessible only to client and admin

---

### FR-03.2: Inquiry Management (Admin)

**Description:**
Admin reviews, responds to, and progresses inquiries through the pipeline toward quotation.

**Inputs:**
- Inquiry ID
- Admin action: ACKNOWLEDGE, REQUEST_INFO, REJECT, CONVERT_TO_QUOTE
- Response message (required for REQUEST_INFO and REJECT)
- Rejection reason category (required for REJECT: budget_mismatch, too_complex, capacity, outside_service_area, other)

**Outputs:**
- Inquiry status updated
- Client notified of status change with admin's message
- If CONVERT_TO_QUOTE: Quotation draft created pre-populated with inquiry data
- Audit log entry created for every status transition

**State Transitions for Inquiry:**
```
SUBMITTED
    ├──► ACKNOWLEDGED (admin reviewed it)
    │        ├──► INFO_REQUESTED (admin needs more details)
    │        │        └──► SUBMITTED (client responds, re-enters queue)
    │        └──► QUOTE_PENDING (admin begins quotation)
    └──► REJECTED (admin declines, with reason)
```

**Failure Handling:**
- Admin attempts invalid state transition (e.g., REJECT from INFO_REQUESTED): Return 422 with valid transitions listed
- Client notification fails: State still updates; notification queued for retry

**Edge Cases:**
- Admin rejects inquiry, client resubmits with more details → treated as a new inquiry; previous rejection is visible in client's history but does not block resubmission
- Admin acknowledges inquiry then is reassigned to a different admin → reassignment logged, new admin inherits full history

**Acceptance Criteria:**
- [ ] Invalid state transitions blocked at API level
- [ ] Every state change has a timestamped audit entry
- [ ] Admin cannot bypass INFO_REQUESTED state to go directly to REJECTED without a response message

---

## FR-04: Quotation System

### FR-04.1: Quotation Creation (Admin)

**Description:**
Admin creates a formal quotation for a custom order. The quotation captures the agreed scope, pricing, and terms before production begins.

**Inputs:**
- Source inquiry ID (required, links quotation to inquiry)
- Line items (required, at least 1):
  - Description (required)
  - Quantity (required, positive integer)
  - Unit price (required, positive decimal)
- Material specification: wood type, finish (required)
- Agreed dimensions: length, width, height (required)
- Production lead time (required, integer days from approval)
- Payment terms:
  - Advance percentage (required, 30–60%)
  - Milestone 2 percentage and trigger (optional)
  - Balance percentage (auto-calculated, must total 100%)
- Quote validity period (required, 7–30 days from issue)
- Admin notes to client (optional)
- Internal notes (required — admin's own reference, not visible to client)
- Version number (auto-incremented, starts at 1)

**Outputs:**
- Quotation record created with status: DRAFT
- Linked to source inquiry and to client account
- PDF preview generated server-side
- Quote reference number generated (format: QT-YYYY-NNNNNN)

**Validation Rules:**
- Payment percentages must sum to exactly 100%
- Advance percentage cannot be below 30% (business policy minimum)
- Lead time minimum: 7 days
- Quote validity maximum: 30 days (quotes older than this cannot be approved by client)
- All line item prices must be positive
- Version number must be exactly 1 greater than previous version for this inquiry

**Failure Handling:**
- PDF generation failure: Save quotation record, flag PDF generation as pending, retry via background job; admin notified that PDF is not yet ready
- Percentages do not total 100%: Return 422 with specific breakdown of the arithmetic error

**Edge Cases:**
- Admin creates Quote v1, sends it, client negotiates, admin creates Quote v2 → Quote v1 is automatically set to SUPERSEDED status; client can only approve Quote v2
- Admin creates a quotation for an inquiry that was already quoted by a different admin → second quotation blocked; system shows existing quotation with option to edit it

**Acceptance Criteria:**
- [ ] Only one ACTIVE quotation can exist per inquiry at any time
- [ ] Superseded quotations are preserved in history but cannot be approved
- [ ] Payment percentages validated to sum to 100 before saving
- [ ] Quote validity enforced — expired quotes cannot be approved by client

---

### FR-04.2: Quotation Approval (Client)

**Description:**
The client reviews the quotation and formally approves it, triggering order creation and advance payment initiation.

**Inputs:**
- Quote ID
- Client action: APPROVE or REQUEST_REVISION
- If REQUEST_REVISION: Revision notes (required, minimum 20 characters)

**Outputs:**
- If APPROVED:
  - Quotation status → APPROVED
  - Order record created from quotation data
  - Order reference number generated (format: ORD-YYYY-NNNNNN)
  - Order status → ADVANCE_PENDING
  - Client and admin notified
  - Advance payment instruction generated
- If REQUEST_REVISION:
  - Quotation status → REVISION_REQUESTED
  - Admin notified with client's revision notes
  - New quotation version cycle begins

**Validation Rules:**
- Client can only approve quotations addressed to their own account
- Quotation must be in SENT status (not DRAFT, SUPERSEDED, or EXPIRED) to be approvable
- Quote validity date must not have passed
- Client cannot approve a quotation if they already have an order created from a previous version of the same inquiry

**Failure Handling:**
- Client approves quotation but order creation fails: Roll back quotation to SENT status, log failure, notify admin immediately, do not leave client in a state of believing their order exists when it does not
- Concurrent approval attempt (client clicks approve twice rapidly): Idempotency check — second request returns the already-created order, not an error

**Edge Cases:**
- Quote expires while client is viewing it: Client clicks approve on an expired quote → Return 422 with explanation and option to request a new quotation
- Client requests revision for the third time: System records it but also flags for admin that this is the third revision request — potential difficult client indicator

**Acceptance Criteria:**
- [ ] Order is not created until quotation is formally approved
- [ ] Client cannot approve another client's quotation under any circumstance
- [ ] Expired quotation approval attempt returns clear error with guidance
- [ ] Order creation from approval is atomic (either both quote updates and order creates, or neither)

---

## FR-05: Order Management

### FR-05.1: Order State Machine

**Description:**
Every order in Furnix exists in exactly one defined state at any point in time. State transitions are governed by strict rules and every transition is logged.

**Complete Order State Machine:**

```
ADVANCE_PENDING
    │  (advance payment confirmed)
    ▼
IN_PRODUCTION
    │  (admin marks production started)
    ▼
PRODUCTION_MILESTONES (sub-states):
    ├── MATERIAL_PROCUREMENT
    ├── ROUGH_CUTTING
    ├── ASSEMBLY_JOINERY
    ├── FINISHING_POLISH
    └── QUALITY_CHECK
    │  (all milestones complete)
    ▼
READY_FOR_DELIVERY
    │  (delivery scheduled)
    ▼
DELIVERY_SCHEDULED
    │  (delivery executed, final payment confirmed)
    ▼
DELIVERED
    │  (auto-transition after 7 days or manual)
    ▼
CLOSED (WARRANTY_ACTIVE)

CANCELLED can be reached from:
    ADVANCE_PENDING → CANCELLED (full refund if no work started)
    IN_PRODUCTION → CANCELLED (partial refund per policy)
    
HOLD can be applied to:
    Any state between IN_PRODUCTION and READY_FOR_DELIVERY
    Reason required: material_shortage, client_request, quality_issue
```

**Validation Rules for Transitions:**
- ADVANCE_PENDING → IN_PRODUCTION requires payment record with status CONFIRMED
- READY_FOR_DELIVERY → DELIVERY_SCHEDULED requires a delivery date set in the future
- DELIVERY_SCHEDULED → DELIVERED requires delivery confirmation proof (photo or admin sign-off)
- Any HOLD requires a reason and estimated resolution date
- CANCEL from IN_PRODUCTION requires Super Admin authority

**Audit Requirements:**
Every transition must record:
- Previous state
- New state
- Actor (user ID and role)
- Timestamp
- Optional note

**Acceptance Criteria:**
- [ ] State machine enforced at service layer, not only UI layer
- [ ] No order can exist in an undefined state
- [ ] Every transition recorded in audit log
- [ ] Invalid transitions return 422 with current state and valid transitions listed

---

### FR-05.2: Payment Milestone Tracking

**Description:**
Each order has a structured payment schedule derived from the approved quotation. Payments are recorded manually by admin in Phase 1.

**Data Model:**

```
Order Payment Schedule:
├── Milestone 1: Advance (e.g., 50%)
│   ├── Amount Due: calculated from order total
│   ├── Due Trigger: On order creation
│   ├── Status: PENDING / CONFIRMED / WAIVED
│   └── Confirmed At: timestamp when admin records payment
├── Milestone 2: Mid-production (e.g., 25%) [optional]
│   ├── Amount Due: calculated
│   ├── Due Trigger: On reaching specified production state
│   └── Status: PENDING / CONFIRMED / WAIVED
└── Milestone 3: Balance (e.g., 25%)
    ├── Amount Due: calculated
    ├── Due Trigger: READY_FOR_DELIVERY state
    └── Status: PENDING / CONFIRMED / WAIVED
```

**Inputs (Admin records payment):**
- Order ID
- Milestone ID
- Payment method: cash, bank_transfer, upi, other
- Reference number (optional but encouraged — bank transaction ID)
- Amount received (must match milestone amount, or flag as partial)
- Payment date (defaults to current date, admin can adjust for past-date recording)

**Outputs:**
- Payment milestone status → CONFIRMED
- Order financial summary updated
- Client notified of payment receipt
- Audit log entry created with all payment details
- If final milestone: Order eligible for DELIVERED transition

**Validation Rules:**
- Amount received must match expected milestone amount exactly, OR admin must explicitly mark as partial with explanation
- Payment date cannot be in the future
- Same milestone cannot be confirmed twice (idempotency)
- Admin cannot record a milestone 3 payment if milestone 1 is still PENDING

**Failure Handling:**
- Admin records payment with wrong amount accidentally: Allow admin to void payment record and re-enter within 24 hours; after 24 hours requires Super Admin to void
- Partial payment recorded: Order is not progressed; admin flagged to follow up for remaining balance

**Edge Cases:**
- Client pays more than the milestone amount: Record actual amount, flag overpayment for admin to credit against next milestone
- Order is cancelled after advance is confirmed: System calculates refund amount based on production state and business policy; admin manually processes refund and records it

**Acceptance Criteria:**
- [ ] Order total always equals sum of all milestone amounts
- [ ] Payment record cannot be silently deleted — only voided with reason
- [ ] Production cannot begin until advance payment milestone is CONFIRMED
- [ ] Financial summary is accurate at all times (no rounding errors)

---

## FR-06: Client Order Tracking

**Description:**
Authenticated clients can view the current status and milestone history of their orders without contacting admin.

**Inputs:**
- Client authentication (required)
- Order ID or order reference number

**Outputs:**
- Current order state (human-readable label, not technical enum)
- Timeline of state transitions with dates
- Payment milestone summary (amounts, status — not payment method or reference)
- Production milestone progress (milestone name, completed or pending)
- Latest admin communication/update
- Estimated delivery date (if set)
- Next action required from client (if any)

**Validation Rules:**
- Client can only view orders linked to their own account
- Payment method and reference numbers are not exposed to client (financial privacy)
- Admin internal notes are not exposed to client

**Failure Handling:**
- Order not found or not belonging to client: Return 404 (identical response whether not found or unauthorized — do not distinguish)

**Edge Cases:**
- Client shares their order tracking URL with someone else → URL requires authentication, other person sees login page, not the order
- Order is in HOLD state: Client sees "Temporarily On Hold" with admin's message; reason detail is admin-controlled (they may not want to say "material shortage")

**Acceptance Criteria:**
- [ ] Client cannot access another client's order data under any URL or API manipulation
- [ ] Order tracking page loads within 1.5 seconds
- [ ] State displayed in plain language, not technical terms
- [ ] If no orders exist, empty state is helpful and guides to inquiry submission

---

## FR-07: Admin Dashboard

**Description:**
The central operational command center for Super Admin and Admin roles.

**Dashboard Panels:**

**Panel 1: Inquiry Queue**
- All SUBMITTED and ACKNOWLEDGED inquiries sorted by submission time (oldest first)
- SLA indicator: color coding for inquiries older than 24 hours (yellow) and 48 hours (red)
- One-click action to acknowledge or begin quotation

**Panel 2: Active Orders**
- All orders in IN_PRODUCTION, ADVANCE_PENDING, READY_FOR_DELIVERY, DELIVERY_SCHEDULED
- Sorted by expected delivery date (soonest first)
- Visual indicator for HOLD status
- Quick status update control

**Panel 3: Payment Alerts**
- Orders with overdue payment milestones (milestone trigger date passed, payment still PENDING)
- Orders with unconfirmed advances blocking production start

**Panel 4: Delivery Calendar**
- Week view of scheduled deliveries
- Conflict detection (two deliveries same time slot)

**Panel 5: Recent Activity**
- Last 20 system events (state changes, payments, inquiries) in reverse chronological order

**Performance Requirements:**
- Dashboard must load full initial view within 2 seconds
- Each panel data is independently loaded (panel failure does not block other panels)
- Dashboard data refreshes every 60 seconds automatically; manual refresh available

**Edge Cases:**
- Admin has no orders or inquiries (new system): Each panel shows meaningful empty state with guidance
- Dashboard loads during a database maintenance window: Cached data shown with staleness indicator

**Acceptance Criteria:**
- [ ] Dashboard is the default landing page after admin login
- [ ] Each panel independently handles its own loading and error state
- [ ] SLA color coding is accurate to the minute
- [ ] Dashboard is functional on tablet (1024px minimum width for admin interface)

---

## FR-08: Notification System

### FR-08.1: Email Notifications

**Events that trigger client email notifications:**

| Event | Email Content |
|---|---|
| Inquiry submitted | Confirmation with reference number and response SLA |
| Inquiry acknowledged | "We've reviewed your inquiry and are preparing a quote" |
| Quotation sent | Quote summary with approval link |
| Quote about to expire (48hr warning) | "Your quote expires in 48 hours" |
| Order created (after quote approval) | Order confirmation with reference and payment instructions |
| Payment milestone confirmed | "We've received your payment of ₹X" |
| Production milestone reached | "Your furniture has reached [milestone name]" |
| Order ready for delivery | "Your order is ready! Let's schedule delivery" |
| Delivery scheduled | Delivery date, time window, and instructions |
| Order delivered | "Thank you for your order. Your warranty period has begun." |
| Order cancelled | Cancellation confirmation with refund policy |

**Events that trigger admin email notifications:**

| Event | Recipient |
|---|---|
| New inquiry submitted | All Admins + Super Admin |
| Quote approved by client | Admin who issued quote + Super Admin |
| Inquiry idle for 48+ hours | Super Admin |
| Order in HOLD for 72+ hours | Super Admin |

**Validation Rules:**
- Emails must use a confirmed sender domain with SPF/DKIM records
- Unsubscribe mechanism required (legal compliance) — but transactional order emails exempt from unsubscribe (they are required communications)
- Email templates must be tested for mobile rendering

**Failure Handling:**
- Primary email service failure: Fallback to secondary provider (if configured), else queue for retry
- Permanent delivery failure (bounced): Flag client email as invalid, alert admin, do not continue attempting delivery
- Retry policy: 3 attempts over 30 minutes with exponential backoff

**Acceptance Criteria:**
- [ ] Critical order emails (payment confirmation, delivery confirmation) delivered within 2 minutes
- [ ] Bounced emails recorded and admin alerted
- [ ] No duplicate emails sent for the same event (idempotency on event processing)

---

# PART 5 — NON-FUNCTIONAL REQUIREMENTS

---

## 5.1 Performance Requirements

| Metric | Target | Measurement Method |
|---|---|---|
| Public catalog page load (P95) | < 1.5 seconds | Synthetic monitoring |
| Product detail page load (P95) | < 2 seconds | Synthetic monitoring |
| Admin dashboard initial load (P95) | < 2 seconds | Synthetic monitoring |
| API response time — read endpoints (P95) | < 300ms | APM tool |
| API response time — write endpoints (P95) | < 500ms | APM tool |
| Image upload completion (10MB file) | < 10 seconds on 4G | Real user monitoring |
| Order state transition (API) | < 200ms | APM tool |
| Search query response | < 1 second | APM tool |

---

## 5.2 Scalability Targets

**Phase 1 (MVP) Scale:**
- Concurrent active users: 50
- Total registered users: 500
- Active orders simultaneously: 100
- Product catalog size: 200 products
- Daily API requests: 10,000

**Phase 2 Scale:**
- Concurrent active users: 500
- Total registered users: 5,000
- Active orders simultaneously: 500
- Daily API requests: 100,000

**Phase 3 Scale:**
- Concurrent active users: 2,000
- Total registered users: 50,000
- Active orders simultaneously: 2,000
- Daily API requests: 1,000,000

**Architectural implication:** The backend must be deployable as a single monolith at MVP scale with clear service boundaries that allow extraction into microservices at Phase 3 scale without wholesale rewrite.

---

## 5.3 Uptime Expectations

| Environment | Uptime Target | Planned Maintenance Window |
|---|---|---|
| Production | 99.5% monthly | Sunday 02:00–04:00 local time |
| Staging | 95% | As needed |

**Downtime Calculation at 99.5%:** Maximum 3.6 hours of unplanned downtime per month.

**Degraded Mode Operation:**
- If the database is unavailable: Public catalog serves cached content; all writes rejected with 503 and user-friendly message
- If Cloudinary is unavailable: Existing images still served via CDN; new image uploads fail gracefully with clear error

---

## 5.4 Latency Constraints

| Operation | Maximum Acceptable Latency |
|---|---|
| Login / token issue | 500ms |
| Real-time notification delivery (Phase 2) | < 2 seconds end-to-end |
| Order state update reflected in client tracking | < 5 seconds (eventual consistency acceptable) |
| Admin dashboard data freshness | < 60 seconds (polling interval) |
| Payment confirmation → order state update | < 10 seconds (webhook processing) |

---

## 5.5 Security Expectations

| Requirement | Specification |
|---|---|
| Transport encryption | TLS 1.2 minimum, TLS 1.3 preferred; no HTTP in production |
| Password storage | BCrypt with work factor 12 minimum |
| JWT signing | RS256 (asymmetric) not HS256 — private key never leaves backend |
| Admin MFA | TOTP-based 2FA mandatory for Super Admin; optional for Admin in Phase 1, mandatory in Phase 2 |
| SQL injection prevention | Parameterized queries / JPA only; no string concatenation in queries |
| XSS prevention | Content Security Policy headers; all user input sanitized before storage and on output |
| CSRF protection | Double-submit cookie pattern or SameSite cookie attribute |
| Rate limiting | Per-IP and per-user limits on all authentication and write endpoints |
| Sensitive data in logs | Payment reference numbers, emails, and phone numbers must be masked in logs |
| Dependency scanning | All third-party dependencies scanned for known vulnerabilities in CI pipeline |
| CORS policy | Whitelist of allowed origins; no wildcard in production |

---

## 5.6 Observability Requirements

| Area | Requirement |
|---|---|
| Structured logging | All log entries in JSON format with: timestamp, level, service, traceId, userId (masked), event |
| Request tracing | Every HTTP request assigned a traceId; traceId propagated through all service calls |
| Error tracking | All unhandled exceptions reported to error tracking service (Sentry or equivalent) with full context |
| Metrics collection | HTTP request rate, error rate, response time percentiles, JVM heap, DB connection pool utilization |
| Health endpoints | /actuator/health (Spring Boot) returning component-level health |
| Alerting | Alert on: error rate > 1%, P95 latency > 1 second for 3 consecutive minutes, DB connection pool > 80% utilization |
| Audit log | Separate, append-only audit log for security-relevant events |

---

## 5.7 Concurrency Requirements

| Scenario | Requirement |
|---|---|
| Two admins updating the same order simultaneously | Optimistic locking with version field; second write receives 409 with current state |
| Client approving a quote while admin is editing it | Quote locked for editing while client approval is in progress |
| Multiple simultaneous inquiry submissions | Each processed independently; no shared state between submissions |
| Concurrent image uploads | Each upload is independent; no upload queue contention |
| Session token refresh | Idempotent; concurrent refresh requests return same new token |

---

# PART 6 — REALTIME & STATE MANAGEMENT REQUIREMENTS

---

## 6.1 Synchronization Expectations

**Phase 1 (Polling-based):**
- Admin dashboard refreshes every 60 seconds via API polling
- Client tracking page refreshes every 120 seconds
- Notification delivery via email (async, up to 2-minute delay acceptable)

**Phase 2 (WebSocket-based):**
- Admin receives real-time push for: new inquiries, quote approvals, payment confirmations
- Client receives real-time push for: order state changes, new admin messages

---

## 6.2 WebSocket / Event Behavior (Phase 2 Specification)

**Connection Management:**
- WebSocket connection established after authentication (token passed in connection handshake)
- Connection is per-user (one connection per browser tab maximum)
- Server sends heartbeat ping every 30 seconds; client must pong within 10 seconds or connection is closed
- On authentication token expiry: server sends TOKEN_EXPIRED event; client must reconnect with refreshed token

**Event Schema:**

```json
{
  "eventId": "uuid-v4",
  "eventType": "ORDER_STATUS_CHANGED",
  "targetUserId": "user-id",
  "payload": {
    "orderId": "ORD-2025-000001",
    "previousState": "IN_PRODUCTION",
    "newState": "READY_FOR_DELIVERY",
    "updatedAt": "2025-01-15T10:30:00Z",
    "message": "Your furniture is ready for delivery!"
  },
  "timestamp": "2025-01-15T10:30:01Z"
}
```

**Event Types:**
- `INQUIRY_RECEIVED` — Admin channel only
- `QUOTE_APPROVED` — Admin channel only
- `ORDER_STATUS_CHANGED` — Client and Admin channels
- `PAYMENT_CONFIRMED` — Client and Admin channels
- `NEW_MESSAGE` — Both channels (Phase 2 messaging feature)
- `DELIVERY_SCHEDULED` — Client channel
- `SYSTEM_ALERT` — Admin channel only

---

## 6.3 Rollback and Reconciliation Rules

**Scenario: Order state updated via WebSocket but client refresh shows old state**
- Client-side state is always treated as potentially stale
- On page focus or reconnect: client fetches authoritative state from REST API
- WebSocket events update UI optimistically; if subsequent REST fetch disagrees, REST wins

**Scenario: Admin marks order as DELIVERED but network drops before client receives event**
- Client will see DELIVERED state on next page load or polling cycle
- No manual reconciliation required — REST API is the source of truth

**Scenario: Event delivered to WebSocket but database write failed**
- Events are only emitted AFTER the database transaction commits
- Pre-commit event emission is explicitly prohibited
- Event emission failure is logged but does not roll back the database transaction (eventual delivery via polling)

---

## 6.4 Offline / Reconnect Handling

**Client Behavior:**
- If WebSocket connection drops: Display "Reconnecting..." indicator subtly in UI
- Automatic reconnect with exponential backoff: 1s, 2s, 4s, 8s, 30s, then every 60s
- On reconnect: Fetch full state from REST API to reconcile any missed events during disconnection
- Missed events are NOT replayed via WebSocket — REST fetch is the recovery mechanism

**Admin Behavior:**
- Same reconnect strategy
- On reconnect: Admin dashboard triggers a full refresh of all panels
- Critical: Any order state changes made during admin disconnection are visible on reconnect via REST fetch

**Offline Constraint:**
- No offline write capability is supported in Phase 1 or Phase 2
- All order management actions require active connectivity
- Client tracking page can display last-known state with "Last updated X minutes ago" indicator

---

# PART 7 — UX & WORKFLOW REQUIREMENTS

---

## 7.1 Critical Workflow: Inquiry to Order

```
Step 1: Client browses catalog
    UX requirement: 
    - Catalog loads without authentication
    - Filter controls are immediately operable without page reload
    - Each product card has explicit "Order" and "Inquire" CTA buttons

Step 2: Client decides on custom inquiry
    UX requirement:
    - Inquiry form is multi-step (not one long form)
    - Step 1: What you need (type, dimensions, notes)
    - Step 2: Preferences (wood, finish, budget, timeline)
    - Step 3: Contact preference and image upload
    - Progress indicator visible throughout
    - Form state persisted in sessionStorage (not lost on accidental navigation)
    - Unauthenticated users who reach Step 3 are prompted to sign in/register 
      WITHOUT losing their form data

Step 3: Inquiry submitted
    UX requirement:
    - Immediate success screen with reference number (prominent)
    - Clear statement of what happens next and expected response time
    - Option to WhatsApp the business directly (with pre-filled context message)
    - Redirect to client's inquiry list after 5 seconds or on button click

Step 4: Client receives quotation
    UX requirement:
    - Email contains a direct deep link to the quotation in the platform
    - Quotation page shows all terms clearly before the approval button
    - Approval button requires explicit confirmation modal ("By approving, you agree to...")
    - Revision request button equally prominent (no dark pattern to hide it)

Step 5: Client approves, order created
    UX requirement:
    - Immediate transition to order page with advance payment instructions prominently displayed
    - Payment instructions must include: amount, payment method options, reference to include
    - Clear statement that production does not begin until payment is confirmed by the workshop
```

---

## 7.2 Operational Ergonomics for Admin

**Principle:** Admin interfaces prioritize speed of action over visual richness. An admin managing 20 orders a day needs to make decisions in seconds, not navigate deep menus.

**Requirements:**
- Every order in the dashboard list has inline quick-action controls (update status, add note) without requiring full order page navigation
- Keyboard shortcuts for common actions (configurable)
- Admin notes can be added to any order from anywhere in the dashboard in under 3 clicks
- Bulk status update is available for production milestone updates (select multiple orders, update all to same milestone)
- Search is always accessible (global search bar) and searches across orders, inquiries, and clients simultaneously
- Admin dashboard must work acceptably on a tablet (admin may be in the workshop)

---

## 7.3 Error Recovery UX

| Error Scenario | UX Response |
|---|---|
| Form submission fails due to network error | Preserve all entered data; show retry button; do not reset form |
| Image upload fails mid-upload | Show which specific file failed; allow re-upload of that file only; do not require re-entry of all other form data |
| Session expires mid-workflow | Show "Session expired" modal with "Sign in again" → after sign-in, return user to exactly where they were |
| Admin state transition fails (invalid transition) | Show which transition was attempted and why it failed; show list of valid next transitions |
| Payment recording fails | Show error with details; do not show payment as confirmed; allow immediate retry |
| WhatsApp deep link fails to open | Fallback: Show phone number with copy button |

---

## 7.4 Loading, Empty, and Error States

**Every data-displaying component must have all three states defined before development begins:**

| Component | Loading State | Empty State | Error State |
|---|---|---|---|
| Product catalog | Skeleton cards (12 placeholders) | "No products match your filters. [Clear filters]" | "Unable to load products. [Retry]" |
| Admin order list | Skeleton rows (5 placeholders) | "No active orders. [View inquiry queue]" | "Dashboard data unavailable. [Refresh]" |
| Client order history | Skeleton rows (3 placeholders) | "You have no orders yet. [Browse catalog] or [Submit inquiry]" | "Unable to load orders. [Retry]" |
| Inquiry queue | Skeleton cards | "All inquiries handled. No pending items." | "Inquiry queue temporarily unavailable." |
| Payment history | Skeleton rows | "No payment records for this order yet." | "Payment history unavailable." |

**Global Error States:**
- 404: Custom page with navigation back to catalog and home
- 500: Custom page with apology, no technical details exposed, reference ID for support
- 503: Custom maintenance page with estimated return time if known
- Network offline: Toast notification, UI goes into "read-only, potentially stale" mode

---

# PART 8 — DATA REQUIREMENTS

---

## 8.1 Critical Entities

```
USER
├── id (UUID)
├── email (unique, indexed)
├── password_hash (nullable — null for OAuth-only accounts)
├── full_name
├── phone_number (E.164 format)
├── phone_verified (boolean)
├── email_verified (boolean)
├── role (ENUM: SUPER_ADMIN, ADMIN, SHOP_MANAGER, DELIVERY, CLIENT)
├── oauth_provider (nullable: GOOGLE)
├── oauth_provider_id (nullable)
├── is_active (boolean)
├── mfa_secret (nullable, encrypted at rest)
├── created_at
├── updated_at
└── last_login_at

PRODUCT
├── id (UUID)
├── slug (unique, indexed)
├── name
├── description (TEXT)
├── category_id (FK)
├── base_price (DECIMAL 10,2)
├── lead_time_days (INTEGER)
├── is_featured (boolean)
├── status (ENUM: DRAFT, ACTIVE, ARCHIVED)
├── created_by (FK → USER)
├── created_at
├── updated_at
└── version (optimistic locking)

PRODUCT_IMAGE
├── id (UUID)
├── product_id (FK)
├── cloudinary_public_id
├── cloudinary_url
├── display_order (INTEGER)
├── is_primary (boolean)
└── created_at

INQUIRY
├── id (UUID)
├── reference_number (unique: INQ-YYYY-NNNNNN)
├── client_id (FK → USER)
├── assigned_admin_id (FK → USER, nullable)
├── furniture_type_description (TEXT)
├── dimensions_json (JSON: {length, width, height, unit})
├── preferred_wood_type
├── preferred_finish
├── budget_min (DECIMAL)
├── budget_max (DECIMAL)
├── desired_delivery_date (DATE, nullable)
├── additional_notes (TEXT)
├── preferred_contact_method (ENUM)
├── status (ENUM: SUBMITTED, ACKNOWLEDGED, INFO_REQUESTED, QUOTE_PENDING, REJECTED, CONVERTED)
├── rejection_reason_category (nullable)
├── rejection_message (nullable)
├── created_at
├── updated_at
└── version

QUOTATION
├── id (UUID)
├── reference_number (unique: QT-YYYY-NNNNNN)
├── inquiry_id (FK)
├── client_id (FK → USER)
├── created_by_admin_id (FK → USER)
├── version_number (INTEGER)
├── status (ENUM: DRAFT, SENT, APPROVED, REVISION_REQUESTED, SUPERSEDED, EXPIRED)
├── material_spec_json (JSON: {wood_type, finish, dimensions})
├── line_items_json (JSON array)
├── total_amount (DECIMAL 10,2)
├── advance_percentage (INTEGER)
├── milestone2_percentage (INTEGER, nullable)
├── milestone2_trigger_state (ENUM, nullable)
├── balance_percentage (INTEGER)
├── lead_time_days (INTEGER)
├── valid_until (DATE)
├── admin_notes_to_client (TEXT)
├── internal_notes (TEXT)
├── pdf_cloudinary_url (nullable)
├── approved_at (nullable)
├── created_at
├── updated_at
└── version

ORDER
├── id (UUID)
├── reference_number (unique: ORD-YYYY-NNNNNN)
├── client_id (FK → USER)
├── quotation_id (FK, nullable for standard orders)
├── product_id (FK, nullable for custom orders)
├── order_type (ENUM: STANDARD, CUSTOM)
├── status (ENUM: full state machine)
├── hold_reason (nullable)
├── hold_estimated_resolution (DATE, nullable)
├── specification_snapshot_json (JSON — frozen at order creation)
├── total_amount (DECIMAL 10,2)
├── delivery_date (DATE, nullable)
├── delivery_address_json (JSON)
├── assigned_delivery_staff_id (FK → USER, nullable)
├── cancelled_at (nullable)
├── cancellation_reason (nullable)
├── cancellation_authority_id (FK → USER, nullable)
├── delivered_at (nullable)
├── warranty_expires_at (nullable)
├── created_at
├── updated_at
└── version

PAYMENT_MILESTONE
├── id (UUID)
├── order_id (FK)
├── milestone_number (INTEGER: 1, 2, 3)
├── milestone_label (e.g., "Advance", "Mid-production", "Balance")
├── amount_due (DECIMAL 10,2)
├── trigger_state (ENUM — order state that makes this due)
├── status (ENUM: PENDING, CONFIRMED, VOIDED, WAIVED)
├── payment_method (ENUM: CASH, BANK_TRANSFER, UPI, OTHER, nullable)
├── payment_reference (nullable — bank reference number)
├── amount_received (DECIMAL 10,2, nullable)
├── confirmed_by_admin_id (FK → USER, nullable)
├── confirmed_at (nullable)
├── voided_by_admin_id (FK → USER, nullable)
├── voided_at (nullable)
├── void_reason (nullable)
└── created_at

ORDER_STATUS_HISTORY (Audit table)
├── id (UUID)
├── order_id (FK)
├── previous_status
├── new_status
├── changed_by_user_id (FK → USER)
├── changed_by_role
├── note (nullable)
└── changed_at

AUDIT_LOG (Append-only, separate schema)
├── id (UUID)
├── event_type
├── actor_user_id
├── actor_role
├── target_entity_type
├── target_entity_id
├── previous_value_json
├── new_value_json
├── ip_address (hashed)
├── user_agent
└── occurred_at
```

---

## 8.2 Audit Requirements

**Events that MUST be audited (non-negotiable):**

| Event | Data Captured |
|---|---|
| User login (success and failure) | Actor, IP (hashed), timestamp, success/failure |
| User account created/deactivated | Actor, target user, role assigned |
| Order status change | Previous state, new state, actor, timestamp, note |
| Quotation created, sent, approved, superseded | Version number, amounts, actor |
| Payment milestone confirmed or voided | Amount, method, reference, actor, timestamp |
| Product price change | Previous price, new price, product ID, actor |
| Order cancellation | Reason, authority level, refund amount |
| Admin privilege grant/revoke | Actor, target, previous role, new role |
| System settings change | Setting key, previous value, new value, actor |
| Failed authentication attempts > 3 | IP (hashed), account targeted, timestamps |

**Audit Log Technical Requirements:**
- Stored in a separate database schema or table with no UPDATE or DELETE permissions granted to application service account
- Application can only INSERT into audit log
- Audit log queries available to Super Admin only via admin interface
- Audit log data retained for minimum 5 years
- Audit log is not part of regular application backup — it has its own independent backup schedule

---

## 8.3 Data Retention Requirements

| Data Type | Retention Period | Post-Retention Action |
|---|---|---|
| Active order records | Indefinite while order is active | Archive after CLOSED + 3 years |
| Closed order records | 7 years (financial compliance) | Soft archive, not delete |
| Cancelled orders | 3 years | Soft archive |
| Inquiry records (converted) | 7 years | Linked to order, archived together |
| Inquiry records (rejected) | 1 year | Soft delete |
| Audit logs | 5 years minimum | Compressed archive |
| User accounts (active) | Indefinite | — |
| User accounts (self-deleted) | 30-day grace period | Anonymize PII, retain order records |
| Product images (archived products) | 2 years after archive | Delete from Cloudinary |
| Inquiry reference images | 1 year after inquiry closure | Delete from Cloudinary |
| Notification email logs | 90 days | Purge |

---

## 8.4 Analytics Requirements (Phase 3)

**Business Metrics to be tracked:**

| Metric | Calculation |
|---|---|
| Inquiry conversion rate | (Orders created / Inquiries received) × 100 |
| Average order value | Total revenue / Number of delivered orders |
| Average lead time actual vs estimated | Mean of (actual_delivery_date - order_created_date) vs quoted lead time |
| Revenue by product category | Sum of order totals grouped by product category |
| Revenue by time period | Weekly/monthly/quarterly totals |
| Inquiry response time | Mean of (acknowledged_at - submitted_at) |
| Most inquired furniture types | Count of inquiries grouped by furniture type description (NLP in Phase 4) |
| Payment delay rate | % of milestone payments confirmed more than 7 days after due trigger |

---

# PART 9 — SECURITY REQUIREMENTS

---

## 9.1 Role-Based Access Control (RBAC)

**Implementation Requirements:**
- RBAC enforced at the API service layer using Spring Security method-level annotations
- RBAC is NOT enforced only at the UI level — hiding a button is not security
- Every API endpoint has an explicit permission requirement documented and enforced
- Role checks use the JWT claims — roles are embedded in the token at issue time
- Role changes take effect at the next token refresh (max 15-minute lag) or immediately on token invalidation for critical changes (e.g., account deactivation)
- No hardcoded role logic in frontend — frontend fetches user capabilities from a /me endpoint and renders accordingly

---

## 9.2 Session Management

**Requirements:**
- Access token: 15-minute TTL, signed with RS256
- Refresh token: 7-day TTL, stored in HttpOnly, Secure, SameSite=Strict cookie
- Access token: Stored in memory (JavaScript variable), not localStorage
- Token rotation: Every refresh operation issues a new refresh token and invalidates the old one
- Concurrent session limit: 3 sessions per user (configurable)
- Force logout: Super Admin can invalidate all sessions for any user account
- Session table: Maintains record of all active refresh tokens with device hint and last-used timestamp

**Session Invalidation Triggers:**
- Password change → All sessions except current invalidated
- Role change → All sessions invalidated, re-authentication required
- Account deactivation → All sessions invalidated within 60 seconds
- Manual logout → Current device's refresh token invalidated
- Security breach detected → All sessions for user invalidated immediately

---

## 9.3 Abuse Prevention

| Attack Vector | Countermeasure |
|---|---|
| Credential stuffing on login | Rate limit: 5 failed attempts per account per 15 minutes; CAPTCHA after 3 failures |
| Registration spam | CAPTCHA on registration; email verification required before any action |
| Inquiry spam | Max 3 open inquiries per verified account; CAPTCHA on form submission |
| API scraping of catalog | Rate limit on public endpoints: 100 requests/minute per IP |
| Image upload abuse | File size limit (10MB), file type validation (magic bytes, not just extension), virus scan in background |
| Brute force on password reset | Rate limit: 3 reset requests per email per hour; reset tokens expire in 30 minutes |
| JWT forging | RS256 with public key verification; algorithm field in JWT must match server expectation (reject none algorithm) |
| Cloudinary direct upload bypass | All uploads go through backend; Cloudinary unsigned uploads disabled |
| IDOR on order access | Server-side ownership verification on every order/inquiry/quotation request — not just access token presence |
| Path traversal | No filesystem paths derived from user input |

---

## 9.4 Audit Logging (Security Events)

**In addition to the operational audit log, a security event log must capture:**

- All authentication events (success, failure, method used)
- All authorization failures (403 responses with context)
- All rate limit triggers (IP, endpoint, count)
- All admin privilege operations
- All data export operations
- All Super Admin operations on financial records
- All password reset flows
- All account deactivation/reactivation events

---

## 9.5 API Security

| Requirement | Implementation |
|---|---|
| Authentication | Bearer token in Authorization header for all authenticated endpoints |
| Input validation | Server-side validation on all inputs using Bean Validation (Jakarta Validation) |
| Output sanitization | All user-generated content HTML-escaped before rendering |
| CORS | Strict whitelist: only frontend domain(s) allowed; no wildcard |
| Security headers | HSTS, X-Content-Type-Options, X-Frame-Options: DENY, Referrer-Policy, CSP |
| Dependency security | OWASP Dependency-Check in CI pipeline; build fails on CRITICAL CVEs |
| Error responses | Never expose stack traces or internal error details in API responses |
| Logging | Sensitive data (passwords, tokens, full card numbers) never written to logs |
| HTTPS enforcement | HSTS preloading; redirect all HTTP to HTTPS at infrastructure level |

---

# PART 10 — RISKS & UNKNOWNS

---

## 10.1 Technical Uncertainty

| Uncertainty | Nature | Mitigation |
|---|---|---|
| AR model delivery across devices | iOS requires USDZ, Android requires GLB; web AR support is fragmented across browsers | Defer to Phase 3; evaluate WebXR support maturity at that point |
| WhatsApp Business API approval | Meta's approval process is unpredictable; small businesses are sometimes rejected | Build deep-link integration as permanent fallback; do not make production timelines dependent on API approval |
| MySQL full-text search adequacy | May not be sufficient for catalog search quality at scale | Acceptable at MVP; evaluate Elasticsearch migration at Phase 3 |
| PDF generation reliability | Server-side PDF generation (iText/Apache PDFBox) can be memory-intensive at scale | Queue PDF generation as async job; never block user action on PDF |
| Cloudinary costs at scale | High-resolution images and AR models have unpredictable bandwidth costs | Implement image optimization pipeline; set Cloudinary usage alerts |

---

## 10.2 Operational Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Business owner does not adopt the platform | Medium | Critical | Prioritize admin UX; ensure the platform saves measurable time from day 1 |
| Clients prefer to stay on WhatsApp | High | High | Do not fight this — build WhatsApp as a first-class channel, not a competitor |
| Admin forgets to update order status | High | High | SLA alerts, automated reminders, friction-free quick-update controls |
| Production data loss | Low | Critical | Daily automated backups; point-in-time recovery; backup restoration tested quarterly |
| Delivery dispute with no proof | Medium | High | Delivery photo upload mandatory in Phase 2; document the requirement from Phase 1 |
| Staff account compromised | Medium | High | MFA for admin accounts; session monitoring; anomalous login alerts |

---

## 10.3 Scaling Concerns

| Concern | Threshold | Architectural Response |
|---|---|---|
| Database connection pool exhaustion | > 80% utilization consistently | Connection pooling tuning; read replica for dashboard queries |
| Cloudinary API rate limits | High upload volume during peak | Upload queue with rate-aware throttling |
| Email delivery reputation | High volume of client notifications | Dedicated sending IP; bounce and complaint rate monitoring |
| Session storage at scale | > 10,000 concurrent sessions | Move refresh token storage to Redis from relational DB |
| File storage costs | > 10GB stored media | Implement lifecycle policies; compress and archive old media |

---

## 10.4 Third-Party Dependency Risks

| Dependency | Risk | Contingency |
|---|---|---|
| Cloudinary | Pricing change, service outage, data loss | Ensure media URLs are stored (not regenerated); have migration path to S3 |
| Google OAuth | API changes, outage | Password auth always available as fallback; never make OAuth the only auth method |
| Email delivery service | Deliverability issues, service changes | Maintain secondary SMTP provider configuration |
| WhatsApp Business API | Meta policy changes, account suspension | Deep-link fallback always functional |
| MySQL (managed DB) | Provider outage | Multi-AZ deployment; point-in-time recovery configured |

---

# PART 11 — SUCCESS METRICS

---

## 11.1 Business KPIs

| KPI | Baseline (Pre-Furnix) | Target (3 months post-launch) | Measurement |
|---|---|---|---|
| Inquiry response time (avg) | Unknown / inconsistent | < 4 hours during business hours | System timestamp comparison |
| Lost inquiries per month | Unknown (WhatsApp overflow) | 0 (all inquiries captured) | Inquiry system completeness |
| Admin time on status communication | ~2 hours/day | < 45 minutes/day | Admin self-reported + inquiry volume |
| Payment collection cycle | Ad-hoc, 1–5 day delays | < 48 hours per milestone | Payment milestone timestamp |
| Delivery dispute rate | Unknown | < 2% of delivered orders | Dispute records vs delivery records |
| Client repeat order rate | Unknown | > 30% within 12 months | Order history analysis |

---

## 11.2 Technical KPIs

| KPI | Target |
|---|---|
| API error rate (5xx) | < 0.1% of all requests |
| API P95 response time | < 300ms for read, < 500ms for write |
| Deployment success rate | > 95% of deployments without rollback |
| Mean time to recovery (MTTR) | < 30 minutes for P1 incidents |
| Database query P95 | < 50ms |
| Test coverage | > 80% on service layer |
| Security vulnerability (CRITICAL) | 0 in production at any time |

---

## 11.3 User Engagement Metrics

| Metric | Target |
|---|---|
| Client login frequency (active order holders) | > 2 visits per week while order is active |
| % of clients who track order vs call admin | > 70% use tracking (measured by support call reduction) |
| Inquiry form completion rate | > 60% of started forms submitted |
| Quote approval time (after quote sent) | < 72 hours median |
| Admin dashboard daily active usage | 100% of working days by admin |

---

## 11.4 Reliability Metrics

| Metric | Target |
|---|---|
| Monthly uptime | > 99.5% |
| Failed notification delivery rate | < 0.5% |
| Data backup success rate | 100% of scheduled backups |
| Audit log completeness | 100% of defined auditable events captured |
| Zero payment state inconsistencies | 0 orders where payment state does not match payment records |
| Zero unauthorized data access | 0 confirmed cases of IDOR or cross-account data exposure |

---

*This PRD represents the complete product specification for Furnix Phase 1 through Phase 3. All functional requirements must be validated against the domain analysis before engineering design begins. Any requirement not covered here that surfaces during development must be brought back to the product function for formal specification before implementation.*

---

**Document End — Version 1.0**