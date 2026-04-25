import { ORDER_STATUSES } from './constants'

// Format price: 120000 → "₹1,20,000"
export const formatPrice = (price) => {
  if (price === 0 || price === '0.00' || price === null || price === undefined) return 'Contact for Price'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export const formatCurrency = formatPrice;

// Format date: "2024-01-15T10:30:00" → "Jan 15, 2024"
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// Time ago: "2 days ago"
export const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${mins} minute${mins > 1 ? 's' : ''} ago`
}

// Get status config by value
export const getStatusConfig = (statusValue) => {
  return ORDER_STATUSES.find(s => s.value === statusValue)
    || { value: statusValue, label: statusValue, color: '#888', full: statusValue }
}

// Build WhatsApp URL
export const buildWhatsAppUrl = (phone, productName) => {
  const msg = encodeURIComponent(
    `Hello! I'm interested in your "${productName}". Please send me more details.`
  )
  return `https://wa.me/${phone}?text=${msg}`
}

// Truncate text
export const truncate = (text, maxLength = 80) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}