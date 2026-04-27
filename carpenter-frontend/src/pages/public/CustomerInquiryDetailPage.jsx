import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { formatDate, timeAgo } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
import { ORDER_STATUSES } from '../../utils/constants'
import { projectService } from '../../services/projectService'
import { Link } from 'react-router-dom'

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

const CustomerInquiryDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [inquiry, setInquiry] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const load = async () => {
      try {
        const data = await orderService.getMyInquiryById(id)
        setInquiry(data)
        
        // Try to fetch project if inquiry is in production/later
        if (['IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED', 'READY'].includes(data.status)) {
          try {
            // Ideally we'd have a project ID on the inquiry, 
            // but for now we'll search by inquiry ID or similar if the API allows
            // or just try to get project #1 for demo purposes if needed
            // REAL LOGIC: projectService.getByInquiryId(id)
            const proj = await projectService.getByInquiryId(id);
            setProject(proj);
          } catch (e) { /* project might not be created yet */ }
        }
      } catch (err) {
        setError('Failed to load inquiry details. It may not exist or belong to you.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user, navigate])

  if (loading) return (
    <div className="pt-32 pb-24 px-4 min-h-screen bg-surface-container-lowest">
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-on-surface-variant text-sm">Loading inquiry...</span>
      </div>
    </div>
  )

  if (!inquiry || error) return (
    <div className="pt-32 pb-24 px-4 min-h-screen bg-surface-container-lowest">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-4 py-20">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <h2 className="text-2xl font-headline text-on-surface">Inquiry Not Found</h2>
        <p className="text-on-surface-variant">{error}</p>
        <button onClick={() => navigate('/account')} className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-xl">
          Return to Account
        </button>
      </div>
    </div>
  )

  const getStatusColor = (statusValue) => {
    const s = ORDER_STATUSES.find(st => st.value === statusValue)
    return s ? s.color : '#D4A017'
  }

  return (
    <div className="pt-32 pb-24 px-4 min-h-screen bg-surface-container-lowest text-on-surface">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/account')}
              className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-container rounded-full"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="font-headline text-3xl text-primary">
                Inquiry <span className="text-secondary">#{inquiry.id}</span>
              </h1>
              <p className="font-body text-sm text-on-surface-variant mt-1">
                Requested {timeAgo(inquiry.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-lg">
              <h2 className="font-headline text-lg tracking-wider uppercase text-primary mb-4">
                Project Vision
              </h2>
              <div className="h-px w-full bg-outline-variant/30 mb-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow icon="category"   label="Piece Type" value={inquiry.pieceType} />
                <InfoRow icon="chair"       label="Room" value={inquiry.roomType} />
                <InfoRow icon="straighten"  label="Dimensions" value={inquiry.dimensions} />
                <InfoRow icon="schedule"    label="Timeline" value={inquiry.timeline} />
                <InfoRow icon="forest"      label="Material Preference" value={inquiry.materialPreference} />
                <InfoRow icon="format_paint" label="Finish" value={inquiry.finishPreference} />
                <InfoRow icon="attach_money" label="Budget Min" value={inquiry.budgetMin ? `$${inquiry.budgetMin}` : ''} />
                <InfoRow icon="attach_money" label="Budget Max" value={inquiry.budgetMax ? `$${inquiry.budgetMax}` : ''} />
              </div>

              <div className="mt-6">
                <InfoRow icon="description" label="Detailed Description" value={inquiry.description} />
              </div>

              {inquiry.referenceImages && inquiry.referenceImages.length > 0 && (
                <div className="mt-8">
                  <p className="font-body text-xs text-on-surface-variant tracking-wider uppercase mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">image</span> Reference Images
                  </p>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {inquiry.referenceImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Reference"
                        className="w-48 h-48 object-cover rounded-2xl border border-outline-variant/30 shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Sidebar */}
          <div className="space-y-8">
            <div className="bg-primary text-on-primary p-8 rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <h2 className="font-headline text-lg tracking-wider uppercase mb-6 relative z-10">
                Current Status
              </h2>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getStatusColor(inquiry.status) }} 
                />
                <span className="font-body text-xl font-bold">
                  {(inquiry.status || 'NEW').replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-4 relative z-10 pt-6 border-t border-white/20">
                <div>
                  <p className="font-body text-xs text-white/70 uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="font-body text-sm font-semibold">{formatDate(inquiry.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Live Tracking Link */}
            {project && (
              <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <h2 className="font-headline text-lg tracking-wider uppercase mb-2 relative z-10 text-primary">
                  Live Progress
                </h2>
                <p className="text-xs text-gray-400 mb-6 relative z-10 leading-relaxed">
                  Your commission is currently in the workshop. View the latest photos and updates.
                </p>
                <Link
                  to={`/track-project/${project.id}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-white px-6 py-3 text-gray-900 font-bold tracking-wide hover:bg-primary-50 transition-all relative z-10 shadow-lg"
                >
                  Track Live Production
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                </Link>
              </div>
            )}

            <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-lg">
              <h2 className="font-headline text-lg tracking-wider uppercase text-primary mb-4">
                Need Help?
              </h2>
              <p className="text-sm text-on-surface-variant font-body mb-6">
                If you need to make changes to your inquiry or discuss the details further, please contact our team.
              </p>
              <a
                href={`/contact`}
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-surface-container-high px-6 py-3 text-on-surface font-semibold tracking-wide hover:bg-outline-variant transition-colors"
              >
                Contact Support
                <span className="material-symbols-outlined text-sm">support_agent</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CustomerInquiryDetailPage
