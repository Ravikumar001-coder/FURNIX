import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { orderService } from '../../services/orderService'
import { ORDER_STATUSES } from '../../utils/constants'
import { formatDate, timeAgo } from '../../utils/helpers'
import QuoteBuilder from '../../components/admin/QuoteBuilder'

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-outline-variant/20 last:border-0">
    <span className="material-symbols-outlined text-sm text-on-surface-variant/80 flex-shrink-0 mt-0.5">{icon}</span>
    <div>
      <p className="font-body text-xs text-on-surface-variant tracking-wider uppercase mb-0.5">
        {label}
      </p>
      <p className="font-body text-sm text-on-surface">{value || '—'}</p>
    </div>
  </div>
)

const OrderDetailPage = () => {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const [newStatus, setNewStatus]   = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await orderService.getById(id)
        setOrder(data)
        setNewStatus(data.status)
        setAdminNotes(data.adminNotes || '')
      } catch (err) {
        setError('Failed to load inquiry')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleUpdateStatus = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await orderService.updateStatus(id, newStatus, adminNotes)
      setOrder(updated)
      setSuccess('Inquiry status updated successfully!')
    } catch (err) {
      setError('Failed to update inquiry status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <AdminLayout>
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-on-surface-variant text-sm">Loading inquiry...</span>
      </div>
    </AdminLayout>
  )

  if (!order) return (
    <AdminLayout>
      <div className="flex items-center gap-3 bg-error-container text-on-error-container px-4 py-3 rounded-lg font-body text-sm">
        <span className="material-symbols-outlined">error</span>
        {error || 'Inquiry not found'}
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>

      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-container rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline text-2xl text-primary">
              Inquiry <span className="text-secondary">#{order.id}</span>
            </h1>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Created {timeAgo(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1+2: Customer + Order ─────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer Info Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl">
            <h2 className="font-headline text-sm tracking-wider uppercase text-primary mb-4">
              Customer Info
            </h2>
            <div className="h-px w-full bg-outline-variant/30 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow icon="person"   label="Name"    value={order.name} />
              <InfoRow icon="call"     label="Phone"   value={order.phone} />
              <InfoRow icon="mail"     label="Email"   value={order.email} />
              <InfoRow icon="location_city" label="City"   value={order.city} />
              <div className="md:col-span-2">
                <InfoRow icon="location_on" label="Address" value={order.address} />
              </div>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl">
            <h2 className="font-headline text-sm tracking-wider uppercase text-primary mb-4">
              Project Details
            </h2>
            <div className="h-px w-full bg-outline-variant/30 mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow icon="package_2"   label="Piece Type" value={order.pieceType} />
              <InfoRow icon="chair"       label="Room Type" value={order.roomType} />
              <InfoRow icon="straighten"  label="Dimensions" value={order.dimensions} />
              <InfoRow icon="schedule"    label="Timeline" value={order.timeline} />
              <InfoRow icon="forest"      label="Material Pref." value={order.materialPreference} />
              <InfoRow icon="format_paint" label="Finish Pref." value={order.finishPreference} />
              <InfoRow icon="attach_money" label="Budget Min" value={order.budgetMin ? `$${order.budgetMin}` : ''} />
              <InfoRow icon="attach_money" label="Budget Max" value={order.budgetMax ? `$${order.budgetMax}` : ''} />
              <InfoRow icon="engineering" label="Site Visit Req." value={order.siteVisitRequired ? 'Yes' : 'No'} />
            </div>

            <div className="mt-4">
              <InfoRow icon="description" label="Description / Vision" value={order.description} />
            </div>

            {/* Reference image */}
            {order.referenceImages && order.referenceImages.length > 0 && (
              <div className="mt-6">
                <p className="font-body text-xs text-on-surface-variant tracking-wider uppercase mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">image</span> Reference Images
                </p>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {order.referenceImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Reference"
                      className="w-48 h-48 object-cover rounded-lg border border-outline-variant/30 flex-shrink-0 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quote Builder Section */}
          <div className="mt-8 pb-12">
            <h2 className="font-headline text-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">payments</span>
              Generate Professional Quote
            </h2>
            <QuoteBuilder 
              inquiryId={order.id} 
              customerName={order.name}
              onSaveSuccess={() => {
                // Refresh order data
                orderService.getById(id).then(setOrder);
              }}
            />
          </div>
        </div>

        {/* ── Col 3: Status Update ──────────────── */}
        <div className="bg-surface-container-lowest p-6 rounded-xl h-fit">
          <h2 className="font-headline text-sm tracking-wider uppercase text-primary mb-4">
            Inquiry Management
          </h2>
          <div className="h-px w-full bg-outline-variant/30 mb-6" />

          {/* Current status */}
          <div className="mb-6">
            <p className="font-body text-xs text-on-surface-variant mb-2">Current Status:</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-body text-sm font-bold text-on-surface">
                {(order.status || 'NEW').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Update status */}
          <div className="mb-4">
            <p className="font-body text-xs text-on-surface-variant mb-2">Update Status To:</p>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="w-full bg-surface-container-high text-on-surface font-body text-sm rounded-lg px-4 py-3 border-none focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
            >
              {ORDER_STATUSES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.full}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Notes */}
          <div className="mb-6">
            <p className="font-body text-xs text-on-surface-variant mb-2">Admin Notes / Next Steps:</p>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about quote sent, site visit scheduled, etc..."
              rows={4}
              className="w-full bg-surface-container-high text-on-surface font-body text-sm rounded-lg px-4 py-3 border-none focus:ring-1 focus:ring-primary outline-none resize-none placeholder:text-outline-variant"
            />
          </div>

          {/* Feedback */}
          {success && (
            <div className="flex items-center gap-2 bg-primary-fixed/30 text-primary px-3 py-2 rounded-lg mb-4 text-xs font-body">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-3 py-2 rounded-lg mb-4 text-xs font-body">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleUpdateStatus}
            disabled={saving}
            className="w-full bg-primary text-on-primary font-body text-sm font-medium py-3 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            )}
            Save Changes
          </button>

          {/* Created info */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 space-y-1">
            <p className="font-body text-xs text-on-surface-variant">
              Received: {formatDate(order.createdAt)}
            </p>
            <p className="font-body text-xs text-on-surface-variant">
              Last Updated: {formatDate(order.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default OrderDetailPage