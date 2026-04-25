import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { productService } from '../../services/productService'
import { CATEGORIES } from '../../utils/constants'
import { formatPrice } from '../../utils/helpers'

const ProductsPage = () => {
  const navigate = useNavigate()

  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [category,  setCategory]  = useState('ALL')
  const [search,    setSearch]    = useState('')
  const [error,     setError]     = useState('')
  const [deleting,  setDeleting]  = useState(null)
  
  // Pagination State
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLast, setIsLast] = useState(true)
  const [isFirst, setIsFirst] = useState(true)

  const loadProducts = async (cat = category, kw = search, p = page) => {
    setLoading(true)
    try {
      const pageResponse = await productService.getAll(cat === 'ALL' ? null : cat, kw, p, 10)
      
      // If the backend returns an array (legacy), adapt it
      if (Array.isArray(pageResponse)) {
        setProducts(pageResponse)
        setTotalElements(pageResponse.length)
        setTotalPages(1)
        setIsFirst(true)
        setIsLast(true)
      } else {
        setProducts(pageResponse.content || [])
        setTotalElements(pageResponse.totalElements || 0)
        setTotalPages(pageResponse.totalPages || 0)
        setIsFirst(pageResponse.first ?? true)
        setIsLast(pageResponse.last ?? true)
      }
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Load when category or page changes
  useEffect(() => { 
    loadProducts(category, search, page) 
  }, [category, page])

  // Optional: Add debounce for search or manual search button.
  // For now, let's keep search on enter or blur to prevent spam.
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0) // reset to first page on search
    loadProducts(category, search, 0)
  }

  // Using server-side search instead of client-side
  const filtered = products

  const handleToggle = async (id) => {
    try {
      const updated = await productService.toggle(id)
      setProducts(prev => prev.map(p => p.id === id ? updated : p))
    } catch {
      setError('Failed to toggle product')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await productService.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Failed to delete product')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <AdminLayout>

      {/* ── Header ─────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
        <div>
          <h2 className="font-headline text-3xl text-primary tracking-wide mb-2">Product Management</h2>
          <p className="font-body text-on-surface-variant text-sm max-w-xl">
            Curate the artisanal collection. Add new pieces, refine details, or manage the gallery's current offerings.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="bg-primary text-on-primary font-body font-medium text-sm px-6 py-3 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors duration-300 flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          Add New Product
        </button>
      </header>

      {/* ── Filters & Search Toolbar ───────────────── */}
      <section className="bg-surface-container-lowest rounded-xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search and press enter..."
            className="w-full bg-surface-container-high text-on-surface placeholder-outline-variant font-body text-sm rounded-sm py-3 pl-12 pr-4 border-none focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </form>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {/* Category dropdown-style button */}
          <div className="relative">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="appearance-none bg-surface-container text-on-surface font-body text-xs font-medium px-4 py-2 pr-8 rounded-full border-none cursor-pointer hover:bg-surface-variant transition-colors focus:ring-1 focus:ring-primary outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>Category: {cat.label}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">expand_more</span>
          </div>

          <button className="flex items-center gap-2 text-primary font-body text-xs font-medium px-4 py-2 rounded-full whitespace-nowrap hover:bg-primary-container hover:text-on-primary-container transition-colors ml-auto md:ml-0">
            <span className="material-symbols-outlined text-[16px]">filter_list</span> More Filters
          </button>
        </div>
      </section>

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

      {/* ── Product Table ─────────────────────────────── */}
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden relative z-10 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-body font-semibold text-on-surface-variant tracking-wider uppercase bg-surface-container-low">
                <th className="py-4 px-6 rounded-tl-xl font-headline tracking-widest text-primary">Piece</th>
                <th className="py-4 px-6 font-headline tracking-widest text-primary">Category</th>
                <th className="py-4 px-6 font-headline tracking-widest text-primary">Price</th>
                <th className="py-4 px-6 font-headline tracking-widest text-primary">Status</th>
                <th className="py-4 px-6 text-right rounded-tr-xl font-headline tracking-widest text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-body divide-y-0">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-on-surface-variant text-sm">Loading collection...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">inventory_2</span>
                    <p className="text-sm">No products found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id} className="group hover:bg-surface-container-low transition-colors duration-300">
                    {/* Piece */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded overflow-hidden bg-surface-container flex-shrink-0 relative">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                              <span className="material-symbols-outlined text-2xl text-outline">image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent mix-blend-multiply" />
                        </div>
                        <div>
                          <p className="font-headline text-base font-semibold text-on-surface mb-1">{product.name}</p>
                          <p className="text-xs text-on-surface-variant flex gap-2 items-center">
                            <span className="inline-block px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded-full text-[10px] tracking-wider uppercase">
                              {product.category || 'Custom'}
                            </span>
                            SKU: AO-{String(product.id).padStart(4, '0')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-5 px-6 text-on-surface-variant">
                      {(product.category || 'Custom').charAt(0) + (product.category || 'Custom').slice(1).toLowerCase()}
                    </td>

                    {/* Price */}
                    <td className="py-5 px-6 font-medium text-on-surface">
                      {formatPrice(product.price)}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(product.id)}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                              product.active ? 'bg-primary' : 'bg-surface-variant'
                            }`}
                          >
                            <span className={`inline-block h-2 w-2 rounded-full transition-transform ${
                              product.active
                                ? 'translate-x-4 bg-on-primary'
                                : 'translate-x-1 bg-outline'
                            }`} />
                          </button>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            product.active ? 'text-primary' : 'text-on-surface-variant'
                          }`}>
                            {product.active ? 'Visible' : 'Draft'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deleting === product.id}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {deleting === product.id ? 'hourglass_empty' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-6 flex items-center justify-between text-sm text-on-surface-variant border-t border-outline-variant/15 mt-4">
          <p>Showing {products.length} of {totalElements} product{totalElements !== 1 ? 's' : ''}</p>
          <div className="flex gap-2 items-center">
            <span className="mr-2 text-xs">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={isFirst || loading}
              className="p-2 hover:bg-surface-container rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={isLast || loading}
              className="p-2 hover:bg-surface-container rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </AdminLayout>
  )
}

export default ProductsPage