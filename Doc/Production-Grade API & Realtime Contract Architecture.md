# Furnix — Production-Grade API & Realtime Contract Architecture
### Version 1.0 | API Governance & Contract Design Document

---

## Document Preamble

This document defines the API contract layer for Furnix as a **governance artifact**, not merely a technical specification. Every API decision made here creates a commitment to clients (browsers, mobile apps, third-party integrations) that is expensive to break. The governing principle is: **API contracts are public promises. Design them as if they cannot be changed.**

Three non-negotiable axioms govern every decision:

1. **Consistency over cleverness** — every endpoint follows the same patterns, predictably
2. **Explicit over implicit** — validation rules, error codes, and state transitions are documented and enforced
3. **Fail loudly, fail safely** — clear errors are better than silent failures, and security failures must never degrade gracefully

---

# PART 1 — API ARCHITECTURE

---

## 1.1 Protocol Selection Analysis

```
DECISION: REST over HTTP/1.1 and HTTP/2

Evaluation Matrix:

Criterion              │ REST    │ GraphQL │ gRPC    │ Winner
───────────────────────┼─────────┼─────────┼─────────┼────────
Browser compatibility  │ Native  │ Native  │ Requires│ REST
                       │         │         │ grpc-web│
Team familiarity       │ High    │ Medium  │ Low     │ REST
Tooling maturity       │ Highest │ High    │ Medium  │ REST
Caching at HTTP layer  │ Native  │ Complex │ None    │ REST
Type safety            │ OpenAPI │ Schema  │ Proto   │ Draw
Partial responses      │ Manual  │ Native  │ Manual  │ GraphQL
Real-time subscriptions│ SSE/WS  │ Native  │ Native  │ Draw
Introspection/docs     │ OpenAPI │ Native  │ Protobuf│ Draw
N+1 on mobile          │ Risk    │ Solved  │ Solved  │ GraphQL
Operational complexity │ Low     │ Medium  │ High    │ REST

WHY NOT GraphQL for Furnix MVP:
→ Admin dashboard and client portal have stable, well-defined query shapes.
  The primary benefit of GraphQL (flexible field selection for diverse clients)
  does not apply when there is one web client with predictable data needs.
→ Caching is significantly more complex with GraphQL (POST requests bypass
  HTTP cache; requires CDN-level query caching which is operationally complex).
→ Authorization at field-level in GraphQL requires custom resolver-level
  enforcement. REST endpoint-level authorization is simpler and more auditable.
→ GraphQL error handling (200 OK with errors in body) conflicts with
  Furnix's requirement for HTTP status codes to drive client error handling.
→ Re-evaluate at Phase 3 if mobile app requires flexible data fetching.

WHY NOT gRPC:
→ Requires grpc-web proxy for browser clients (additional infrastructure).
→ Binary protocol makes debugging harder (curl, browser devtools insufficient).
→ Team does not have protobuf expertise.
→ No benefit over REST for Furnix's request volume and payload complexity.

REST IMPLEMENTATION STYLE: Resource-oriented with pragmatic RPC extensions
→ Pure resource REST for CRUD operations (products, users, orders)
→ RPC-style endpoints for state transitions (order state changes, quote approval)
  These are actions, not resources, and are better expressed as commands.

Example:
  Resource: GET /api/v1/orders/{id}         (fetch order)
  Resource: GET /api/v1/orders              (list orders)
  Command:  POST /api/v1/orders/{id}/approve (approve — RPC action)
  Command:  POST /api/v1/orders/{id}/transitions (state change — RPC command)
  
  NOT: PUT /api/v1/orders/{id} with {status: "APPROVED"}
  Because: Status transitions have guards, side effects, and authority requirements
           that cannot be expressed in a simple resource update.
```

---

## 1.2 Versioning Strategy

```
VERSIONING APPROACH: URI Path Versioning with Sunset Headers

Format: /api/v{major}/{resource}

Examples:
  /api/v1/products
  /api/v1/orders/{id}/transitions
  /api/v2/products  (when breaking change required)

WHY URI versioning over alternatives:

Header versioning (Accept: application/vnd.furnix.v2+json):
  REJECTED: Cannot be bookmarked, cached by CDN, or tested in browser directly.
  Inconsistent support across HTTP clients and proxies.

Query parameter (?version=2):
  REJECTED: Query params are for filtering, not protocol versioning.
  Breaks cache key semantics (cache misses on versioned vs unversioned URLs).

URI versioning:
  SELECTED: Explicit in logs, cacheable, bookmarkable, unambiguous.
  Weakness: URL changes on major version. Acceptable — major versions
  represent breaking changes and require client migration.

VERSION LIFECYCLE POLICY:

v1 (Current) → Active, fully supported
  → SLA: 100% uptime, all bug fixes applied
  
v1 (Deprecated) → After v2 launches, v1 enters deprecation
  → Duration: Minimum 6 months deprecation period
  → Response header: Deprecation: true
                     Sunset: {ISO date 6 months from deprecation announcement}
                     Link: </api/v2/products>; rel="successor-version"
  → Email notification to registered API consumers
  
v1 (Sunset) → After Sunset date, v1 returns 410 Gone

BACKWARD COMPATIBILITY WITHIN A VERSION:
→ Additive changes (new fields, new endpoints, new enum values in response)
  do NOT require a version bump. Clients must be written to tolerate
  unknown fields (they must not break on extra JSON properties).
→ Breaking changes (removing fields, changing field types, removing endpoints,
  changing error codes) ALWAYS require a new major version.
→ This is the API contract law — no exceptions without deprecation process.

MINOR VERSIONING (informational only):
Header: X-API-Version: 1.3.2
→ Communicated to clients for debugging
→ Does not affect routing
→ Incremented on non-breaking changes
→ Visible in API changelog
```

---

## 1.3 API Modularization

```
MODULE STRUCTURE (mapped to Spring Boot modules):

/api/v1/
├── /auth/                    → AuthModule
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   ├── POST /password/reset-request
│   ├── POST /password/reset
│   ├── POST /email/verify
│   ├── POST /email/resend-verification
│   └── GET  /me
│
├── /catalog/                 → CatalogModule (public)
│   ├── GET  /products
│   ├── GET  /products/{slug}
│   ├── GET  /categories
│   └── GET  /wood-types
│
├── /admin/products/          → AdminCatalogModule (ADMIN+)
│   ├── POST /
│   ├── GET  /
│   ├── GET  /{id}
│   ├── PUT  /{id}
│   ├── POST /{id}/archive
│   ├── POST /{id}/publish
│   └── POST /{id}/images
│
├── /inquiries/               → InquiryModule
│   ├── POST /                 (CLIENT: submit; ADMIN: create on behalf)
│   ├── GET  /                 (ADMIN: all; CLIENT: own)
│   ├── GET  /{id}
│   ├── POST /{id}/acknowledge  (ADMIN)
│   ├── POST /{id}/request-info (ADMIN)
│   ├── POST /{id}/reject       (ADMIN)
│   └── POST /{id}/respond      (CLIENT: respond to info request)
│
├── /quotations/              → QuotationModule
│   ├── POST /                 (ADMIN: create)
│   ├── GET  /{id}             (CLIENT: own; ADMIN: any)
│   ├── PUT  /{id}             (ADMIN: edit DRAFT)
│   ├── POST /{id}/send        (ADMIN)
│   ├── POST /{id}/approve     (CLIENT)
│   └── POST /{id}/request-revision (CLIENT)
│
├── /orders/                  → OrderModule
│   ├── GET  /                 (ADMIN: all; CLIENT: own)
│   ├── GET  /{id}             (CLIENT: own; ADMIN: any)
│   ├── POST /{id}/transitions  (ADMIN/SHOP_MGR state changes)
│   ├── POST /{id}/hold         (ADMIN)
│   ├── POST /{id}/release-hold (ADMIN)
│   └── POST /{id}/cancel       (SUPER_ADMIN)
│
├── /orders/{id}/payments/    → PaymentModule
│   ├── GET  /                 (ADMIN: full; CLIENT: own summary)
│   ├── GET  /{milestoneId}
│   └── POST /{milestoneId}/confirm (ADMIN)
│
├── /orders/{id}/production/  → ProductionModule
│   ├── GET  /stages           (ADMIN/SHOP_MGR/CLIENT limited view)
│   ├── PUT  /stages/{stageId} (ADMIN/SHOP_MGR)
│   └── POST /stages/{stageId}/photos (ADMIN/SHOP_MGR)
│
├── /orders/{id}/delivery/    → DeliveryModule
│   ├── POST /schedule         (ADMIN)
│   ├── PUT  /schedule/{scheduleId} (ADMIN)
│   └── POST /schedule/{scheduleId}/complete (ADMIN/DELIVERY_STAFF)
│
├── /admin/dashboard/         → AdminModule
│   ├── GET  /summary
│   ├── GET  /orders
│   └── GET  /inquiries
│
├── /admin/users/             → UserManagementModule (SUPER_ADMIN)
│   ├── GET  /
│   ├── POST /staff
│   ├── GET  /{id}
│   ├── PUT  /{id}
│   └── POST /{id}/deactivate
│
├── /media/                   → MediaModule
│   └── POST /upload-credentials
│
└── /health/                  → System (public, no auth)
    ├── GET  /live
    └── GET  /ready
```

---

# PART 2 — AUTHENTICATION & AUTHORIZATION

---

## 2.1 Token Strategy

```
TOKEN ARCHITECTURE: Dual-Token with RS256 JWT

┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN FLOW DIAGRAM                           │
│                                                                 │
│  Client                    API Server              Redis        │
│    │                           │                    │           │
│    │── POST /auth/login ───────►│                    │           │
│    │   {email, password}        │── BCrypt verify    │           │
│    │                            │── Generate JWT     │           │
│    │                            │── Generate RT      │           │
│    │                            │── Store RT hash ──►│           │
│    │◄── 200 ───────────────────│                    │           │
│    │   body: {access_token}     │                    │           │
│    │   cookie: refresh_token    │                    │           │
│    │   (HttpOnly, Secure)       │                    │           │
│    │                            │                    │           │
│    │── GET /orders ────────────►│                    │           │
│    │   Authorization: Bearer {AT}│── Validate JWT    │           │
│    │                            │── Check JTI ──────►│           │
│    │◄── 200 ───────────────────│                    │           │
│    │                            │                    │           │
│    │   [AT expires at 15 min]   │                    │           │
│    │                            │                    │           │
│    │── POST /auth/refresh ─────►│                    │           │
│    │   cookie: refresh_token    │── Hash RT          │           │
│    │                            │── Lookup in Redis ►│           │
│    │                            │◄── User context ───│           │
│    │                            │── New RT ──────────►│           │
│    │                            │── Revoke old RT ──►│           │
│    │◄── 200 ───────────────────│                    │           │
│    │   body: {new access_token} │                    │           │
│    │   cookie: new refresh_token│                    │           │
└─────────────────────────────────────────────────────────────────┘

ACCESS TOKEN (JWT) PAYLOAD:
{
  "iss": "https://api.furnix.com",
  "aud": "furnix-clients",
  "sub": "usr_7f3a2b1c4d5e6f7a",
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1705312800,
  "exp": 1705313700,
  "role": "ADMIN",
  "permissions": ["order:read", "order:write", "inquiry:read", "inquiry:write"],
  "email_verified": true,
  "token_version": 3
}

FIELD RATIONALE:
→ "aud" claim: Prevents token from being used on other APIs (audience check)
→ "jti" claim: Unique per token, stored in Redis for revocation checking
→ "token_version": Must match user.token_version in DB.
  Invalidates all tokens issued before password/role change without
  maintaining a full revocation list. Most tokens self-expire before mismatch.
→ "permissions": Denormalized from role for fast authorization checks.
  Avoids DB lookup on every request for permission evaluation.

REFRESH TOKEN SPECIFICATION:
Format: cryptographically random 48 bytes, base64url encoded → 64 chars
Storage: SHA-256 hash stored in Redis with TTL
Cookie: HttpOnly=true, Secure=true, SameSite=Strict, Path=/api/auth
Rotation: New RT issued on every use. Old RT invalidated immediately.
Theft detection: If revoked RT is used, ALL sessions for user invalidated.

CLAIM VERIFICATION ORDER (every authenticated request):
1. Extract Bearer token from Authorization header
2. Verify JWT signature (RS256 public key)
3. Verify "iss" claim matches expected issuer
4. Verify "aud" claim includes "furnix-clients"
5. Verify "exp" not past (token not expired)
6. Verify "jti" not in Redis revoked set
7. Verify user.token_version matches JWT "token_version" claim
   (cached in Redis for 5 minutes to avoid DB call on every request)
8. Verify user.is_active = true (from cache)
If any check fails: 401 Unauthorized with specific error code
```

---

## 2.2 RBAC Integration

```
PERMISSION MODEL: Role-Based with Resource-Level Ownership Checks

ROLES AND PERMISSION SETS:

SUPER_ADMIN permissions:
  "*:*"  (all resources, all actions)

ADMIN permissions:
  "product:read", "product:write",
  "inquiry:read", "inquiry:write", "inquiry:assign",
  "quotation:read", "quotation:write", "quotation:send",
  "order:read", "order:write", "order:transition",
  "payment:read", "payment:write",
  "production:read", "production:write",
  "delivery:read", "delivery:write",
  "user:read",           -- Can view client profiles
  "dashboard:read",
  "audit:read"

SHOP_MANAGER permissions:
  "order:read",
  "production:read", "production:write",
  "delivery:read"

DELIVERY_STAFF permissions:
  "delivery:read",           -- Own assignments only
  "delivery:complete"        -- Mark delivery done

CLIENT permissions:
  "catalog:read",
  "inquiry:submit",
  "inquiry:read:own",
  "quotation:read:own", "quotation:approve",
  "order:read:own",
  "profile:read:own", "profile:write:own"

IMPLEMENTATION: Spring Security Method-Level Security

// Base controller annotation:
@RestController
@RequestMapping("/api/v1/orders")
@PreAuthorize("isAuthenticated()")  // All order endpoints require auth
public class OrderController {

    // Admin can see all orders; client only sees own
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SHOP_MANAGER') " +
                  "or hasRole('CLIENT')")
    public ResponseEntity<PagedResponse<OrderSummaryDTO>> listOrders(...) { }

    // Order detail: admin any, client only own
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN') " +
                  "or @orderSecurity.isOwner(#id, authentication)")
    public ResponseEntity<OrderDetailDTO> getOrder(@PathVariable String id) { }

    // State transition: admin roles only
    @PostMapping("/{id}/transitions")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'SHOP_MANAGER')")
    public ResponseEntity<OrderDetailDTO> transitionOrder(...) { }

    // Cancel: Super Admin only
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<OrderDetailDTO> cancelOrder(...) { }
}

// OrderSecurity component:
@Component("orderSecurity")
public class OrderSecurityService {
    
    public boolean isOwner(String orderId, Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        // Cache this result in Redis: "order:owner:{orderId}" → clientId
        return orderRepository.existsByIdAndClientId(orderId, principal.getId());
    }
}

RESOURCE-LEVEL SECURITY RULES:
→ Clients NEVER receive other clients' data — enforced at query level
  (WHERE client_id = :currentUserId added to all client-facing queries)
→ Internal fields (internal_notes, payment_reference_numbers, admin_notes)
  NEVER returned in client-facing DTOs — enforced at DTO mapping layer
→ Security is enforced at: annotation level (RBAC), service level (ownership),
  query level (client_id filter), DTO level (field exclusion)
  Four layers — any single layer failure does not expose data
```

---

## 2.3 Request Authentication Flow

```java
// Security filter chain configuration:
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            .csrf(csrf -> csrf.disable())  // Stateless API — no CSRF needed
            // NOTE: Refresh token in HttpOnly cookie IS protected against XSS
            // because JavaScript cannot read HttpOnly cookies.
            // CSRF attack on /auth/refresh is mitigated by SameSite=Strict cookie.
            
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (no auth required):
                .requestMatchers(
                    "/api/v1/auth/**",
                    "/api/v1/catalog/**",
                    "/api/v1/health/**",
                    "/actuator/health",
                    "/actuator/health/**"
                ).permitAll()
                
                // WebSocket handshake:
                .requestMatchers("/ws/**").permitAll()
                
                // Everything else requires authentication:
                .anyRequest().authenticated()
            )
            
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtService, userCacheService),
                UsernamePasswordAuthenticationFilter.class
            )
            
            .addFilterBefore(
                new RateLimitFilter(rateLimitService),
                JwtAuthenticationFilter.class
            )
            
            .addFilterAfter(
                new RequestLoggingFilter(auditService),
                JwtAuthenticationFilter.class
            )
            
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new FurnixAuthenticationEntryPoint())
                .accessDeniedHandler(new FurnixAccessDeniedHandler())
            );
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "https://furnix.com",
            "https://www.furnix.com",
            "https://admin.furnix.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
            "Authorization", "Content-Type", "X-Request-ID",
            "X-Idempotency-Key", "Accept-Language"
        ));
        config.setExposedHeaders(List.of(
            "X-Request-ID", "X-RateLimit-Limit",
            "X-RateLimit-Remaining", "X-RateLimit-Reset",
            "Deprecation", "Sunset"
        ));
        config.setAllowCredentials(true);  // Required for HttpOnly cookie
        config.setMaxAge(3600L);           // Preflight cache: 1 hour
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/ws/**", config);
        return source;
    }
}
```

---

# PART 3 — ENDPOINT DESIGN

---

## 3.1 Standard Request/Response Envelope

```json
// STANDARD SUCCESS RESPONSE ENVELOPE:
{
  "success": true,
  "data": { ... },              // Resource or collection
  "meta": {                     // Always present (nullable fields set to null if N/A)
    "requestId": "req_7f3a2b1c",
    "timestamp": "2025-01-15T10:30:00.123Z",
    "apiVersion": "1.3.2",
    "processingTimeMs": 145
  },
  "pagination": null            // Present only for list endpoints (see pagination)
}

// STANDARD PAGINATED RESPONSE ENVELOPE:
{
  "success": true,
  "data": [ ... ],
  "meta": { ... },
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "totalItems": 47,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextCursor": "cursor_eyJpZCI6IjEyMyJ9"  // For cursor pagination
  }
}

// STANDARD ERROR RESPONSE ENVELOPE:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "budget_min",
        "code": "MUST_BE_POSITIVE",
        "message": "Budget minimum must be greater than 0",
        "rejectedValue": -500
      }
    ],
    "traceId": "6a3f2b1c4d5e6f7a",
    "requestId": "req_7f3a2b1c",
    "timestamp": "2025-01-15T10:30:00.123Z",
    "documentation": "https://docs.furnix.com/errors/VALIDATION_ERROR"
  },
  "data": null,
  "meta": { ... },
  "pagination": null
}

DESIGN RATIONALE:
→ "success" boolean: Client can check one field regardless of HTTP status.
  Prevents "check status code OR check body" ambiguity.
→ Consistent envelope: Frontend can have ONE response parser, not per-endpoint.
→ "traceId" in error: Client can report this for support — maps to backend logs.
→ "details" array for validation: Allows front-end to show inline field errors.
→ "documentation" link: Self-documenting errors for API integrators.
→ "data": null in error responses: Prevents undefined access bugs in clients.
```

---

## 3.2 Authentication Endpoints

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/auth/register
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Register a new client account
Authentication: None
Rate Limit: 5 per hour per IP

REQUEST:
{
  "fullName": "Priya Sharma",
  "email": "priya@example.com",
  "password": "SecurePass@123",
  "phoneNumber": "+919876543210"    // Optional at registration
}

VALIDATION RULES:
  fullName:    required, 2–200 chars, no HTML
  email:       required, RFC 5321 format, max 254 chars
  password:    required, 8–128 chars, must contain:
               uppercase, lowercase, digit, special char
               must NOT contain user's name or email
               must NOT match top 10,000 common passwords (checked against list)
  phoneNumber: optional, E.164 format (+{country_code}{number})
               10–15 digits after +

SERVER-SIDE PROCESSING:
1. Validate inputs (fail fast on first error)
2. Normalize email: lowercase, trim
3. Check email uniqueness (both verified + unverified)
4. Hash password: BCrypt(cost=12)
5. Create user record (email_verified=false)
6. Generate verification token (48 random bytes, base64url)
7. Store BCrypt hash of token in email_verifications
8. Queue email notification (async, after commit)

RESPONSE 201 Created:
{
  "success": true,
  "data": {
    "userId": "usr_7f3a2b1c4d5e6f7a",
    "email": "priya@example.com",
    "message": "Account created. Please check your email to verify your account.",
    "emailSentTo": "pr***@example.com"    // Partially masked
  },
  "meta": { ... }
}

ERROR RESPONSES:
409 Conflict:
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email address already exists."
  }
}

422 Unprocessable Entity (validation failure):
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "password",
        "code": "PASSWORD_TOO_WEAK",
        "message": "Password must contain at least one special character"
      },
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email address format is invalid"
      }
    ]
  }
}

429 Too Many Requests:
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many registration attempts. Please try again later.",
    "retryAfter": 3600
  }
}

Headers returned:
  X-Request-ID: req_7f3a2b1c
  Content-Type: application/json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/auth/login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Authenticate with email/password, receive tokens
Authentication: None
Rate Limit: 10 per 15 minutes per IP; 5 per 15 minutes per email

REQUEST:
{
  "email": "priya@example.com",
  "password": "SecurePass@123",
  "deviceHint": "Chrome on MacOS"    // Optional, for session display
}

PROCESSING:
1. Normalize email
2. Look up user by email (timing-safe: always BCrypt verify even if user not found)
3. Check account lock (locked_until > NOW())
4. BCrypt verify password
5. On failure: increment failed_login_count, lock if >= 5 failures
6. On success: reset failed_login_count = 0
7. Check email_verified = true (reject if not)
8. Check is_active = true
9. Generate access token (JWT, 15 min TTL)
10. Generate refresh token (48 random bytes)
11. Store refresh token hash in Redis with user context

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 900,    // Seconds until access token expires
    "user": {
      "id": "usr_7f3a2b1c",
      "email": "priya@example.com",
      "fullName": "Priya Sharma",
      "role": "CLIENT",
      "emailVerified": true
    }
  },
  "meta": { ... }
}

Set-Cookie: refresh_token={token}; HttpOnly; Secure; SameSite=Strict;
            Path=/api/v1/auth; Max-Age=604800; Domain=api.furnix.com

SECURITY NOTES:
→ Response time is constant regardless of whether email exists
  (prevents email enumeration via timing attack)
→ Account lock message is generic: "Invalid credentials or account locked"
  (does not reveal whether email exists or is locked)
→ Failed login logged to audit trail with IP hash
→ 5 consecutive failures triggers temporary lock (15 minutes)
→ 10 failures within 1 hour triggers extended lock (1 hour) + admin alert

ERROR RESPONSES:
401 Unauthorized:
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "attemptsRemaining": 3    // Show remaining attempts on 4th+ failure
  }
}

403 Forbidden (account not verified):
{
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Please verify your email address before logging in.",
    "actions": [{"label": "Resend verification email", "href": "/api/v1/auth/email/resend-verification"}]
  }
}

423 Locked:
{
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account temporarily locked due to too many failed attempts.",
    "lockedUntil": "2025-01-15T11:00:00Z",
    "retryAfter": 900
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/auth/refresh
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Exchange refresh token for new access token
Authentication: Refresh token cookie (no Bearer token)
Rate Limit: 30 per minute per user

REQUEST:
  No body required.
  Refresh token read from HttpOnly cookie automatically by browser.

PROCESSING:
1. Extract refresh token from cookie
2. SHA-256 hash the raw token
3. Look up hash in Redis
4. If not found or expired: 401 (token invalid or expired)
5. If found but revoked_at is set: Security event — invalidate ALL sessions
6. Validate user is still active
7. Issue new access token
8. Rotate refresh token (new token, old token marked as rotated)

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}

Set-Cookie: refresh_token={new_token}; HttpOnly; Secure; SameSite=Strict; ...
// Old cookie overwritten by new token

IDEMPOTENCY: If same refresh token presented twice within 30 seconds
  (network retry scenario), return same new access token (cached response).
  After 30 seconds, second presentation = stolen token → revoke all sessions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/auth/me
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Get current user's profile and capabilities
Authentication: Bearer token required
Rate Limit: 60 per minute per user
Cache: ETag-based (client can cache, server sends 304 if unchanged)

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "id": "usr_7f3a2b1c",
    "email": "priya@example.com",
    "fullName": "Priya Sharma",
    "phoneNumber": "+919876543210",
    "phoneVerified": true,
    "role": "CLIENT",
    "permissions": ["catalog:read", "inquiry:submit", "order:read:own"],
    "mfaEnabled": false,
    "createdAt": "2025-01-01T10:00:00Z",
    "lastLoginAt": "2025-01-15T10:30:00Z"
  }
}

DESIGN NOTE: The permissions array in /me response tells the frontend
exactly what UI elements to render. Frontend NEVER makes authorization
decisions based on role strings alone — it uses the permissions array.
This decouples UI rendering from role definitions.
```

---

## 3.3 Catalog Endpoints

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/catalog/products
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: List active products with filtering and pagination
Authentication: None (public)
Rate Limit: 200 per minute per IP
Cache: CDN-cacheable for anonymous requests (60 seconds edge TTL)
       Redis cache: 5 minutes

QUERY PARAMETERS:
  page           integer, default: 1, min: 1
  pageSize       integer, default: 12, max: 48, allowed: [12, 24, 48]
  categoryId     UUID, optional
  woodTypeId     UUID, optional (multi-value: ?woodTypeId=x&woodTypeId=y)
  minPrice       decimal, optional, min: 0
  maxPrice       decimal, optional, must be > minPrice
  sort           enum: FEATURED, PRICE_ASC, PRICE_DESC, NEWEST, optional
                 default: FEATURED
  q              string, optional, max: 200 chars (full-text search)

VALIDATION:
  → Invalid enum values for sort: 422 with valid options listed
  → minPrice > maxPrice: 422 with message "minPrice must be less than maxPrice"
  → Unknown query params: silently ignored (forward compatibility)
  → q length > 200: 422

RESPONSE 200 OK:
{
  "success": true,
  "data": [
    {
      "id": "prod_abc123",
      "slug": "teak-dining-table-6-seater",
      "name": "Teak Dining Table - 6 Seater",
      "shortDescription": "Solid teak dining table with hand-carved legs",
      "basePrice": 85000.00,
      "currency": "INR",
      "leadTimeRange": {
        "minDays": 30,
        "maxDays": 45
      },
      "primaryImage": {
        "url": "https://res.cloudinary.com/furnix/image/upload/w_400,h_400,c_fill,q_auto,f_auto/products/teak-dining-table.jpg",
        "alt": "Teak Dining Table - 6 Seater, front view"
      },
      "isFeatured": true,
      "availableWoodTypes": ["Teak", "Sheesham"],
      "category": {
        "id": "cat_dining",
        "name": "Dining Furniture"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "totalItems": 47,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "meta": {
    "requestId": "req_7f3a2b1c",
    "timestamp": "2025-01-15T10:30:00.123Z",
    "apiVersion": "1.3.2",
    "processingTimeMs": 45,
    "cacheHit": true,
    "appliedFilters": {
      "categoryId": null,
      "sort": "FEATURED",
      "q": null
    }
  }
}

RESPONSE DESIGN NOTES:
→ Cloudinary URLs are pre-constructed with transformation parameters
  (w_400,h_400,c_fill,q_auto,f_auto) — client never constructs URLs
→ basePrice is the starting price. Actual price may vary by configuration.
→ "cacheHit" in meta tells client whether data is from cache (for debugging)
→ "appliedFilters" echo confirms which filters server actually applied
  (helps debug filter conflicts or silently-ignored params)

CACHE CONTROL HEADERS:
  Cache-Control: public, max-age=60, stale-while-revalidate=30
  ETag: "{hash of response body}"
  Vary: Accept-Encoding, Accept-Language
  
  For authenticated admin requests: Cache-Control: no-store

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/catalog/products/{slug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Get full product detail by URL slug
Authentication: None (public)
Rate Limit: 500 per minute per IP
Cache: Redis 10 minutes; CDN 5 minutes

PATH PARAMETER: slug — URL-safe string, validated against regex: ^[a-z0-9-]{3,200}$

SIDE EFFECT: Increments products.view_count (fire-and-forget, async)

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "id": "prod_abc123",
    "slug": "teak-dining-table-6-seater",
    "name": "Teak Dining Table - 6 Seater",
    "description": "Full rich text content...",
    "basePrice": 85000.00,
    "currency": "INR",
    "dimensions": {
      "length": 180,
      "width": 90,
      "height": 75,
      "unit": "cm"
    },
    "leadTimeRange": {"minDays": 30, "maxDays": 45},
    "availableWoodTypes": [
      {"id": "wt_teak", "name": "Teak", "priceAdjustment": 0, "tier": "PREMIUM"},
      {"id": "wt_sheesham", "name": "Sheesham", "priceAdjustment": -5000, "tier": "STANDARD"}
    ],
    "availableFinishTypes": [
      {"id": "ft_natural", "name": "Natural Polish", "priceAdjustment": 0},
      {"id": "ft_dark", "name": "Dark Walnut Stain", "priceAdjustment": 2000}
    ],
    "images": [
      {
        "url": "https://res.cloudinary.com/.../w_1200,h_900,c_limit,q_auto,f_auto/...",
        "thumbnailUrl": "https://res.cloudinary.com/.../w_100,h_100,c_thumb/...",
        "alt": "Teak Dining Table - front view",
        "isPrimary": true,
        "displayOrder": 0
      }
    ],
    "relatedProducts": [
      { "id": "prod_def456", "slug": "...", "name": "...", "basePrice": 45000 }
    ],
    "seo": {
      "metaTitle": "Handcrafted Teak Dining Table | Furnix",
      "metaDescription": "..."
    },
    "category": {"id": "cat_dining", "name": "Dining Furniture", "slug": "dining"}
  },
  "meta": { ... }
}

ERROR RESPONSES:
404 Not Found:
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product could not be found.",
    "suggestions": [
      {"label": "Browse all products", "href": "/api/v1/catalog/products"}
    ]
  }
}
NOTE: Archived products return 404 (same response as truly not found —
      do not reveal the product exists but is archived)
```

---

## 3.4 Inquiry Endpoints

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/inquiries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Submit a custom furniture inquiry
Authentication: Bearer token (CLIENT role)
Rate Limit: 5 per hour per user
Idempotency: X-Idempotency-Key header required

HEADERS:
  Authorization: Bearer {token}
  Content-Type: application/json
  X-Idempotency-Key: {client-generated UUID}    // Required

REQUEST:
{
  "furnitureType": "Custom L-shaped bookshelf with sliding doors",
  "dimensions": {                           // Optional
    "length": 240,
    "width": 40,
    "height": 200,
    "unit": "cm"
  },
  "woodTypeId": "wt_teak",                 // Optional — from /catalog/wood-types
  "finishTypeId": "ft_natural",            // Optional
  "woodTypeFreetext": null,                // Use when woodTypeId not available
  "budgetRange": {
    "min": 15000,
    "max": 35000,
    "currency": "INR"
  },
  "desiredDeliveryDate": "2025-04-15",     // Optional, YYYY-MM-DD
  "preferredContact": "WHATSAPP",          // EMAIL | WHATSAPP | IN_APP
  "additionalNotes": "Need space for 500+ books...",
  "productHintId": null,                   // Optional: if started from product page
  "referenceImageIds": [                   // Optional: Cloudinary public IDs
    "furnix/staging/upload_abc123",
    "furnix/staging/upload_def456"
  ]
}

VALIDATION RULES:
  furnitureType:       required, 10–500 chars, sanitized (strip HTML)
  dimensions:          optional; if provided, all values must be positive decimals
  woodTypeId:          optional; if provided, must exist in wood_types table
  woodTypeFreetext:    optional; only if woodTypeId is null; max 200 chars
  budgetRange.min:     required, >= 500, decimal
  budgetRange.max:     required, >= budgetRange.min
  desiredDeliveryDate: optional; must be >= today + 14 days (minimum lead time)
  preferredContact:    required; if WHATSAPP, user must have verified phone number
  additionalNotes:     optional; max 2000 chars
  referenceImageIds:   optional; max 5 IDs; each validated against Redis upload
                       session (belongs to this user, not expired, not used)
  
  BUSINESS RULE: Client cannot have more than 3 OPEN inquiries simultaneously
  Checked INSIDE transaction (not just pre-flight)

IDEMPOTENCY BEHAVIOR:
  If X-Idempotency-Key already exists in DB:
  → Return 200 OK with original inquiry data (not 201)
  → Header: X-Idempotent-Replayed: true
  If key is new: process normally, return 201 Created

RESPONSE 201 Created:
{
  "success": true,
  "data": {
    "inquiryId": "inq_7f3a2b1c",
    "referenceNumber": "INQ-2025-000047",
    "status": "SUBMITTED",
    "whatsappLink": "https://wa.me/919876543210?text=Hi%2C%20I%20submitted%20inquiry%20INQ-2025-000047",
    "message": "Your inquiry has been submitted successfully. We typically respond within 24 hours.",
    "expectedResponseBy": "2025-01-16T10:30:00Z",
    "submittedAt": "2025-01-15T10:30:00.123Z"
  },
  "meta": { ... }
}

ERROR RESPONSES:
409 Conflict (idempotency replay):
  Returns 200 with original inquiry, header X-Idempotent-Replayed: true

422 Unprocessable Entity (business rule violation):
{
  "error": {
    "code": "INQUIRY_LIMIT_REACHED",
    "message": "You already have 3 open inquiries. Please wait for a response before submitting a new one.",
    "existingInquiries": [
      {"id": "inq_abc", "referenceNumber": "INQ-2025-000032", "status": "SUBMITTED"},
      {"id": "inq_def", "referenceNumber": "INQ-2025-000038", "status": "ACKNOWLEDGED"},
      {"id": "inq_ghi", "referenceNumber": "INQ-2025-000044", "status": "INFO_REQUESTED"}
    ]
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/inquiries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: List inquiries (scoped by role)
Authentication: Bearer token
Rate Limit: 60 per minute per user
Cache: No cache (operational data must be fresh)

QUERY PARAMETERS:
  For ADMIN/SUPER_ADMIN:
    status         enum (multi-value), optional
    assignedTo     UUID, optional
    clientId       UUID, optional
    dateFrom       ISO date, optional
    dateTo         ISO date, optional
    sortBy         CREATED_AT | SLA_AGE | STATUS, default: CREATED_AT
    sortDir        ASC | DESC, default: DESC
    page           integer, default: 1
    pageSize       integer, default: 20, max: 100
  
  For CLIENT:
    status         enum (multi-value), optional
    page           integer, default: 1
    pageSize       integer, default: 10, max: 20

RESPONSE DIFFERENTIATION:
  Admin response includes: assignedAdmin, adminNotes, slaStatus
  Client response excludes: assignedAdmin, adminNotes, internalData

  Admin response for each inquiry item:
  {
    "id": "inq_7f3a2b1c",
    "referenceNumber": "INQ-2025-000047",
    "client": {
      "id": "usr_abc",
      "fullName": "Priya Sharma",
      "email": "pr***@example.com",    // Partially masked in list view
      "phoneNumber": "+91987***3210"
    },
    "furnitureType": "Custom L-shaped bookshelf",
    "budgetRange": {"min": 15000, "max": 35000},
    "status": "SUBMITTED",
    "slaStatus": {
      "label": "OVERDUE",
      "hoursSinceSubmission": 26.5,
      "slaHours": 24,
      "overduBy": "2 hours 30 minutes"
    },
    "assignedAdmin": null,
    "preferredContact": "WHATSAPP",
    "submittedAt": "2025-01-14T10:00:00Z",
    "updatedAt": "2025-01-14T10:00:00Z"
  }
```

---

## 3.5 Order Management Endpoints

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/orders/{id}/transitions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Execute an order state transition
Authentication: Bearer token (ADMIN | SHOP_MANAGER | SUPER_ADMIN)
Rate Limit: 30 per minute per user
Idempotency: X-Idempotency-Key header recommended

REQUEST:
{
  "targetState": "READY_FOR_DELIVERY",
  "note": "All quality checks passed. Ready for delivery scheduling.",
  "expectedCurrentState": "QUALITY_CHECK"    // OCC: prevents stale state transition
}

VALIDATION RULES:
  targetState:           required, valid OrderStatus enum value
  note:                  optional, max 1000 chars
  expectedCurrentState:  optional but strongly recommended;
                         if provided and doesn't match: 409 Conflict

STATE MACHINE ENFORCEMENT (server-side):
  Server validates ALL of:
  1. Is targetState a valid transition from current state?
  2. Does requesting user's role have authority for this transition?
  3. Are all preconditions met? (e.g., all production stages complete
     before QUALITY_CHECK → READY_FOR_DELIVERY)
  4. If expectedCurrentState provided: does it match?

PRECONDITION CHECKS PER TRANSITION:
  → IN_PRODUCTION → MATERIAL_PROCUREMENT: Always allowed (first stage)
  → QUALITY_CHECK → READY_FOR_DELIVERY:
    All 5 production stages must be COMPLETED or SKIPPED
  → READY_FOR_DELIVERY → DELIVERY_SCHEDULED:
    Delivery schedule must exist with future date
  → DELIVERY_SCHEDULED → DELIVERED:
    At least one delivery proof must be uploaded
    (ADMIN can override with note explaining bypass)

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "orderId": "ord_7f3a2b1c",
    "referenceNumber": "ORD-2025-000023",
    "previousState": "QUALITY_CHECK",
    "newState": "READY_FOR_DELIVERY",
    "transitionedAt": "2025-01-15T10:30:00Z",
    "transitionedBy": {
      "id": "usr_admin",
      "fullName": "Admin Name",
      "role": "ADMIN"
    },
    "note": "All quality checks passed.",
    "nextActions": [
      {
        "action": "SCHEDULE_DELIVERY",
        "description": "Schedule delivery date with client",
        "href": "/api/v1/orders/ord_7f3a2b1c/delivery/schedule"
      }
    ]
  },
  "meta": { ... }
}

DESIGN NOTE: "nextActions" array tells admin UI what actionable steps
are available after this transition — reduces UI logic complexity.

ERROR RESPONSES:
409 Conflict (state mismatch):
{
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Order state has changed since you loaded it.",
    "currentState": "READY_FOR_DELIVERY",
    "yourExpectedState": "QUALITY_CHECK",
    "hint": "Refresh the order and try again."
  }
}

422 Unprocessable Entity (invalid transition):
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition from IN_PRODUCTION to DELIVERED directly.",
    "currentState": "IN_PRODUCTION",
    "requestedState": "DELIVERED",
    "validTransitions": ["MATERIAL_PROCUREMENT", "ON_HOLD", "CANCELLED"]
  }
}

422 Unprocessable Entity (precondition not met):
{
  "error": {
    "code": "TRANSITION_PRECONDITION_FAILED",
    "message": "Cannot mark as Ready for Delivery. Not all production stages are complete.",
    "unmetPreconditions": [
      {
        "precondition": "ALL_PRODUCTION_STAGES_COMPLETE",
        "detail": "Stages FINISHING_POLISH and QUALITY_CHECK are still PENDING"
      }
    ]
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/orders/{id}/payments/{milestoneId}/confirm
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Record payment receipt for a milestone
Authentication: Bearer token (ADMIN | SUPER_ADMIN only)
Rate Limit: 20 per minute per user
Idempotency: X-Idempotency-Key header REQUIRED (financial operation)

REQUEST:
{
  "amountReceived": 42500.00,
  "currency": "INR",
  "paymentMethod": "UPI",
  "paymentDate": "2025-01-15",
  "referenceNumber": "UPI123456789012",    // Bank UTR / reference
  "notes": "Client paid via Google Pay"    // Optional
}

VALIDATION RULES:
  amountReceived:  required, positive decimal, max 2 decimal places
                   If amountReceived != milestone.amountDue AND
                   no explicit "isPartial: true" flag → 422 with explanation
  currency:        required, must match order.currency
  paymentMethod:   required, valid enum
  paymentDate:     required, ISO date, cannot be in the future,
                   cannot be before order creation date
  referenceNumber: optional for CASH; recommended for others; max 200 chars

FINANCIAL VALIDATION:
  → amountReceived must equal milestone.amount_due exactly, OR
  → admin must set "isPartialPayment": true with explicit note

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "paymentRecordId": "pmt_7f3a2b1c",
    "milestoneId": "ms_abc123",
    "milestoneLabel": "Advance Payment",
    "amountDue": 42500.00,
    "amountReceived": 42500.00,
    "currency": "INR",
    "paymentMethod": "UPI",
    "paymentDate": "2025-01-15",
    "confirmedAt": "2025-01-15T10:30:00Z",
    "confirmedBy": "Admin Name",
    "orderUpdates": {
      "amountPaid": 42500.00,
      "amountOutstanding": 42500.00,
      "stateTransitioned": true,
      "newOrderState": "IN_PRODUCTION",    // If payment triggered state change
      "previousOrderState": "ADVANCE_PENDING"
    }
  },
  "meta": { ... }
}

DESIGN NOTE: "orderUpdates" confirms whether recording this payment
automatically triggered an order state transition. Admin sees the full
effect of their action in one response — no need to refresh the order separately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/admin/dashboard/summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Admin dashboard operational summary
Authentication: Bearer token (ADMIN | SUPER_ADMIN)
Rate Limit: 60 per minute per user
Cache: Redis 60 seconds (dashboard staleness acceptable)

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "inquiries": {
      "totalPending": 8,
      "unacknowledged": 3,
      "overdueSla": 2,
      "oldest": {
        "referenceNumber": "INQ-2025-000041",
        "hoursAge": 52.3,
        "clientName": "R*** S***"
      }
    },
    "orders": {
      "byState": {
        "ADVANCE_PENDING": 5,
        "IN_PRODUCTION": 12,
        "READY_FOR_DELIVERY": 3,
        "DELIVERY_SCHEDULED": 2
      },
      "totalActive": 22,
      "onHold": 1,
      "deliveryThisWeek": 4
    },
    "payments": {
      "overdueCount": 3,
      "overdueAmount": 127500.00,
      "currency": "INR",
      "collectedThisMonth": 425000.00,
      "pendingThisMonth": 215000.00
    },
    "capacity": {
      "ordersInProduction": 12,
      "estimatedCapacityPercent": 80,
      "availableSlots": 3
    },
    "dataFreshness": {
      "lastUpdated": "2025-01-15T10:29:00Z",
      "ageSeconds": 60,
      "isStale": false
    }
  },
  "meta": { ... }
}
```

---

## 3.6 Media Upload Endpoint

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/media/upload-credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Get signed upload credentials for Cloudinary direct upload
Authentication: Bearer token (any authenticated role)
Rate Limit: 20 per minute per user

REQUEST:
{
  "uploadContext": "INQUIRY_REFERENCE",    // INQUIRY_REFERENCE | PRODUCTION_PHOTO
                                           // | DELIVERY_PROOF | PRODUCT_IMAGE
  "fileCount": 3,                          // 1–5
  "fileSizes": [2048576, 1536000, 3145728] // Bytes per file (for validation)
}

VALIDATION:
  uploadContext:  required, valid enum
  fileCount:      required, 1–5 (per context limits)
  fileSizes:      required array, must match fileCount length
                  each file: max 10MB (10485760 bytes)
                  total: max 25MB for one request
  Permission check: PRODUCT_IMAGE context requires ADMIN role

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "sessionId": "ups_7f3a2b1c",
    "uploadInstructions": [
      {
        "fileIndex": 0,
        "cloudinaryUrl": "https://api.cloudinary.com/v1_1/furnix-prod/image/upload",
        "uploadParams": {
          "api_key": "123456789",
          "timestamp": 1705312800,
          "signature": "sha256_hash_here",
          "folder": "furnix/staging",
          "allowed_formats": "jpg,jpeg,png,webp",
          "max_bytes": 10485760,
          "unique_filename": true,
          "overwrite": false,
          "tags": "inquiry_reference,session_ups_7f3a2b1c"
        },
        "expiresAt": "2025-01-15T10:35:00Z"    // 5 minutes from now
      }
    ],
    "instructions": "Upload each file directly to Cloudinary using the provided parameters. After successful upload, include the returned public_id in your inquiry submission.",
    "expiresAt": "2025-01-15T10:35:00Z"
  },
  "meta": { ... }
}

SECURITY MECHANISM:
→ Server generates a signed upload URL per file
→ Cloudinary validates the signature without needing the API secret on client
→ Upload is scoped to furnix/staging/ folder
→ Tag includes sessionId for server-side validation
→ Redis stores: "upload_session:{sessionId}:{fileIndex}" → {userId, expiresAt}
→ On inquiry submission: server validates each cloudinaryPublicId belongs
  to this session and this user
→ Session keys deleted after use (single-use)
```

---

# PART 4 — WEBSOCKET/EVENT CONTRACTS

---

## 4.1 WebSocket Connection Protocol

```
CONNECTION ENDPOINT: wss://api.furnix.com/ws

HANDSHAKE:
Client connects with STOMP CONNECT frame:
  CONNECT
  accept-version:1.2
  heart-beat:10000,10000
  Authorization:Bearer {access_token}
  X-Client-Version:1.0.0
  
Server validates token and responds:
  CONNECTED
  version:1.2
  heart-beat:10000,10000
  server:Furnix-WS/1.3.2
  X-Session-Id:wss_7f3a2b1c

On invalid token:
  ERROR
  message:Authentication failed
  X-Error-Code:TOKEN_INVALID
  
  [Connection closed with code 4001]

HEARTBEAT:
  Client sends: PING frame every 10 seconds
  Server responds: PONG within 5 seconds
  If no PONG: Client initiates reconnect
  Server tracks: Missing PING from client → close connection after 30 seconds

CONNECTION LIFECYCLE:
  Connected → Authenticated → Subscribed → Active → Disconnected
  
  Each state has defined behavior for message delivery and reconnect.

TOPIC SUBSCRIPTIONS (after CONNECTED):

Admin role subscribes to:
  /user/queue/notifications      → Personal admin notifications
  /topic/admin.inquiries         → New inquiry events (all admins)
  /topic/admin.orders            → Order events (all admins)
  /topic/admin.alerts            → System alerts
  /user/queue/order.{orderId}    → Specific order tracking (optional)

Client role subscribes to:
  /user/queue/notifications      → Personal client notifications
  /user/queue/orders             → Their order updates
  /user/queue/quotations         → Their quotation updates

Shop Manager subscribes to:
  /topic/production.queue        → Production order events
  /user/queue/notifications      → Personal notifications

SUBSCRIBE frame example:
  SUBSCRIBE
  id:sub-0
  destination:/user/queue/notifications
```

---

## 4.2 Event Schema Standards

```
EVENT NAMING CONVENTION:
  Format: {DOMAIN}.{ENTITY}.{PAST_TENSE_ACTION}
  Examples:
    inquiry.inquiry.submitted
    order.order.state_changed
    payment.milestone.confirmed
    quotation.quotation.approved
    system.alert.sla_breach

ALL EVENTS FOLLOW THIS ENVELOPE:
{
  "eventId": "evt_550e8400e29b41d4a716446655440000",   // UUID v4, globally unique
  "eventType": "order.order.state_changed",
  "schemaVersion": "1.0",                              // Event schema version
  "occurredAt": "2025-01-15T10:30:00.123Z",            // When it happened (server time)
  "deliveredAt": "2025-01-15T10:30:00.456Z",           // When WebSocket delivers it
  "sequenceNumber": 1042,                              // Per-entity monotonic sequence
  "targetUserId": "usr_7f3a2b1c",                      // Who this event is for (null = broadcast)
  "payload": {                                         // Event-specific data
    // ... varies by eventType
  }
}

SEQUENCE NUMBER DESIGN:
→ Per-entity (per orderId, per inquiryId) monotonic sequence
→ Client maintains: Map<entityId, lastSeenSequence>
→ On receiving event: if event.sequenceNumber <= lastSeenSequence → discard (duplicate)
→ On reconnect: if received sequence > lastSeen + 1 → REST API fetch to reconcile gaps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVENT: order.order.state_changed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topics: /topic/admin.orders, /user/queue/orders (client-specific)

ADMIN PAYLOAD:
{
  "eventId": "evt_abc123",
  "eventType": "order.order.state_changed",
  "schemaVersion": "1.0",
  "occurredAt": "2025-01-15T10:30:00.123Z",
  "sequenceNumber": 1042,
  "payload": {
    "orderId": "ord_7f3a2b1c",
    "referenceNumber": "ORD-2025-000023",
    "previousState": "QUALITY_CHECK",
    "newState": "READY_FOR_DELIVERY",
    "changedBy": {
      "id": "usr_admin",
      "fullName": "Admin Name",
      "role": "ADMIN"
    },
    "note": "Quality check passed",
    "timestamp": "2025-01-15T10:30:00.123Z",
    "client": {
      "id": "usr_client",
      "fullName": "Priya Sharma"
    }
  }
}

CLIENT PAYLOAD (filtered — no internal data):
{
  "eventId": "evt_abc123",
  "eventType": "order.order.state_changed",
  "schemaVersion": "1.0",
  "occurredAt": "2025-01-15T10:30:00.123Z",
  "sequenceNumber": 1042,
  "payload": {
    "orderId": "ord_7f3a2b1c",
    "referenceNumber": "ORD-2025-000023",
    "newState": "READY_FOR_DELIVERY",
    "displayLabel": "Ready for Delivery",
    "message": "Great news! Your furniture is ready for delivery. We will contact you to schedule.",
    "timestamp": "2025-01-15T10:30:00.123Z",
    "nextAction": {
      "label": "Confirm Delivery Date",
      "type": "DELIVERY_SCHEDULING"
    }
  }
  // NOTE: previousState, changedBy, and note NOT included in client payload
  // changedBy is internal admin identity
  // previousState is implementation detail
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVENT: inquiry.inquiry.submitted
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic: /topic/admin.inquiries (all admins)

PAYLOAD:
{
  "eventType": "inquiry.inquiry.submitted",
  "sequenceNumber": 88,
  "payload": {
    "inquiryId": "inq_7f3a2b1c",
    "referenceNumber": "INQ-2025-000047",
    "client": {
      "id": "usr_client",
      "fullName": "Priya Sharma",
      "preferredContact": "WHATSAPP"
    },
    "furnitureSummary": "Custom L-shaped bookshelf",
    "budgetRange": {"min": 15000, "max": 35000},
    "submittedAt": "2025-01-15T10:30:00Z",
    "slaDeadline": "2025-01-16T10:30:00Z",
    "actions": [
      {
        "label": "View Inquiry",
        "href": "/api/v1/inquiries/inq_7f3a2b1c"
      }
    ]
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVENT: payment.milestone.confirmed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topics: /topic/admin.orders (admin), /user/queue/orders (client)

ADMIN PAYLOAD:
{
  "eventType": "payment.milestone.confirmed",
  "payload": {
    "orderId": "ord_7f3a2b1c",
    "referenceNumber": "ORD-2025-000023",
    "milestoneId": "ms_abc123",
    "milestoneLabel": "Advance Payment",
    "amountReceived": 42500.00,
    "currency": "INR",
    "paymentMethod": "UPI",
    "confirmedBy": "Admin Name",
    "orderAmountPaid": 42500.00,
    "orderAmountOutstanding": 42500.00,
    "orderStateChange": {
      "triggered": true,
      "newState": "IN_PRODUCTION"
    }
  }
}

CLIENT PAYLOAD (no payment method or reference):
{
  "eventType": "payment.milestone.confirmed",
  "payload": {
    "orderId": "ord_7f3a2b1c",
    "referenceNumber": "ORD-2025-000023",
    "milestoneLabel": "Advance Payment",
    "amountReceived": 42500.00,
    "currency": "INR",
    "message": "Your advance payment of ₹42,500 has been received. Production will begin shortly.",
    "formattedAmount": "₹42,500"
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVENT: system.alert.sla_breach
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic: /topic/admin.alerts (admins only)

PAYLOAD:
{
  "eventType": "system.alert.sla_breach",
  "payload": {
    "alertType": "INQUIRY_RESPONSE_SLA",
    "severity": "HIGH",
    "breachCount": 3,
    "breachedItems": [
      {
        "referenceNumber": "INQ-2025-000041",
        "hoursOverdue": 5.3,
        "clientName": "R*** S***"
      }
    ],
    "action": {
      "label": "View Overdue Inquiries",
      "href": "/api/v1/inquiries?status=SUBMITTED&slaStatus=OVERDUE"
    }
  }
}
```

---

## 4.3 Reconnect Behavior Contract

```
CLIENT-SIDE RECONNECT PROTOCOL:

State Machine:
  CONNECTED → DISCONNECTED (network drop) → RECONNECTING → CONNECTED
  RECONNECTING: exponential backoff [1s, 2s, 4s, 8s, 30s, 60s, 60s, 60s...]

On Reconnect (STOMP RE-CONNECT frame):
  1. Send new CONNECT frame with fresh access token
     (If access token expired: refresh first, then reconnect)
  2. Re-subscribe to all previous SUBSCRIBE destinations
  3. Send RECONCILE message to server:
     {
       "destination": "/app/reconcile",
       "body": {
         "entitySubscriptions": [
           {"entityType": "ORDER", "entityId": "ord_abc", "lastSeenSequence": 41},
           {"entityType": "INQUIRY", "entityId": "inq_def", "lastSeenSequence": 12}
         ]
       }
     }
  4. Server responds with missed events (up to 100 events, configurable):
     → Events with sequenceNumber > lastSeenSequence for each entity
     → If too many events missed (> 100): Server sends FULL_REFRESH signal
       Client then fetches fresh state via REST API

FULL_REFRESH SIGNAL:
{
  "eventType": "system.client.full_refresh_required",
  "payload": {
    "reason": "TOO_MANY_EVENTS_MISSED",
    "affectedEntities": ["ORDER:ord_abc", "INQUIRY:inq_def"],
    "instructions": "Fetch fresh state from REST API for listed entities."
  }
}

OFFLINE HANDLING:
→ WebSocket connection maintained during brief network interruptions (< 30s)
  via STOMP heartbeat tracking
→ If connection drops: display "Live updates paused" indicator in UI
→ UI continues to function with stale data (with staleness indicator)
→ On reconnect: staleness indicator removed, fresh data fetched
→ No write operations allowed while disconnected (server will reject stale
  state operations with 409 CONFLICT anyway — no special offline handling needed)

TOKEN EXPIRY DURING ACTIVE CONNECTION:
→ Server sends: system.auth.token_expiring (5 minutes before expiry)
→ Client silently refreshes token
→ Client sends updated CONNECT frame (STOMP re-authentication)
→ Server validates new token, connection continues uninterrupted

PAYLOAD:
{
  "eventType": "system.auth.token_expiring",
  "payload": {
    "expiresAt": "2025-01-15T10:45:00Z",
    "expiresInSeconds": 300
  }
}
```

---

# PART 5 — ERROR STANDARDS

---

## 5.1 Error Code Registry

```
HTTP STATUS → Error Code → Description → Retryable?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
400 BAD REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MALFORMED_JSON          Request body is not valid JSON               No
MISSING_REQUIRED_FIELD  Required field is absent from request        No
INVALID_CONTENT_TYPE    Content-Type must be application/json        No
INVALID_QUERY_PARAM     Query parameter has invalid format           No

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
401 UNAUTHORIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOKEN_MISSING           No Authorization header or cookie            No (re-auth)
TOKEN_INVALID           JWT signature verification failed            No (re-auth)
TOKEN_EXPIRED           JWT access token has expired                 No (refresh)
TOKEN_REVOKED           JWT JTI is in revoked set                    No (re-auth)
REFRESH_TOKEN_INVALID   Refresh token not found or expired           No (re-auth)
REFRESH_TOKEN_REUSED    Refresh token reuse detected (theft signal)  No (re-auth)
TOKEN_VERSION_MISMATCH  Token issued before password/role change     No (re-auth)
INVALID_CREDENTIALS     Email or password incorrect                  No
EMAIL_NOT_VERIFIED      Account email not yet verified               No

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
403 FORBIDDEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSUFFICIENT_PERMISSIONS Role lacks permission for this action       No
RESOURCE_ACCESS_DENIED  Client accessing another client's resource   No
ACCOUNT_DEACTIVATED     User account has been deactivated            No
MFA_REQUIRED            MFA verification required for this action    No (complete MFA)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
404 NOT FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESOURCE_NOT_FOUND      The requested resource does not exist        No
PRODUCT_NOT_FOUND       Specific product not found or archived       No
ORDER_NOT_FOUND         Order not found or not accessible            No
INQUIRY_NOT_FOUND       Inquiry not found                            No

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
409 CONFLICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMAIL_ALREADY_EXISTS    Email already registered                     No
STATE_CONFLICT          Optimistic lock version mismatch             Yes (refresh+retry)
DUPLICATE_RESOURCE      Unique constraint violation                  No
RESOURCE_LOCKED         Resource locked by concurrent operation      Yes (brief wait+retry)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
410 GONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION_TOKEN_USED Email verification token already consumed    No
API_VERSION_SUNSET      API version has been sunset                  No (upgrade)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
422 UNPROCESSABLE ENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION_ERROR        Field-level validation failures              No (fix input)
BUSINESS_RULE_VIOLATION Business logic constraint violated           No (fix input)
INVALID_STATE_TRANSITION Target state is not reachable from current  No (check state)
TRANSITION_PRECONDITION_FAILED Preconditions not met for transition  No (complete prereqs)
INQUIRY_LIMIT_REACHED   Max open inquiries reached                   No (close existing)
QUOTE_EXPIRED           Quotation validity period has passed         No (request new)
PAYMENT_AMOUNT_MISMATCH Payment amount doesn't match expected        No (correct amount)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
423 LOCKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCOUNT_LOCKED          Account temporarily locked (too many failures) Yes (after lockedUntil)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
429 TOO MANY REQUESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATE_LIMIT_EXCEEDED     Rate limit for endpoint exceeded             Yes (after Retry-After)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
500 INTERNAL SERVER ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERNAL_ERROR          Unexpected server error                      Yes (with backoff)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
503 SERVICE UNAVAILABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICE_UNAVAILABLE     Service temporarily unavailable              Yes (Retry-After)
DEPENDENCY_UNAVAILABLE  External dependency (Cloudinary, etc.) down  Yes (Retry-After)
```

---

## 5.2 Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        
        List<FieldError> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> new FieldError(
                fe.getField(),
                mapConstraintToErrorCode(fe.getCode()),
                fe.getDefaultMessage(),
                fe.getRejectedValue()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.status(422)
            .body(ErrorResponse.builder()
                .code("VALIDATION_ERROR")
                .message("Request validation failed")
                .details(fieldErrors)
                .traceId(MDC.get("traceId"))
                .requestId(MDC.get("requestId"))
                .timestamp(Instant.now())
                .documentation("https://docs.furnix.com/errors/VALIDATION_ERROR")
                .build());
    }
    
    @ExceptionHandler(InvalidStateTransitionException.class)
    public ResponseEntity<ErrorResponse> handleStateTransition(
            InvalidStateTransitionException ex) {
        return ResponseEntity.status(422)
            .body(ErrorResponse.builder()
                .code("INVALID_STATE_TRANSITION")
                .message(ex.getMessage())
                .detail("currentState", ex.getCurrentState())
                .detail("requestedState", ex.getRequestedState())
                .detail("validTransitions", ex.getValidTransitions())
                .traceId(MDC.get("traceId"))
                .build());
    }
    
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(
            OptimisticLockingFailureException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(409)
            .body(ErrorResponse.builder()
                .code("STATE_CONFLICT")
                .message("The resource was modified by another operation. Please refresh and retry.")
                .detail("hint", "Fetch the latest version and retry your operation")
                .traceId(MDC.get("traceId"))
                .build());
    }
    
    // CRITICAL: Generic exception handler must NOT expose internals
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {
        
        String traceId = MDC.get("traceId");
        
        // Log full details internally (with stack trace)
        log.error("Unhandled exception [traceId={}] on {} {}: {}",
            traceId, request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);
        
        // Report to error tracking (Sentry)
        Sentry.captureException(ex);
        
        // Return MINIMAL information to client (no stack trace, no internal detail)
        return ResponseEntity.status(500)
            .body(ErrorResponse.builder()
                .code("INTERNAL_ERROR")
                .message("An unexpected error occurred. Our team has been notified.")
                .traceId(traceId)    // Client can provide this for support
                .timestamp(Instant.now())
                .build());
    }
}
```

---

# PART 6 — SECURITY

---

## 6.1 Input Validation Layer

```java
// VALIDATION ARCHITECTURE: Three layers

// Layer 1: Controller-level (Jakarta Validation annotations)
@PostMapping("/inquiries")
public ResponseEntity<?> submitInquiry(
    @Valid @RequestBody SubmitInquiryRequest request) { ... }

// Layer 2: Request DTO validation constraints
public class SubmitInquiryRequest {
    
    @NotBlank(message = "Furniture type description is required")
    @Size(min = 10, max = 500, message = "Description must be 10–500 characters")
    @Pattern(
        regexp = "^[^<>\"'\\\\;]*$",
        message = "Description contains invalid characters"
    )
    private String furnitureType;
    
    @Valid  // Validates nested object
    private DimensionsRequest dimensions;
    
    @DecimalMin(value = "500.00", message = "Minimum budget is ₹500")
    @DecimalMax(value = "10000000.00", message = "Maximum budget is ₹1,00,00,000")
    @NotNull
    private BigDecimal budgetMin;
    
    @NotNull
    private BigDecimal budgetMax;
    
    @FutureMinDays(14)    // Custom annotation: must be at least 14 days from today
    private LocalDate desiredDeliveryDate;
    
    @NotNull
    @ValidEnum(enumClass = PreferredContact.class)
    private String preferredContact;
    
    @Size(max = 5, message = "Maximum 5 reference images allowed")
    private List<@NotBlank @ValidCloudinaryId String> referenceImageIds;
}

// Layer 3: Service-level business validation
@Service
public class InquiryService {
    
    public Inquiry submit(SubmitInquiryRequest request, UserPrincipal actor) {
        // Business rule validation (cannot be expressed in annotations):
        
        // Rule 1: Phone number required for WhatsApp contact
        if (request.getPreferredContact() == PreferredContact.WHATSAPP) {
            User user = userRepository.findById(actor.getId()).orElseThrow();
            if (!user.isPhoneVerified()) {
                throw new BusinessRuleViolationException(
                    "PHONE_REQUIRED_FOR_WHATSAPP",
                    "A verified phone number is required to use WhatsApp contact"
                );
            }
        }
        
        // Rule 2: Budget coherence (checked again server-side)
        if (request.getBudgetMin().compareTo(request.getBudgetMax()) > 0) {
            throw new ValidationException("budgetMin", "MUST_BE_LESS_THAN_MAX",
                "Minimum budget must be less than or equal to maximum budget");
        }
        
        // Rule 3: Open inquiry limit (inside transaction)
        // Checked again inside @Transactional to prevent race condition
    }
}

// SANITIZATION: HTML/XSS prevention
@Configuration
public class SanitizationConfig {
    
    @Bean
    public StringSanitizer htmlSanitizer() {
        // Uses OWASP Java HTML Sanitizer
        PolicyFactory policy = new HtmlPolicyBuilder()
            .allowElements("b", "i", "u", "p", "br")  // Allow minimal formatting
            .toFactory();
        
        return input -> input == null ? null : policy.sanitize(input.trim());
    }
}

// Applied in service layer before persistence:
String sanitizedDescription = htmlSanitizer.sanitize(request.getFurnitureType());
```

---

## 6.2 Injection Prevention

```java
// SQL INJECTION: Prevented by JPA + parameterized queries
// ALL database queries use JPA/Spring Data — no string concatenation

// SAFE (parameterized):
@Query("SELECT p FROM Product p WHERE p.categoryId = :categoryId AND p.status = :status")
List<Product> findByCategoryAndStatus(
    @Param("categoryId") String categoryId,
    @Param("status") ProductStatus status
);

// NEVER DO THIS (string concatenation — SQL injection):
String query = "SELECT * FROM products WHERE category = '" + categoryId + "'";
// → Blocked by code review + SonarQube rule: "java:S2077"

// FULL-TEXT SEARCH: Sanitize before passing to MySQL MATCH/AGAINST
private String sanitizeSearchQuery(String rawQuery) {
    if (rawQuery == null) return null;
    // Remove MySQL full-text search operators that could alter behavior:
    return rawQuery
        .replaceAll("[+\\-><()~*\"@]", " ")  // Remove FULLTEXT operators
        .replaceAll("\\s+", " ")
        .trim()
        .substring(0, Math.min(rawQuery.length(), 200));
}

// NOSQL INJECTION (Redis): Prevented by using typed Lettuce commands
// NEVER: redisTemplate.execute("SET " + key + " " + value) — command injection
// ALWAYS: redisTemplate.opsForValue().set(key, value, ttl, TimeUnit.SECONDS)

// LOG INJECTION: Prevent log forging via user-controlled input in log messages
// Log4j2/Logback with message lookup disabled:
// log4j2.formatMsgNoLookups=true (or use SLF4J structured logging)

// Structured logging prevents injection:
log.info("Inquiry submitted",     // Static message — no user input in message
    kv("inquiryId", inquiryId),   // User data as structured KV, not string format
    kv("clientId", clientId),
    kv("furnitureType", sanitized)
);
// NOT: log.info("Inquiry submitted for " + furnitureType); ← log injection risk
```

---

## 6.3 Security Headers

```java
// Security headers configuration:
@Configuration
public class SecurityHeadersConfig {
    
    @Bean
    public FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilter() {
        FilterRegistrationBean<SecurityHeadersFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new SecurityHeadersFilter());
        bean.addUrlPatterns("/*");
        return bean;
    }
}

public class SecurityHeadersFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        HttpServletResponse response = (HttpServletResponse) res;
        
        // Prevent MIME type sniffing:
        response.setHeader("X-Content-Type-Options", "nosniff");
        
        // Prevent clickjacking (API — no framing needed):
        response.setHeader("X-Frame-Options", "DENY");
        
        // XSS protection (legacy browsers):
        response.setHeader("X-XSS-Protection", "1; mode=block");
        
        // HSTS (force HTTPS):
        response.setHeader("Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload");
        
        // Referrer policy:
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // Content Security Policy (for API — restrictive):
        response.setHeader("Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'");
        
        // Remove server identification:
        response.setHeader("Server", "");
        response.setHeader("X-Powered-By", "");
        
        chain.doFilter(req, res);
    }
}
```

---

# PART 7 — OBSERVABILITY

---

## 7.1 Request Tracing

```java
// TRACE ID PROPAGATION: Every request gets a traceId
@Component
public class RequestTracingFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        
        // Accept trace from upstream (Cloudflare, ALB) or generate new one
        String traceId = Optional.ofNullable(request.getHeader("X-Trace-ID"))
            .filter(id -> id.matches("^[a-f0-9]{32}$"))  // Validate format (hex, 32 chars)
            .orElse(generateTraceId());
        
        String requestId = "req_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        
        // Set in MDC for automatic inclusion in all log lines:
        MDC.put("traceId", traceId);
        MDC.put("requestId", requestId);
        MDC.put("method", request.getMethod());
        MDC.put("path", request.getRequestURI());
        MDC.put("userAgent", request.getHeader("User-Agent"));
        
        // Propagate to response (client can report traceId for support):
        response.setHeader("X-Trace-ID", traceId);
        response.setHeader("X-Request-ID", requestId);
        
        long startTime = System.currentTimeMillis();
        
        try {
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            // Structured access log:
            log.info("Request completed",
                kv("traceId", traceId),
                kv("requestId", requestId),
                kv("method", request.getMethod()),
                kv("path", request.getRequestURI()),
                kv("statusCode", response.getStatus()),
                kv("durationMs", duration),
                kv("userId", MDC.get("userId")),  // Set by JWT filter if authenticated
                kv("userRole", MDC.get("userRole"))
            );
            
            MDC.clear();  // CRITICAL: Clear MDC after request to prevent thread pool leakage
        }
    }
    
    private String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
```

---

## 7.2 API Analytics

```java
// METRICS: Custom business + technical metrics
@Component
public class ApiMetricsCollector {
    
    private final MeterRegistry registry;
    
    // Request counters by endpoint + status:
    // http_server_requests_total{method="POST",uri="/api/v1/inquiries",status="201"}
    // → Provided automatically by Spring Boot Actuator + Micrometer
    
    // Custom business metrics:
    
    // Inquiry submission rate:
    public void recordInquirySubmitted(String furnitureType, String contactMethod) {
        Counter.builder("furnix.inquiries.submitted")
            .tag("contact_method", contactMethod)
            .register(registry)
            .increment();
    }
    
    // Quote approval conversion:
    public void recordQuoteApproved(BigDecimal value) {
        DistributionSummary.builder("furnix.quotes.approved.value")
            .baseUnit("INR")
            .publishPercentiles(0.5, 0.75, 0.95)
            .register(registry)
            .record(value.doubleValue());
    }
    
    // Order state transition tracking:
    public void recordStateTransition(String fromState, String toState) {
        Counter.builder("furnix.orders.state_transitions")
            .tag("from_state", fromState)
            .tag("to_state", toState)
            .register(registry)
            .increment();
    }
    
    // Payment method distribution:
    public void recordPaymentConfirmed(String paymentMethod, BigDecimal amount) {
        Counter.builder("furnix.payments.confirmed")
            .tag("method", paymentMethod)
            .register(registry)
            .increment();
        
        DistributionSummary.builder("furnix.payments.amounts")
            .tag("method", paymentMethod)
            .publishPercentiles(0.5, 0.95)
            .register(registry)
            .record(amount.doubleValue());
    }
    
    // WebSocket connection tracking:
    public void recordWebSocketConnected(String userRole) {
        Gauge.builder("furnix.websocket.connections.active",
            connectionStore, store -> store.countByRole(userRole))
            .tag("role", userRole)
            .register(registry);
    }
    
    // Admin SLA tracking:
    public void recordInquiryResponseTime(Duration responseTime) {
        Timer.builder("furnix.admin.inquiry_response_time")
            .publishPercentiles(0.5, 0.75, 0.95, 0.99)
            .publishPercentileHistogram()
            .register(registry)
            .record(responseTime);
    }
}
```

---

# PART 8 — PERFORMANCE

---

## 8.1 Response Compression

```yaml
# application.yml
server:
  compression:
    enabled: true
    mime-types:
      - application/json
      - text/html
      - text/css
      - application/javascript
    min-response-size: 1024   # Only compress responses > 1KB
                               # Small responses: compression overhead > savings

# Compression levels:
# JSON API responses: gzip typically achieves 70-80% size reduction
# Example: 50KB order list → ~10KB compressed
# Example: 2KB single product → ~600 bytes compressed (skip compression: < 1KB)
```

---

## 8.2 HTTP Caching Strategy

```java
// CACHE CONTROL per endpoint type:

@GetMapping("/catalog/products")
public ResponseEntity<PagedResponse<ProductSummaryDTO>> listProducts(...) {
    
    PagedResponse<ProductSummaryDTO> response = catalogService.listProducts(...);
    
    // Generate ETag from response content hash:
    String etag = '"' + DigestUtils.md5DigestAsHex(
        objectMapper.writeValueAsBytes(response)
    ) + '"';
    
    // Check If-None-Match header (client may have cached version):
    if (request.getHeader("If-None-Match") != null &&
        request.getHeader("If-None-Match").equals(etag)) {
        return ResponseEntity.status(304).build();  // Not Modified — no body
    }
    
    return ResponseEntity.ok()
        .header("Cache-Control", "public, max-age=60, stale-while-revalidate=30")
        .header("ETag", etag)
        .header("Vary", "Accept-Encoding, Accept-Language")
        .body(buildSuccessResponse(response));
}

// AUTHENTICATED endpoints: Never cached
@GetMapping("/orders")
public ResponseEntity<?> listOrders(...) {
    return ResponseEntity.ok()
        .header("Cache-Control", "no-store")
        .header("Pragma", "no-cache")  // Legacy compatibility
        .body(buildSuccessResponse(orders));
}

// STATIC reference data: Long cache
@GetMapping("/catalog/wood-types")
public ResponseEntity<?> listWoodTypes() {
    return ResponseEntity.ok()
        .header("Cache-Control", "public, max-age=3600")  // 1 hour
        .body(buildSuccessResponse(woodTypes));
}
```

---

## 8.3 Payload Optimization

```
FIELD SELECTION STRATEGY:

List endpoints return SUMMARY DTOs (not full entity DTOs):
  ProductSummaryDTO: id, slug, name, basePrice, primaryImageUrl, category
  OrderSummaryDTO:   id, referenceNumber, status, promisedDeliveryDate, totalAmount
  InquirySummaryDTO: id, referenceNumber, status, furnitureType, submittedAt

Detail endpoints return FULL DTOs:
  ProductDetailDTO: all fields including description, all images, variants
  OrderDetailDTO:   all fields including payment milestones, production stages

RATIONALE: A 12-item product listing returning full product objects
(including 5000-char descriptions) is 12× the payload it needs to be.
Summary DTOs reduce list response size by 60–80%.

DATE FORMAT STANDARDS:
→ All dates: ISO 8601 UTC: "2025-01-15T10:30:00.000Z"
→ Date-only fields: "2025-01-15"
→ Never: Unix timestamps (unreadable), local time without timezone

AMOUNT FORMAT STANDARDS:
→ All monetary: decimal number (not string): 85000.00
→ All monetary accompanied by currency: "currency": "INR"
→ Formatted display string provided separately: "formattedAmount": "₹85,000"
  (client uses formattedAmount for display; amount for calculation)
→ Never format amounts client-side with locale assumptions

NULL HANDLING:
→ Optional fields that have no value: null (not absent, not empty string)
→ Consistent: client can always check === null, not typeof field !== 'undefined'
→ Exception: pagination object is null (not present) on non-list endpoints
  to keep envelope predictable
```

---

# PART 9 — BACKWARD COMPATIBILITY

---

## 9.1 Versioning and Deprecation

```java
// DEPRECATION HEADER IMPLEMENTATION:
@Component
public class DeprecationHeaderFilter extends OncePerRequestFilter {
    
    private static final Map<String, DeprecationInfo> DEPRECATED_ENDPOINTS = Map.of(
        "GET /api/v1/catalog/products/search", new DeprecationInfo(
            LocalDate.of(2025, 6, 1),    // Announced deprecated
            LocalDate.of(2025, 12, 1),   // Sunset date
            "/api/v1/catalog/products?q={query}"  // Successor
        )
    );
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        
        String key = request.getMethod() + " " + request.getRequestURI();
        DeprecationInfo deprecation = DEPRECATED_ENDPOINTS.get(key);
        
        if (deprecation != null) {
            response.setHeader("Deprecation", "true");
            response.setHeader("Sunset", deprecation.sunsetDate().toString());
            response.setHeader("Link",
                "<" + deprecation.successorUri() + ">; rel=\"successor-version\"");
            
            // Log deprecated endpoint usage for migration tracking:
            log.warn("Deprecated endpoint accessed",
                kv("endpoint", key),
                kv("sunsetDate", deprecation.sunsetDate()),
                kv("userId", MDC.get("userId")),
                kv("clientVersion", request.getHeader("X-Client-Version"))
            );
        }
        
        chain.doFilter(request, response);
    }
}

// FIELD DEPRECATION (within a version — no version bump needed):
// Use @Deprecated annotation in DTO + document in response:
public class OrderSummaryDTO {
    
    private String status;      // Current field
    
    @Deprecated                 // Will be removed in v2
    @JsonProperty("orderStatus")  // Old field name — kept for backward compatibility
    public String getOrderStatus() {
        return this.status;     // Returns same value as status
    }
    
    // In addition: include deprecation notice in API changelog
}

// CLIENT COMPATIBILITY GUARANTEES:
// Clients MUST:
→ Tolerate additional JSON fields in responses (ignore unknown fields)
→ Tolerate new enum values they don't recognize (treat as unknown, not error)
→ Not depend on field ORDER in JSON (JSON spec: order undefined)
→ Not depend on response header presence (headers may be added/removed)

// Clients CAN rely on:
→ All documented fields being present (or explicitly null) in responses
→ HTTP status codes not changing for existing operations
→ Error code strings being stable within a major version
→ Pagination structure being stable within a major version
→ Event type names being stable (new event types may be added)
```

---

## 9.2 API Changelog Format

```markdown
# Furnix API Changelog

## v1.3.2 — 2025-01-15

### Added
- `GET /api/v1/orders/{id}` now includes `nextActions` array
  suggesting contextual follow-up actions for admin
- `POST /api/v1/orders/{id}/transitions` response now includes
  `nextActions` array
- `dataFreshness` field added to `GET /api/v1/admin/dashboard/summary`
  response indicating cache age

### Changed (non-breaking — additive only)
- `GET /api/v1/catalog/products` now includes `availableWoodTypes`
  array in each product item (previously only in product detail)
- Error responses now include `documentation` field with link
  to error documentation

## v1.3.1 — 2025-01-01

### Fixed
- `POST /api/v1/inquiries` rate limit changed from 3/hour to 5/hour
  to accommodate legitimate repeat submissions

### Deprecated
- `GET /api/v1/catalog/products/search` deprecated
  Use: `GET /api/v1/catalog/products?q={query}`
  Sunset date: 2025-12-01

## v2.0.0 — PLANNED (2025-Q3)

### Breaking Changes
- `order.status` field values renamed for consistency:
  "IN_PRODUCTION" → "PRODUCTION_ACTIVE"
- `GET /api/v1/orders` default sort changed from CREATED_AT to DELIVERY_DATE
- Authentication: MFA now required for all ADMIN accounts
```

---

## API Contract Summary Table

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    API GOVERNANCE DECISIONS                             │
├───────────────────────────┬─────────────────────────────────────────────┤
│ Decision                  │ Choice & Rationale                          │
├───────────────────────────┼─────────────────────────────────────────────┤
│ API Protocol              │ REST + STOMP/WebSocket                      │
│                           │ REST: stability, caching, tooling           │
│                           │ STOMP: topic subscriptions for RT events    │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Versioning                │ URI path (/api/v1/...)                      │
│                           │ Sunset headers for deprecation lifecycle     │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Auth                      │ RS256 JWT (15 min) + opaque RT (7 days)     │
│                           │ RT in HttpOnly cookie, AT in memory         │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Response envelope         │ Consistent: success, data, meta, pagination │
│                           │ All endpoints, no exceptions                 │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Error format              │ Typed error codes + field-level details     │
│                           │ traceId for support correlation              │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Idempotency               │ X-Idempotency-Key on all write operations   │
│                           │ Required for financial operations            │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Pagination                │ Cursor-based for ordered collections         │
│                           │ Offset-based for admin sorted lists          │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Event naming              │ {domain}.{entity}.{past_tense}              │
│                           │ Monotonic sequence per entity               │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Caching                   │ Cache-Control headers per endpoint type     │
│                           │ ETag for conditional GET                    │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Data in client payload    │ Internal fields excluded from client DTOs   │
│                           │ Four-layer security enforcement             │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Backward compatibility    │ Additive changes only within v1             │
│                           │ Breaking changes require v2 + 6-month grace │
└───────────────────────────┴─────────────────────────────────────────────┘
```

---

*This API contract document defines the complete external interface for Furnix. All endpoints, events, and error codes defined here constitute a commitment to API consumers. Changes to any contract element must go through the deprecation process. New capabilities may be added additively at any time without version increment.*