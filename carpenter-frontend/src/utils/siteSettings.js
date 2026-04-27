import { BUSINESS_DATA } from './businessData'

const primaryPhone = BUSINESS_DATA.contact.phones?.[0]?.number || ''
const supportPhone = BUSINESS_DATA.contact.phones?.[1]?.number || primaryPhone
const primaryEmail = BUSINESS_DATA.contact.emails?.[0]?.address || ''
const supportEmail = BUSINESS_DATA.contact.emails?.[1]?.address || primaryEmail

export const DEFAULT_SITE_SETTINGS = {
  'brand.name': BUSINESS_DATA.brand.name || 'Furnix',
  'brand.slogan': BUSINESS_DATA.brand.slogan || '',
  'brand.logo': BUSINESS_DATA.brand.logo || '/assets/furnix-logo.png',

  'hero.title': 'Handcrafted Wooden Excellence',
  'hero.subtitle': 'Discover bespoke furniture tailored to your space, crafted with passion and precision.',

  'contact.whatsapp': BUSINESS_DATA.contact.whatsapp || '',
  'contact.phone': primaryPhone,
  'contact.phone.primary': primaryPhone,
  'contact.phone.support': supportPhone,
  'contact.email': primaryEmail,
  'contact.email.primary': primaryEmail,
  'contact.email.support': supportEmail,

  'location.address': BUSINESS_DATA.location.address || '',
  'location.city': BUSINESS_DATA.location.city || '',
  'location.region': BUSINESS_DATA.location.region || '',
  'location.mapEmbedUrl': BUSINESS_DATA.location.mapEmbedUrl || '',

  'hours.weekdays': BUSINESS_DATA.hours.weekdays || '',
  'hours.saturday': BUSINESS_DATA.hours.saturday || '',
  'hours.sunday': BUSINESS_DATA.hours.sunday || '',
  'hours.notes': BUSINESS_DATA.hours.notes || '',

  'social.instagram': BUSINESS_DATA.social.instagram || '',
  'social.facebook': BUSINESS_DATA.social.facebook || '',
  'social.whatsapp_link': BUSINESS_DATA.social.whatsapp_link || '',

  'stats.homesFurnished': BUSINESS_DATA.stats.homesFurnished || '',
  'stats.deliveryReach': BUSINESS_DATA.stats.deliveryReach || '',
  'stats.warrantyYears': BUSINESS_DATA.stats.warrantyYears || '',
  'stats.serviceArea': BUSINESS_DATA.stats.serviceArea || '',

  'trust.points': (BUSINESS_DATA.trustPoints || []).join('|'),

  'seo.title': `${BUSINESS_DATA.brand.name || 'Furnix'} | Premium Handcrafted Furniture`,
  'seo.description': 'Furnix - Premium Handcrafted Furniture & Bespoke Woodworking services.',
  'seo.keywords': 'furnix, artisan furniture, bespoke furniture, handcrafted woodwork, custom furniture',
  'og.title': `${BUSINESS_DATA.brand.name || 'Furnix'} | Premium Handcrafted Furniture`,
  'og.description': 'Furnix provides premium handcrafted bespoke furniture.',
}

export const SETTINGS_FORM_SECTIONS = [
  {
    title: 'Brand and Hero',
    fields: [
      { key: 'brand.name', label: 'Brand Name', type: 'text' },
      { key: 'brand.slogan', label: 'Brand Slogan', type: 'text' },
      { key: 'brand.logo', label: 'Brand Logo Path/URL', type: 'text' },
      { key: 'hero.title', label: 'Hero Title (supports simple HTML)', type: 'text' },
      { key: 'hero.subtitle', label: 'Hero Subtitle', type: 'textarea' },
    ],
  },
  {
    title: 'Contact and Support',
    fields: [
      { key: 'contact.whatsapp', label: 'WhatsApp Number (with country code, no +)', type: 'text' },
      { key: 'contact.phone.primary', label: 'Primary Phone', type: 'text' },
      { key: 'contact.phone.support', label: 'Support Phone', type: 'text' },
      { key: 'contact.email.primary', label: 'Primary Email', type: 'email' },
      { key: 'contact.email.support', label: 'Support Email', type: 'email' },
    ],
  },
  {
    title: 'Location and Hours',
    fields: [
      { key: 'location.address', label: 'Address', type: 'textarea' },
      { key: 'location.city', label: 'City', type: 'text' },
      { key: 'location.region', label: 'Region/State', type: 'text' },
      { key: 'location.mapEmbedUrl', label: 'Google Map Embed URL', type: 'text' },
      { key: 'hours.weekdays', label: 'Weekdays', type: 'text' },
      { key: 'hours.saturday', label: 'Saturday', type: 'text' },
      { key: 'hours.sunday', label: 'Sunday', type: 'text' },
      { key: 'hours.notes', label: 'Hours Notes', type: 'text' },
    ],
  },
  {
    title: 'Social and Proof',
    fields: [
      { key: 'social.instagram', label: 'Instagram URL', type: 'text' },
      { key: 'social.facebook', label: 'Facebook URL', type: 'text' },
      { key: 'social.whatsapp_link', label: 'WhatsApp Link URL', type: 'text' },
      { key: 'stats.homesFurnished', label: 'Homes Furnished', type: 'text' },
      { key: 'stats.deliveryReach', label: 'Delivery Reach', type: 'text' },
      { key: 'stats.warrantyYears', label: 'Warranty Years', type: 'text' },
      { key: 'stats.serviceArea', label: 'Service Area', type: 'text' },
      { key: 'trust.points', label: 'Trust Points (use | between values)', type: 'textarea' },
    ],
  },
  {
    title: 'SEO and Open Graph',
    fields: [
      { key: 'seo.title', label: 'SEO Title', type: 'text' },
      { key: 'seo.description', label: 'SEO Description', type: 'textarea' },
      { key: 'seo.keywords', label: 'SEO Keywords (comma separated)', type: 'textarea' },
      { key: 'og.title', label: 'OG Title', type: 'text' },
      { key: 'og.description', label: 'OG Description', type: 'textarea' },
    ],
  },
]

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value)
    }
  }
  return ''
}

const normalizeWhatsAppNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  const withoutInternationalPrefix = digits.startsWith('00') ? digits.slice(2) : digits
  if (withoutInternationalPrefix.length === 10) {
    // Defaulting to India country code for local 10-digit mobile numbers.
    return `91${withoutInternationalPrefix}`
  }

  return withoutInternationalPrefix
}

const extractNumberFromWhatsAppLink = (value) => {
  const raw = String(value || '').trim()
  if (!raw) {
    return ''
  }

  const waMeMatch = raw.match(/wa\.me\/(\d{8,15})/i)
  if (waMeMatch?.[1]) {
    return waMeMatch[1]
  }

  const apiPhoneMatch = raw.match(/[?&]phone=(\d{8,15})/i)
  if (apiPhoneMatch?.[1]) {
    return apiPhoneMatch[1]
  }

  return ''
}

export const mergeSiteSettings = (incoming = {}) => ({
  ...DEFAULT_SITE_SETTINGS,
  ...(incoming || {}),
})

export const normalizeSettingsForSave = (incoming = {}) => {
  const merged = mergeSiteSettings(incoming)

  const whatsappDigits = normalizeWhatsAppNumber(merged['contact.whatsapp'])
  merged['contact.whatsapp'] = whatsappDigits

  const primaryPhoneValue = firstNonEmpty(
    merged['contact.phone.primary'],
    merged['contact.phone'],
    DEFAULT_SITE_SETTINGS['contact.phone.primary']
  )
  merged['contact.phone.primary'] = primaryPhoneValue
  merged['contact.phone'] = primaryPhoneValue

  const supportPhoneValue = firstNonEmpty(
    merged['contact.phone.support'],
    DEFAULT_SITE_SETTINGS['contact.phone.support'],
    primaryPhoneValue
  )
  merged['contact.phone.support'] = supportPhoneValue

  const primaryEmailValue = firstNonEmpty(
    merged['contact.email.primary'],
    merged['contact.email'],
    DEFAULT_SITE_SETTINGS['contact.email.primary']
  )
  merged['contact.email.primary'] = primaryEmailValue
  merged['contact.email'] = primaryEmailValue

  const supportEmailValue = firstNonEmpty(
    merged['contact.email.support'],
    DEFAULT_SITE_SETTINGS['contact.email.support'],
    primaryEmailValue
  )
  merged['contact.email.support'] = supportEmailValue

  if (!merged['social.whatsapp_link'] && whatsappDigits) {
    merged['social.whatsapp_link'] = `https://wa.me/${whatsappDigits}`
  }

  return merged
}

export const getSiteSetting = (settings, key, fallback = '') => {
  if (!settings) {
    return fallback
  }
  const value = settings[key]
  return value !== undefined && value !== null ? value : fallback
}

export const getWhatsAppNumber = (settings) => firstNonEmpty(
  normalizeWhatsAppNumber(getSiteSetting(settings, 'contact.whatsapp')),
  normalizeWhatsAppNumber(extractNumberFromWhatsAppLink(getSiteSetting(settings, 'social.whatsapp_link'))),
  normalizeWhatsAppNumber(DEFAULT_SITE_SETTINGS['contact.whatsapp']),
  normalizeWhatsAppNumber(extractNumberFromWhatsAppLink(DEFAULT_SITE_SETTINGS['social.whatsapp_link']))
)

export const buildWhatsAppLink = (settings, message = '') => {
  const number = getWhatsAppNumber(settings)
  const directLink = String(getSiteSetting(settings, 'social.whatsapp_link', '')).trim()
  const encodedMessage = message ? encodeURIComponent(message) : ''

  if (number) {
    return encodedMessage
      ? `https://wa.me/${number}?text=${encodedMessage}`
      : `https://wa.me/${number}`
  }

  if (!directLink) {
    return ''
  }

  if (!encodedMessage) {
    return directLink
  }

  const separator = directLink.includes('?') ? '&' : '?'
  return `${directLink}${separator}text=${encodedMessage}`
}

export const getContactPhones = (settings) => {
  const phones = [
    getSiteSetting(settings, 'contact.phone.primary'),
    getSiteSetting(settings, 'contact.phone.support'),
    getSiteSetting(settings, 'contact.phone'),
  ]
  const unique = [...new Set(phones.map((value) => String(value || '').trim()).filter(Boolean))]
  return unique.length > 0 ? unique : [DEFAULT_SITE_SETTINGS['contact.phone.primary']]
}

export const getContactEmails = (settings) => {
  const emails = [
    getSiteSetting(settings, 'contact.email.primary'),
    getSiteSetting(settings, 'contact.email.support'),
    getSiteSetting(settings, 'contact.email'),
  ]
  const unique = [...new Set(emails.map((value) => String(value || '').trim()).filter(Boolean))]
  return unique.length > 0 ? unique : [DEFAULT_SITE_SETTINGS['contact.email.primary']]
}

export const getTrustPoints = (settings) => {
  const rawValue = firstNonEmpty(
    getSiteSetting(settings, 'trust.points'),
    DEFAULT_SITE_SETTINGS['trust.points']
  )
  return rawValue.split('|').map((value) => value.trim()).filter(Boolean)
}

const upsertMetaTag = (attribute, key, content) => {
  if (typeof document === 'undefined') {
    return
  }

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content || '')
}

export const applySeoMetadata = (settings = {}) => {
  if (typeof document === 'undefined') {
    return
  }

  const merged = mergeSiteSettings(settings)
  const brandName = firstNonEmpty(merged['brand.name'], 'Furnix')
  const title = firstNonEmpty(merged['seo.title'], `${brandName} | Premium Handcrafted Furniture`)
  const description = firstNonEmpty(merged['seo.description'], DEFAULT_SITE_SETTINGS['seo.description'])
  const keywords = firstNonEmpty(merged['seo.keywords'], DEFAULT_SITE_SETTINGS['seo.keywords'])
  const ogTitle = firstNonEmpty(merged['og.title'], title)
  const ogDescription = firstNonEmpty(merged['og.description'], description)

  document.title = title
  upsertMetaTag('name', 'description', description)
  upsertMetaTag('name', 'keywords', keywords)
  upsertMetaTag('property', 'og:title', ogTitle)
  upsertMetaTag('property', 'og:description', ogDescription)
}
