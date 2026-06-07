# Graph Report - carpenter-web  (2026-06-07)

## Corpus Check
- 188 files · ~143,261 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 654 nodes · 820 edges · 63 communities detected
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 210 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 16 edges
2. `InquiryService` - 14 edges
3. `AuthController` - 13 edges
4. `GlobalExceptionHandler` - 12 edges
5. `getWhatsAppNumber()` - 12 edges
6. `InquiryController` - 11 edges
7. `ProductService` - 11 edges
8. `QuoteService` - 11 edges
9. `useAuth()` - 11 edges
10. `useSiteSettings()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  carpenter-frontend\src\components\ProtectedRoute.jsx → carpenter-frontend\src\context\AuthContext.jsx
- `WhatsAppLoginModal()` --calls--> `useAuth()`  [INFERRED]
  carpenter-frontend\src\components\auth\WhatsAppLoginModal.jsx → carpenter-frontend\src\context\AuthContext.jsx
- `AdminLayout()` --calls--> `useAuth()`  [INFERRED]
  carpenter-frontend\src\components\layout\AdminLayout.jsx → carpenter-frontend\src\context\AuthContext.jsx
- `LoginPage()` --calls--> `useAuth()`  [INFERRED]
  carpenter-frontend\src\pages\admin\LoginPage.jsx → carpenter-frontend\src\context\AuthContext.jsx
- `CustomerAccountPage()` --calls--> `useAuth()`  [INFERRED]
  carpenter-frontend\src\pages\public\CustomerAccountPage.jsx → carpenter-frontend\src\context\AuthContext.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (10): AuthController, GalleryController, ImageController, InquiryController, ProductController, QuoteController, OtpRequest, OtpVerifyRequest (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (31): LoginPage(), SettingsPage(), WhatsAppLoginModal(), ProtectedRoute(), useAuth(), useSiteSettings(), AdminLayout(), Footer() (+23 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (8): AdminRepository, CustomerRepository, InquiryDraftRepository, OtpCodeRepository, CustomUserDetailsService, AuthService, InquiryDraftService, UserDetailsService

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (6): AdminController, Customer, canTransitionTo(), isFinalState(), InquiryRepository, InquiryService

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (5): Category, GalleryRepository, ProductRepository, GalleryService, ProductService

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (6): ApiResponse, CloudinaryService, ImageService, NotificationService, PdfService, WhatsAppAuthService

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (4): ProjectController, Project, ProjectRepository, ProjectService

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (5): Inquiry, Quote, QuoteRepository, QuoteService, TaxConfigurationService

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (9): OrderDetailPage(), OrderStatusBadge(), ProductCard(), CustomerInquiryDetailPage(), StatusBadge(), formatDate(), getStatusConfig(), timeAgo() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (4): CategoryController, CategoryRepository, SubcategoryRepository, CategoryService

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (4): OncePerRequestFilter, AuthRateLimitFilter, JwtAuthenticationFilter, JwtUtils

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (4): CarpenterApiApplication, CommandLineRunner, DatabaseFixConfig, DataInitializer

### Community 12 - "Community 12"
Cohesion: 0.28
Nodes (1): GlobalExceptionHandler

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (5): BadRequestException, ConflictException, InvalidQuoteException, ResourceNotFoundException, RuntimeException

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (2): normalizeUser(), persistAuthData()

### Community 15 - "Community 15"
Cohesion: 0.43
Nodes (1): SecurityConfig

### Community 16 - "Community 16"
Cohesion: 0.43
Nodes (1): SettingsController

### Community 17 - "Community 17"
Cohesion: 0.48
Nodes (1): SyncManager

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (2): useFormPersistence(), OrderPage()

### Community 20 - "Community 20"
Cohesion: 0.4
Nodes (2): normalizeUser(), persistSession()

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (1): GalleryItem

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (1): Product

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): CloudinaryConfig

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (1): OpenApiConfig

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (1): InquiryRequest

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (2): ProjectResponse, UpdateResponse

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (2): QuoteItemResponse, QuoteResponse

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (1): Admin

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (1): InquiryDraft

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (1): OtpCode

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (1): ProjectUpdate

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (1): CarpenterApiApplicationTests

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): AsyncConfig

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): TaxConfigurationProperties

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): AuthRequest

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): GalleryItemRequest

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): GoogleAuthRequest

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): InquiryDraftRequest

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): InquiryStatusRequest

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): ProductRequest

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): ProjectRequest

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): ProjectUpdateRequest

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): QuoteCalculationRequest

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): QuoteItemRequest

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): QuoteLineItemRequest

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): QuoteRequest

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): RegisterRequest

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): SocialLoginRequest

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): UpdateProfileRequest

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): AuthResponse

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): CategoryResponse

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): CurrentUserResponse

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): DashboardStats

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): GalleryItemResponse

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): InquiryResponse

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): ProductResponse

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): QuoteCalculationResponse

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): QuoteLineItemResponse

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): SubcategoryResponse

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): QuoteItem

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): SiteSetting

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Subcategory

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): SiteSettingRepository

## Knowledge Gaps
- **37 isolated node(s):** `AsyncConfig`, `TaxConfigurationProperties`, `OtpRequest`, `OtpVerifyRequest`, `AuthRequest` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (13 nodes): `GlobalExceptionHandler.java`, `GlobalExceptionHandler`, `.buildProblem()`, `.handleAccessDenied()`, `.handleBadCredentials()`, `.handleBadRequest()`, `.handleDisabled()`, `.handleFileTooLarge()`, `.handleGeneric()`, `.handleInvalidQuote()`, `.handleNotFound()`, `.handleTypeMismatch()`, `.handleValidation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (9 nodes): `api.js`, `clearAuthStorage()`, `getLoginRedirectPath()`, `isDirectAuthRequest()`, `isRefreshRequest()`, `normalizeUser()`, `persistAuthData()`, `processQueue()`, `readToken()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (7 nodes): `SecurityConfig.java`, `SecurityConfig`, `.authenticationManager()`, `.authenticationProvider()`, `.corsConfigurationSource()`, `.passwordEncoder()`, `.securityFilterChain()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (7 nodes): `SettingsController.java`, `SettingsController`, `.getAllSettings()`, `.normalizeValue()`, `.updateSettings()`, `.validateSettings()`, `.validateSettingValue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (7 nodes): `SyncManager.js`, `SyncManager`, `.addTask()`, `.constructor()`, `.loadQueue()`, `.processQueue()`, `.saveQueue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (6 nodes): `useFormPersistence.js`, `OrderPage.jsx`, `useFormPersistence()`, `InputField()`, `OrderPage()`, `SelectField()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (6 nodes): `authService.js`, `clearSession()`, `normalizeUser()`, `persistSession()`, `readStoredToken()`, `readStoredUser()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (4 nodes): `GalleryItem.java`, `GalleryItem`, `.onCreate()`, `.onUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (4 nodes): `Product.java`, `Product`, `.onCreate()`, `.onUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (3 nodes): `CloudinaryConfig.java`, `CloudinaryConfig`, `.cloudinary()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (3 nodes): `OpenApiConfig.java`, `OpenApiConfig`, `.carpenterOpenApi()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (3 nodes): `InquiryRequest.java`, `InquiryRequest`, `.isValidBudgetRange()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (3 nodes): `ProjectResponse.java`, `ProjectResponse`, `UpdateResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (3 nodes): `QuoteResponse.java`, `QuoteItemResponse`, `QuoteResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (3 nodes): `Admin.java`, `Admin`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (3 nodes): `InquiryDraft.java`, `InquiryDraft`, `.onUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (3 nodes): `OtpCode.java`, `OtpCode`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (3 nodes): `ProjectUpdate.java`, `ProjectUpdate`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (3 nodes): `CarpenterApiApplicationTests.java`, `CarpenterApiApplicationTests`, `.contextLoads()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `AsyncConfig.java`, `AsyncConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `TaxConfigurationProperties.java`, `TaxConfigurationProperties`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `AuthRequest.java`, `AuthRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `GalleryItemRequest.java`, `GalleryItemRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `GoogleAuthRequest.java`, `GoogleAuthRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `InquiryDraftRequest.java`, `InquiryDraftRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `InquiryStatusRequest.java`, `InquiryStatusRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `ProductRequest.java`, `ProductRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `ProjectRequest.java`, `ProjectRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `ProjectUpdateRequest.java`, `ProjectUpdateRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `QuoteCalculationRequest.java`, `QuoteCalculationRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `QuoteItemRequest.java`, `QuoteItemRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `QuoteLineItemRequest.java`, `QuoteLineItemRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `QuoteRequest.java`, `QuoteRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `RegisterRequest.java`, `RegisterRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `SocialLoginRequest.java`, `SocialLoginRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `UpdateProfileRequest.java`, `UpdateProfileRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `AuthResponse.java`, `AuthResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `CategoryResponse.java`, `CategoryResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `CurrentUserResponse.java`, `CurrentUserResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `DashboardStats.java`, `DashboardStats`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `GalleryItemResponse.java`, `GalleryItemResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `InquiryResponse.java`, `InquiryResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `ProductResponse.java`, `ProductResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `QuoteCalculationResponse.java`, `QuoteCalculationResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (2 nodes): `QuoteLineItemResponse.java`, `QuoteLineItemResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (2 nodes): `SubcategoryResponse.java`, `SubcategoryResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (2 nodes): `QuoteItem.java`, `QuoteItem`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `SiteSetting.java`, `SiteSetting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `Subcategory.java`, `Subcategory`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `SiteSettingRepository.java`, `SiteSettingRepository`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `QuoteService` connect `Community 7` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getWhatsAppNumber()` (e.g. with `Footer()` and `Navbar()`) actually correct?**
  _`getWhatsAppNumber()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AsyncConfig`, `TaxConfigurationProperties`, `OtpRequest` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._