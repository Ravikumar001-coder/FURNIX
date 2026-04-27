// ── API Base URL ─────────────────────────────────────
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080/api'

// ── Categories ───────────────────────────────────────
export const CATEGORIES = [
  { value: 'ALL',      label: 'All',      icon: '🪵' },
  { value: 'CHAIR',    label: 'Chair',    icon: '🪑' },
  { value: 'TABLE',    label: 'Table',    icon: '🪵' },
  { value: 'BED',      label: 'Bed',      icon: '🛏' },
  { value: 'CABINET',  label: 'Cabinet',  icon: '🗄' },
  { value: 'WARDROBE', label: 'Wardrobe', icon: '🚪' },
  { value: 'DOOR',     label: 'Door',     icon: '🚪' },
  { value: 'CUSTOM',   label: 'Custom',   icon: '✏️' },
]

// ── Shop Category Architecture (Primary + Subcategory) ─
export const SHOP_CATEGORY_TREE = [
  {
    value: 'HOME_LIVING',
    label: 'Home Living',
    subcategories: [
      { value: 'SOFAS', label: 'Sofas', backendCategory: 'CUSTOM', keywords: ['sofa', 'sectional', 'couch'] },
      { value: 'BEDS', label: 'Beds', backendCategory: 'BED', keywords: ['bed', 'bed frame'] },
      { value: 'DINING_TABLES', label: 'Dining Tables', backendCategory: 'TABLE', keywords: ['dining table', 'table'] },
      { value: 'DINING_CHAIRS', label: 'Dining Chairs', backendCategory: 'CHAIR', keywords: ['dining chair', 'chair'] },
      { value: 'COFFEE_TABLES', label: 'Coffee Tables', backendCategory: 'TABLE', keywords: ['coffee table', 'table'] },
      { value: 'WARDROBES', label: 'Wardrobes', backendCategory: 'WARDROBE', keywords: ['wardrobe', 'closet'] },
      { value: 'TV_UNITS', label: 'TV Units', backendCategory: 'CABINET', keywords: ['tv unit', 'media console'] },
      { value: 'SIDE_TABLES', label: 'Side Tables', backendCategory: 'TABLE', keywords: ['side table', 'end table'] },
      { value: 'BOOKSHELVES', label: 'Bookshelves', backendCategory: 'CABINET', keywords: ['bookshelf', 'shelf'] },
    ],
  },
  {
    value: 'CORPORATE_OFFICE',
    label: 'Corporate / Office',
    subcategories: [
      { value: 'OFFICE_CHAIRS', label: 'Office Chairs', backendCategory: 'CHAIR', keywords: ['office chair', 'task chair'] },
      { value: 'WORKSTATIONS', label: 'Workstations', backendCategory: 'TABLE', keywords: ['workstation', 'office desk'] },
      { value: 'CONFERENCE_TABLES', label: 'Conference Tables', backendCategory: 'TABLE', keywords: ['conference table', 'meeting table'] },
      { value: 'RECEPTION_DESKS', label: 'Reception Desks', backendCategory: 'TABLE', keywords: ['reception desk', 'desk'] },
      { value: 'STORAGE_CABINETS', label: 'Storage Cabinets', backendCategory: 'CABINET', keywords: ['storage cabinet', 'cabinet'] },
    ],
  },
  {
    value: 'HOSPITALITY_HOTEL',
    label: 'Hospitality (Hotel)',
    subcategories: [
      { value: 'HOTEL_BEDS', label: 'Hotel Beds', backendCategory: 'BED', keywords: ['hotel bed', 'bed'] },
      { value: 'BEDSIDE_TABLES', label: 'Bedside Tables', backendCategory: 'TABLE', keywords: ['bedside table', 'nightstand'] },
      { value: 'LOUNGE_CHAIRS', label: 'Lounge Chairs', backendCategory: 'CHAIR', keywords: ['lounge chair', 'armchair'] },
      { value: 'HOTEL_WARDROBES', label: 'Wardrobes', backendCategory: 'WARDROBE', keywords: ['wardrobe'] },
      { value: 'WRITING_DESKS', label: 'Writing Desks', backendCategory: 'TABLE', keywords: ['writing desk', 'desk'] },
    ],
  },
  {
    value: 'RESTAURANT_CAFE',
    label: 'Restaurant & Cafe',
    subcategories: [
      { value: 'RESTAURANT_CHAIRS', label: 'Restaurant Chairs', backendCategory: 'CHAIR', keywords: ['restaurant chair', 'chair'] },
      { value: 'RESTAURANT_TABLES', label: 'Restaurant Tables', backendCategory: 'TABLE', keywords: ['restaurant table', 'table'] },
      { value: 'BAR_STOOLS', label: 'Bar Stools', backendCategory: 'CHAIR', keywords: ['bar stool', 'stool'] },
      { value: 'BOOTH_SEATING', label: 'Booth Seating', backendCategory: 'CHAIR', keywords: ['booth seating', 'booth'] },
    ],
  },
  {
    value: 'INSTITUTIONAL',
    label: 'Institutional',
    subcategories: [
      { value: 'CLASSROOM_DESKS', label: 'Classroom Desks', backendCategory: 'TABLE', keywords: ['classroom desk', 'desk'] },
      { value: 'STUDENT_CHAIRS', label: 'Student Chairs', backendCategory: 'CHAIR', keywords: ['student chair', 'chair'] },
      { value: 'LIBRARY_TABLES', label: 'Library Tables', backendCategory: 'TABLE', keywords: ['library table', 'table'] },
      { value: 'LAB_FURNITURE', label: 'Lab Furniture', backendCategory: 'CUSTOM', keywords: ['lab furniture', 'laboratory'] },
    ],
  },
  {
    value: 'CUSTOM_FURNITURE',
    label: 'Custom Furniture',
    subcategories: [
      { value: 'CUSTOM_BEDS', label: 'Custom Beds', backendCategory: 'CUSTOM', keywords: ['custom bed', 'bed'] },
      { value: 'CUSTOM_SOFAS', label: 'Custom Sofas', backendCategory: 'CUSTOM', keywords: ['custom sofa', 'sofa'] },
      { value: 'CUSTOM_TABLES', label: 'Custom Tables', backendCategory: 'CUSTOM', keywords: ['custom table', 'table'] },
      { value: 'CUSTOM_STORAGE', label: 'Custom Storage', backendCategory: 'CUSTOM', keywords: ['custom storage', 'storage'] },
    ],
  },
]

export const SHOP_PRIMARY_CATEGORIES = [
  { value: 'ALL', label: 'All Spaces' },
  ...SHOP_CATEGORY_TREE.map((category) => ({ value: category.value, label: category.label })),
]

export const SHOP_SUBCATEGORIES = SHOP_CATEGORY_TREE.flatMap((category) =>
  category.subcategories.map((subcategory) => ({
    ...subcategory,
    primaryValue: category.value,
    primaryLabel: category.label,
  }))
)

export const SHOP_SUBCATEGORY_MAP = SHOP_SUBCATEGORIES.reduce((acc, subcategory) => {
  acc[subcategory.value] = subcategory
  return acc
}, {})

// ── Furniture Types for Order Form ──────────────────
export const FURNITURE_TYPES = [
  'Dining Table',
  'Bed Frame',
  'Wardrobe',
  'Kitchen Cabinets',
  'Office Desk',
  'Bookshelf',
  'TV Unit',
  'Wooden Door',
  'Entrance Door',
  'Custom Shelf',
  'Living Room Set',
  'Bespoke Design',
  'Others...',
]

// ── Order Statuses ───────────────────────────────────
export const ORDER_STATUSES = [
  { value: 'NEW',                label: 'NEW',   color: '#D4A017', full: 'New Inquiry' },
  { value: 'UNDER_REVIEW',       label: 'REVW',  color: '#4A90D9', full: 'Under Review' },
  { value: 'QUOTE_SENT',         label: 'QUOTE', color: '#3498DB', full: 'Quote Sent' },
  { value: 'NEGOTIATION',        label: 'NEGO',  color: '#9B59B6', full: 'Negotiation' },
  { value: 'ACCEPTED',           label: 'ACPT',  color: '#2ECC71', full: 'Accepted' },
  { value: 'REJECTED',           label: 'REJ',   color: '#E74C3C', full: 'Rejected' },
  { value: 'SITE_VISIT_SCHEDULED',label: 'VISIT', color: '#8E44AD', full: 'Site Visit Scheduled' },
  { value: 'IN_PRODUCTION',      label: 'PROD',  color: '#E67E22', full: 'In Production' },
  { value: 'READY_FOR_DELIVERY', label: 'READY', color: '#1ABC9C', full: 'Ready for Delivery' },
  { value: 'DELIVERED',          label: 'DELV',  color: '#27AE60', full: 'Delivered' },
  { value: 'CLOSED',             label: 'CLOSE', color: '#95A5A6', full: 'Closed' },
]

import { BUSINESS_DATA } from './businessData'

// ── WhatsApp Number ──────────────────────────────────
export const WHATSAPP_NUMBER = BUSINESS_DATA.contact.whatsapp

// ── Business Info ────────────────────────────────────
// Keeping this structure for backward compatibility
export const BUSINESS_INFO = {
  name:    BUSINESS_DATA.brand.name,
  phone:   BUSINESS_DATA.contact.phones.map(p => p.number),
  email:   BUSINESS_DATA.contact.emails.map(e => e.address),
  address: BUSINESS_DATA.location.address,
  hours:   BUSINESS_DATA.hours,
  social:  BUSINESS_DATA.social,
  mapEmbed: BUSINESS_DATA.location.mapEmbedUrl,
}


// ── JWT Storage Key ──────────────────────────────────
export const TOKEN_KEY = 'carpenter_access_token'
export const USER_KEY  = 'carpenter_user'
export const LEGACY_TOKEN_KEY = 'carpenter_admin_token'
export const LEGACY_USER_KEY = 'carpenter_admin_user'
