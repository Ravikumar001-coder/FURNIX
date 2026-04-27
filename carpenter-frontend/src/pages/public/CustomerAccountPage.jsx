import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { orderService } from '../../services/orderService'
import { wishlistService } from '../../services/wishlistService'
import { formatCurrency } from '../../utils/helpers'
import { toast } from 'react-hot-toast'

const CustomerAccountPage = () => {
  const { user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    profilePicture: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    setEditForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      profilePicture: user.profilePicture || ''
    })

    const fetchData = async () => {
      try {
        const [ordersRes] = await Promise.all([
          orderService.getMyInquiries(0, 20)
        ])
        setOrders(ordersRes.content || [])
        setWishlist(wishlistService.get())
      } catch (err) {
        console.error('Failed to fetch account data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  const customOrders = useMemo(() => {
    return orders.filter((order) =>
      String(order.pieceType || '').toUpperCase().includes('CUSTOM')
      || String(order.pieceType || '').toUpperCase().includes('BESPOKE')
    )
  }, [orders])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await updateProfile(editForm)
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveFromWishlist = (productId) => {
    const nextList = wishlistService.remove(productId)
    setWishlist(nextList)
    toast.success('Removed from wishlist')
  }

  if (!user) return null

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="pt-28 pb-24 px-4 min-h-screen bg-surface-container-lowest text-on-surface">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="font-headline text-4xl text-on-surface mb-2">My Account</h1>
          <p className="font-body text-on-surface-variant italic">Welcome back, {user.fullName || user.username}</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="bg-white rounded-3xl border border-outline-variant/20 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="relative group">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.fullName || user.username}
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-primary text-on-primary font-headline text-3xl flex items-center justify-center shadow-md">
                      {getInitials(user.fullName || user.username)}
                    </div>
                  )}
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full border border-outline-variant/30 shadow-sm text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h2 className="font-headline text-2xl text-on-surface">{user.fullName || user.username}</h2>
                  <p className="font-body text-sm text-on-surface-variant">{user.username}</p>
                  {user.phone && <p className="font-body text-xs text-on-surface-variant">{user.phone}</p>}
                </div>

                <div className="w-full pt-4 border-t border-outline-variant/10 flex flex-col gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 text-sm font-body font-medium text-on-surface transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_edit</span>
                    Edit Profile
                  </button>

                  <button
                    onClick={async () => {
                      await logout()
                      navigate('/')
                    }}
                    className="w-full text-error hover:bg-error-container/10 border border-error/10 rounded-xl py-3 text-sm font-body font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-primary text-on-primary rounded-3xl p-8 shadow-xl shadow-primary/10 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <h3 className="font-headline text-xl mb-6 relative z-10">Quick Stats</h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-on-primary text-sm">Total Inquiries</span>
                  <strong className="text-xl">{orders.length}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-primary text-sm">Wishlist Items</span>
                  <strong className="text-xl">{wishlist.length}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-primary text-sm">Custom Designs</span>
                  <strong className="text-xl">{customOrders.length}</strong>
                </div>
              </div>
            </section>
          </aside>

          {/* Main Content */}
          <main className="space-y-8">
            {/* Edit Profile Section */}
            {isEditing && (
              <section className="bg-white rounded-3xl border-2 border-primary/20 p-8 shadow-lg">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-headline text-2xl text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_square</span>
                    Update Information
                  </h2>
                  <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary focus:outline-none font-body"
                      placeholder="Your Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Phone Number</label>
                    <input 
                      type="tel" 
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary focus:outline-none font-body"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Profile Picture URL</label>
                    <input 
                      type="url" 
                      value={editForm.profilePicture}
                      onChange={(e) => setEditForm({...editForm, profilePicture: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary focus:outline-none font-body"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <div className="md:col-span-2 pt-4 flex gap-3">
                    <button 
                      type="submit" 
                      disabled={updating}
                      className="bg-primary text-on-primary px-8 py-3 rounded-xl font-body font-bold text-sm uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="bg-surface-container-high text-on-surface px-8 py-3 rounded-xl font-body font-bold text-sm uppercase tracking-widest hover:bg-outline-variant transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Recent Orders */}
            <section className="bg-white rounded-3xl border border-outline-variant/20 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-headline text-2xl text-on-surface">Recent Inquiries</h2>
                <Link to="/custom-order" className="text-sm font-body text-primary font-bold hover:underline flex items-center gap-1">
                  Start New Design <span className="material-symbols-outlined text-sm">add_circle</span>
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <div className="h-20 bg-surface-container-low rounded-2xl animate-pulse" />
                  <div className="h-20 bg-surface-container-low rounded-2xl animate-pulse" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/20">
                  <span className="material-symbols-outlined text-outline-variant text-5xl mb-4">shopping_basket</span>
                  <p className="font-body text-on-surface-variant mb-6">No handcrafted pieces requested yet.</p>
                  <Link to="/gallery" className="inline-flex bg-primary text-on-primary px-8 py-3 rounded-xl font-body font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all">
                    Browse Collections
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="group bg-surface-container-low/50 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300 rounded-2xl p-5 border border-outline-variant/10 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white border border-outline-variant/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">table_restaurant</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-body font-bold text-on-surface">{order.pieceType || 'Custom Piece'}</h3>
                        <p className="font-body text-xs text-on-surface-variant flex items-center gap-2">
                          Inquiry #{order.id} • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary-container text-on-primary-container border border-primary/10">
                          {(order.status || 'NEW').replace(/_/g, ' ')}
                        </span>
                        <Link to={`/account/inquiry/${order.id}`} className="text-primary p-2">
                           <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Wishlist */}
            <section className="bg-white rounded-3xl border border-outline-variant/20 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h2 className="font-headline text-2xl text-on-surface mb-8">My Wishlist</h2>
              
              {wishlist.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/20">
                  <span className="material-symbols-outlined text-outline-variant text-5xl mb-4">favorite</span>
                  <p className="font-body text-on-surface-variant mb-6">Save the pieces you aspire to own.</p>
                  <Link to="/gallery" className="inline-flex bg-surface-container-highest text-on-surface px-8 py-3 rounded-xl font-body font-bold text-xs uppercase tracking-widest border border-outline-variant/30 hover:bg-outline-variant transition-all">
                    Explore Gallery
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlist.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-outline-variant/20 hover:border-primary/20 hover:shadow-md transition-all group">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-container-low flex-shrink-0">
                        <img 
                          src={item.imageUrl || "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"} 
                          alt={item.name} 
                          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-headline text-lg text-on-surface line-clamp-1">{item.name}</h4>
                        <p className="text-on-surface-variant text-xs mb-2">Bespoke Collection</p>
                        <div className="flex items-center gap-2">
                           <Link to={`/products/${item.id}`} className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">View Piece</Link>
                           <span className="text-outline-variant text-[10px]">•</span>
                           <button 
                            onClick={() => handleRemoveFromWishlist(item.id)}
                            className="text-[10px] font-bold uppercase tracking-widest text-error/70 hover:text-error transition-colors"
                           >
                             Remove
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default CustomerAccountPage
