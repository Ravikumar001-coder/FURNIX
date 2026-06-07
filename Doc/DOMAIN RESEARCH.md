# Furnix — Deep Domain Research & Pre-Architecture Analysis

---

## 1. Industry & Domain Analysis

### How This Industry Currently Operates

The artisanal woodworking and bespoke furniture industry operates fundamentally differently from mass-market retail. It is a **craft-driven, relationship-dependent, and time-intensive** business model where the production cycle is measured in weeks or months, not hours.

In reality, most small-to-medium woodworking businesses today operate through:

- **Instagram/Facebook as their primary storefront** — product photos drive inquiries
- **WhatsApp as their primary CRM** — every negotiation, revision, approval, and payment reminder happens in chat threads
- **Physical notebooks or basic spreadsheets** as their order management system
- **Cash or UPI transfers** as their payment processing
- **Word-of-mouth and repeat clients** as their primary acquisition channel

The transition from this informal model to a structured digital platform is the exact problem Furnix is trying to solve. This means the platform must respect and digitize existing workflows rather than force entirely new behaviors.

---

### Operational Workflows Used in Real Organizations

A typical bespoke furniture business follows this operational chain:

```
Client Inquiry
      ↓
Initial Consultation (dimensions, material preferences, budget)
      ↓
Design/Sketch Proposal (sometimes physical, sometimes photos)
      ↓
Quotation Generation
      ↓
Client Approval / Negotiation Loop
      ↓
Advance Payment (typically 40–50% upfront)
      ↓
Material Procurement
      ↓
Production Phase (weeks to months)
      ↓
Quality Check / Client Preview (sometimes in-person)
      ↓
Final Payment
      ↓
Delivery & Installation
      ↓
Post-delivery Support / Warranty Claims
```

Each of these stages can stall, reverse, or branch. A client can reject a proposal at Stage 3 and restart. Material procurement can fail and delay production. Final payment can be disputed after delivery. **These non-linear paths are what most digital platforms fail to model.**

---

### Standard Terminology and Domain Language

Understanding the domain language is critical before designing data models or UI flows:

| Term | Definition |
|---|---|
| **Bespoke / Custom Order** | Furniture made entirely to client specification — no catalog equivalent |
| **Standard Order** | A catalog item ordered as-is with no modification |
| **Semi-custom Order** | A catalog item ordered with specific modifications (size, finish, wood type) |
| **Bill of Materials (BOM)** | The itemized list of raw materials needed for a specific piece |
| **Lead Time** | The total time from order confirmation to delivery |
| **Advance / Token** | Partial upfront payment to begin production |
| **Work in Progress (WIP)** | Items currently in the production phase |
| **Finishing** | Surface treatments — polish, lacquer, stain, paint |
| **Wood Species** | The type of wood — Teak, Sheesham, Walnut, Oak, Pine — each has different cost and availability |
| **Joinery** | The method of connecting wood pieces — dovetail, mortise and tenon, etc. |
| **Grain Direction** | Aesthetic property of wood that affects design decisions |
| **Snagging** | Identifying and fixing defects before final delivery |
| **Installation** | Physical assembly at the client's location (separate from manufacturing) |
| **Warranty Period** | Post-delivery support window, typically 6–24 months |

---

### Hidden Operational Complexities Beginners Usually Miss

These are the areas that appear simple on the surface but create significant system complexity:

**1. Orders Are Not Transactions — They Are Processes**
A furniture order is not a simple "add to cart → pay → ship" flow. It is a stateful, multi-party, multi-week negotiation and production process. Modeling it as a simple e-commerce order is the most common beginner mistake.

**2. Pricing Is Not Deterministic**
Unlike a SaaS product with fixed prices, furniture pricing depends on:
- Current wood market prices (fluctuate weekly)
- Complexity of joinery requested
- Finish type and number of coats
- Delivery distance and installation complexity
- Current shop workload (rush orders cost more)

A price shown today may not be valid next month. The system must handle **quote versioning**.

**3. Partial Payments Are the Norm, Not the Exception**
Most artisanal orders follow a multi-stage payment structure:
- 40–50% advance to begin work
- 25–30% at a production milestone
- Final 20–25% on delivery

This means payment tracking is not a boolean — it is a ledger with multiple entries against a single order.

**4. Material Dependency Creates Cascading Delays**
If a specific wood species is unavailable, the entire order stalls. The client must be consulted to approve a substitute. This creates a **workflow branch** that most systems do not account for.

**5. Client Communication Is Part of the Product**
In artisanal furniture, clients expect to be kept informed. Silence equals anxiety. The communication log between the carpenter and client is not a support feature — it is a core operational requirement. Missing this creates churn.

**6. Design Revisions Have No Clear Endpoint**
Bespoke orders can go through unlimited revision cycles before the client approves the design. Without a system that formally closes the revision phase and captures approval, disputes arise later about what was agreed upon.

**7. Workshop Capacity Is the True Bottleneck**
The number of concurrent orders is limited not by the website's ability to accept orders but by the physical capacity of the workshop. A platform that accepts unlimited orders without capacity management will cause the business to collapse under its own success.

**8. Delivery Is Not Shipping**
Furniture is not put in a box and handed to a courier. Delivery involves:
- Scheduling a delivery date that works for the client
- Transportation with padding and protection
- Physical installation at the destination
- Sign-off from the client post-installation

This is a **scheduled service event**, not a shipment tracking event.

---

## 2. User & Stakeholder Analysis

### Complete Stakeholder Map

```
                    ┌─────────────────┐
                    │   Business Owner │  ← Primary Stakeholder
                    │   (Master Admin) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼────┐  ┌──────▼─────┐  ┌───▼──────┐
        │  Shop    │  │  Sales /   │  │Delivery  │
        │  Manager │  │  Designer  │  │  Staff   │
        └──────────┘  └────────────┘  └──────────┘
                             │
              ┌──────────────┼──────────────┐
              │                             │
        ┌─────▼────┐                  ┌─────▼────┐
        │  Retail  │                  │ Interior │
        │  Client  │                  │ Designer │
        └──────────┘                  └──────────┘
                                           │
                                     ┌─────▼────┐
                                     │ End      │
                                     │ Client   │
                                     └──────────┘
```

---

### Role-by-Role Breakdown

#### Role 1: Business Owner (Master Admin)
**Responsibilities:**
- Approve or reject custom order inquiries
- Set pricing and quotations
- Monitor workshop capacity and production schedule
- Manage staff access and permissions
- View financial overview (advances received, balance due, total revenue)
- Control website content and product catalog

**Goals:**
- Reduce time spent on WhatsApp managing order status updates
- Never miss a follow-up on a pending inquiry
- Understand which products are most profitable
- Avoid over-committing the workshop's capacity

**Frustrations:**
- Client calls asking "is my order ready?" when there's no tracking system
- Losing track of which orders have received advance payment
- No visibility into which inquiry is most likely to convert
- Spending hours on quotation documents manually

**Workflows:**
```
Receives Inquiry → Reviews Client Requirements → Generates Quote 
→ Sends Quote → Awaits Approval → Marks Advance Received 
→ Schedules Production → Updates Milestones → Schedules Delivery
```

**Power Level:** Superuser — full read/write on all system entities

---

#### Role 2: Shop Manager / Production Lead
**Responsibilities:**
- Track which orders are in production
- Update production milestones
- Flag material shortages
- Coordinate with delivery staff for scheduling

**Goals:**
- Know what to build next based on priority and deadlines
- Flag issues early before they become delivery delays
- Not deal with client communications directly

**Frustrations:**
- Receiving order changes mid-production with no formal record
- No clear production queue or priority system
- Manual tracking of which materials have arrived

**Workflows:**
```
Views Production Queue → Starts Work on Order 
→ Updates Status Milestones → Flags Issues 
→ Marks Ready for Delivery
```

**Power Level:** Operational user — write access limited to production entities

---

#### Role 3: Retail Client (End Customer)
**Responsibilities:**
- Browse catalog or submit custom inquiry
- Review and approve quotations
- Make staged payments
- Track order progress
- Confirm delivery

**Goals:**
- Feel confident their order is being handled professionally
- Have visibility into production progress without calling
- Easily communicate design changes with documented history

**Frustrations:**
- No feedback after submitting an inquiry
- Uncertainty about timeline and delivery date
- No record of what was agreed upon in design discussions
- Having to chase the business for updates

**Workflows:**
```
Browses Catalog → Submits Custom Inquiry or Places Standard Order 
→ Receives Quote → Approves Quote → Pays Advance 
→ Tracks Progress → Approves Final → Pays Balance → Receives Delivery
```

**Power Level:** Restricted user — read/write only on their own orders and inquiries

---

#### Role 4: Interior Designer (B2B Client)
**Responsibilities:**
- Source custom furniture for multiple end-client projects simultaneously
- Manage multiple concurrent orders across different projects
- Require formal documentation (quotes, invoices, delivery notes) for their clients

**Goals:**
- Manage multiple Furnix orders in one dashboard
- Get preferential pricing for volume orders
- Receive formal invoices for accounting purposes

**Frustrations:**
- Being treated the same as a one-time retail client
- Having no consolidated view of all their active orders
- Lack of bulk inquiry capability

**Power Level:** Elevated customer — needs a differentiated account type that retail client accounts do not have

> **Beginner Mistake:** Most platforms ignore the B2B interior designer persona entirely and model only direct retail clients. This is a significant missed revenue opportunity since interior designers represent high-volume, high-value, repeat business.

---

#### Role 5: Delivery Staff
**Responsibilities:**
- Execute scheduled deliveries
- Mark delivery complete with proof (photo, signature)
- Report installation issues

**Goals:**
- Know exactly where to go and what to deliver
- Record delivery confirmation without needing office staff involved

**Workflows:**
```
Views Delivery Schedule → Picks Up Order → Travels to Location 
→ Installs → Captures Proof → Marks Delivered
```

**Power Level:** Minimal access — delivery-specific read/write only

---

### Power User vs Casual User vs Admin Matrix

| Dimension | Casual Client | Power Client (B2B) | Shop Manager | Business Owner |
|---|---|---|---|---|
| Session Frequency | Low (inquiry + tracking) | Medium (weekly) | Daily | Daily |
| Feature Depth | Surface level | Moderate | Deep (production) | Full system |
| Data Sensitivity Access | Own orders only | Own portfolio | Production data | Everything |
| Communication Volume | Sporadic | Regular | Internal | Both |
| Decision Authority | None (approve only) | Order-level | Production-level | Business-level |

---

## 3. Competitor & Market Analysis

### Major Competitors

#### Competitor 1: Etsy (Custom Order Flow)
**Strengths:**
- Massive discovery engine and marketplace traffic
- Built-in buyer trust and payment protection
- Simple custom order request system via direct messaging
- Global reach

**Weaknesses:**
- No production workflow management — the seller is completely on their own after the order
- No AR or advanced product visualization
- Platform takes 6.5% transaction fee plus listing fees
- No admin dashboard for business management — only seller stats
- Generic — not designed for high-value furniture businesses specifically

**UX Patterns:**
- Listing-first discovery (photo → price → message seller)
- Conversation happens inside Etsy messaging
- No formal quotation system — pricing is ad-hoc

**Gap:** Etsy gets the discovery right but completely abandons the seller after the inquiry. There is no structured order management, no production tracking, and no payment milestone system.

---

#### Competitor 2: Houzz Pro
**Strengths:**
- Specifically designed for home design and renovation professionals
- Has project management, client communication, and invoicing
- Integrates with material suppliers in some markets
- Strong B2B focus for interior designers and contractors

**Weaknesses:**
- Subscription-based and expensive for small artisans
- Not designed for direct-to-consumer catalog browsing
- No AR product visualization
- Complex UI that assumes a high level of digital literacy

**Gap:** Houzz Pro is built for interior designers and contractors, not for the furniture maker themselves. It manages the project side but not the craft production side.

---

#### Competitor 3: Shopify with Custom App Plugins
**Strengths:**
- Extremely flexible with plugins
- Strong e-commerce infrastructure
- Handles payments, shipping, and catalog well

**Weaknesses:**
- Standard e-commerce flow (add to cart → pay → ship) does not map to bespoke furniture workflows
- Custom order systems require expensive plugin combinations
- No native production workflow management
- Recurring subscription cost plus plugin costs add up significantly
- Requires technical expertise to configure properly

**Gap:** Shopify treats all products as inventory items. Bespoke furniture has no inventory — it is created on demand. Forcing bespoke orders into a Shopify product model creates fundamental operational mismatches.

---

#### Competitor 4: Custopolis / OrderDesk (Niche Custom Order Platforms)
**Strengths:**
- Designed for made-to-order workflows
- Better quote management than generic e-commerce

**Weaknesses:**
- Poor UI/UX quality
- No AR or visual experience
- Limited to Western markets and languages
- No WhatsApp integration (critical for South Asian markets)
- No mobile-first design

**Gap:** The niche players understand the workflow but have not invested in the quality UX that premium artisanal branding demands.

---

### Market Opportunity Summary

```
High UX Quality
        │
        │    ◄── Furnix Target Position ──►
        │              ★
        │
Etsy ───┼─────────────────────────────────
        │                          Houzz Pro
        │
        │  Custopolis
Low UX ─┴────────────────────────────────────
     Generic Workflow          Bespoke Workflow
```

**The clear gap is:** A platform with premium UX quality AND proper bespoke order workflow management, designed specifically for artisanal furniture makers in emerging markets with WhatsApp as a first-class communication channel.

---

## 4. Operational Workflow Mapping

### Master Workflow: From Inquiry to Delivery

```
Phase 1: Discovery
─────────────────
Client visits catalog 
    → Views products (AR optional)
    → Decides between Standard Order or Custom Inquiry

Phase 2A: Standard Order Path
──────────────────────────────
Client selects catalog item
    → Selects specifications if applicable (size, finish)
    → Reviews price
    → Places order
    → Pays advance online OR receives payment link
    → Order enters production queue

Phase 2B: Custom Inquiry Path
──────────────────────────────
Client submits inquiry form
    → Describes requirements (dimensions, wood type, finish, reference images)
    → Admin receives notification
    → Admin reviews inquiry
    → Admin prepares quotation (price, lead time, payment terms)
    → Quotation sent to client (email/WhatsApp)
    → [BRANCH POINT]
        ├── Client approves → Order created, advance payment initiated
        ├── Client requests revision → Back to quotation phase
        └── Client rejects → Inquiry closed, reason recorded

Phase 3: Production Management
──────────────────────────────
Order enters production queue
    → Admin assigns to production slot
    → Production milestones tracked:
        ├── Material Procurement
        ├── Rough Cutting
        ├── Joinery / Assembly
        ├── Finishing / Polish
        └── Quality Check / Snagging
    → Client receives milestone notifications (optional)

Phase 4: Pre-delivery
──────────────────────
Production complete
    → Admin marks "Ready for Delivery"
    → Delivery date scheduled with client
    → Final payment reminder sent
    → Final payment received
    → Delivery confirmed

Phase 5: Delivery & Closure
────────────────────────────
Delivery executed
    → Installation complete
    → Client signs off / confirmation captured
    → Order marked "Delivered"
    → Warranty period begins
    → Follow-up scheduled (optional)
```

---

### Edge Cases and Failure Scenarios

**Edge Case 1: Client Ghosts After Quotation**
- Client receives quote, stops responding
- System must: auto-follow-up after N days, then mark inquiry as "Stale," then archive after M days
- Recovery: Manual re-engagement by admin with a "Last Chance" communication

**Edge Case 2: Material Unavailable After Order Confirmation**
- Admin has accepted payment but cannot source the required wood species
- System must: flag the order as "Material Hold," notify admin, provide communication template to inform client
- Client options: approve substitute material, accept delay, or cancel with full refund
- Recovery: Formal amendment to the order with client sign-off captured in system

**Edge Case 3: Client Requests Changes Mid-Production**
- Production has begun but client wants to change dimensions or finish
- System must: freeze current order, calculate cost delta and time delta, generate amendment quote
- If client approves: resume with updated specs, update timeline
- If client rejects amendment: resume original spec
- This is a **version control problem** for order specifications

**Edge Case 4: Payment Dispute on Delivery**
- Client refuses final payment claiming quality does not match specification
- System must: have a record of the original approved specification, all communication, and milestone photos
- Recovery: Admin escalation process, possible partial refund, warranty service scheduling

**Edge Case 5: Workshop Overload**
- Admin accepts more orders than production capacity allows
- System must: expose current capacity utilization to prevent this proactively
- Recovery: Negotiate extended lead times with clients, offer compensation (discount on future order)

**Edge Case 6: Delivery No-Show**
- Delivery is scheduled but client is unreachable on the day
- System must: record the failed delivery attempt, reschedule, and track associated re-delivery cost

---

### Workflows Requiring Real-Time Synchronization

| Workflow | Why Real-Time Matters |
|---|---|
| Order status updates | Client and admin must see the same state simultaneously |
| Quotation approval | Admin must know immediately when a client approves to begin material procurement |
| Payment confirmation | Production should not start until payment is confirmed, not just initiated |
| Delivery scheduling | Conflicts between two clients requesting the same delivery date must be caught immediately |
| Admin notifications | New inquiries, new payments, and new messages must reach admin without polling delay |

---

## 5. Risk & Complexity Analysis

### Operational Bottlenecks

**Bottleneck 1: The Quotation Cycle**
Every custom order requires manual admin involvement to prepare a quote. This does not scale. At low volume it is manageable, but at 20+ concurrent custom inquiries, the admin becomes the limiting factor of the entire business.

**Bottleneck 2: Payment Confirmation Lag**
If payment confirmation is manual (admin checks bank account, then marks paid in system), production start times slip. This creates timeline inaccuracies.

**Bottleneck 3: Single Admin Dependency**
If the business owner is the only person who can update order status, approve quotes, and manage deliveries, any absence creates system-wide stagnation.

---

### Scaling Risks

| Risk | Description | Impact |
|---|---|---|
| Workshop capacity not modeled | System accepts orders beyond physical production ability | Business reputation collapse |
| No order prioritization | High-value or deadline-critical orders treated same as standard | Client churn on important accounts |
| No lead time forecasting | Clients given inaccurate delivery estimates | Expectation mismatch at scale |
| Media storage costs | High-resolution images and AR models at scale | Cloudinary costs become significant |

---

### Data Consistency Risks

**Risk 1: Payment State vs Order State Mismatch**
If a payment is confirmed by the payment gateway but the order system hasn't updated, production may not start. Or worse — production starts on an unpaid order.

**Risk 2: Quotation Version Drift**
If a client is shown Quote v1, negotiates changes, receives Quote v2, but the system only stores the latest version, there is no audit trail if a dispute arises.

**Risk 3: Concurrent Order Modification**
If the admin and a client are both interacting with an order simultaneously (admin updating status while client approves quote), race conditions can corrupt the order state.

**Risk 4: WhatsApp Communication Not in System**
If critical decisions are made in WhatsApp and not recorded in Furnix, the system of record is incomplete. Disputes become unresolvable.

---

### Abuse and Misuse Possibilities

| Abuse Vector | Description | Mitigation |
|---|---|---|
| Fake Inquiries / Spam | Competitors or bots submitting fake custom order requests | CAPTCHA, inquiry rate limiting, verified email requirement |
| Quote Farming | Clients collecting quotes with no intention to order | Requiring basic contact verification before quote |
| Payment Fraud | Fraudulent payment confirmations | Server-side payment webhook verification, never trust client-side confirmation |
| Admin Account Takeover | Single admin account is catastrophic if compromised | MFA enforcement for admin accounts |
| AR Model Theft | 3D models served for AR could be downloaded and copied | Signed URL delivery, model obfuscation |

---

### Areas Requiring Auditability

Every one of these events must be logged with a timestamp, actor identity, and before/after state:

- Order status changes
- Quotation creation, revision, and approval
- Payment records (created, confirmed, refunded)
- Admin authentication events
- Product catalog changes (price updates especially)
- Order specification amendments
- Delivery confirmations

> **Beginner Mistake:** Auditability is treated as a future feature. In reality, the first time a client disputes an order, the absence of an audit log means the business has no evidence to stand on.

---

## 6. Technical Implications from Domain

### How Domain Requirements Influence Architecture

**The Order Is a State Machine, Not a Record**
The order entity must be modeled as a formal state machine with:
- Defined valid states
- Defined valid transitions between states
- Guards that prevent invalid transitions
- Events emitted on each transition

```
INQUIRY_SUBMITTED
    ↓
QUOTE_PENDING
    ↓
QUOTE_SENT
    ↓ (client approves)
ADVANCE_PENDING
    ↓ (payment confirmed)
IN_PRODUCTION
    ↓
READY_FOR_DELIVERY
    ↓ (final payment confirmed)
DELIVERY_SCHEDULED
    ↓
DELIVERED
    ↓
CLOSED / WARRANTY_ACTIVE
```

Any state can also transition to `CANCELLED` with documented reason and refund tracking.

---

### Where Specific Technical Systems Become Necessary

**Real-Time Systems (WebSocket or SSE)**
- Admin notification when new inquiry arrives
- Client receives status update when order moves to next milestone
- Both parties see quote approval simultaneously

**Event System / Message Queue**
- Payment gateway webhook → order state update (must be reliable, not lost)
- Milestone update → client notification trigger
- Quote approval → production queue update
- Must survive application restarts — an in-memory event bus is insufficient

**Caching Layer**
- Product catalog (read-heavy, changes infrequently)
- Active session tokens for JWT validation
- Workshop capacity summary for the admin dashboard

**Document/Blob Storage Strategy**
- Product images via Cloudinary (already decided)
- AR 3D models need a different storage and delivery strategy than 2D images
- Client-submitted reference images for custom inquiries (intake storage)
- Delivery proof photos (output storage with retention policy)

**Audit Log as a Separate Concern**
The audit trail should be written to an append-only store, separate from the main transactional database. It should never be deletable through normal application paths.

**WhatsApp Integration Architecture**
```
Client submits inquiry in Furnix
    → System creates inquiry record
    → System generates WhatsApp deep link (pre-filled message)
    OR
    → WhatsApp Business API webhook receives message
    → System creates/updates corresponding inquiry record
```
The challenge is maintaining bidirectional sync between WhatsApp conversations and the Furnix system of record.

---

## 7. MVP vs Enterprise Gap

### What Realistically Belongs in MVP

The MVP should validate the core hypothesis: **Can digitizing the inquiry-to-order workflow reduce the admin's manual effort and improve the client's experience?**

| Feature | MVP | Justification |
|---|---|---|
| Product catalog with photos | ✅ Yes | Core discovery mechanism |
| Custom inquiry form | ✅ Yes | Core conversion mechanism |
| Admin order management dashboard | ✅ Yes | Core operational value |
| Basic order status tracking for client | ✅ Yes | Reduces client support calls |
| Manual quotation creation by admin | ✅ Yes | Acceptable at low volume |
| JWT auth + Google OAuth | ✅ Yes | Security baseline |
| WhatsApp link integration (deep link) | ✅ Yes | Low effort, high familiarity |
| Payment milestone tracking (manual) | ✅ Yes | Critical for financial tracking |
| Cloudinary image management | ✅ Yes | Professional catalog requirement |
| AR Product Visualization | ❌ No | High complexity, low conversion impact at MVP stage |
| WhatsApp Business API (bidirectional) | ❌ No | Requires API approval, significant integration effort |
| Real-time WebSocket notifications | ⚠️ Optional | Email/SMS notifications acceptable at MVP scale |
| Workshop capacity management | ❌ No | Manual process acceptable at MVP |
| B2B interior designer portal | ❌ No | Separate product, different UX |
| Automated payment gateway | ⚠️ Optional | Manual payment confirmation acceptable initially |
| Audit log system | ⚠️ Should include | Basic event logging, not full audit infrastructure |
| Order specification versioning | ⚠️ Should include | Critical for dispute prevention |

---

### What Becomes Mandatory at Production Scale

| Feature | Why It Becomes Mandatory |
|---|---|
| Workshop capacity management | Without it, the business accepts more than it can deliver |
| Automated payment gateway with webhooks | Manual confirmation breaks at volume |
| WhatsApp Business API integration | Deep links do not scale, context is lost between sessions |
| Real-time notifications | Email polling is too slow for a time-sensitive production business |
| Full audit log infrastructure | First major client dispute makes this urgent |
| AR product visualization | Differentiation becomes necessary as competitors mature |
| Role-based access control (RBAC) | Multiple staff members need different access levels |
| Reporting and analytics | Business owner needs data to make pricing and capacity decisions |
| B2B account type | Interior designers will demand differentiated treatment |
| Order amendment and version control | Mid-production changes without this create legal exposure |

---

## 8. Final Recommendations

### System Priorities (Ranked by Operational Impact)

**Priority 1: Get the Order State Machine Right**
This is the foundation everything else sits on. A broken order state model cannot be patched incrementally — it requires a rewrite. Design every possible state and transition before writing a single line of code.

**Priority 2: Payment and Order State Must Be Atomic**
The system must guarantee that a payment confirmation always results in an order state update. This requires server-side webhook handling, idempotency keys, and retry logic. A payment that succeeds but does not update the order is a business-critical bug.

**Priority 3: Communication History Is Non-Negotiable**
Every interaction between admin and client — every note, every approval, every rejection — must be stored in the system. This protects both parties. This is more important than any UI feature.

**Priority 4: Admin Experience Before Client Experience**
The admin dashboard must be operationally complete before investing heavily in client-facing polish. A beautiful client-facing catalog is worthless if the admin cannot manage orders effectively.

**Priority 5: Capacity Awareness**
Even a simple indicator showing "X orders currently in production" prevents the business from over-committing. This does not need to be sophisticated at MVP, but it must exist.

---

### Hardest Engineering Problems

**Problem 1: WhatsApp Synchronization**
Keeping the system of record in sync with WhatsApp conversations where real decisions are being made is fundamentally a two-system consistency problem. There is no clean solution — only tradeoffs.

**Problem 2: Order Amendment Mid-Production**
When a client requests changes after production has started, the system must handle cost recalculation, timeline recalculation, client approval, and production restart — all as a coherent transactional unit. This is a workflow orchestration problem that most e-commerce frameworks do not support natively.

**Problem 3: Payment Gateway + Order State Consistency**
Handling partial payments across multiple milestones, refunds on cancellations, and partial refunds on disputes — while keeping order state accurate — is a distributed systems consistency problem even within a monolith.

**Problem 4: AR Model Management**
3D models for AR visualization are large, require specific format support across iOS (USDZ) and Android (GLB), need to be protected from direct download, and must be performant on mobile networks. This is a media pipeline engineering problem, not a UI problem.

**Problem 5: Notification Reliability**
At MVP, missed notifications (admin misses an inquiry, client misses a payment reminder) are a business failure. Building a reliable notification system that survives application downtime is harder than it appears.

---

### Operational Features More Important Than UI Polish

The following operational capabilities will determine whether the business succeeds or fails on this platform. They must be prioritized over any visual refinement:

1. **Order state audit trail** — every change, who made it, when
2. **Payment milestone ledger** — exactly what has been paid and what is outstanding per order
3. **Inquiry response time tracking** — how long inquiries go unanswered (prevents revenue leakage)
4. **Production queue view** — what is being worked on, what is next, what is blocked
5. **Delivery scheduling system** — prevents double-booking and missed deliveries
6. **Client communication log** — all notes and messages tied to the order record
7. **Workshop capacity indicator** — prevents over-commitment

> **Final Observation:** Furnix is not fundamentally a web design project — it is a business operations digitization project. The technology choices and UI are secondary to correctly modeling the domain. A beautifully designed platform with a broken order model will fail. A simple, stable platform with a correct operational model will create real business value.

---

*This analysis should be treated as the domain foundation before any database schema, API design, or UI architecture decisions are made.*