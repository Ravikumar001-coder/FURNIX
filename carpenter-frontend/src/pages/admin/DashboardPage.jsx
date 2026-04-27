import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import AdminLayout from '../../components/layout/AdminLayout'

const ORDER_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCZNnhjBip_KDF77WBbzG_DPgFF2M9hk1gDupZjBgtNBcSR2G_I7vjTUP8Uf9qhIkt5fVaqskKVkYj8Dw0dFfc1YkBYjk353a2k6wXtDNE3tLw57JXMg-8xBWcEIX7uAdzkwQ5kYUd2womd_Glj7RvcJs1olrUEkIRxYozvifqiHKjhaSe8O2cz7-4bBpC6vUrxpjDifsUZGrq0Qgxe9sJCS3EQY68A9aMHb3oPwrp3q7ZDPMepzwSH4QWJWaJiG2cTHOW05MNIgLE',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPBYOPNsUkK7fKNuw8iwqxqZziATFRtSYUYHCR8gjrYaT0SsPI-9y6IPS5gr1ZC3qaWjJSThNOKFmSh-DRtKyZP4QuhOEbdDtDRztRFw4l7CvUneh9nbj8zBm6aZ3XOpqItcIQQiwyCsf836ctifHIyWRDKkKXEN14lRRrO7m3H7ntSGDDwT3D-GqpVHP0tQs8_nL4S3lQRKZghDfIVt-DwMBvL7_zngO8q3C7sa3CrcyqspgNL8ZN4UIUmfzkOCzF0qMNyjZi-K8',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAmGwOlMHYzMxzYiInefRIzw4m92CabJ4zlJYiRMWH9O1Nsh17oOTnXCHmGG3zQrAZNlS7hns1qrcHsIRnLkMkU5tUWqlqjDr9C_t5AsZmMzMq3Gg6FZq-IRq3sbmONJYaSKWHmDrEYR9rHVqqbVKh9hD193m3d6NWboqoapBEY8vBVhuWYeP80Iupr6w_-Au5wi6w18VPgCdwOUXNvBV0yU05p5gwLqg8D_ckIL4YeXE5GXuH8ocLgjp1WPZGW0YJNfImnk5Z_uTQ',
]

const BAR_VALUES = [20, 35, 25, 50, 40, 65, 80]
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const formatStatus = (status) => {
  if (!status) return 'New Inquiry'
  return status
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

const statusClasses = (status) => {
  switch (status) {
    case 'ACCEPTED':
    case 'QUOTE_SENT':
      return 'bg-primary/10 text-primary'
    case 'IN_PRODUCTION':
    case 'UNDER_REVIEW':
      return 'bg-secondary-container/20 text-secondary'
    case 'READY_FOR_DELIVERY':
    case 'DELIVERED':
    case 'CLOSED':
      return 'bg-primary-fixed/40 text-primary-container'
    default:
      return 'bg-tertiary-container/10 text-tertiary-container'
  }
}

const toOrderCode = (order) => {
  const year = new Date(order?.createdAt || Date.now()).getFullYear()
  const n = String(order?.id ?? 0).padStart(3, '0')
  return `INQ-${year}-${n}`
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [statsData, ordersData] = await Promise.all([
          orderService.getStats(),
          orderService.getAll(),
        ])
        setStats(statsData)
        const items = Array.isArray(ordersData) ? ordersData : (ordersData?.content || [])
        setOrders(items.slice(0, 3))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalOrders = stats?.totalInquiries ?? 0
  const totalProducts = stats?.totalProducts ?? 0
  const pendingOrders = stats?.newInquiries ?? 0
  const confirmedOrders = stats?.acceptedInquiries ?? 0
  const pendingActions = pendingOrders

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="font-headline text-3xl text-primary mb-2">Dashboard Overview</h2>
            <p className="text-on-surface-variant font-body text-sm">Today's snapshot of the atelier.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-white text-on-surface px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm text-sm font-medium border border-outline-variant/20">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              Last 30 Days
            </button>
            <button className="bg-primary text-on-primary px-6 py-3 rounded-xl font-body text-sm font-bold uppercase tracking-widest hover:bg-primary-container transition-colors shadow-sm">
              Generate Report
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-on-surface-variant text-sm">Loading insights...</span>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-outline-variant/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h3 className="font-headline text-lg text-on-surface tracking-tight">Total Products</h3>
                  <span className="material-symbols-outlined text-primary bg-primary-fixed/50 p-2 rounded-lg">chair</span>
                </div>
                <div className="relative z-10">
                  <span className="font-headline text-5xl text-primary font-bold">{totalProducts}</span>
                  <div className="flex items-center gap-1 mt-2 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
                    <span className="material-symbols-outlined text-xs text-primary">trending_up</span>
                    <span>Curated Collection</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-outline-variant/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h3 className="font-headline text-lg text-on-surface tracking-tight">New Inquiries</h3>
                  <span className="material-symbols-outlined text-secondary bg-secondary-container/50 p-2 rounded-lg">receipt_long</span>
                </div>
                <div className="relative z-10">
                  <span className="font-headline text-5xl text-secondary font-bold">{pendingOrders}</span>
                  <div className="flex items-center gap-1 mt-2 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
                    <span className="material-symbols-outlined text-xs text-secondary">pending_actions</span>
                    <span>Action required on {pendingActions}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-outline-variant/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h3 className="font-headline text-lg text-on-surface tracking-tight">Total Portfolio</h3>
                  <span className="material-symbols-outlined text-tertiary bg-tertiary-fixed/50 p-2 rounded-lg">shopping_bag</span>
                </div>
                <div className="relative z-10">
                  <span className="font-headline text-5xl text-tertiary font-bold">{totalOrders}</span>
                  <div className="flex items-center gap-1 mt-2 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
                    <span className="material-symbols-outlined text-xs text-tertiary">verified</span>
                    <span>{confirmedOrders} accepted</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-outline-variant/10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline text-2xl text-primary">Inquiry Volume</h3>
                  <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                  </button>
                </div>

                <div className="h-64 relative flex items-end justify-between px-4 pb-4 border-b border-outline-variant/20">
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant font-body font-bold uppercase tracking-widest py-4">
                    <span>50</span>
                    <span>40</span>
                    <span>30</span>
                    <span>20</span>
                    <span>10</span>
                    <span>0</span>
                  </div>

                  <div className="w-full h-full flex items-end justify-between ml-10 relative">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="w-full h-px bg-outline-variant/5"></div>
                      <div className="w-full h-px bg-outline-variant/5"></div>
                      <div className="w-full h-px bg-outline-variant/5"></div>
                      <div className="w-full h-px bg-outline-variant/5"></div>
                      <div className="w-full h-px bg-outline-variant/5"></div>
                    </div>

                    {BAR_VALUES.map((value, idx) => (
                      <div key={idx} className={`w-8 h-[${value}%] ${idx % 3 === 0 ? 'bg-primary' : idx % 2 === 0 ? 'bg-primary-fixed' : 'bg-primary-container'} rounded-t-sm group relative`} style={{ height: `${value}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {Math.round((value / 100) * 52)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between ml-14 mt-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                  {DAY_LABELS.map((day) => <span key={day}>{day}</span>)}
                </div>
              </section>

              <section className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-outline-variant/10 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline text-2xl text-primary">Recent Activity</h3>
                  <button onClick={() => navigate('/admin/orders')} className="text-xs font-bold text-secondary hover:text-secondary-container transition-colors uppercase tracking-widest">View All</button>
                </div>

                <div className="flex flex-col gap-6 flex-1">
                  {orders.length === 0 && (
                    <p className="text-sm text-on-surface-variant font-body">No recent inquiries yet.</p>
                  )}

                  {orders.map((order, idx) => (
                    <button key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)} className="w-full flex items-center gap-4 group text-left">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 relative">
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={ORDER_IMAGES[idx % ORDER_IMAGES.length]} alt={order.pieceType} />
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline text-sm font-semibold text-on-surface line-clamp-1">{order.pieceType || 'Custom Piece'}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-1 font-bold uppercase tracking-wider">{toOrderCode(order)}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClasses(order.status)}`}>
                        {formatStatus(order.status)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default DashboardPage
