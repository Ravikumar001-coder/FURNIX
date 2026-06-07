# Furnix — Production-Grade UI/UX System Architecture
### Version 1.0 | UX Architecture & Design System Document

---

## Document Preamble

This document defines the Furnix UI/UX system as an **operational instrument**, not a visual portfolio exercise. Every design decision is evaluated against one question: **does this help the person doing work do it faster, with fewer errors, and with more confidence?**

The Furnix interface serves two fundamentally different mental contexts:

1. **The Admin Context** — A business operator managing time-sensitive production workflows. They need density, speed, and operational clarity. They are interrupted constantly. Every extra click costs real money.

2. **The Client Context** — A customer who may visit rarely, has high emotional investment in their furniture order, and needs to feel reassured, not overwhelmed. They need clarity, warmth, and transparency.

These contexts require architecturally different interface philosophies applied within one design system.

---

# PART 1 — DESIGN PHILOSOPHY

---

## 1.1 Operational Efficiency First

```
PRINCIPLE: Interface elements earn their place by reducing operator work.
           Every added element must eliminate more cognitive work than it creates.

APPLIED RULES:

Rule 1: Zero-Click Information
→ Critical operational information (overdue inquiries, payment alerts,
  orders on hold) must be visible WITHOUT any click or navigation.
→ Admin must see the most urgent action available within 2 seconds of
  opening the dashboard, with no search, no filter, no scroll.

Rule 2: One-Click Primary Action
→ Every list item (order, inquiry, quotation) surfaces its most likely
  next action as a button directly on the list row.
→ Admin should not need to open an order detail page to update status
  for routine milestone progression.
→ Actions that require context (cancellation, refunds) require navigation
  to detail — this is intentional friction for high-consequence operations.

Rule 3: Confirmation Friction is Proportional to Consequence
→ Low-consequence actions (update production milestone): No confirmation dialog.
  Execute immediately with undo toast available for 8 seconds.
→ Medium-consequence actions (send quotation to client): Confirmation with
  summary of what will happen. One extra click.
→ High-consequence actions (cancel order, issue refund): Full confirmation
  with explicit acknowledgment text the admin must type or select.
  This friction is a feature — it prevents accidental irreversible actions.

Rule 4: Context Persistence on Navigation
→ Admin opens Order A from dashboard, makes a note, navigates back.
  Dashboard scroll position is preserved. Filter state is preserved.
  The workflow continues, not restarts.
→ Browser Back button behaves as expected. URL state encodes view state.
→ No "your unsaved changes will be lost" dialogs — auto-save or
  explicit discard required, never implicit discard.

Rule 5: Keyboard-First Admin Interface
→ Admin performing 50+ order updates per day cannot afford to use mouse
  for every action. Common actions have keyboard shortcuts.
→ Tab order follows workflow logic, not DOM order.
→ Shortcut overlay accessible via ? key (like GitHub, Linear, Notion).
```

---

## 1.2 Cognitive Load Reduction

```
STRATEGIES:

Progressive Disclosure:
→ Show essential information immediately.
  Show supporting information on interaction (hover, expand, click).
  Show rare/expert information only on explicit request (settings, advanced options).
→ Order list: shows status, client name, delivery date, next action.
  Hides: payment reference numbers, internal notes, specification details.
  Available on row expand or detail navigation.

Chunking Complex Workflows:
→ Multi-step forms broken into named stages with explicit progress indication.
→ Each stage has ONE primary decision or action.
→ No stage asks for more than 6 pieces of information.
→ Stage completion is visually rewarded (checkmark, animation, progress advance).

Status Language Consistency:
→ Every order state has ONE human label used everywhere:
  Technical: "READY_FOR_DELIVERY" → Display: "Ready for Delivery"
  Never: "Ready to Ship", "Available", "Production Complete" — pick one, use it always.
→ Status language is defined once in the design system and injected everywhere.
  Any change propagates automatically. No hardcoded status strings in components.

Color Meaning Discipline:
→ Colors carry semantic meaning and NEVER deviate from it:
  Red → Error, danger, immediate attention required
  Amber → Warning, approaching deadline, needs attention soon
  Green → Success, confirmed, healthy state
  Blue → Informational, in-progress, active
  Grey → Inactive, disabled, archived, secondary
→ These meanings apply to EVERY component in the system.
  A green button never appears next to a "Delete" label.
  An amber badge never indicates success.

Whitespace as Information:
→ Spatial grouping communicates relationship.
  Payment milestones grouped visually with their order.
  Production stages grouped visually as a sequence.
→ Padding increases toward section boundaries.
  Items within a group: 8px separation.
  Groups within a card: 16px separation.
  Cards within a panel: 24px separation.
  Panels within a page: 32px separation.
```

---

## 1.3 Accessibility as Architecture

```
POSITION: Accessibility is not a compliance checkbox added at the end.
          It is a structural requirement that shapes every component design.
          An inaccessible component is an incomplete component.

ACCESSIBILITY REQUIREMENTS:
→ WCAG 2.1 Level AA minimum (mandatory)
→ WCAG 2.1 Level AAA for critical paths (login, order submission, payment)
→ Screen reader tested: VoiceOver (macOS/iOS), NVDA (Windows)
→ Keyboard navigation: 100% of functionality reachable without mouse
→ Touch targets: Minimum 44×44px (WCAG 2.5.5 AAA: 24×24px minimum)

STRUCTURAL DECISIONS FOR ACCESSIBILITY:
→ Semantic HTML first: Use <button> not <div onClick>.
  Screen readers announce role automatically. Keyboard works without JS.
→ ARIA labels on interactive elements that lack visible text.
  Icon buttons: always have aria-label.
  Status badges: aria-label = "Order status: Ready for Delivery"
→ Focus management on dynamic content:
  When a dialog opens → focus moves to dialog.
  When a dialog closes → focus returns to triggering element.
  When content updates (WebSocket) → announce via aria-live, do not steal focus.
→ Error messages linked to form fields via aria-describedby.
  Screen reader reads: "Budget minimum. Invalid. Must be at least 500."
→ Color is never the ONLY indicator of meaning.
  Status: color badge + text label + icon.
  Error: red color + error icon + error text.
  (Users with color blindness must get the same information.)
```

---

# PART 2 — DESIGN SYSTEM

---

## 2.1 Typography System

```
TYPE SCALE: Modular scale with 1.25 ratio (Major Third)

Token Name          Size    Weight    Line Height    Usage
────────────────────────────────────────────────────────────────────────────
--text-xs           11px    400       16px           Timestamps, metadata, labels
--text-sm           13px    400       20px           Secondary body, captions
--text-base         15px    400       24px           Primary body, descriptions
--text-md           17px    500       26px           Form labels, emphasized body
--text-lg           20px    600       28px           Card titles, section headers
--text-xl           24px    600       32px           Page section headers
--text-2xl          30px    700       38px           Page titles
--text-3xl          38px    700       46px           Dashboard hero numbers
--text-4xl          48px    800       56px           Landing page display text

FONT FAMILY:
Primary:     "Inter", system-ui, -apple-system, sans-serif
             → Inter: Designed for screens. Excellent legibility at small sizes.
               Optimized for UI text. Comprehensive weight range.
Monospace:   "JetBrains Mono", "Fira Code", monospace
             → For: Reference numbers (INQ-2025-000047), code, amounts
               Monospace ensures alignment in tables and lists.
             → Reference numbers use monospace so column widths stay stable.

FONT LOADING:
font-display: swap    → Prevents invisible text during load
Subset: latin         → Reduces payload by ~70% for Indian market
Preloaded in <head>: Regular (400) and SemiBold (600) weights only
Other weights: Loaded on demand

TYPOGRAPHIC RULES:
→ Body text: Never below 13px (--text-sm) in any state
→ Maximum line length: 72 characters (readability)
→ Minimum paragraph spacing: 1em between paragraphs
→ Numbers in financial context: Always tabular (font-variant-numeric: tabular-nums)
  This ensures columns of amounts align precisely

AMOUNT FORMATTING TOKEN:
.amount-display {
  font-family: "JetBrains Mono", monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
→ ₹42,500.00 in a table column will ALWAYS align with ₹85,000.00
  regardless of digit count. No visual column shifting.
```

---

## 2.2 Color System

```
COLOR ARCHITECTURE: Semantic tokens over raw values
All components use semantic tokens. Raw hex values appear only in token definitions.
Changing a semantic token updates all components that use it.

BRAND PALETTE:
--color-wood-50:    #FDF8F2    Light cream (background, warm surfaces)
--color-wood-100:   #F5E6D3    Light wood (card backgrounds, hover states)
--color-wood-200:   #E8C9A0    Medium wood (borders, dividers)
--color-wood-300:   #D4A574    Warm tan (accents)
--color-wood-400:   #B8864A    Medium brown (brand secondary)
--color-wood-500:   #8B5E2E    Rich brown (brand primary)
--color-wood-600:   #6B4520    Dark brown (hover on primary)
--color-wood-700:   #4A2F14    Deep brown (pressed states)
--color-wood-800:   #2E1C0A    Very dark (text on light backgrounds)
--color-wood-900:   #180E05    Near black

NEUTRAL PALETTE:
--color-neutral-0:   #FFFFFF
--color-neutral-50:  #F9FAFB
--color-neutral-100: #F3F4F6
--color-neutral-200: #E5E7EB
--color-neutral-300: #D1D5DB
--color-neutral-400: #9CA3AF
--color-neutral-500: #6B7280
--color-neutral-600: #4B5563
--color-neutral-700: #374151
--color-neutral-800: #1F2937
--color-neutral-900: #111827

SEMANTIC STATUS COLORS:
--color-success-50:  #F0FDF4    Background for success states
--color-success-100: #DCFCE7    Light success (table row highlight)
--color-success-500: #22C55E    Primary success (confirmed payment)
--color-success-700: #15803D    Text on light success background
--color-success-900: #14532D    Dark success text

--color-warning-50:  #FFFBEB    Background for warning states
--color-warning-100: #FEF3C7    Light warning
--color-warning-500: #F59E0B    Primary warning (approaching deadline)
--color-warning-700: #B45309    Text on light warning background
--color-warning-900: #78350F    Dark warning text

--color-error-50:    #FFF1F2    Background for error states
--color-error-100:   #FFE4E6    Light error
--color-error-500:   #EF4444    Primary error (overdue, critical)
--color-error-700:   #B91C1C    Text on light error background
--color-error-900:   #7F1D1D    Dark error text

--color-info-50:     #EFF6FF    Background for info states
--color-info-100:    #DBEAFE    Light info
--color-info-500:    #3B82F6    Primary info (in progress, active)
--color-info-700:    #1D4ED8    Text on light info background

SEMANTIC SURFACE TOKENS:
--surface-page:         var(--color-neutral-50)    Page background
--surface-card:         var(--color-neutral-0)     Card background
--surface-card-hover:   var(--color-neutral-50)    Card hover
--surface-sidebar:      var(--color-wood-800)      Admin sidebar
--surface-sidebar-hover:var(--color-wood-700)      Sidebar hover
--surface-elevated:     var(--color-neutral-0)     Modal, dropdown background
--surface-sunken:       var(--color-neutral-100)   Input background, table rows alt

SEMANTIC TEXT TOKENS:
--text-primary:         var(--color-neutral-900)   Primary text
--text-secondary:       var(--color-neutral-600)   Secondary, metadata
--text-tertiary:        var(--color-neutral-400)   Placeholder, disabled
--text-inverse:         var(--color-neutral-0)     Text on dark backgrounds
--text-brand:           var(--color-wood-500)      Brand-colored text
--text-link:            var(--color-info-700)      Hyperlinks
--text-danger:          var(--color-error-700)     Error text
--text-success:         var(--color-success-700)   Success text
--text-warning:         var(--color-warning-700)   Warning text

CONTRAST COMPLIANCE:
--text-primary on --surface-page:       15.3:1    ✓ AAA
--text-secondary on --surface-card:     5.9:1     ✓ AA
--text-tertiary on --surface-card:      3.1:1     ✗ Fail (placeholder only — exempt)
--text-inverse on --surface-sidebar:    12.1:1    ✓ AAA
--color-error-700 on --color-error-50:  7.2:1     ✓ AAA
--color-success-700 on --color-success-50: 6.8:1 ✓ AAA
--color-warning-700 on --color-warning-50: 5.1:1 ✓ AA

DARK MODE: Defined in Phase 2
Dark mode tokens follow same semantic structure, different raw values.
Components use ONLY semantic tokens — dark mode works by switching token values.
No component-level color overrides needed.
```

---

## 2.3 Spacing System

```
BASE UNIT: 4px (--space-1)
All spacing is multiples of the base unit.

Token       Value    Usage
──────────────────────────────────────────────────────────
--space-0   0px
--space-0.5 2px      Micro adjustments, hairline separators
--space-1   4px      Icon internal padding, dense list item gaps
--space-2   8px      Within-component gaps (icon + label, badge items)
--space-3   12px     Input padding vertical, small button padding
--space-4   16px     Input padding horizontal, component internal padding
--space-5   20px     Card section internal separation
--space-6   24px     Card padding, between-component gaps
--space-8   32px     Between card groups, section separation
--space-10  40px     Page section separation
--space-12  48px     Major section breaks
--space-16  64px     Page hero sections, modal padding

LAYOUT TOKENS:
--sidebar-width:        240px    Admin sidebar expanded
--sidebar-collapsed:    64px     Admin sidebar collapsed (icons only)
--topbar-height:        56px     Fixed top navigation bar
--content-max-width:    1280px   Maximum content width
--content-padding:      var(--space-8)  Page content padding

RESPONSIVE BREAKPOINTS:
--bp-mobile:    480px    Mobile (single column)
--bp-tablet:    768px    Tablet (two column where applicable)
--bp-desktop:   1024px   Desktop (full layout)
--bp-wide:      1280px   Wide desktop (expanded panels)
--bp-ultra:     1600px   Ultra-wide (max content width applies)

BREAKPOINT RULES:
Admin interface: Minimum supported width: 1024px
  → Below 1024px: Show "Admin interface requires a wider screen"
  → Admin on tablet (768px): Read-only views with limited actions
  → Admin on mobile: Not supported (production decision — admin needs full context)

Client interface: Fully responsive 320px → ∞
  → Mobile: Primary design target (clients browse on phones)
  → Tablet: Two-column layout
  → Desktop: Full layout with sidebar navigation
```

---

## 2.4 Interaction Standards

```
ANIMATION TOKENS:
--duration-instant:  0ms      No animation (immediate feedback)
--duration-fast:     150ms    Micro-interactions (hover, focus ring)
--duration-base:     200ms    State transitions (button press, toggle)
--duration-moderate: 300ms    Modal appear, panel expand
--duration-slow:     500ms    Page transitions, complex reveals
--duration-deliberate: 800ms  Onboarding, first-time callouts

--ease-default:   cubic-bezier(0.4, 0, 0.2, 1)   Standard UI motion
--ease-enter:     cubic-bezier(0, 0, 0.2, 1)      Elements entering viewport
--ease-exit:      cubic-bezier(0.4, 0, 1, 1)      Elements leaving viewport
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1) Confirmations, success

ANIMATION RULES:
→ Respect prefers-reduced-motion: all animations disabled if set
→ Loading spinners: Never on actions that complete in < 200ms
  (spinner appearing and disappearing instantly is jarring)
→ Progress bars: Only for operations > 1 second
→ Skeleton screens: For content that takes > 300ms to load
→ Transitions: Only on properties that were explicitly changed
  No CSS transitions on everything (*) — causes performance issues

HOVER STATES:
Interactive elements: background-color transition, 150ms
Buttons: slight background darkening (4% on dark backgrounds, 6% on light)
Table rows: --surface-card-hover background (not color change — too aggressive)
Links: underline appears on hover (do not rely solely on color for link identity)

FOCUS STATES (critical for accessibility):
All interactive elements must have a visible focus ring.
Focus ring: 2px solid --color-info-500, offset 2px from element
NEVER: outline: none without a replacement focus indicator
→ :focus-visible pseudo-class: Show focus ring for keyboard, not mouse
  (Prevents "ugly ring" on click while preserving keyboard navigation)

.focusable:focus-visible {
  outline: 2px solid var(--color-info-500);
  outline-offset: 2px;
  border-radius: calc(var(--border-radius-base) + 2px);
}
```

---

# PART 3 — COMPONENT SYSTEM

---

## 3.1 Status Badge Component

```
The most used component in Furnix. Every order, inquiry, and quotation
displays a status badge. Must be visually distinct, consistent, and readable.

COMPONENT VARIANTS (complete set):

Order Status Badges:
┌─────────────────────────────────────────────────────────────┐
│ ● Advance Pending      [amber bg, amber text, clock icon]   │
│ ● In Production        [blue bg, blue text, gear icon]      │
│ ● Material Procurement [blue bg, blue text, box icon]       │
│ ● Assembly             [blue bg, blue text, tool icon]      │
│ ● Finishing            [blue bg, blue text, brush icon]     │
│ ● Quality Check        [blue bg, blue text, check icon]     │
│ ● Ready for Delivery   [green bg, green text, truck icon]   │
│ ● Delivery Scheduled   [green bg, green text, calendar icon]│
│ ● Delivered            [green bg, green text, check icon]   │
│ ● Closed               [grey bg, grey text, archive icon]   │
│ ● On Hold              [amber bg, amber text, pause icon]   │
│ ● Cancelled            [red bg, red text, x icon]           │
└─────────────────────────────────────────────────────────────┘

JSX COMPONENT DEFINITION:

interface StatusBadgeProps {
  status: OrderStatus | InquiryStatus | QuotationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  pulse?: boolean;   // Animated pulse for "active" states (In Production)
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  ADVANCE_PENDING: {
    label: 'Advance Pending',
    icon: Clock,
    colorClass: 'status-warning',
    ariaLabel: 'Awaiting advance payment'
  },
  IN_PRODUCTION: {
    label: 'In Production',
    icon: Settings,
    colorClass: 'status-info',
    pulse: true,
    ariaLabel: 'Currently in production'
  },
  READY_FOR_DELIVERY: {
    label: 'Ready for Delivery',
    icon: Truck,
    colorClass: 'status-success',
    ariaLabel: 'Ready for delivery scheduling'
  },
  ON_HOLD: {
    label: 'On Hold',
    icon: PauseCircle,
    colorClass: 'status-warning',
    ariaLabel: 'Order is on hold, action required'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    colorClass: 'status-error',
    ariaLabel: 'Order has been cancelled'
  }
  // ... all statuses defined
};

export const StatusBadge = ({
  status, size = 'md', showIcon = true,
  showLabel = true, pulse
}: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <span
      className={cn('status-badge', `status-badge--${size}`, config.colorClass,
        pulse && config.pulse && 'status-badge--pulse')}
      role="status"
      aria-label={config.ariaLabel}
    >
      {showIcon && <config.icon aria-hidden="true" />}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

CSS:
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 9999px;  /* Pill shape */
  white-space: nowrap;
}
.status-badge--sm { padding: var(--space-0-5) var(--space-2); }
.status-badge--md { padding: var(--space-1) var(--space-3); }
.status-badge--lg { padding: var(--space-2) var(--space-4); }

.status-warning {
  background: var(--color-warning-100);
  color: var(--color-warning-700);
}
.status-info {
  background: var(--color-info-100);
  color: var(--color-info-700);
}
.status-success {
  background: var(--color-success-100);
  color: var(--color-success-700);
}
.status-error {
  background: var(--color-error-100);
  color: var(--color-error-700);
}

.status-badge--pulse .status-badge__dot {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 3.2 Data Table Component

```
The most complex component in the admin interface.
Must handle: sorting, filtering, selection, inline actions,
             loading states, empty states, error states, pagination.

COLUMN CONFIGURATION:

interface TableColumn<T> {
  key: keyof T;
  header: string;
  width?: string;          // Fixed or min-width
  sortable?: boolean;
  renderCell: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';  // For horizontal scroll
  hideBelow?: Breakpoint;      // Responsive column hiding
  ariaLabel?: (row: T) => string;  // For screen reader context
}

ORDER TABLE COLUMNS (admin view):
const orderColumns: TableColumn<Order>[] = [
  {
    key: 'referenceNumber',
    header: 'Order',
    width: '140px',
    sticky: 'left',
    renderCell: (order) => (
      <div className="cell-reference">
        <span className="reference-number">{order.referenceNumber}</span>
        <span className="order-type-indicator" aria-label={order.orderType}>
          {order.orderType === 'CUSTOM' ? 'Custom' : 'Catalog'}
        </span>
      </div>
    )
  },
  {
    key: 'client',
    header: 'Client',
    renderCell: (order) => (
      <div className="cell-client">
        <Avatar name={order.client.fullName} size="sm" />
        <div>
          <p className="client-name">{order.client.fullName}</p>
          <p className="client-contact">{order.client.preferredContact}</p>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    renderCell: (order) => (
      <div>
        <StatusBadge status={order.status} size="sm" />
        {order.holdReason && (
          <HoldIndicator reason={order.holdReason} />
        )}
      </div>
    )
  },
  {
    key: 'financials',
    header: 'Payment',
    align: 'right',
    hideBelow: 'desktop',
    renderCell: (order) => (
      <div className="cell-financials">
        <span className="amount-display">
          ₹{formatAmount(order.amountPaid)}
        </span>
        <span className="amount-separator">/</span>
        <span className="amount-total">
          ₹{formatAmount(order.totalAmount)}
        </span>
        {order.amountOutstanding > 0 && (
          <PaymentProgressBar
            paid={order.amountPaid}
            total={order.totalAmount}
            aria-label={`₹${order.amountPaid} paid of ₹${order.totalAmount} total`}
          />
        )}
      </div>
    )
  },
  {
    key: 'promisedDeliveryDt',
    header: 'Delivery Date',
    sortable: true,
    renderCell: (order) => (
      <DeliveryDateCell
        date={order.promisedDeliveryDt}
        status={order.status}
        // Shows: date + urgency indicator (overdue=red, this week=amber, ok=grey)
      />
    )
  },
  {
    key: 'actions',
    header: '',
    width: '48px',
    sticky: 'right',
    renderCell: (order) => (
      <RowActionMenu
        order={order}
        // Shows contextual actions based on order.status
        // In Production → "Update Stage", "Add Note", "View Details"
        // Advance Pending → "Record Payment", "Send Reminder", "View Details"
      />
    )
  }
];

TABLE STATES:

Loading State (skeleton):
  <TableSkeleton columns={6} rows={10}>
    {/* Each cell replaced with animated grey bar */}
    {/* Widths match actual column widths — prevents layout shift */}
    {/* Skeleton rows have different bar widths for realism */}
  </TableSkeleton>

Empty State:
  <TableEmptyState
    icon={ClipboardList}
    title="No orders found"
    description="Orders will appear here once clients submit inquiries and quotations are approved."
    action={{
      label: "View inquiry queue",
      href: "/admin/inquiries"
    }}
  />

Empty State (with active filters):
  <TableEmptyState
    icon={Filter}
    title="No orders match your filters"
    description="Try adjusting your filters or search terms."
    action={{
      label: "Clear all filters",
      onClick: clearFilters
    }}
    secondaryAction={{
      label: "View all orders",
      onClick: viewAll
    }}
  />

Error State:
  <TableErrorState
    message="Unable to load orders"
    detail="This may be a temporary issue."
    action={{
      label: "Retry",
      onClick: refetch,
      icon: RefreshCw
    }}
  />
```

---

## 3.3 Form Components

```
DESIGN PRINCIPLE: Forms communicate. They explain what's needed,
                  why it's needed, and confirm what was provided.

INPUT COMPONENT STATES:

Default:
┌─────────────────────────────────────────────────────┐
│ Budget Minimum                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ₹  [                                          ] │ │
│ └─────────────────────────────────────────────────┘ │
│ The minimum amount you're prepared to spend          │
└─────────────────────────────────────────────────────┘

Focus (keyboard or click):
┌─────────────────────────────────────────────────────┐
│ Budget Minimum                                       │
│ ┌═════════════════════════════════════════════════┐ │
│ ║ ₹  [15000                                     ] ║ │  ← 2px info-500 border
│ └═════════════════════════════════════════════════┘ │
│ The minimum amount you're prepared to spend          │
└─────────────────────────────────────────────────────┘

Error:
┌─────────────────────────────────────────────────────┐
│ Budget Minimum                          ⚠ Required  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ₹  [                                          ] │ │  ← 2px error-500 border
│ └─────────────────────────────────────────────────┘ │
│ ✕ Budget minimum is required                        │  ← error-700 text + icon
└─────────────────────────────────────────────────────┘

Success (validated):
┌─────────────────────────────────────────────────────┐
│ Budget Minimum                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ₹  [15,000                                    ✓]│ │  ← success-500 check icon
│ └─────────────────────────────────────────────────┘ │
│ The minimum amount you're prepared to spend          │
└─────────────────────────────────────────────────────┘

Disabled:
┌─────────────────────────────────────────────────────┐
│ Budget Minimum                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ₹  [15,000                                    ] │ │  ← grey bg, grey border
│ └─────────────────────────────────────────────────┘ │  ← cursor: not-allowed
│ This field cannot be edited for confirmed orders     │
└─────────────────────────────────────────────────────┘

VALIDATION FEEDBACK TIMING:
→ On Submit: Validate all fields immediately, show all errors
→ On Blur (after typing): Validate the field that lost focus
→ On Change: ONLY clear an existing error (don't add new errors while typing)
→ NEVER validate on every keystroke — prevents "you're already wrong before finishing"

VALIDATION MESSAGE COPY STANDARDS:
  Good: "Budget minimum must be at least ₹500"
        (Specific, actionable, tells the rule)
  Bad:  "Invalid value" (What is invalid? Why?)
  Bad:  "Budget minimum is required" when value is 200
        (It IS provided — the error is wrong, not missing)

MULTI-STEP FORM PROGRESS INDICATOR:
  ●━━━━━●━━━━━●━━━━━○
  What you need    Preferences    Contact    Review
  
  ● = Completed (clickable to navigate back)
  ● = Current (active)
  ○ = Future (not yet accessible)
  
  Progress bar fills proportionally.
  Each step shows: step number + step name + completion status.
  Back navigation always available (no "you cannot go back" patterns).
```

---

## 3.4 Loading, Empty, and Error States (Complete System)

```
LOADING STATE HIERARCHY:

Level 1: Page-level loading (full page first load)
  → Skeleton layout matches expected content structure
  → Sidebar is NOT skeletonized (it's client-rendered from cached user data)
  → Each panel loads independently (no single blocking skeleton for entire page)
  → No spinner — skeleton only (spinners provide no content preview)

Level 2: Component-level loading (panel refresh)
  → Overlay on existing content with subtle opacity: 0.6
  → Small spinner in top-right of component
  → Content remains readable (does not disappear) during refresh
  → Indicates "this is updating" not "this is broken"

Level 3: Inline loading (button action)
  → Button text replaced with spinner + "Processing..."
  → Button disabled during loading
  → Width preserved (prevents layout jump as text changes length)
  → Keyboard focus remains on button

Level 4: Background operation
  → No UI blocking
  → Toast notification on completion or failure
  → Progress indicator in notification for known-duration operations

EMPTY STATE DESIGN RULES:
→ Every empty state has: illustration/icon, title, description, primary action
→ Empty ≠ Error. Different visual treatment, different icon vocabulary.
→ Empty state copy is contextual to why it's empty:
  "No orders yet" (never had orders) vs
  "No orders match your filters" (filters too narrow) vs
  "No orders in production" (all done or not started)

ILLUSTRATION VOCABULARY:
  No orders:       A clean workbench with tools arranged neatly
  No inquiries:    An empty message inbox with a plus button prompt
  No products:     An empty catalog shelf
  No results:      A magnifying glass over blank paper
  All done:        A checkmark with celebration (used sparingly)

ERROR STATE DESIGN:
→ Error state is NOT just "Something went wrong" with a refresh button.
→ Error states are specific:
  
  Network error: (different from server error)
  ┌────────────────────────────────────────────┐
  │  ⚡ Connection Lost                         │
  │                                            │
  │  Unable to reach the server. Check your    │
  │  internet connection and try again.         │
  │                                            │
  │  [Try Again]    Last loaded: 3 minutes ago │
  └────────────────────────────────────────────┘
  
  Server error: (different from network error)
  ┌────────────────────────────────────────────┐
  │  ⚠ Unable to Load Orders                  │
  │                                            │
  │  Our servers encountered an issue. This    │
  │  is usually temporary.                     │
  │                                            │
  │  [Retry]    Reference: req_7f3a2b1c        │
  └────────────────────────────────────────────┘
  
  Permission error: (should not happen in well-designed UI, but can)
  ┌────────────────────────────────────────────┐
  │  🔒 Access Restricted                      │
  │                                            │
  │  You don't have permission to view this.   │
  │  Contact your administrator if you         │
  │  believe this is an error.                 │
  │                                            │
  │  [Return to Dashboard]                     │
  └────────────────────────────────────────────┘
```

---

# PART 4 — WORKFLOW UX

---

## 4.1 Admin Order Management Workflow

```
DESIGN GOAL: An admin should be able to process their most common
             daily actions (check overnight updates, update production stages,
             record payments, respond to inquiries) in < 10 minutes.

MORNING WORKFLOW UX (primary use case):
Admin opens dashboard. They see:

┌─────────────────────────────────────────────────────────────────────────┐
│  🔴 2 inquiries overdue SLA    🟡 3 payments pending    ⚡ 1 order on hold│
│  [View Overdue]                [View Payments]          [View Order]    │
└─────────────────────────────────────────────────────────────────────────┘

These alerts are ABOVE the fold, ABOVE the order list.
Admin knows their urgent actions before scrolling.

INLINE ROW ACTIONS (reduces navigation):
Each order row in the admin table shows:

INQ-2025-000047  │  Priya Sharma  │  ● In Production  │  ₹42,500/85,000  │
  Teak Dining Table               │  Assembly Stage   │  May 15          │  [↗] [···]

[↗] = Open order detail (primary navigation)
[···] = Quick action menu:
  ├── Update Production Stage →  (opens inline sub-menu with stages)
  │     ● Material Procurement ✓
  │     ● Rough Cutting ✓
  │     ● Assembly          ← click to complete
  │     ○ Finishing
  │     ○ Quality Check
  ├── Add Internal Note
  ├── Record Payment
  ├── Send Status Update to Client
  └── ─────────────────────
      Apply Hold
      Cancel Order (requires navigation — intentional friction)

INLINE QUICK ACTION COMPLETION:
When admin clicks "Complete Assembly Stage":
1. Optimistic update: Stage shows as complete IMMEDIATELY
2. Row status badge updates: "Assembly" → "Finishing"
3. Undo toast appears: "Assembly stage marked complete. [Undo] 8s"
4. Background API call confirms
5. If API fails: Row reverts, error toast: "Could not update stage. [Retry]"

This flow: 1 click → done. Zero navigation. Zero page reloads.

KEYBOARD WORKFLOW (power user mode):
? → Opens shortcut reference overlay
/ → Jumps focus to global search
J/K → Navigate between rows (vi-style)
Space → Expand/collapse selected row
Enter → Open order detail for selected row
A → Acknowledge (from inquiry list)
N → Add note to selected order
P → Record payment for selected order
U → Update stage for selected order
Esc → Close any open panel/dialog, return focus to list
```

---

## 4.2 Multi-Step Inquiry Form (Client)

```
DESIGN GOAL: Client submits inquiry with complete information in one session.
             If interrupted, they resume without starting over.

STEP ARCHITECTURE:
Step 1: What are you looking for?
Step 2: Specifications (dimensions, materials)
Step 3: Budget and timeline
Step 4: Contact preference
Step 5: Review and submit

INTERRUPTION RECOVERY:
→ Form state saved to sessionStorage after each step completion
→ On return (same session): "You were in the middle of an inquiry. Continue?"
   [Continue]    [Start fresh]
→ On return (different session/day): State not persisted — fresh start
  (sessionStorage clears on tab close — intentional. Stale inquiry data
  from weeks ago would confuse more than help.)

STEP 1 DESIGN: What are you looking for?
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Tell us about your furniture idea                                      │
│  We'll use this to prepare an accurate quote for you.                   │
│                                                                         │
│  What type of furniture are you looking for?                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ e.g., "Dining table for 6 people" or "Wardrobe with mirror"    │   │
│  │                                                                  │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  Be as descriptive as you like — details help us quote accurately       │
│                                                                         │
│  Would you like this to match an existing style?      ○ Yes   ● No    │
│                                                                         │
│  [Upload reference images]  (Optional — up to 5 photos)               │
│   📎 Drop images here or click to browse                               │
│                                                                         │
│                                              [Continue →]              │
└─────────────────────────────────────────────────────────────────────────┘

VALIDATION UX ON STEP TRANSITION:
→ Clicking "Continue" triggers field validation
→ If errors: scroll to first error, focus first error field
→ Scroll behavior: smooth, with 80px top offset (so label is visible)
→ Error count announced: "3 fields need attention" (screen reader)
→ Form does NOT submit and jump to step 2 with errors on step 1

REVIEW STEP (Step 5):
Shows full summary before submission.
Every field editable inline (click field to jump back to that step and field).
"Back to edit" per section — not "back to step X".
Submit button clearly labelled: "Submit Inquiry →"
NOT: "Submit", "Send", "Done", "Finish" — be explicit.

POST-SUBMISSION SUCCESS:
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    ✓ Inquiry Submitted Successfully                     │
│                                                                         │
│                    Reference: INQ-2025-000047                          │
│                    (save this number)                                   │
│                                                                         │
│       We'll respond within 24 hours via WhatsApp.                      │
│       Expected response by: Wednesday, Jan 16 at 10:30 AM             │
│                                                                         │
│   [WhatsApp Us Now]         [Track Your Inquiry]                       │
│                                                                         │
│   You'll receive a WhatsApp message at +91 98765 43210                │
│   when we respond.                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

DESIGN NOTES:
→ Reference number in monospace, large size — designed to be photographed
→ Expected response time is concrete (not "within 24 hours" only, but actual time)
→ WhatsApp button primary — matches client's preferred contact
→ "Save this number" hint — reduces support calls asking "what's my reference?"
```

---

## 4.3 Quotation Approval Flow (Client)

```
DESIGN GOAL: Client must understand what they're approving before clicking.
             Approval must feel considered, not accidental.

QUOTATION PAGE LAYOUT:
┌─────────────────────────────────────────────────────────────────────────┐
│  ← My Inquiries                                                         │
│                                                                         │
│  Quote for Your L-Shaped Bookshelf                                     │
│  Reference: QT-2025-000023  ·  Valid until: January 22, 2025           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ⏰ This quote expires in 6 days                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  What's included                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  L-Shaped Bookshelf – Main Unit              ₹22,000             │  │
│  │  Sliding Glass Doors (4 panels)              ₹8,000              │  │
│  │  Premium Teak Wood Upgrade                   ₹5,000              │  │
│  │  ─────────────────────────────────────────────────               │  │
│  │  Total                                       ₹35,000             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Specifications                                                         │
│  Wood: Teak Grade A  ·  Finish: Natural Polish  ·  240 × 40 × 200 cm  │
│                                                                         │
│  Payment Plan                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Today: Advance (50%)          ₹17,500  ← Pay to begin          │  │
│  │  Mid-production:               ₹8,750   ← After Assembly stage  │  │
│  │  On delivery:                  ₹8,750   ← Before installation   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Delivery Timeline                                                      │
│  Production starts when advance is received.                           │
│  Estimated delivery: 30–45 days (by March 1 – March 15, 2025)         │
│                                                                         │
│  Message from our workshop                                             │
│  "We've sourced excellent Grade A teak for your bookshelf..."          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [Request Changes]              [Approve Quotation →]           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

ON APPROVAL CLICK — Confirmation Modal:
┌─────────────────────────────────────────────────────────────────────────┐
│  Confirm Your Order                                                     │
│                                                                         │
│  By approving, you agree to:                                           │
│  ✓ The specifications listed in this quotation                         │
│  ✓ The payment plan (₹17,500 advance due immediately)                 │
│  ✓ The estimated delivery timeline (30–45 days)                        │
│                                                                         │
│  Once approved, production begins after your advance payment            │
│  is received. Design changes after this point may incur                │
│  additional cost.                                                       │
│                                                                         │
│  [Cancel]                              [Yes, Approve Quotation]        │
└─────────────────────────────────────────────────────────────────────────┘

DESIGN NOTES:
→ "Request Changes" is equally prominent — not hidden or grayed out
  (Dark patterns that hide the revision path cause client frustration)
→ Approval modal uses plain language, not legal language
→ Approval button says "Yes, Approve Quotation" — repetition of action
  prevents accidental confirmation
→ Payment amount shown again in modal — not just in quotation
  Client should not have to scroll up to remember what they're committing to
```

---

# PART 5 — REALTIME UX

---

## 5.1 Live Update Patterns

```
PRINCIPLE: Realtime updates should feel like assistance, not interruption.
           Updates that change what the user is looking at without warning
           are disorienting and untrustworthy.

UPDATE TAXONOMY:

Type 1: Silent Background Update (no user notification)
  When: Non-critical count updates (total order counts on dashboard)
  How: Number animates from old to new value
  User experience: "The number changed. Good — it's live."

Type 2: Indicator Update (notification without content push)
  When: New inquiry arrives while admin is viewing a different page
  How: Sidebar badge count increments with brief pulse animation
       Toast in corner: "New inquiry from Priya Sharma" with [View] button
  User experience: "Something happened. I'll look when I'm ready."
  NEVER: Replace current page content, hijack scroll position, steal focus

Type 3: Content Update (update visible content the user is watching)
  When: Admin has the inquiry detail page open; client sends a message
  How: New message animates into the message thread from bottom
       Subtle "New message" indicator at top of thread if scrolled up
  User experience: "The content I'm watching just updated. I see it."

Type 4: State Change Alert (requires admin action)
  When: Order moves to state requiring admin action (payment confirmed → now in production)
  How: Dashboard panel refreshes with updated count
       Toast: "ORD-2025-000023 advance payment confirmed — production can begin"
       Order moves to top of "In Production" queue
  User experience: "My work queue just changed. Let me prioritize."

IMPLEMENTATION: OPTIMISTIC UPDATES
When admin clicks "Complete Assembly Stage":
  
  Sequence:
  T+0ms:   User clicks "Complete" → Button disabled
  T+1ms:   Local state updated immediately (optimistic)
           Stage badge shows "Completed ✓" (grey)
           Order progress bar advances
           Undo toast appears: "Assembly marked complete [Undo] 8s"
  T+200ms: API call initiated
  T+350ms: API returns success
           Stage badge: grey "Completed ✓" → confirmed (no visual change needed)
           Undo toast dismissed (or stays if user hasn't dismissed)
  
  On Failure:
  T+0ms:   User clicks "Complete" → Button disabled
  T+1ms:   Local state updated (optimistic)
  T+200ms: API call initiated
  T+3000ms: API returns 500
  T+3001ms: LOCAL STATE REVERTED immediately
            Stage badge returns to "In Progress"
            Progress bar returns
            Error toast: "Could not update stage. [Retry] [Dismiss]"
            Button re-enabled

ROLLBACK VISIBILITY RULES:
→ Rollback must complete in < 200ms (feels instant)
→ Rolled-back element briefly highlights in error-100 background (300ms, then fades)
  This brief highlight communicates "this changed and then changed back"
  Without highlight: User may not notice the revert

UNDO PATTERN:
→ 8-second window (generous — admin may have moved mouse away)
→ Undo toast shows countdown (subtle progress bar under the toast)
→ Clicking [Undo]: immediately reverts optimistic state + makes undo API call
→ API undo call: standard state transition reversal
→ If undo API fails: Show error, note that operation could not be undone,
  provide link to manual correction
```

---

## 5.2 Synchronization Indicators

```
CONNECTION STATUS INDICATOR:
Location: Bottom-left corner of admin interface (unobtrusive)

States:
  ● Connected     [green dot]  "Live updates active"
  ⟳ Reconnecting  [grey dot, spinning] "Reconnecting..."
  ● Disconnected  [amber dot]  "Live updates paused — showing last known data"

ON DISCONNECTED STATE:
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ Live updates paused                              Last updated: 2m ago│
│  Working in offline mode. Changes you make will still be saved.         │
│  [Reconnect now]                                                        │
└─────────────────────────────────────────────────────────────────────────┘

→ Banner appears at TOP of content area (not just status dot)
→ "Last updated X minutes ago" timestamp visible on all data panels
→ Admin can continue working — writes still go through REST API
→ WebSocket is for receive only — not for sending commands
→ So "offline" means: no live updates, but all actions still work

DATA FRESHNESS INDICATORS:
→ Dashboard panels show: "Updated 45 seconds ago"
→ Panels that are stale (> 90 seconds): "Refreshing..." indicator
→ Panels that errored: Show last known data + "Could not refresh" + [Retry]
→ No panel shows blank if it has previous data — degrade to stale data

CONCURRENT EDIT INDICATOR:
When admin B opens an order that admin A has open:
  → No lock (no "order locked by another user" — unnecessary friction)
  → If admin B submits a change after admin A already changed state:
    409 Conflict error returned
    UI shows: "This order was updated by [Admin A] moments ago.
               Their change: [status moved from X to Y]
               [View current state]    [Retry your action with fresh state]"
  → Admin B never silently overwrites Admin A's work
```

---

# PART 6 — ACCESSIBILITY

---

## 6.1 Keyboard Navigation System

```
GLOBAL KEYBOARD NAVIGATION:

Tab:        Forward through focusable elements
Shift+Tab:  Backward through focusable elements
Enter:      Activate button or link; submit form; confirm dialog
Space:      Toggle checkbox; activate button (when button, not link)
Escape:     Close modal; close dropdown; cancel editing; deselect
Arrow keys: Navigate within composite widgets (tables, menus, radio groups)

ADMIN-SPECIFIC SHORTCUTS:
?         Open keyboard shortcut reference (modal overlay)
/         Focus global search (always available)
G then D  Go to Dashboard
G then O  Go to Orders
G then I  Go to Inquiries
G then Q  Go to Quotations
J / K     Select next / previous row in list
Enter     Open selected item detail
A         Acknowledge selected inquiry (if in inquiry list)
N         New: opens context-appropriate create dialog
P         Record payment (if selected order is in payment-pending state)
U         Update status (opens status update drawer for selected order)

MODAL FOCUS MANAGEMENT:
When modal opens:
  1. First focusable element in modal receives focus
  2. Focus is trapped inside modal (Tab cycles through modal elements only)
  3. Escape closes modal
  4. On close: focus returns to element that triggered the modal

IMPLEMENTATION:
// useFocusTrap hook:
export const useFocusTrap = (ref: RefObject<HTMLElement>, isActive: boolean) => {
  useEffect(() => {
    if (!isActive || !ref.current) return;
    
    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0] as HTMLElement;
    const last = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    first?.focus();
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isActive]);
};

SKIP NAVIGATION:
First focusable element on every page:
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
  
Visible only on focus:
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-info-500);
  color: white;
  padding: var(--space-2) var(--space-4);
  z-index: 9999;
}
.skip-link:focus { top: 0; }  /* Appears on focus, stays accessible */
```

---

## 6.2 Screen Reader Support

```
ARIA LIVE REGIONS:
Used for dynamic content updates that don't change URL or page structure.

<div aria-live="polite" aria-atomic="false" id="status-announcements">
  {/* 
    Polite: Announces after user finishes current action (not mid-sentence)
    atomic=false: Announces only changed portion, not entire region
    Used for: order status updates, new message in thread, payment confirmation
  */}
</div>

<div aria-live="assertive" aria-atomic="true" id="urgent-announcements">
  {/*
    Assertive: Interrupts current screen reader output immediately
    atomic=true: Announces entire content of region
    Used for: Error messages, session expiry warning, security alerts
    USE SPARINGLY — assertive interrupts user's current reading
  */}
</div>

// Announcement utility:
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const region = document.getElementById(
    priority === 'assertive' ? 'urgent-announcements' : 'status-announcements'
  );
  if (region) {
    region.textContent = '';         // Clear first (forces re-announcement if same text)
    setTimeout(() => {
      region.textContent = message;
    }, 50);
  }
};

// Usage examples:
announce('Payment of ₹17,500 confirmed. Order is now in production.');
announce('Error: Could not update stage. Please retry.', 'assertive');
announce('New inquiry from Priya Sharma is awaiting acknowledgment.');

TABLE ACCESSIBILITY:
<table aria-label="Active Orders">
  <thead>
    <tr>
      <th scope="col" aria-sort="ascending">Order Reference</th>
      <th scope="col" aria-sort="none">
        <button onClick={sortByStatus}>
          Status
          <ArrowUpDown aria-hidden="true" />
        </button>
      </th>
      <th scope="col">Delivery Date</th>
      <th scope="col">
        <span className="sr-only">Actions</span>
      </th>
    </tr>
  </thead>
  <tbody>
    {orders.map(order => (
      <tr key={order.id} aria-label={`Order ${order.referenceNumber}`}>
        <td>
          <a href={`/admin/orders/${order.id}`}
             aria-label={`View order ${order.referenceNumber} for ${order.client.fullName}`}>
            {order.referenceNumber}
          </a>
        </td>
        <td>
          <StatusBadge
            status={order.status}
            aria-label={`Status: ${STATUS_CONFIG[order.status].ariaLabel}`}
          />
        </td>
      </tr>
    ))}
  </tbody>
</table>

IMAGE ACCESSIBILITY:
Product images: alt={`${product.name}, ${product.category.name}, ${primaryWoodType} wood`}
Process photos: alt={`Production photo: ${stageName} stage for order ${referenceNumber}`}
Delivery proofs: alt={`Delivery confirmation photo for order ${referenceNumber}`}
Decorative icons: aria-hidden="true" (do not read decorative elements)
Meaningful icons (without text): aria-label="Close dialog" or aria-label="Sort ascending"
```

---

# PART 7 — DASHBOARD ARCHITECTURE

---

## 7.1 Admin Dashboard Information Hierarchy

```
INFORMATION HIERARCHY: Urgent → Important → Useful → Contextual

LAYOUT:
┌─────────────────────────────────────────────────────────────────────────┐
│  TIER 1: CRITICAL ALERTS (always visible, above fold)                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🔴 2 Inquiries overdue (48h+)                    [View Now →]  │   │
│  │  🟡 1 Order on hold: Material shortage            [Resolve →]   │   │
│  │  🟡 3 Payments overdue                            [View →]      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  Dismissed alerts remain visible until resolved (cannot be hidden)      │
│                                                                         │
│  TIER 2: OPERATIONAL SNAPSHOT (primary decision-making data)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Inquiries  │  │   Orders    │  │  Payments   │  │  Deliveries │  │
│  │             │  │             │  │             │  │             │  │
│  │      8      │  │     22      │  │  ₹2,15,000  │  │  4 this wk  │  │
│  │   pending   │  │   active    │  │  outstanding│  │  2 tomorrow │  │
│  │             │  │             │  │             │  │             │  │
│  │  3 unread   │  │  1 on hold  │  │  3 overdue  │  │  [Schedule] │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
│  TIER 3: ACTIVE WORK QUEUE (what to work on now)                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Orders Requiring Action                           [Sort ↕]     │   │
│  │                                                                  │   │
│  │  ORD-2025-000023  Priya S.   ● Advance Pending  ₹17,500 due   │   │
│  │                              [Record Payment]   [Send Reminder] │   │
│  │                                                                  │   │
│  │  ORD-2025-000019  Rahul K.   ● Quality Check   Due: tomorrow   │   │
│  │                              [Mark Complete]   [View Details]   │   │
│  │                                                                  │   │
│  │  INQ-2025-000047  Meera P.   ● Unacknowledged   47 hours ago   │   │
│  │                              [Acknowledge]     [Create Quote]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  TIER 4: CONTEXTUAL DATA (useful when time allows)                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  This Month              │  │  Production Queue                 │   │
│  │  Revenue: ₹4,25,000      │  │  12 orders in progress           │   │
│  │  Orders delivered: 8     │  │  Estimated capacity: 80%         │   │
│  │  Avg lead time: 38 days  │  │  Available slots: 3              │   │
│  └──────────────────────────┘  └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

CRITICAL DESIGN DECISIONS:
→ Tier 1 alerts cannot be collapsed or hidden
  They persist until the underlying issue is resolved
  This is intentional — SLA breaches must be impossible to ignore
  
→ Tier 2 metrics are numbers, not charts
  Charts require interpretation time. Numbers are immediate.
  Charts appear in analytics section (Tier 4+), not operational dashboard.
  
→ Tier 3 is sorted by operational urgency (overdue > due soon > in progress)
  NOT sorted by order number or creation date
  
→ Each Tier 3 row has inline action buttons for the most likely next action
  Action buttons are context-aware (change based on order status)
  
→ Tier 4 is below the fold on most screens
  This is correct — contextual data is consulted, not monitored
```

---

## 7.2 Client Order Tracking Dashboard

```
DESIGN GOAL: Client opens their order page and immediately feels
             that everything is under control and on track.
             Or, if there's an issue, they understand exactly what it is.

CLIENT ORDER DETAIL VIEW:
┌─────────────────────────────────────────────────────────────────────────┐
│  ← My Orders                                                            │
│                                                                         │
│  Your L-Shaped Bookshelf                                               │
│  Order ORD-2025-000023  ·  Placed January 5, 2025                     │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  ●───●───●───●───○                                             │   │
│  │  Confirmed Production Assembly Finishing Delivery              │   │
│  │             ✓         ← You are here                           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  🔨 Currently: Assembly & Joinery                                      │
│  Your furniture frame is being assembled by our craftsmen.             │
│  Expected to complete this stage by: January 20, 2025                 │
│                                                                         │
│  Estimated Delivery                                                     │
│  March 1 – March 15, 2025                                             │
│                                                                         │
│  Updates                                                               │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Jan 15  ● Assembly stage started. Your shelving unit frame    │   │
│  │            is being put together.                              │   │
│  │                                                                │   │
│  │  Jan 10  ● All materials sourced and ready for production.     │   │
│  │            Teak Grade A confirmed.                             │   │
│  │                                                                │   │
│  │  Jan 7   ✓ Advance payment received. Production scheduled.    │   │
│  │                                                                │   │
│  │  Jan 5   ✓ Order confirmed.                                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Payment Summary                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Advance (₹17,500)          Paid Jan 7                      │   │
│  │  ○ Mid-production (₹8,750)    Due after Assembly complete     │   │
│  │  ○ Balance (₹8,750)           Due on delivery                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Questions?  [WhatsApp Us]  ·  Reference: ORD-2025-000023             │
└─────────────────────────────────────────────────────────────────────────┘

DESIGN NOTES:
→ Progress tracker shows WHERE in the journey, not which technical state
→ "Currently: Assembly & Joinery" in plain English, not "ASSEMBLY_JOINERY"
→ Updates timeline reads like a story — reassures client things are happening
→ Payment shows amounts and status, NOT payment method or bank details
→ WhatsApp link is always visible — client's safety valve if concerned
→ Reference number always visible — reduces "what's my order number?" calls
```

---

# PART 8 — FAILURE HANDLING UX

---

## 8.1 Network Failure Patterns

```
NETWORK FAILURE TAXONOMY:

Scenario 1: Request timeout (slow network)
  User action: Admin clicks "Record Payment"
  Network: Response never arrives (60s timeout)
  
  UX Response:
  T+0:     Button shows "Saving..."
  T+15s:   Button shows "Still processing..." (user knows it's slow, not frozen)
  T+30s:   Toast warning: "This is taking longer than expected.
             Your action may have succeeded. Don't click again yet."
  T+60s:   Toast: "Connection timed out. Check your internet connection.
             IMPORTANT: Verify in the order whether payment was recorded
             before trying again. [Check Order] [Try Again]"
  
  WHY THIS MATTERS: If admin retries a payment recording after timeout,
  they may create a duplicate payment record. The warning to check first
  prevents this. Idempotency key handles server-side dedup, but UX
  should also warn against unnecessary retries.

Scenario 2: Full offline (no connectivity)
  UX Response:
  → Banner at top of admin interface:
    "⚡ No internet connection. Changes you make are not being saved.
     Please restore your connection before continuing."
  → All form submit buttons disabled
  → All quick-action buttons disabled
  → Data remains visible (last loaded state)
  → Recovery: On reconnect, banner dismissed, buttons re-enabled
    "Connection restored. [Refresh dashboard]"
  
  WHY disable buttons during offline:
  Admin attempting to record a payment while offline would believe they succeeded.
  The payment would not be recorded. The order would still be pending.
  Preventing the action is less damaging than a false success.

Scenario 3: Network recovered after disconnection
  → Auto-attempt reconnect (exponential backoff)
  → On reconnect success: Announce to screen reader: "Connection restored"
  → Visual: Banner animates out (300ms fade)
  → Background: Fetch fresh data for visible panels
  → Toast: "Connection restored. Dashboard updated." (3 second auto-dismiss)

TECHNICAL IMPLEMENTATION:
// Network status monitoring:
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Trigger data refresh across all panels
      queryClient.invalidateQueries();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline, wasOffline };
};
```

---

## 8.2 Session Expiry UX

```
SESSION EXPIRY FLOW:
(Handled gracefully — never loses user work)

T-5 minutes before expiry:
  → Server sends WebSocket event: system.auth.token_expiring
  → Client silently refreshes token (user sees nothing)
  → If refresh succeeds: Session continues seamlessly

If refresh fails (refresh token also expired):
  → If user is mid-form: Save form state to sessionStorage
  → Show modal (cannot be dismissed by clicking outside):
  
  ┌────────────────────────────────────────────────────────────┐
  │  🔒 Your session has expired                               │
  │                                                            │
  │  For your security, you've been signed out after a         │
  │  period of inactivity.                                     │
  │                                                            │
  │  Any changes you were making have been saved.              │
  │  Sign in again to continue where you left off.             │
  │                                                            │
  │  [Sign In Again]                                           │
  │                                                            │
  │  Your data is safe — nothing has been lost.                │
  └────────────────────────────────────────────────────────────┘
  
  → "Sign In Again" opens login page in same tab
  → After login: Returns to exact URL user was on
  → Form state restored from sessionStorage
  → User continues without re-entering their work

SECURITY NOTE:
→ "Changes saved" is honest only for auto-saved forms.
   For forms that were NOT submitted yet: "Any information you entered
   has been preserved. Sign in to continue."
→ Never claim data is saved when it wasn't submitted.
```

---

# PART 9 — ENTERPRISE UX CONSIDERATIONS

---

## 9.1 Operational Confidence Design

```
PRINCIPLE: An admin who doesn't trust the system will revert to WhatsApp.
           Every design decision must build operational confidence.

TRUST INDICATORS:

1. Confirmation of every action:
  Every write operation results in explicit confirmation visible in UI.
  Admin clicks "Record Payment" → success toast + row updates immediately.
  No silent success. No ambiguous "action performed" messages.
  Specific: "₹17,500 advance payment recorded for ORD-2025-000023"

2. Timestamps everywhere:
  Every record shows when it was last modified.
  Every status shows when it was last updated.
  "Status updated 2 hours ago by Admin" — Who did what, when.
  This allows admin to spot anomalies: "Why did status change without me?"

3. Audit trail visibility (admin):
  Every order detail page has an "Activity History" section at the bottom.
  Shows: all status changes, payment recordings, notes, and by whom.
  Admin can audit their own actions and their team's actions.
  
  Activity History:
  ┌────────────────────────────────────────────────────────────────┐
  │  Jan 15, 10:30 AM  Admin (you)     Stage: Assembly Started    │
  │  Jan 10, 2:15 PM   Admin (you)     Payment recorded: ₹17,500  │
  │  Jan 8,  11:00 AM  System          Quote approved by client    │
  │  Jan 7,  9:00 AM   Admin (you)     Quotation sent to client    │
  │  Jan 5,  2:00 PM   System          Inquiry received            │
  └────────────────────────────────────────────────────────────────┘

4. No silent state changes:
  If background system changes state (e.g., quote expiry at midnight):
  Admin sees clear indication next time they open affected order:
  "This quotation expired on January 22. A new quotation may be created."
  NOT: Order just shows wrong state with no explanation.

5. Consistent data across views:
  If order shows "₹17,500 paid" in the order list,
  order detail MUST show the same amount.
  No inconsistency between list view and detail view.
  (This requires both to fetch from same data source, not separate queries
   that might have different cache states.)

MULTI-ADMIN CONFLICT UX:
When admin A's action fails because admin B already made a change:
  
  ┌────────────────────────────────────────────────────────────────┐
  │  ⚠ Order Updated by Another Admin                             │
  │                                                                │
  │  This order was updated by [Admin B] while you were viewing   │
  │  it. Here's what changed:                                      │
  │                                                                │
  │  Status:  In Production → Ready for Delivery                   │
  │  Updated: 2 minutes ago                                        │
  │                                                                │
  │  Your attempted action:                                        │
  │  "Mark as Ready for Delivery" — already done by Admin B.       │
  │                                                                │
  │  [View Current Order State]    [Dismiss]                       │
  └────────────────────────────────────────────────────────────────┘
  
  This is NOT an error. It's information.
  Admin A's action wasn't needed — the result they wanted already happened.
  Framing it as a conflict rather than a failure reduces anxiety.
```

---

## 9.2 Role-Appropriate Interface Adaptation

```
INTERFACE ADAPTATION BY ROLE:
The same components render different content and actions based on user role.
Role is never stored client-side for security decisions —
but IS used for UI rendering decisions (what to show, not what to allow).

ADMIN INTERFACE ELEMENTS:
→ Sidebar: All sections visible
→ Order rows: Show client details, payment amounts, internal notes indicator
→ Action buttons: Full set (update status, record payment, apply hold, etc.)
→ Dashboard: Full operational dashboard with financials

SHOP MANAGER INTERFACE ELEMENTS:
→ Sidebar: Only Production Queue, My Tasks, Order List (limited)
→ Order rows: Show status, stage, assigned-to. Hide financial details.
→ Action buttons: Update Stage, Add Production Note, Upload Photo
→ No: Record payment, Apply Hold, Cancel Order
→ Dashboard: Production queue view only (not financials)

DELIVERY STAFF INTERFACE:
→ Single-view: Today's deliveries only
→ Each delivery: Address, contact, order reference, time slot
→ Actions: Mark delivered, upload proof photo, report issue
→ No: Order history, financial data, admin functions
→ Optimized for MOBILE (delivery staff use phones in the field)

DELIVERY STAFF MOBILE INTERFACE:
┌─────────────────────────────┐
│  Today's Deliveries (3)    │
│  Monday, January 15         │
│                             │
│  ┌────────────────────────┐ │
│  │  9:00 AM – 12:00 PM   │ │
│  │  ORD-2025-000019       │ │
│  │  Priya Sharma          │ │
│  │  14 MG Road, Mumbai    │ │
│  │  +91 98765 43210       │ │
│  │  [Navigate] [Call]     │ │
│  │                        │ │
│  │  [Mark Delivered]      │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │  2:00 PM – 5:00 PM    │ │
│  │  ...                   │ │
│  └────────────────────────┘ │
└─────────────────────────────┘

MARK DELIVERED FLOW (mobile-optimized):
Step 1: "Take a photo of the completed installation"
  [Camera button — opens device camera directly]
  [Choose from gallery]

Step 2: "Confirm delivery details"
  ✓ Items delivered as listed
  ✓ Client is satisfied with condition
  Client name: [text field for signature proxy]

Step 3: [Submit Delivery Confirmation]

→ Minimal steps — delivery staff has limited time on-site
→ Camera is the primary input (no complex forms)
→ Offline support: capture locally, sync when back online
```

---

## Design System Token File (Complete Reference)

```css
/* furnix-tokens.css — Single source of truth */
:root {
  /* === TYPOGRAPHY === */
  --font-primary: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  --text-xs:   11px; --leading-xs:   16px;
  --text-sm:   13px; --leading-sm:   20px;
  --text-base: 15px; --leading-base: 24px;
  --text-md:   17px; --leading-md:   26px;
  --text-lg:   20px; --leading-lg:   28px;
  --text-xl:   24px; --leading-xl:   32px;
  --text-2xl:  30px; --leading-2xl:  38px;
  --text-3xl:  38px; --leading-3xl:  46px;
  
  /* === SPACING === */
  --space-0-5: 2px;  --space-1: 4px;   --space-2: 8px;
  --space-3: 12px;   --space-4: 16px;  --space-5: 20px;
  --space-6: 24px;   --space-8: 32px;  --space-10: 40px;
  --space-12: 48px;  --space-16: 64px;
  
  /* === COLORS (semantic) === */
  --surface-page:      #F9FAFB;
  --surface-card:      #FFFFFF;
  --surface-elevated:  #FFFFFF;
  --surface-sunken:    #F3F4F6;
  --surface-sidebar:   #2E1C0A;
  
  --text-primary:      #111827;
  --text-secondary:    #4B5563;
  --text-tertiary:     #9CA3AF;
  --text-inverse:      #FFFFFF;
  --text-brand:        #8B5E2E;
  --text-link:         #1D4ED8;
  --text-danger:       #B91C1C;
  --text-success:      #15803D;
  --text-warning:      #B45309;
  
  /* === BORDERS === */
  --border-subtle:     #E5E7EB;
  --border-default:    #D1D5DB;
  --border-strong:     #9CA3AF;
  --border-radius-sm:  4px;
  --border-radius-base: 6px;
  --border-radius-lg:  8px;
  --border-radius-xl:  12px;
  --border-radius-full: 9999px;
  
  /* === SHADOWS === */
  --shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  
  /* === MOTION === */
  --duration-fast:     150ms;
  --duration-base:     200ms;
  --duration-moderate: 300ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-enter:   cubic-bezier(0, 0, 0.2, 1);
  --ease-exit:    cubic-bezier(0.4, 0, 1, 1);
  
  /* === LAYOUT === */
  --sidebar-width:     240px;
  --sidebar-collapsed: 64px;
  --topbar-height:     56px;
  --content-max-width: 1280px;
  --content-padding:   var(--space-8);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast:     0ms;
    --duration-base:     0ms;
    --duration-moderate: 0ms;
  }
}
```

---

*This UI/UX system document defines the complete design and interaction architecture for Furnix. Every component, pattern, and decision documented here should be treated as a contract between design, engineering, and product. Deviations must be reviewed against the governing principles in Part 1 before implementation.*