import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { orderService } from '../../services/orderService'
import { formatDate } from '../../utils/helpers'

const STATUS_TABS = [
  { label: 'All Inquiries', value: null },
  { label: 'New',    value: 'NEW' },
  { label: 'In Production', value: 'IN_PRODUCTION' },
  { label: 'Delivered',  value: 'DELIVERED' },
]

const formatStatus = (status) => {
  if (!status) return 'NEW'
  return status.replace(/_/g, ' ')
}

const statusDotColor = (status) => {
  switch (status) {
    case 'NEW':                return 'bg-amber-500'
    case 'UNDER_REVIEW':       return 'bg-blue-500'
    case 'QUOTE_SENT':         return 'bg-indigo-500'
    case 'NEGOTIATION':        return 'bg-purple-500'
    case 'ACCEPTED':           return 'bg-emerald-500'
    case 'IN_PRODUCTION':      return 'bg-orange-500'
    case 'READY_FOR_DELIVERY': return 'bg-cyan-500'
    case 'DELIVERED':          return 'bg-green-600'
    case 'CLOSED':             return 'bg-stone-600'
    case 'REJECTED':           return 'bg-red-500'
    default:                   return 'bg-gray-400'
  }
}

const statusTextColor = (status) => {
  switch (status) {
    case 'NEW':                return 'text-amber-700'
    case 'UNDER_REVIEW':       return 'text-blue-700'
    case 'QUOTE_SENT':         return 'text-indigo-700'
    case 'NEGOTIATION':        return 'text-purple-700'
    case 'ACCEPTED':           return 'text-emerald-700'
    case 'IN_PRODUCTION':      return 'text-orange-700'
    case 'READY_FOR_DELIVERY': return 'text-cyan-700'
    case 'DELIVERED':          return 'text-green-700'
    case 'CLOSED':             return 'text-stone-700'
    case 'REJECTED':           return 'text-red-700'
    default:                   return 'text-gray-600'
  }
}

const toOrderCode = (order) => {
  const year = new Date(order?.createdAt || Date.now()).getFullYear()
  const n = String(order?.id ?? 0).padStart(4, '0')
  return `#INQ-${year}-${n}`
}

const OrdersPage = () => {
  const navigate = useNavigate()

  const [orders,  setOrders]  = useState([])
  const [tab,     setTab]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [stats,   setStats]   = useState(null)
  
  // Pagination State
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLast, setIsLast] = useState(true)
  const [isFirst, setIsFirst] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [pageResponse, statsData] = await Promise.all([
          orderService.getAll(tab, null, page, 10),
          orderService.getStats(),
        ])
        
        // If the backend returns an array (legacy), adapt it
        if (Array.isArray(pageResponse)) {
          setOrders(pageResponse)
          setTotalElements(pageResponse.length)
          setTotalPages(1)
          setIsFirst(true)
          setIsLast(true)
        } else {
          setOrders(pageResponse.content || [])
          setTotalElements(pageResponse.totalElements || 0)
          setTotalPages(pageResponse.totalPages || 0)
          setIsFirst(pageResponse.first ?? true)
          setIsLast(pageResponse.last ?? true)
        }
        setStats(statsData)
      } catch (err) {
        setError('Failed to load inquiries')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab, page])

  // Reset page when tab changes
  useEffect(() => {
    setPage(0)
  }, [tab])

  // Build tab labels with counts
  const tabsWithCount = STATUS_TABS.map(t => {
    let count = null
    if (stats) {
      if (t.value === null)            count = stats.totalInquiries
      if (t.value === 'NEW')           count = stats.newInquiries
      if (t.value === 'IN_PRODUCTION') count = stats.inProductionInquiries
      if (t.value === 'DELIVERED')     count = stats.deliveredInquiries
    }
    return { ...t, count }
  })

  return (
    <AdminLayout>

      {/* ── Header ─────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl text-primary tracking-wide mb-2">
            Inquiry Queue
          </h2>
          <p className="font-body text-on-surface-variant text-sm max-w-xl">
            Review and manage bespoke commissions and inquiries. Prioritize craftsmanship over speed.
          </p>
        </div>
        <button className="bg-primary text-on-primary font-body font-medium text-sm px-6 py-3 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors duration-300 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-sm">download</span>
          Export Manifest
        </button>
      </header>

      {/* ── Status Tabs ──────────────────────────────── */}
      <div className="flex gap-0 border-b border-outline-variant/30 mb-8 overflow-x-auto">
        {tabsWithCount.map(t => (
          <button
            key={String(t.value)}
            onClick={() => setTab(t.value)}
            className={`font-body text-sm font-medium px-6 py-3 transition-colors relative whitespace-nowrap ${
              tab === t.value
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}{t.count != null ? ` (${t.count})` : ''}
            {tab === t.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Error Alert ──────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-error-container text-on-error-container px-4 py-3 rounded-lg mb-6 font-body text-sm">
          <span className="material-symbols-outlined text-lg">error</span>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="hover:opacity-70">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* ── Orders List ───────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant text-sm">Loading commissions...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-outline-variant block mb-3">inbox</span>
          <p className="font-body text-on-surface-variant text-sm">No inquiries found in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-surface-container-lowest rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow duration-300"
            >
              {/* Order ID & Date */}
              <div className="flex-shrink-0 min-w-[140px]">
                <p className="font-headline text-lg font-bold text-on-surface">
                  {toOrderCode(order)}
                </p>
                <p className="font-body text-xs text-on-surface-variant mt-1">
                  {formatDate(order.createdAt)}
                </p>
              </div>

              {/* Customer Info */}
              <div className="flex-shrink-0 min-w-[180px]">
                <p className="font-body text-xs text-on-surface-variant mb-1">Commissioned By</p>
                <p className="font-body text-sm font-semibold text-on-surface">
                  {order.name || 'Unknown'}
                </p>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  {order.email || order.phone || '—'}
                </p>
              </div>

              {/* Product Info */}
              <div className="flex-1 flex items-center gap-4">
                <p className="font-body text-xs text-on-surface-variant mb-1 md:hidden">Piece</p>
                {order.referenceImages && order.referenceImages.length > 0 && (
                  <div className="w-14 h-14 rounded overflow-hidden bg-surface-container flex-shrink-0">
                    <img
                      src={order.referenceImages[0]}
                      alt={order.pieceType}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-headline text-sm font-semibold text-on-surface mb-1">
                    {order.pieceType || 'Custom Piece'}
                  </p>
                  {order.description && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="inline-block px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded text-[10px] tracking-wider uppercase font-medium">
                        {order.description.length > 30
                          ? order.description.slice(0, 30) + '...'
                          : order.description
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusDotColor(order.status)}`} />
                  <span className={`font-body text-xs font-bold tracking-wider uppercase ${statusTextColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="font-body text-xs font-medium text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors"
                >
                  {['CLOSED', 'DELIVERED', 'CANCELLED'].includes(order.status) ? 'View Details' : 'Update Status'}
                  <span className="material-symbols-outlined text-sm">
                    {['CLOSED', 'DELIVERED', 'CANCELLED'].includes(order.status) ? 'visibility' : 'arrow_forward'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {!loading && orders.length > 0 && (
        <div className="px-6 py-6 flex items-center justify-between text-sm text-on-surface-variant border-t border-outline-variant/15 mt-8">
          <p>Showing {orders.length} of {totalElements} inquir{totalElements !== 1 ? 'ies' : 'y'}</p>
          <div className="flex gap-2 items-center">
            <span className="mr-2 text-xs">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={isFirst || loading}
              className="p-2 hover:bg-surface-container rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-surface-container-lowest shadow-sm" 
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={isLast || loading}
              className="p-2 hover:bg-surface-container rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-surface-container-lowest shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default OrdersPage