# Furnix — Production-Grade Threat Model & Security Architecture
### Version 1.0 | Security Architecture Review Document

---

## Document Preamble

This document treats security not as a feature list but as a **property of the system** that must be maintained continuously. Every section is written against a specific adversary model and evaluated for operational consequence — not theoretical risk.

**Adversary Model for Furnix:**

```
Adversary Type          Motivation                    Capability Level
────────────────────────────────────────────────────────────────────────
Opportunistic Bot       Credential stuffing,          Low — automated tools,
                        spam inquiries                no custom exploits

Disgruntled Client      View competitor orders,       Medium — authenticated,
                        manipulate own order data     knows the UI

Competitor              Business intelligence,        Medium — motivated,
                        operational disruption        some technical skill

Former Employee         Access after termination,     Medium-High — knows
                        data exfiltration             system internals

Automated Scraper       Catalog data, pricing,        Low-Medium — HTTP
                        client data enumeration       automation tools

Sophisticated Attacker  Full system compromise,       High — custom exploits,
                        financial data theft          patient, targeted
```

**Operational Consequence Framework:**
Every vulnerability is evaluated on:
- **Business Impact**: Revenue loss, reputation damage, legal liability
- **Recovery Cost**: Time and money to remediate
- **Detection Likelihood**: Would the team know it happened?
- **Exploitability**: How hard is it to execute?

---

# PART 1 — THREAT SURFACE ANALYSIS

---

## 1.1 Authentication Threat Surface

```
THREAT: A-01 — Credential Stuffing Attack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Attacker uses credentials from other breached websites
  (purchased from dark web) and attempts login on Furnix.
  Assumes users reuse passwords across services.

Attack Vector:
  POST /api/v1/auth/login with credential pairs at scale.
  Tools: OpenBullet, Sentry MBA, custom Python scripts.
  Rate: 500–10,000 attempts per hour from distributed IPs.

Operational Consequence:
  → Attacker gains access to client accounts.
  → Can view order status, delivery address, payment amounts.
  → Can approve quotations (commits client to financial obligation).
  → Can submit fraudulent inquiries in client's name.
  → Business reputation damage: client discovers order placed without consent.

Current Vulnerability Assessment:
  → WITHOUT protection: Single IP can make unlimited attempts.
    Credential stuffing requires only 0.1% success rate to be profitable.
    At 10,000 attempts: 10 compromised accounts expected.

Mitigations (Layered Defense):

Layer 1: Rate Limiting (per IP)
  Max 10 failed login attempts per IP per 15-minute window.
  Implementation:
  
  @Component
  public class LoginRateLimitService {
      private static final int MAX_ATTEMPTS = 10;
      private static final Duration WINDOW = Duration.ofMinutes(15);
      
      public RateLimitResult checkLoginRateLimit(String ipAddress, String email) {
          String ipKey = "ratelimit:login:ip:" + hashIp(ipAddress);
          String emailKey = "ratelimit:login:email:" + email.toLowerCase();
          
          Long ipAttempts = redis.increment(ipKey);
          if (ipAttempts == 1) redis.expire(ipKey, WINDOW);
          
          Long emailAttempts = redis.increment(emailKey);
          if (emailAttempts == 1) redis.expire(emailKey, WINDOW);
          
          // Dual limit: per IP AND per email
          // IP limit catches distributed attack on many accounts
          // Email limit catches targeted attack on one account from many IPs
          if (ipAttempts > MAX_ATTEMPTS || emailAttempts > MAX_ATTEMPTS) {
              securityLogger.logRateLimitTrigger(ipAddress, email, ipAttempts);
              return RateLimitResult.exceeded();
          }
          return RateLimitResult.allowed();
      }
  }

Layer 2: Progressive Lockout (per account)
  3 failures: 5-minute lockout
  5 failures: 15-minute lockout
  10 failures: 1-hour lockout + admin alert
  20 failures: permanent lock until admin review

Layer 3: CAPTCHA (Cloudflare Turnstile — invisible for humans)
  Triggered after: 3rd failed attempt from same IP
  CAPTCHA type: Invisible (no user friction for legitimate users)
  If CAPTCHA fails: Hard block for 1 hour

Layer 4: Breach Password Detection
  On registration and password change:
  Check against HaveIBeenPwned API (k-anonymity model — SHA1 prefix only)
  Reject passwords found in known breaches.
  
  private boolean isPasswordBreached(String password) {
      String sha1 = DigestUtils.sha1Hex(password).toUpperCase();
      String prefix = sha1.substring(0, 5);
      String suffix = sha1.substring(5);
      
      // HIBP k-anonymity: send only 5-char prefix
      // Server returns all hashes with that prefix
      List<String> hashes = hibpClient.getHashesByPrefix(prefix);
      return hashes.stream().anyMatch(h -> h.startsWith(suffix));
  }

Layer 5: Cloudflare Bot Detection
  ASN reputation scoring
  User-Agent validation
  JavaScript challenge for suspicious traffic
  IP reputation from Cloudflare's global threat intelligence

Residual Risk: MEDIUM-LOW after all layers applied.
Monitoring: Alert on email accounts with >5 failed logins in 24h.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAT: A-02 — JWT Token Theft
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Attacker obtains a valid JWT access token through:
  a) XSS attack that reads token from localStorage
  b) Man-in-the-middle (if TLS misconfigured)
  c) Insider threat with access to application memory dumps
  d) Malicious browser extension

Operational Consequence:
  → Attacker impersonates user for up to 15 minutes (access token TTL).
  → For admin tokens: full dashboard access, can record payments,
    update order states, view all client data.
  → Cannot extend session (refresh token is HttpOnly cookie — not accessible to JS).
  → Detection window: 15 minutes maximum before token expires.

Current Architecture Strengths:
  → Access token stored in memory (not localStorage) → XSS cannot steal it
  → Refresh token in HttpOnly cookie → XSS cannot read it
  → RS256 signing → private key on server only, cannot be forged

Remaining Risk — XSS Token Interception:
  Even with memory storage, XSS can:
  → Call the API directly using the same browser context (same-origin)
  → The browser includes the auth header automatically if token in memory
    (if code sets it globally: axios.defaults.headers.common['Authorization'])
  → XSS can exfiltrate data via XHR calls in the browser's authenticated context

XSS Prevention (comprehensive):
  
  1. Content Security Policy:
  Content-Security-Policy:
    default-src 'none';
    script-src 'self';           ← No inline scripts, no eval()
    style-src 'self' 'unsafe-inline';  ← Tailwind needs this; consider nonce
    img-src 'self' https://res.cloudinary.com data:;
    connect-src 'self' wss://api.furnix.com https://api.cloudinary.com;
    font-src 'self';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    upgrade-insecure-requests;
  
  2. Input Sanitization (server-side):
  All user-provided text sanitized with OWASP Java HTML Sanitizer
  before persistence AND before inclusion in any response.
  
  3. Output Encoding:
  React's JSX escapes by default.
  dangerouslySetInnerHTML: Prohibited in codebase (enforced by ESLint rule).
  
  eslint rule:
  "react/no-danger": "error"
  
  4. Subresource Integrity:
  All CDN-hosted scripts include integrity hashes.
  Any script modification invalidates the hash and browser blocks execution.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAT: A-03 — OAuth Account Takeover
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  If attacker compromises victim's Google account, they gain
  access to all services where that Google account is used for OAuth.
  
  Additionally: OAuth state parameter CSRF attack.
  Attacker generates OAuth flow, captures the redirect URL before
  completing it, tricks victim into visiting it — logging victim into
  attacker's account.

CSRF Protection for OAuth:
  1. Generate cryptographically random state parameter (32 bytes)
  2. Store in server-side session (not in URL, not in cookie alone)
  3. Validate state parameter on callback EXACTLY matches stored value
  4. State is single-use (invalidated after use)
  
  String oauthState = generateSecureRandom(32);
  httpSession.setAttribute("oauth_state", oauthState);
  // Include in authorization URL
  // Validate on callback: request.getParameter("state").equals(session.getAttribute("oauth_state"))

Google Account Compromise Mitigation:
  → Cannot prevent Google account compromise
  → Can limit blast radius: OAuth login cannot create admin accounts
  → Can detect: Alert on new OAuth login from new IP/device
  → Can remediate: Admin force-logout capability
```

---

## 1.2 Authorization Threat Surface

```
THREAT: B-01 — Insecure Direct Object Reference (IDOR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Client A knows their order ID (ORD-2025-000023).
  They increment or guess Client B's order ID (ORD-2025-000024).
  If server returns Client B's data: IDOR vulnerability.

Attack Vectors:
  GET /api/v1/orders/ord_7f3a2b1c → Guess or enumerate other order IDs
  GET /api/v1/quotations/qt_abc123 → Access another client's quotation
  GET /api/v1/inquiries/inq_def456 → Read another client's inquiry

Operational Consequence:
  → Full order data exposure: client names, addresses, amounts paid,
    delivery dates, furniture specifications.
  → Competitor intelligence: pricing, lead times, client volume.
  → PII exposure: delivery addresses of all clients.
  → Legal liability: GDPR personal data breach notification required.

Why UUID Alone Is Insufficient Defense:
  UUIDs are not secret — they are transmitted in URLs, emails,
  WhatsApp messages. A client who receives ORD-2025-000023 in their
  email may share that URL. UUID randomness prevents sequential guessing
  but does not prevent a client who knows a valid UUID from accessing it.

MANDATORY: Server-Side Ownership Verification
Every single order/inquiry/quotation endpoint must verify:
  currentUser.id == resource.clientId  OR  currentUser.role ∈ {ADMIN, SUPER_ADMIN}

NEVER rely on:
  → URL structure to imply ownership
  → Client-provided user ID in request body
  → Frontend routing to prevent access (frontend can be bypassed)

Implementation:
  // Correct: ownership check in service layer
  @Service
  public class OrderService {
      public OrderDetailDTO getOrder(String orderId, UserPrincipal actor) {
          Order order = orderRepository.findById(orderId)
              .orElseThrow(() -> new ResourceNotFoundException("ORDER", orderId));
          
          // CRITICAL: Ownership verification before returning any data
          if (!actor.hasRole(ADMIN, SUPER_ADMIN) &&
              !order.getClientId().equals(actor.getId())) {
              // Return 404 NOT 403
              // 403 reveals the resource exists
              // 404 reveals nothing
              throw new ResourceNotFoundException("ORDER", orderId);
          }
          
          return orderMapper.toDetailDTO(order, actor.getRole());
      }
  }
  
  // Testing: IDOR tests in integration test suite
  @Test
  void clientCannotAccessAnotherClientsOrder() {
      String orderId = createOrderForClient(clientA);
      
      // Attempt access as clientB
      given()
          .header("Authorization", "Bearer " + clientBToken)
      .when()
          .get("/api/v1/orders/" + orderId)
      .then()
          .statusCode(404);  // 404, not 403 — do not reveal existence
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAT: B-02 — Privilege Escalation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  CLIENT role user attempts to access ADMIN endpoints.
  
  Vector 1: Direct API call with CLIENT token to admin endpoint.
  Vector 2: Parameter tampering — sending role: "ADMIN" in request body.
  Vector 3: JWT algorithm confusion attack (HS256/RS256 confusion).

JWT Algorithm Confusion Attack:
  If server uses RS256 but also accepts HS256:
  Attacker takes RS256 public key (which is public!),
  uses it as the HMAC secret for HS256,
  crafts a token with role: "SUPER_ADMIN",
  signs with HS256 using the public key as secret.
  If server validates with HS256 using same key: ACCEPTS the forged token.

Prevention:
  // CRITICAL: Explicitly reject any algorithm other than RS256
  JwtParser parser = Jwts.parserBuilder()
      .setSigningKey(rsaPublicKey)
      .requireAlgorithm("RS256")  // Hard-code algorithm — never take from token header
      .build();
  
  // Never use: Jwts.parserBuilder().setSigningKeyResolver(...)
  // That pattern allows algorithm to be specified in the token header

Parameter Tampering Prevention:
  → Role NEVER accepted from request body, query parameters, or headers
  → Role ONLY read from validated JWT claims
  → JWT claims ONLY trusted after signature verification
  
  // Wrong (accepts client-provided role):
  @PostMapping("/admin/orders")
  public void createOrder(@RequestBody OrderRequest request) {
      if (request.getUserRole().equals("ADMIN")) { ... }  // NEVER DO THIS
  }
  
  // Correct:
  @PostMapping("/admin/orders")
  @PreAuthorize("hasRole('ADMIN')")  // Role from JWT, not request
  public void createOrder(@RequestBody OrderRequest request,
                          @AuthenticationPrincipal UserPrincipal user) {
      // user.getRole() comes from JWT (server-verified)
      // request never contains role information
  }
```

---

## 1.3 API Exposure Threats

```
THREAT: C-01 — API Enumeration & Intelligence Gathering
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Attacker systematically calls API endpoints to gather:
  → Business intelligence (pricing, order volumes, client data)
  → System information (error messages revealing technology stack)
  → Valid user emails (through registration/login response differences)

Error Response Standardization:
  ALL 404 responses use identical response body and timing:
  → "Resource not found" — same for: does not exist, access denied, deleted
  → Never reveal: "User not found" (email enumeration)
                  "Order belongs to different user" (IDOR signal)
                  "Product archived" (reveals archive status)
  
  Timing attack prevention for login:
  Even if user does not exist, still execute BCrypt.verify()
  (use a dummy hash) to ensure constant response time.
  
  @Service
  public class AuthService {
      // Pre-computed BCrypt hash of dummy password for timing normalization
      private static final String DUMMY_HASH = BCrypt.hashpw("dummy", BCrypt.gensalt(12));
      
      public LoginResult authenticate(String email, String password) {
          Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
          
          String hashToVerify = userOpt
              .map(User::getPasswordHash)
              .orElse(DUMMY_HASH);  // Always run BCrypt regardless of user existence
          
          boolean passwordValid = BCrypt.checkpw(password, hashToVerify);
          
          if (userOpt.isEmpty() || !passwordValid) {
              // Same response regardless of which condition failed
              throw new InvalidCredentialsException();
          }
          // ...
      }
  }

THREAT: C-02 — Mass Assignment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Client sends additional JSON fields in request body:
  {"furnitureType": "...", "role": "ADMIN", "isActive": true, "clientId": "other-user"}
  
  If server blindly maps request body to entity: these fields overwrite DB values.

Prevention — NEVER use JPA entities as request objects:
  
  // WRONG: Entity as request body (mass assignment vulnerability)
  @PostMapping("/profile")
  public void updateProfile(@RequestBody User user) {
      userRepository.save(user);  // NEVER DO THIS — attacker controls all fields
  }
  
  // CORRECT: Dedicated DTO with only allowed fields
  public class UpdateProfileRequest {
      @Size(max = 200) private String fullName;
      @Pattern(regexp = "^\\+[1-9]\\d{1,14}$") private String phoneNumber;
      // Role, isActive, email: NOT PRESENT IN DTO
      // Jackson will ignore these fields even if sent in request
  }
  
  @PostMapping("/profile")
  public void updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                            @AuthenticationPrincipal UserPrincipal user) {
      // Only fullName and phoneNumber can be changed
      // Even if attacker sends {"role": "ADMIN"}, it is ignored
  }
```

---

## 1.4 WebSocket Vulnerabilities

```
THREAT: D-01 — WebSocket Authentication Bypass
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  WebSocket upgrade requests are HTTP requests.
  If authentication is not enforced at the UPGRADE request level,
  an unauthenticated connection could subscribe to admin topics.
  
  Additionally: WebSocket connections persist for hours.
  If token is revoked after connection established, old connection
  may continue receiving events.

Token Validation at Connection AND During Session:

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Validate token at CONNECTION time
            String token = accessor.getFirstNativeHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                throw new MessagingException("Missing authorization token");
            }
            
            UserPrincipal user = jwtService.validateAndExtract(token.substring(7));
            accessor.setUser(user);  // Attach to session
            
            // Store session with expiry for periodic revalidation
            wsSessionRegistry.register(accessor.getSessionId(), user, jwtService.getExpiry(token));
        }
        
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            // Validate subscription authorization
            String destination = accessor.getDestination();
            UserPrincipal user = (UserPrincipal) accessor.getUser();
            
            if (!topicAuthorizationService.canSubscribe(user, destination)) {
                throw new MessagingException("Not authorized for destination: " + destination);
            }
        }
        
        return message;
    }
}

// Periodic token revalidation during active connections:
@Scheduled(fixedDelay = 60_000)  // Every 60 seconds
public void revalidateActiveSessions() {
    wsSessionRegistry.getActiveSessions().forEach(session -> {
        // Check: Is user still active? Was role changed? Was session revoked?
        UserValidationResult result = userValidationService.validate(session.getUserId());
        
        if (!result.isValid()) {
            // Send REVOKED event to client, then close connection
            simpMessagingTemplate.convertAndSendToUser(
                session.getUserId(), "/queue/system",
                new SystemEvent("SESSION_REVOKED", result.getReason())
            );
            webSocketSessionManager.closeSession(session.getSessionId(),
                CloseStatus.POLICY_VIOLATION);
        }
    });
}

THREAT: D-02 — WebSocket Message Injection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Client sends crafted STOMP messages to topics they don't own.
  Attempt to publish events to /topic/admin.orders from client connection.

Prevention:
  → Server-side: Only server publishes to topics (clients can only SUBSCRIBE)
  → Client message destinations prefix: /app/* (handled by @MessageMapping)
  → Reject any client message to /topic/* directly
  
  @Configuration
  public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {
      @Override
      protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
          messages
              .simpSubscribeDestMatchers("/topic/admin.**")
                  .hasAnyRole("ADMIN", "SUPER_ADMIN", "SHOP_MANAGER")
              .simpSubscribeDestMatchers("/user/queue/**")
                  .authenticated()
              .simpMessageDestMatchers("/app/**")
                  .authenticated()
              .anyMessage()
                  .denyAll();
      }
  }
```

---

## 1.5 Injection Threat Surface

```
THREAT: E-01 — SQL Injection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Risk: LOW with JPA/Hibernate — but specific patterns require attention.

HIGH-RISK PATTERNS:
  Pattern 1: Native queries with string concatenation
  → Prohibited: @Query(value = "SELECT * FROM orders WHERE client = '" + name + "'", nativeQuery=true)
  → Required: @Query(value = "SELECT * FROM orders WHERE client = :name", nativeQuery=true)
  
  Pattern 2: JPQL with string interpolation
  → Prohibited: entityManager.createQuery("FROM Order WHERE status = '" + status + "'")
  → Required: entityManager.createQuery("FROM Order WHERE status = :status")
                            .setParameter("status", status)
  
  Pattern 3: Full-text search query sanitization
  MySQL FULLTEXT AGAINST operator can be abused:
  → Input: +teak* (Boolean mode modifier — changes search behavior)
  → Prevention: Strip all FULLTEXT operators before query
    [+\-><()~*\"@] → removed from search input
  
  Pattern 4: ORDER BY injection (cannot use parameterized for column names)
  → Prohibited: "ORDER BY " + userInput
  → Required: Whitelist allowed sort columns, reject unknown columns:
    
    private static final Set<String> ALLOWED_SORT_COLUMNS = Set.of(
        "created_at", "updated_at", "base_price", "display_order", "status"
    );
    
    private String validateSortColumn(String column) {
        if (!ALLOWED_SORT_COLUMNS.contains(column)) {
            throw new ValidationException("Invalid sort column: " + column);
        }
        return column;
    }

ENFORCEMENT:
  → SonarQube rule: java:S2077 (SQL injection detection)
  → CodeQL query: java/sql-injection
  → Mandatory code review checklist item: "No string concatenation in queries"

THREAT: E-02 — Server-Side Request Forgery (SSRF)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  If any server-side code fetches URLs provided by users,
  attacker can point to: internal metadata services, internal APIs,
  cloud provider metadata endpoint (169.254.169.254).

Risk in Furnix:
  → Webhook URL configuration (Phase 2 payment gateway callbacks)
  → Any feature that fetches user-provided URLs

Prevention:
  → Validate all outbound URLs against allowlist before fetching
  → Block: 127.0.0.1, 169.254.169.254, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  → Block: file://, gopher://, dict:// schemes
  → Never follow redirects on user-provided URLs without re-validating destination
  
  private void validateOutboundUrl(String url) {
      try {
          URI uri = new URI(url);
          InetAddress address = InetAddress.getByName(uri.getHost());
          
          if (isPrivateAddress(address)) {
              throw new SecurityException("URL resolves to private address");
          }
          
          if (!List.of("https").contains(uri.getScheme())) {
              throw new SecurityException("Only HTTPS URLs allowed");
          }
      } catch (URISyntaxException | UnknownHostException e) {
          throw new ValidationException("Invalid URL: " + url);
      }
  }
```

---

# PART 2 — ABUSE & MISUSE SCENARIOS

---

## 2.1 Spam and Automated Abuse

```
THREAT: F-01 — Inquiry Spam
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Automated accounts submit hundreds of fake custom furniture inquiries.
  Each requires admin time to review and reject.
  At scale: overwhelms admin's working capacity.

Operational Consequence:
  → Admin spends hours on fake inquiries.
  → Real client inquiries buried, delayed, SLA breached.
  → Business reputation impact: real clients get slow responses.
  → Each inquiry may trigger email notifications.
    1,000 spam inquiries = 1,000 emails to admin = email domain reputation damage.

Multi-Layer Defense:

Layer 1: Email Verification Gate
  → Inquiry submission requires verified email.
  → Disposable email detection:
  
  private static final Set<String> DISPOSABLE_DOMAINS = loadDisposableDomainList();
  // Load from: https://github.com/disposable-email-domains/disposable-email-domains
  // Updated weekly via background job
  
  private boolean isDisposableEmail(String email) {
      String domain = email.substring(email.indexOf('@') + 1).toLowerCase();
      return DISPOSABLE_DOMAINS.contains(domain);
  }

Layer 2: Account Age Gate
  → Accounts less than 24 hours old: Maximum 1 inquiry.
  → Accounts less than 7 days old: Maximum 2 inquiries.
  → Established accounts: Maximum 3 concurrent open inquiries.

Layer 3: Content Analysis (heuristic, not ML at MVP)
  Suspicious patterns flagged for manual review (not auto-rejected):
  → Inquiry description < 20 characters (too vague for legitimate inquiry)
  → Budget range impossibly wide (₹100 to ₹10,000,000)
  → Same IP submitting with different accounts within 1 hour
  → Description matches known spam templates (exact string match)
  
  Flagged inquiries: Status = SUBMITTED_FLAGGED
  Admin sees flag indicator. Can dismiss flag or mark as spam.

Layer 4: IP Reputation
  → Cloudflare Threat Score > 50: Require CAPTCHA before inquiry form loads.
  → Known VPN/datacenter ASNs: Soft challenge (visible CAPTCHA).
  → Tor exit nodes: Block inquiry submission (legitimate furniture buyers
    do not buy custom furniture over Tor).

THREAT: F-02 — Account Factory (Registration Spam)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Automated registration of many accounts using:
  → Temporary/disposable email addresses
  → Gmail + addressing (user+1@gmail.com, user+2@gmail.com)
  → Random name generators

Prevention:
  → Disposable email detection (as above)
  → Gmail subaddress normalization: user+anything@gmail.com → user@gmail.com
    (treat as same email for uniqueness check)
  → Phone number verification for inquiry submission
    (prevents automated accounts without real phone numbers from creating inquiries)
  → Registration rate limit: 5 registrations per /24 subnet per hour
    (stricter than per-IP because attackers rotate IPs within subnets)
```

---

## 2.2 Replay Attacks

```
THREAT: G-01 — Payment Webhook Replay
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description (Phase 2 — payment gateway):
  Attacker captures a legitimate payment webhook (POST from Razorpay/Stripe).
  Replays it multiple times to the Furnix webhook endpoint.
  Without protection: Furnix records multiple payments from one transaction.

Prevention:
  // Idempotency check using gateway transaction ID:
  @PostMapping("/webhooks/payment")
  public ResponseEntity<Void> handlePaymentWebhook(
          @RequestBody PaymentWebhookEvent event,
          @RequestHeader("X-Razorpay-Signature") String signature) {
      
      // Step 1: Verify webhook signature (HMAC-SHA256)
      if (!webhookSignatureVerifier.verify(event, signature)) {
          log.warn("Invalid webhook signature received");
          return ResponseEntity.status(400).build();
      }
      
      // Step 2: Idempotency check
      String transactionId = event.getPaymentId();
      if (paymentRecordRepository.existsByGatewayTransactionId(transactionId)) {
          // Already processed — return 200 to stop gateway from retrying
          return ResponseEntity.ok().build();
      }
      
      // Step 3: Timestamp freshness check
      Instant eventTime = Instant.ofEpochSecond(event.getCreatedAt());
      if (eventTime.isBefore(Instant.now().minus(Duration.ofHours(24)))) {
          log.warn("Stale webhook event rejected: {}", transactionId);
          return ResponseEntity.status(400).build();
      }
      
      // Step 4: Process payment (inside distributed lock)
      distributedLock.withLock("payment:" + transactionId, () -> {
          processPayment(event);
      });
      
      return ResponseEntity.ok().build();
  }

THREAT: G-02 — API Request Replay
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Attacker captures a valid API request (e.g., order state transition).
  Replays it after the original operation completed.
  
  Scenario: Admin transitions order from QUALITY_CHECK to READY_FOR_DELIVERY.
  Attacker replays this request → second transition attempt.
  Without protection: 422 because state machine rejects it (state already changed).
  This is actually already protected by the state machine guards.

However — Replay Risk for Non-Idempotent Operations:
  → POST /api/v1/inquiries without idempotency key: Creates duplicate inquiry.
  → POST /api/v1/orders/{id}/payments/{id}/confirm: Records payment twice.

Prevention:
  → X-Idempotency-Key required on all non-idempotent operations.
  → Server stores: MD5(userId + idempotencyKey) → response, TTL 24 hours.
  → On replay: Return cached response, never re-process.
  → Idempotency key validation: UUID format enforced.
```

---

## 2.3 Denial of Service

```
THREAT: H-01 — Application-Level DoS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  Unlike network-level DDoS (handled by Cloudflare),
  application-level DoS targets expensive operations:
  → Submitting large image uploads simultaneously
  → Triggering full-text search with complex queries in rapid succession
  → Requesting many large paginated result sets simultaneously
  → Requesting PDF generation for many quotations simultaneously

Expensive Operation Identification:
  Operation                    Cost              Mitigation
  ─────────────────────────────────────────────────────────────────
  Full-text product search     DB CPU intensive  Rate limit: 30/min/user
  PDF quotation generation     CPU + memory      Queue with max concurrency: 2
  Image upload (10MB)          Bandwidth + CPU   Rate limit: 20/min/user
  Dashboard aggregate queries  DB I/O            Cache results 60s
  Order status history         DB joins          Paginate, max 100 records
  
  // Semaphore for PDF generation concurrency control:
  @Component
  public class PdfGenerationService {
      private final Semaphore concurrencyLimit = new Semaphore(2);
      // Max 2 PDFs generated simultaneously — prevents CPU spike
      
      public byte[] generateQuotationPdf(String quotationId) {
          boolean acquired = concurrencyLimit.tryAcquire(5, TimeUnit.SECONDS);
          if (!acquired) {
              throw new ServiceUnavailableException("PDF generation queue full. Try again in a moment.");
          }
          try {
              return pdfRenderer.render(quotationId);
          } finally {
              concurrencyLimit.release();
          }
      }
  }

THREAT: H-02 — ReDoS (Regular Expression Denial of Service)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Description:
  If input validation uses a vulnerable regex, attacker crafts
  input that causes exponential backtracking in the regex engine.
  Single request can consume 100% CPU for seconds.

Vulnerable Pattern Example:
  // DANGEROUS: Catastrophic backtracking possible
  String emailRegex = "^([a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*)@([a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*)\\.([a-zA-Z]{2,})$";
  // Input: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa!" → exponential backtracking

Prevention:
  → Use Apache Commons Validator for email validation (battle-tested)
  → Use Java's InternetAddress parser for structural validation
  → For custom regex: Use ReGex tester with adversarial inputs
  → Set timeout on regex execution (Java doesn't natively support this —
    use separate thread with interrupt)
  → Test all validation regexes against ReDoS checkers before deployment
```

---

# PART 3 — IDENTITY & ACCESS MANAGEMENT

---

## 3.1 RBAC Implementation Security

```
RBAC SECURITY AUDIT CHECKLIST:

☐ Role stored in JWT — never in request parameters
☐ Role verified in JWT filter — never trusted from database alone per request
☐ Method-level security annotations on every controller method
☐ No unannotated endpoints except explicitly public routes
☐ IDOR check in service layer for every resource fetch
☐ Super Admin operations require MFA (Phase 2 mandatory)
☐ Admin role changes logged to audit trail with actor identity
☐ Role downgrade triggers immediate session invalidation

DETECTING MISSING AUTHORIZATION:
// ArchUnit test — fails if any controller method lacks security annotation:
@ArchTest
static final ArchRule allEndpointsMustBeAuthorized = methods()
    .that().areAnnotatedWith(GetMapping.class)
    .or().areAnnotatedWith(PostMapping.class)
    .or().areAnnotatedWith(PutMapping.class)
    .or().areAnnotatedWith(DeleteMapping.class)
    .should().beAnnotatedWith(PreAuthorize.class)
    .orShould().beAnnotatedWith(PermitAll.class)
    .because("All endpoints must explicitly declare authorization requirements");

This test runs in CI pipeline. Any endpoint added without authorization
annotation fails the build. Authorization cannot be forgotten.

PERMISSION BOUNDARY ENFORCEMENT:
Critical permissions that require SUPER_ADMIN regardless of other roles:
  → ORDER_CANCEL (cannot be delegated)
  → REFUND_ISSUE (financial — cannot be delegated)
  → ACCOUNT_DEACTIVATE (identity — cannot be delegated)
  → SYSTEM_CONFIG_CHANGE (operational)
  → AUDIT_LOG_EXPORT (compliance)
  → STAFF_ACCOUNT_CREATE (access management)

These permissions are hardcoded in the state machine and RBAC configuration,
NOT configurable at runtime. Admin cannot grant themselves SUPER_ADMIN permissions.
```

---

## 3.2 MFA Implementation

```
MFA STRATEGY: TOTP (Time-based One-Time Password — RFC 6238)

WHY TOTP OVER SMS:
  → SMS is vulnerable to SIM swap attacks.
    Attacker calls mobile carrier, social engineers transfer of victim's number.
    All SMS codes now go to attacker's phone.
  → TOTP is generated locally on authenticator app (Google Authenticator, Authy).
    No network dependency. No SIM swap risk.
  → SMS adds operational dependency on telecom infrastructure.
    If SMS provider down: all admin logins fail.

MFA ENROLLMENT FLOW:
  1. Admin navigates to Security Settings
  2. Click "Enable Two-Factor Authentication"
  3. Server generates TOTP secret (20 random bytes, Base32 encoded)
  4. Display QR code (otpauth://totp/Furnix:admin@furnix.com?secret=BASE32&issuer=Furnix)
  5. Admin scans with authenticator app
  6. Admin enters 6-digit code to verify enrollment
  7. Server verifies code: if valid → save encrypted secret, mark MFA enabled
  8. Display 8 backup codes (one-time use, store securely)
  9. MFA now required on all subsequent logins

TOTP VERIFICATION:
  @Service
  public class TotpService {
      private static final int WINDOW = 1;  // Accept 1 period before/after (clock skew)
      private static final int PERIOD = 30; // 30-second TOTP window
      
      public boolean verify(String encryptedSecret, String providedCode) {
          byte[] secret = encryptionService.decrypt(encryptedSecret);
          
          long currentTime = System.currentTimeMillis() / 1000L;
          long currentPeriod = currentTime / PERIOD;
          
          // Check current period + adjacent periods (clock skew tolerance)
          for (int delta = -WINDOW; delta <= WINDOW; delta++) {
              String expectedCode = generateTOTP(secret, currentPeriod + delta);
              if (constantTimeEquals(expectedCode, providedCode)) {
                  // Prevent replay: mark this code as used
                  if (!totpCodeReplayPrevention.markUsed(expectedCode, currentPeriod + delta)) {
                      return false;  // Code already used
                  }
                  return true;
              }
          }
          return false;
      }
      
      // CRITICAL: Constant-time comparison prevents timing attacks
      private boolean constantTimeEquals(String a, String b) {
          return MessageDigest.isEqual(a.getBytes(), b.getBytes());
      }
  }

MFA BYPASS RECOVERY (backup codes):
  → 8 backup codes generated at enrollment
  → Each: 16 random characters, stored as BCrypt hash (not plaintext)
  → Single use: Marked consumed after use
  → If all consumed: Admin must contact SUPER_ADMIN for account recovery
  → Backup code usage triggers: Security alert email + audit log entry
    "Backup code used for login — if this was not you, contact support immediately"

PHASE 1: MFA optional for ADMIN, not enforced
PHASE 2: MFA mandatory for ADMIN and SUPER_ADMIN
  Grace period: 7 days after Phase 2 deploy.
  After grace period: Login without MFA redirects to enrollment (cannot bypass).
```

---

## 3.3 Token Lifecycle Security

```
TOKEN SECURITY MATRIX:

Property              Access Token         Refresh Token
──────────────────────────────────────────────────────────────────────
TTL                   15 minutes           7 days (rolling)
Storage (client)      Memory (JS variable) HttpOnly cookie
Algorithm             RS256                N/A (opaque random)
Revocable             Yes (JTI blocklist)  Yes (Redis delete)
Rotated on use        No                   Yes (every use)
Theft detection       Indirect (expiry)    Direct (replay = theft signal)
Scope                 All API calls        Only /api/v1/auth/refresh

TOKEN ROTATION SECURITY:
Refresh token rotation creates a chain:
  RT1 (issued) → used → RT2 (issued), RT1 revoked
  RT2 used → RT3 issued, RT2 revoked
  
  If attacker steals RT1 after victim has used it (RT1 is revoked):
  Attacker uses RT1 → Revoked token detected → ALL sessions invalidated
  User receives: "Security alert: unusual login detected. All sessions ended."
  
  This is the CORRECT behavior. False positive (legitimate user whose RT1
  was stolen) is: "I got logged out." True positive is: "Attacker was blocked."
  Better to log out legitimate user than allow attacker persistent access.

REFRESH TOKEN DETECTION TIMING WINDOW:
  There is a 30-second grace window after rotation where old token is
  still accepted (handles simultaneous requests using old token before
  new token propagates to all tabs).
  
  After 30 seconds: Old token completely rejected.
  Any use of old token after 30 seconds: Theft signal → invalidate all.

JWT PRIVATE KEY ROTATION:
  Problem: If private key is compromised, attacker can forge tokens indefinitely.
  Solution: Scheduled key rotation (quarterly)
  
  Key rotation procedure:
  1. Generate new RSA key pair
  2. Deploy application with BOTH old and new public keys accepted
     (JWKS endpoint returns both keys with different kid values)
  3. Issue new tokens signed with new private key
  4. Wait for all tokens signed with old key to expire (15 minutes)
  5. Remove old public key from JWKS
  6. Revoke old private key from Secrets Manager
  
  Implementation: JWKS (JSON Web Key Set) endpoint:
  GET /api/v1/auth/.well-known/jwks.json
  Returns: [{kid: "2025-Q1", kty: "RSA", n: "...", e: "AQAB"},
             {kid: "2025-Q2", kty: "RSA", n: "...", e: "AQAB"}]
  Token header includes: kid claim → server knows which key to verify with.
```

---

# PART 4 — DATA SECURITY

---

## 4.1 Encryption Architecture

```
ENCRYPTION LAYERS:

Layer 1: Transport Encryption (TLS 1.3)
  All communication encrypted in transit.
  
  TLS Configuration (Cloudflare):
  → Minimum version: TLS 1.2 (clients using TLS 1.0/1.1 rejected)
  → Preferred: TLS 1.3 (faster, more secure cipher suites)
  → Cipher suites (TLS 1.2 only): 
    TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 (preferred)
    TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
    NO: RC4, DES, 3DES, NULL, EXPORT cipher suites
  → HSTS: max-age=31536000; includeSubDomains; preload
  → Certificate: Let's Encrypt via Cloudflare (auto-renewed, zero management)

Layer 2: Database Encryption at Rest (RDS)
  → AWS RDS: Storage encryption enabled at cluster creation
  → Encryption type: AES-256
  → Key management: AWS KMS (Customer Managed Key — not AWS-managed)
    Using Customer Managed Key: Furnix can revoke access to data if needed
  → Backups: Encrypted with same KMS key
  → Read replicas: Encrypted with same KMS key
  → Performance impact: < 1ms overhead per operation (hardware-accelerated AES)

Layer 3: Application-Level Encryption (Sensitive Fields)
  Fields encrypted at application layer BEFORE writing to database:
  → MFA TOTP secrets (mfa_secret_enc)
  → OAuth access/refresh tokens (access_token_enc, refresh_token_enc)
  
  Encryption scheme: AES-256-GCM (authenticated encryption)
  Key management: AWS KMS data key envelope encryption
  
  Envelope Encryption Pattern:
  1. AWS KMS generates a Data Key (plaintext + ciphertext)
  2. Furnix uses plaintext data key to encrypt the field value with AES-256-GCM
  3. Furnix stores: encrypted_field_value + ciphertext_data_key (in DB column)
  4. Plaintext data key is NEVER persisted
  5. To decrypt: Send ciphertext_data_key to KMS → get plaintext key → decrypt field
  
  Implementation:
  @Service
  public class FieldEncryptionService {
      
      public String encrypt(String plaintext) {
          // Generate IV (never reuse IVs with same key)
          byte[] iv = new byte[12];
          secureRandom.nextBytes(iv);
          
          // Encrypt with AES-256-GCM
          Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
          cipher.init(Cipher.ENCRYPT_MODE, getDataKey(), new GCMParameterSpec(128, iv));
          byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
          
          // Prepend IV to ciphertext (IV is not secret, needed for decryption)
          byte[] result = new byte[iv.length + ciphertext.length];
          System.arraycopy(iv, 0, result, 0, iv.length);
          System.arraycopy(ciphertext, 0, result, iv.length, ciphertext.length);
          
          return Base64.getEncoder().encodeToString(result);
      }
  }

Layer 4: Cloudinary Media Security
  → Signed URLs for sensitive media (delivery proofs, production photos)
    URL expires after 1 hour
    Signature includes: resource ID + expiry + IP (optional)
  → Public product images: Not signed (public catalog — OK to be public)
  → Inquiry reference images: Signed, accessible only to client and admin
```

---

## 4.2 PII Protection

```
PII INVENTORY AND HANDLING:

PII Element           Classification   Storage              Retention
──────────────────────────────────────────────────────────────────────────
Email address         Moderate PII     Hashed for lookup    Until deletion
                                        + encrypted stored
Full name             Moderate PII     Plaintext (required  Until deletion +
                                        for operations)      anonymization
Phone number          Moderate PII     Plaintext (required) Until deletion +
                                                             anonymization
Delivery address      High PII         Plaintext (required) Until delivery +
                                                             3 years
Payment references    High PII         Plaintext            7 years (financial)
IP addresses (logs)   Moderate PII     SHA-256 hash only    90 days
Browser user agent    Low PII          Stored               90 days

PII MINIMIZATION RULES:
→ Order list view: Client email shown as masked (pr***@example.com)
→ Order export: Remove PII unless explicitly requested by SUPER_ADMIN
→ Notification logs: Store event type + timestamp, not message content
→ Error logs: Never log email addresses, phone numbers, or payment data
→ Analytics queries: Aggregate data only, no individual user data

LOG MASKING:
@Aspect
@Component
public class PiiMaskingAspect {
    
    @Around("execution(* org.slf4j.Logger.*(..))")
    public Object maskPii(ProceedingJoinPoint pjp) throws Throwable {
        Object[] args = pjp.getArgs();
        for (int i = 0; i < args.length; i++) {
            if (args[i] instanceof String) {
                args[i] = maskSensitiveData((String) args[i]);
            }
        }
        return pjp.proceed(args);
    }
    
    private String maskSensitiveData(String input) {
        // Email masking: priya@example.com → pr***@example.com
        return input
            .replaceAll("([a-zA-Z0-9._%+\\-]{2})[a-zA-Z0-9._%+\\-]*(@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})",
                "$1***$2")
            // Phone masking: +919876543210 → +91987***3210
            .replaceAll("(\\+\\d{4,6})\\d{3,5}(\\d{4})", "$1***$2")
            // Payment reference masking: UTR123456789 → UTR***789
            .replaceAll("(UTR|REF)\\w{4,10}(\\w{3})", "$1***$2");
    }
}

DATA SUBJECT RIGHTS (GDPR):
→ Right to Access: Client can download their data (Phase 2 feature)
  Export: inquiries, orders, quotations, payment summaries
  Excludes: Internal admin notes, other clients' data

→ Right to Deletion ("Right to be Forgotten"):
  Trigger: Client requests account deletion
  Implementation:
    1. Verify no active orders (cannot delete with in-flight orders)
    2. Soft delete account (mark deleted, clear PII)
    3. Keep order records (financial compliance — 7 years)
    4. Anonymize: name → "[Deleted User]", email → deleted_{id}@deleted,
                  phone → null, address → "[Address removed]"
    5. Order records preserved for financial audit
    6. Audit log: "Account deletion requested by user, PII anonymized"

→ Right to Rectification: Profile update endpoint (already implemented)

→ Right to Portability: Data export as JSON (Phase 2)
```

---

# PART 5 — INFRASTRUCTURE SECURITY

---

## 5.1 Container Security

```
CONTAINER HARDENING:

Dockerfile Security Requirements:

# 1. Non-root user (MANDATORY)
RUN addgroup -g 1001 -S furnix && adduser -u 1001 -S furnix -G furnix
USER furnix
# → Root container compromise = full host compromise
# → Non-root container compromise = limited blast radius

# 2. Read-only filesystem where possible
# docker-compose.yml:
services:
  api:
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m  # Allow /tmp only
      - /app/logs:noexec,nosuid

# 3. No privileged mode
services:
  api:
    privileged: false       # Never true in production
    cap_drop:
      - ALL                 # Drop all Linux capabilities
    cap_add:
      - NET_BIND_SERVICE    # Add back only what's needed (port 8080)

# 4. Resource limits (prevents DoS from container)
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

# 5. Health check (prevents traffic to unhealthy containers)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -q -O- http://localhost:8080/actuator/health/liveness || exit 1

IMAGE SECURITY:
→ Base image: eclipse-temurin:21-jre-alpine (not :latest — pinned version)
  Alpine: Minimal attack surface (no bash, no curl, minimal utilities)
→ Weekly base image rebuild: Pull latest security patches into build
→ Image scanning: Amazon Inspector in CI pipeline
  Fail build on: CRITICAL severity vulnerabilities
  Alert on: HIGH severity vulnerabilities
→ No secrets in image layers: All secrets injected at runtime via environment
  (not baked into Dockerfile or docker-compose)
→ .dockerignore: Exclude .env, *.key, *.pem, .git, test files from image

RUNTIME SECURITY:
→ seccomp profile: Restrict system calls to application-necessary subset
→ AppArmor profile (if using Linux host): Define file system access rules
→ No --network=host: Container has its own network namespace
```

---

## 5.2 Network Isolation

```
NETWORK SECURITY ARCHITECTURE:

VPC Design (AWS):
┌─────────────────────────────────────────────────────────────────┐
│  VPC: 10.0.0.0/16                                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Public Subnets (10.0.1.0/24, 10.0.2.0/24)              │  │
│  │  → Application Load Balancer only                        │  │
│  │  → No application servers in public subnets              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Private App Subnets (10.0.10.0/24, 10.0.11.0/24)       │  │
│  │  → EC2 application servers                               │  │
│  │  → No public IPs on instances                            │  │
│  │  → Outbound via NAT Gateway only                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Private Data Subnets (10.0.20.0/24, 10.0.21.0/24)      │  │
│  │  → RDS MySQL (no internet access ever)                   │  │
│  │  → ElastiCache Redis (no internet access ever)           │  │
│  │  → No route to internet (not even NAT)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

SECURITY GROUPS (Firewall Rules):

alb-security-group:
  Inbound:
    443/tcp  → 0.0.0.0/0   (HTTPS from internet)
    80/tcp   → 0.0.0.0/0   (HTTP → redirect to HTTPS by ALB rule)
  Outbound:
    8080/tcp → app-security-group  (forward to app servers)

app-security-group:
  Inbound:
    8080/tcp → alb-security-group  (ONLY from ALB — not from internet)
    22/tcp   → bastion-security-group (SSH only from bastion — Phase 2)
    OR: SSM Session Manager (no SSH needed — preferred)
  Outbound:
    3306/tcp  → db-security-group    (MySQL)
    6379/tcp  → cache-security-group (Redis)
    443/tcp   → 0.0.0.0/0            (external APIs: Cloudinary, SendGrid)
    80/tcp    → 0.0.0.0/0            (HTTP redirect check only, via NAT)

db-security-group:
  Inbound:
    3306/tcp → app-security-group   (ONLY from application servers)
  Outbound:
    None                            (database makes no outbound connections)

cache-security-group:
  Inbound:
    6379/tcp → app-security-group   (ONLY from application servers)
  Outbound:
    None

NETWORK FLOW CONTROL:
→ VPC Flow Logs: Enabled for all subnets (stored in S3, retained 90 days)
  Used for: Traffic analysis, detecting unexpected communication patterns
→ AWS Network Firewall (Phase 2): Deep packet inspection on outbound traffic
  Block: Outbound to known malicious domains (threat intelligence feed)
  Alert: Unexpected outbound connections from app servers

NO DIRECT SSH ACCESS IN PRODUCTION:
→ Use AWS Systems Manager Session Manager for shell access
→ No SSH ports open → SSH key theft has no attack surface
→ All session activity logged to CloudTrail + S3
→ Session requires: IAM permissions + MFA (enforced by IAM policy)
```

---

## 5.3 Cloud Security Posture

```
AWS SECURITY CONFIGURATION:

IAM Least Privilege:
  Application EC2 instance role permissions (ONLY what the app needs):
  
  {
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue"
        ],
        "Resource": [
          "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:furnix/prod/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": "arn:aws:kms:ap-south-1:ACCOUNT:key/FURNIX-KEY-ID"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject"
        ],
        "Resource": "arn:aws:s3:::furnix-backups/*"
      }
    ]
  }
  
  No: s3:* (all S3 operations)
  No: iam:* (identity management — app never needs this)
  No: ec2:* (infrastructure management — app never needs this)

CloudTrail (Audit of ALL AWS API calls):
  → Enabled in all regions (including global services: IAM, Route53)
  → Log file validation enabled (detects log tampering)
  → Logs stored in dedicated S3 bucket with:
    - Object Lock (cannot be deleted for 7 years — compliance)
    - MFA Delete required (even for bucket admin)
    - Cross-account backup (separate AWS account — prevents accidental deletion)
  → CloudWatch Alarms on:
    - Root account login (should never happen after initial setup)
    - API calls from non-approved regions
    - IAM policy changes
    - Security group modifications

AWS Config Rules (continuous compliance checking):
  → ec2-instances-in-vpc: All instances must be in VPC
  → restricted-ssh: Security groups must not allow unrestricted SSH
  → rds-storage-encrypted: All RDS instances must be encrypted
  → rds-multi-az-support: Production RDS must be Multi-AZ
  → s3-bucket-public-read-prohibited: No S3 buckets with public read
  → iam-root-access-key-check: Root account must not have access keys
  
  Violations trigger: SNS notification → Security alert email + Slack

GuardDuty (Threat Detection):
  → ML-based anomaly detection on: CloudTrail, VPC Flow Logs, DNS logs
  → Alerts on: Port scanning, unusual API calls, crypto mining patterns,
    connections to known malicious IPs
  → Integration: GuardDuty findings → EventBridge → Lambda → PagerDuty
```

---

# PART 6 — MONITORING & DETECTION

---

## 6.1 Security Event Detection

```
SECURITY MONITORING ARCHITECTURE:

Event Sources → Collection → Analysis → Response

Event Sources:
  Application Logs   → CloudWatch Logs Insights
  Auth Events        → Custom Security Log (JSON, structured)
  AWS CloudTrail     → CloudWatch Events
  GuardDuty          → EventBridge
  VPC Flow Logs      → Athena queries
  Cloudflare Logs    → S3 → Athena

DETECTION RULES:

Rule 1: Brute Force Detection
  Trigger: > 10 failed logins for same email within 15 minutes
  Source: Application auth event log
  
  CloudWatch Logs Insights Query:
  fields @timestamp, email, ipAddress
  | filter eventType = "LOGIN_FAILURE"
  | stats count() as failureCount by email, bin(15m)
  | filter failureCount > 10
  | sort @timestamp desc
  
  Action: PagerDuty alert + admin email + trigger enhanced monitoring for IP

Rule 2: Credential Stuffing Pattern
  Trigger: Single IP with > 20 different email attempts in 5 minutes
  Indicates: Automated credential stuffing (different accounts, same source)
  
  Action: Cloudflare IP block (automated via Cloudflare API)
  Duration: 24-hour block, reviewed and extended if attack continues

Rule 3: Privilege Escalation Attempt
  Trigger: 403 Forbidden responses > 5 for same authenticated user in 10 minutes
  Indicates: User testing access beyond their role
  
  Action: Log to security audit trail + alert SUPER_ADMIN + flag account for review

Rule 4: IDOR Probe Detection
  Trigger: Same user accessing > 10 distinct UUIDs that return 404 in 5 minutes
  Indicates: User enumerating resource IDs
  
  Action: Rate limit aggressively + log + flag account

Rule 5: Unusual Geographic Access
  Trigger: Admin login from country different from historical pattern
  Example: Admin historically logs in from India, new login from Russia
  
  Action: Require MFA re-verification (even if MFA was recently completed)
           Email alert to admin: "Login from new location detected"
           If MFA fails: Block session + SUPER_ADMIN alert

Rule 6: Refresh Token Reuse (Theft Indicator)
  Trigger: Refresh token used after being rotated
  Indicates: Possible session token theft
  
  Action: Immediate all-session invalidation + security alert to user + audit log
  Priority: P1 — automated response, no human review required first

Rule 7: Payment Data Access After Hours
  Trigger: Financial reports accessed outside 6am-10pm IST by admin account
  (Configurable business hours window)
  
  Action: Log + email SUPER_ADMIN with access details
  Note: This is a soft alert — not blocking. Admins may work late legitimately.

SECURITY DASHBOARD METRICS (real-time):
  → Failed login attempts (last 24h, trend)
  → Accounts locked (current count)
  → Rate limit triggers (last hour)
  → 403 Forbidden rate (trend alert if spike)
  → New account registrations (anomaly detection)
  → Active WebSocket sessions by role
  → API error rate by endpoint (spike detection)
```

---

## 6.2 Audit Log Security

```
AUDIT LOG INTEGRITY REQUIREMENTS:

Append-Only Enforcement:
  Database user for application has: INSERT, SELECT on audit_events
  Explicitly NO: UPDATE, DELETE, DROP, TRUNCATE
  
  MySQL user creation:
  GRANT SELECT, INSERT ON furnix_audit.audit_events TO 'furnix_app'@'%';
  -- No GRANT for UPDATE, DELETE
  -- Verified monthly: SHOW GRANTS FOR 'furnix_app'@'%';

Tamper Detection:
  Each audit log record includes a chain hash:
  hash(current_record) = SHA256(
    previous_record_hash +
    event_type +
    actor_id +
    entity_id +
    payload +
    occurred_at
  )
  
  Verification job (runs weekly):
  SELECT id, occurred_at,
    SHA2(CONCAT(LAG(chain_hash, 1) OVER (ORDER BY occurred_at),
                event_type, actor_user_id, entity_id,
                payload, occurred_at), 256) as computed_hash,
    chain_hash as stored_hash
  FROM audit_events
  WHERE computed_hash != stored_hash;
  
  Any result: Audit log has been tampered with → security incident

Log Forwarding (real-time, off-system):
  Audit events forwarded to: AWS CloudWatch Logs in separate account
  Delay: < 5 seconds
  Immutability: CloudWatch Log Group with KMS encryption, 7-year retention
  Rationale: Even if primary database is compromised and logs deleted,
             forwarded copy exists in read-only, separate account

SECURITY-RELEVANT EVENTS THAT MUST BE LOGGED:
  Priority 1 (P1 — any absence is a security incident):
  ✓ All authentication events (success and failure)
  ✓ All authorization failures (403 responses)
  ✓ All payment operations (confirm, void, refund)
  ✓ All order cancellations
  ✓ All role changes
  ✓ All account deactivations/deletions
  ✓ All SUPER_ADMIN operations

  Priority 2 (P2 — best effort, alert if gap detected):
  ✓ Order state transitions
  ✓ Quotation approvals
  ✓ Inquiry status changes
  ✓ Product price changes
  ✓ System configuration changes
```

---

# PART 7 — INCIDENT RESPONSE

---

## 7.1 Incident Classification and Response

```
INCIDENT SEVERITY LEVELS:

P0 — CRITICAL (Response: Immediate, 24/7, all-hands):
  → Active data breach (confirmed unauthorized data access)
  → Compromised admin or super admin account
  → Payment data exposed
  → Database accessible from internet
  → System completely unavailable > 15 minutes during business hours
  
  Response SLA: Detection → Containment: < 30 minutes
  Communication: Notify all stakeholders immediately
  Post-incident: Full root cause analysis within 48 hours

P1 — HIGH (Response: Within 1 hour, business hours priority):
  → Suspected account compromise (refresh token reuse detected)
  → Unusual administrative actions detected
  → Dependency vulnerability (CRITICAL CVE) in production
  → SLA breach risk for multiple clients
  
  Response SLA: Detection → Initial response: < 1 hour

P2 — MEDIUM (Response: Within 4 hours, business hours):
  → Failed login spike (potential credential stuffing)
  → Unusual traffic pattern (potential scraping)
  → Single dependency HIGH CVE
  
  Response SLA: Detection → Initial response: < 4 hours

P3 — LOW (Response: Next business day):
  → Single account locked out (possible legitimate user)
  → Medium CVE in dependency
  → Unusual but explainable traffic pattern

INCIDENT RESPONSE PLAYBOOK:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAYBOOK: Compromised Admin Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: Refresh token reuse detected for admin account
         OR: Admin login from impossible location (geographically)
         OR: Admin reports they are locked out unexpectedly

Step 1: Immediate Containment (< 5 minutes)
  → Execute: Force logout all sessions for affected account
    POST /api/v1/admin/users/{id}/force-logout (SUPER_ADMIN only)
    This increments user.token_version → all existing JWTs immediately invalid
  
  → If SUPER_ADMIN account: Also invalidate from AWS console
    Delete all IAM access keys for associated AWS user
    Force password reset via AWS Console
  
  → Block suspected attacker IP in Cloudflare (if known)

Step 2: Scope Assessment (< 30 minutes)
  → Query audit log for account activity in last 24 hours:
    SELECT * FROM furnix_audit.audit_events
    WHERE actor_user_id = '{compromised_user_id}'
    AND occurred_at > NOW() - INTERVAL 24 HOUR
    ORDER BY occurred_at DESC;
  
  → Document: What was accessed? What was changed? Were payments involved?
  → Check: Were any other admin accounts accessed from same IP?
  → Check: Were any client accounts accessed beyond normal patterns?

Step 3: Recovery (< 2 hours)
  → Restore any malicious state changes:
    - Order states modified: Revert to correct state + audit log note
    - Client data changed: Revert + notify affected client
    - Products modified: Revert + verify no unauthorized catalog changes
  
  → Reset compromised account credentials (forced password reset email)
  → Require MFA enrollment before re-activating account
  → Verify all other admin accounts are secure (no suspicious activity)

Step 4: Notification (< 24 hours)
  → If client PII was accessed: GDPR breach notification within 72 hours
    (GDPR Article 33: Notify supervisory authority within 72 hours of breach)
  → Notify affected clients of data exposure
  → Internal post-mortem: How was the account compromised?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAYBOOK: SQL Injection Confirmed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Immediate (< 5 minutes)
  → Enable Cloudflare Under Attack mode (JavaScript challenge for all visitors)
  → Block identified attack payload patterns in Cloudflare WAF
  → Put application in maintenance mode if active exploitation confirmed

Step 2: Assess Damage (< 1 hour)
  → Review database query logs for anomalous queries
  → Check for: Data exfiltration (large SELECT results sent to attacker)
    Identify: Which tables queried? How many records?
  → Review AWS VPC Flow Logs for unusual outbound data transfer

Step 3: Remediate (< 4 hours)
  → Identify the vulnerable code path
  → Deploy hotfix to parameterize all queries in affected endpoint
  → Database password rotation (immediate)
  → Redis flush (all cached data potentially compromised)

Step 4: Full Audit
  → Review all endpoints for similar vulnerability pattern
  → Run automated SQL injection scanner (OWASP ZAP) against staging
  → Security review of all native queries in codebase
```

---

## 7.2 Rollback Strategy

```
ROLLBACK DECISION MATRIX:

Scenario                    Rollback Required?   Type              Time
──────────────────────────────────────────────────────────────────────────
Deployment bug (no data)    Yes                  Code rollback     2 min
Deployment bug (data error) Yes                  Code + data       30 min
Malicious state changes     Partial              Manual data fix   1-4 hours
Database schema mistake      Yes                 Schema rollback   Variable
Mass data corruption         Yes                 Point-in-time     30-60 min
                                                  DB restore

CODE ROLLBACK (ECS/EC2 Auto Scaling):
  → Previous task definition stored in ECS
  → Rollback command:
    aws ecs update-service \
      --cluster furnix-prod \
      --service furnix-api \
      --task-definition furnix-api:{previous-version} \
      --force-new-deployment
  → Blue-green deployment: Switch target group back to blue (< 1 minute)

DATABASE POINT-IN-TIME RECOVERY:
  → Identify correct recovery timestamp (last known-good state)
  → Restore to new RDS instance (cannot restore in-place):
    aws rds restore-db-instance-to-point-in-time \
      --source-db-instance-identifier furnix-prod-db \
      --target-db-instance-identifier furnix-recovery-db \
      --restore-time "2025-01-15T10:00:00Z"
  → Verify restored data integrity
  → Redirect application connection string to restored instance
  → Delta analysis: What legitimate transactions occurred between
    recovery point and incident? These must be manually re-applied.

DATA INTEGRITY AFTER ROLLBACK:
  → After rolling back code: Are pending order states correct?
  → After rolling back DB: Were any payments recorded after recovery point?
    These payments must be manually re-entered into the restored database.
  → Client communication: "We experienced a technical issue.
    Please verify your order status and contact us if anything appears incorrect."
```

---

# PART 8 — COMPLIANCE CONSIDERATIONS

---

## 8.1 GDPR Compliance

```
GDPR APPLICABILITY:
  Furnix serves Indian customers primarily.
  However: If any EU-resident places an order, GDPR applies.
  Safe position: Implement GDPR compliance regardless of geography.
  India's DPDP Act (Digital Personal Data Protection, 2023) has similar requirements.

LEGAL BASIS FOR PROCESSING:
  Data Type                  Legal Basis
  ──────────────────────────────────────────────────────
  Account registration       Contractual necessity
  Order fulfillment          Contractual necessity
  Payment processing         Legal obligation
  Marketing emails           Consent (explicit opt-in)
  Analytics                  Legitimate interest (with opt-out)
  Security logs              Legitimate interest

GDPR REQUIREMENTS IMPLEMENTATION STATUS:

Article 13/14 — Privacy Notice:
  ✓ Privacy policy linked from registration form
  ✓ Privacy policy explains: what data collected, why, how long, rights
  → Phase 2: Cookie consent banner (if analytics cookies used)

Article 15 — Right of Access:
  → Phase 2: "Download my data" feature in client profile
  → Current: Manual data export available on request (within 30 days)

Article 17 — Right to Erasure:
  → Implemented: Soft delete with PII anonymization
  → Order records retained: Financial legal obligation (7 years)
  → Audit logs retained: 5 years (security obligation)
  → These retention requirements are documented as exceptions to erasure

Article 20 — Right to Data Portability:
  → Phase 2: Export in machine-readable format (JSON)

Article 25 — Privacy by Design:
  ✓ PII minimization in data model
  ✓ PII not logged (masked in logs)
  ✓ Encryption at rest and in transit
  ✓ Access controls limiting PII access

Article 32 — Security of Processing:
  ✓ Encryption at rest and in transit
  ✓ Pseudonymization of IP addresses in logs
  ✓ Regular security testing (OWASP ZAP, dependency scanning)
  ✓ Staff access controls and MFA

Article 33 — Breach Notification:
  → Requires: Notify supervisory authority within 72 hours of breach
  → Requires: Notify affected data subjects "without undue delay"
  → Implementation: Incident response playbook covers this
  → Template: Pre-written breach notification emails reviewed by legal

DATA PROCESSING AGREEMENTS:
  → Cloudinary: DPA signed (data processor)
  → SendGrid (Twilio): DPA available (data processor)
  → AWS: DPA signed (infrastructure processor)
  → Google OAuth: DPA via Google Workspace terms
```

---

## 8.2 Security Hardening Checklist

```
PRODUCTION SECURITY CHECKLIST (verify before go-live):

AUTHENTICATION:
☐ JWT signed with RS256 (not HS256)
☐ JWT algorithm explicitly validated (not taken from token header)
☐ Access token TTL: 15 minutes maximum
☐ Refresh token: HttpOnly, Secure, SameSite=Strict cookie
☐ Refresh token rotation on every use
☐ Replay attack detection on refresh token reuse
☐ Token version invalidation on password change
☐ Account lockout after 5 failed attempts
☐ Timing-safe login (constant time regardless of user existence)
☐ Email verification required before account activation

AUTHORIZATION:
☐ RBAC enforced at method level (Spring @PreAuthorize on all endpoints)
☐ IDOR prevention: Ownership check in all resource queries
☐ 404 returned (not 403) for unauthorized resource access
☐ No role/permission accepted from request body
☐ ArchUnit test: All endpoints have authorization annotation

INPUT VALIDATION:
☐ All inputs validated server-side (never trust client validation only)
☐ HTML sanitization on all user text fields
☐ Parameterized queries only (no string concatenation in SQL)
☐ File upload: MIME type validated (not just extension)
☐ File upload: Maximum size enforced server-side
☐ JSON schema validation on all API inputs
☐ Regex: No catastrophic backtracking patterns

INFRASTRUCTURE:
☐ TLS 1.2 minimum (1.3 preferred), no older versions
☐ HSTS with preload directive
☐ All security headers configured (CSP, X-Frame-Options, etc.)
☐ No default credentials (MySQL root password changed)
☐ Database not accessible from internet
☐ Redis not accessible from internet
☐ No admin ports exposed (22, 3306, 6379) to internet
☐ Container runs as non-root user
☐ Image vulnerability scan passes (no CRITICAL CVEs)
☐ Secrets in AWS Secrets Manager (not in code or environment)

MONITORING:
☐ Failed login alerting configured
☐ Rate limit alerting configured
☐ GuardDuty enabled
☐ CloudTrail enabled (all regions)
☐ Audit log integrity verification scheduled
☐ Error tracking configured (Sentry)
☐ On-call rotation established

COMPLIANCE:
☐ Privacy policy published and linked from registration
☐ Data retention policies implemented
☐ Audit log retention: 5 years minimum
☐ Financial record retention: 7 years minimum
☐ GDPR breach notification process documented
☐ Data processing agreements signed with all processors
```

---

## Security Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY POSTURE SUMMARY                             │
├─────────────────────────┬───────────────────────┬───────────────────────┤
│ Threat Category         │ Primary Control        │ Residual Risk         │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ Credential Stuffing     │ Rate limit + CAPTCHA   │ LOW                   │
│                         │ + lockout + HIBP check │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ Session Hijacking       │ HttpOnly RT + memory   │ LOW                   │
│                         │ AT + rotation          │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ IDOR                    │ Service-layer ownership│ LOW (with testing)    │
│                         │ check + 404 response   │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ Privilege Escalation    │ ArchUnit tests + RBAC  │ LOW                   │
│                         │ method security        │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ SQL Injection           │ JPA parameterized only │ LOW                   │
│                         │ + SonarQube enforcement│                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ XSS                     │ CSP + React escaping   │ LOW-MEDIUM            │
│                         │ + no dangerouslySet    │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ DoS / DDoS              │ Cloudflare + rate limit│ LOW (network DDoS)    │
│                         │ + resource limits      │ MEDIUM (App-level)    │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ Data Exfiltration       │ Network isolation +    │ MEDIUM                │
│                         │ encryption + IDOR ctrl │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ Insider Threat          │ Audit logging + MFA    │ MEDIUM                │
│                         │ + least privilege      │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ Supply Chain Attack     │ OWASP dep check +      │ MEDIUM                │
│                         │ pinned versions        │                       │
├─────────────────────────┼───────────────────────┼───────────────────────┤
│ Physical/Cloud Access   │ AWS IAM + KMS + MFA    │ LOW                   │
│                         │ + CloudTrail           │                       │
└─────────────────────────┴───────────────────────┴───────────────────────┘

OVERALL SECURITY POSTURE: GOOD for MVP scale.
Gaps to address in Phase 2:
  → MFA mandatory for all admin accounts (currently optional)
  → Automated penetration testing in CI pipeline (currently manual)
  → WAF rule tuning based on real traffic (currently default rules)
  → Bug bounty program consideration (Phase 3)
```

---

*This threat model and security architecture document defines the complete security posture for Furnix. Security requirements defined here must be treated as non-negotiable constraints, not suggestions. Any deviation from these specifications requires a formal risk acceptance sign-off from the system owner. Security debt is the most expensive technical debt because it compounds silently until it is catastrophically realized.*