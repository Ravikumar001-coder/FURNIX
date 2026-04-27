import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { galleryService } from '../../services/galleryService'
import { X, SlidersHorizontal, ArrowUpRight, ChevronDown } from 'lucide-react'

// ─── Filter Config ───────────────────────────────────────────
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'SEATING',   label: 'Seating' },
  { value: 'TABLES',    label: 'Tables & Desks' },
  { value: 'STORAGE',   label: 'Storage & Wardrobes' },
  { value: 'BEDS',      label: 'Beds & Frames' },
  { value: 'DOORS',     label: 'Doors & Panels' },
  { value: 'KITCHEN',   label: 'Kitchen & Modular' },
  { value: 'DECOR',     label: 'Décor & Accents' },
  { value: 'OUTDOOR',   label: 'Outdoor' },
]

const ROOM_TYPES = [
  { value: '', label: 'All Rooms' },
  { value: 'LIVING_ROOM',  label: 'Living Room' },
  { value: 'BEDROOM',      label: 'Bedroom' },
  { value: 'DINING_ROOM',  label: 'Dining Room' },
  { value: 'HOME_OFFICE',  label: 'Home Office' },
  { value: 'KITCHEN',      label: 'Kitchen' },
  { value: 'BATHROOM',     label: 'Bathroom' },
  { value: 'OUTDOOR',      label: 'Outdoor / Garden' },
]

const MATERIALS = [
  'Teak', 'Rosewood', 'Walnut', 'Oak', 'Pine',
  'Bamboo', 'Reclaimed Wood', 'MDF', 'Brass Hardware'
]

// ─── Masonry Grid Component ───────────────────────────────────
const MasonryGrid = ({ items, onItemClick }) => {
  // Distribute items into 3 columns
  const col1 = items.filter((_, i) => i % 3 === 0)
  const col2 = items.filter((_, i) => i % 3 === 1)
  const col3 = items.filter((_, i) => i % 3 === 2)

  const GalleryCard = ({ item, index }) => {
    const isTall = index % 4 === 1 || index % 4 === 3

    return (
      <article
        className="group relative overflow-hidden rounded-2xl bg-gray-100 cursor-pointer"
        style={{ aspectRatio: isTall ? '3/4' : '4/5' }}
        onClick={() => onItemClick(item)}
      >
        {/* Image */}
        <img
          src={item.coverImage || `https://images.unsplash.com/photo-${1519710164239 + item.id * 12345}-${item.id}abcdef?auto=format&fit=crop&w=800&q=80`}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
          }}
        />

        {/* Featured Badge */}
        {item.featured && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full">
            Featured
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-[10px] uppercase tracking-[0.15em] mb-1">
                  {item.roomType?.replace(/_/g, ' ') || item.category}
                </p>
                <h3 className="text-white font-semibold text-lg leading-tight">{item.title}</h3>
              </div>
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white flex-shrink-0 ml-3">
                <ArrowUpRight size={16} />
              </div>
            </div>

            {/* Materials chips */}
            {item.materialsList?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.materialsList.slice(0, 3).map((mat) => (
                  <span key={mat} className="text-[10px] bg-white/15 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                    {mat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
      {/* Column 1 */}
      <div className="flex flex-col gap-4 lg:gap-6">
        {col1.map((item, i) => <GalleryCard key={item.id} item={item} index={i * 3} />)}
      </div>
      {/* Column 2 — offset for visual variety */}
      <div className="flex flex-col gap-4 lg:gap-6 xl:mt-12">
        {col2.map((item, i) => <GalleryCard key={item.id} item={item} index={i * 3 + 1} />)}
      </div>
      {/* Column 3 */}
      <div className="flex flex-col gap-4 lg:gap-6 xl:mt-24 hidden xl:flex">
        {col3.map((item, i) => <GalleryCard key={item.id} item={item} index={i * 3 + 2} />)}
      </div>
    </div>
  )
}

// ─── Light Box Modal ──────────────────────────────────────────
const LightBox = ({ item, onClose }) => {
  const [currentImg, setCurrentImg] = useState(0)
  const images = item.images?.length > 0 ? item.images : [item.coverImage].filter(Boolean)

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row" onClick={(e) => e.stopPropagation()}>
        {/* Image panel */}
        <div className="lg:w-3/5 bg-gray-100">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
            <img
              src={images[currentImg] || item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImg(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImg ? 'bg-white w-6' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:w-2/5 p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-2">
                {item.roomType?.replace(/_/g, ' ') || item.category}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {item.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{item.description}</p>
          )}

          <div className="space-y-4 mt-auto">
            {item.materialsList?.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-2">Materials Used</p>
                <div className="flex flex-wrap gap-2">
                  {item.materialsList.map((mat) => (
                    <span key={mat} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.projectDuration && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-1">Crafting Time</p>
                <p className="text-sm font-medium text-gray-700">{item.projectDuration}</p>
              </div>
            )}

            {item.clientLocation && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-1">Delivered To</p>
                <p className="text-sm font-medium text-gray-700">{item.clientLocation}</p>
              </div>
            )}

            <Link
              to="/custom-order"
              className="block w-full text-center bg-gray-900 text-white font-semibold py-4 rounded-xl hover:bg-gray-700 transition-colors mt-4"
            >
              Commission Similar Piece →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Gallery Page ────────────────────────────────────────
const GalleryPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    category: '',
    roomType: '',
    material: ''
  })
  const [activeMaterials, setActiveMaterials] = useState([])

  const loadGallery = useCallback(async (newFilters, newPage = 0) => {
    if (newPage === 0) setLoading(true)
    else setLoadingMore(true)

    try {
      const data = await galleryService.getAll({
        ...newFilters,
        material: activeMaterials[0] || newFilters.material || '',
        page: newPage,
        size: 18
      })
      const content = data?.content || []
      if (newPage === 0) setItems(content)
      else setItems(prev => [...prev, ...content])
      setHasMore(!data?.last)
      setPage(newPage)
    } catch (err) {
      console.error('Failed to load gallery:', err)
      // Fallback to empty state
      if (newPage === 0) setItems([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeMaterials])

  useEffect(() => {
    loadGallery(filters, 0)
  }, [filters, activeMaterials])

  const toggleMaterial = (mat) => {
    setActiveMaterials(prev =>
      prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
    )
  }

  const clearFilters = () => {
    setFilters({ category: '', roomType: '', material: '' })
    setActiveMaterials([])
  }

  const activeFilterCount = [
    filters.category, filters.roomType, ...activeMaterials
  ].filter(Boolean).length

  const SAMPLE_ITEMS = [
    { id: 1, title: 'Heirloom Teak Dining Set', category: 'TABLES', roomType: 'DINING_ROOM', coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', materialsList: ['Teak', 'Brass Hardware'], featured: true, projectDuration: '8 weeks', clientLocation: 'Koramangala, Bangalore' },
    { id: 2, title: 'Floating Walnut Bookshelf', category: 'STORAGE', roomType: 'HOME_OFFICE', coverImage: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80', materialsList: ['Walnut', 'Steel'], featured: false, projectDuration: '3 weeks', clientLocation: 'Banjara Hills, Hyderabad' },
    { id: 3, title: 'Minimal Platform Bed', category: 'BEDS', roomType: 'BEDROOM', coverImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80', materialsList: ['Oak', 'Linen Upholstery'], featured: true, projectDuration: '6 weeks', clientLocation: 'Juhu, Mumbai' },
    { id: 4, title: 'Carved Rosewood Console', category: 'DECOR', roomType: 'LIVING_ROOM', coverImage: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80', materialsList: ['Rosewood'], featured: false, projectDuration: '4 weeks', clientLocation: 'Vasant Vihar, Delhi' },
    { id: 5, title: 'Studio Lounge Chair', category: 'SEATING', roomType: 'LIVING_ROOM', coverImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', materialsList: ['Teak', 'Leather'], featured: false, projectDuration: '5 weeks', clientLocation: 'Alwarpet, Chennai' },
    { id: 6, title: 'Modular Kitchen Island', category: 'KITCHEN', roomType: 'KITCHEN', coverImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80', materialsList: ['Birch Ply', 'Marble Countertop'], featured: false, projectDuration: '10 weeks', clientLocation: 'Whitefield, Bangalore' },
  ]

  const displayItems = items.length > 0 ? items : (loading ? [] : SAMPLE_ITEMS)

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Hero Header ──────────────────────────────── */}
      <div className="pt-24 pb-16 px-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">Crafted in India · Est. 2012</p>
            <h1 className="text-5xl md:text-7xl font-bold text-on-surface leading-none tracking-tight">
              Our <br className="hidden md:block" />
              <span className="italic font-light text-on-surface-variant">Portfolio</span>
            </h1>
          </div>
          <div className="max-w-md">
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Every piece in this gallery is a bespoke commission — designed, hand-crafted, and delivered to a single home. No two are alike.
            </p>
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center border-t border-b border-gray-100 py-5">
          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilters(prev => ({ ...prev, category: cat.value }))}
                className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                  filters.category === cat.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* More Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* ── Extended Filter Panel ───────────────────── */}
        {showFilters && (
          <div className="mt-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Room Type */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Room Type</label>
                <div className="flex flex-col gap-2">
                  {ROOM_TYPES.map((rt) => (
                    <label key={rt.value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="roomType"
                        value={rt.value}
                        checked={filters.roomType === rt.value}
                        onChange={() => setFilters(prev => ({ ...prev, roomType: rt.value }))}
                        className="w-3.5 h-3.5 accent-gray-900"
                      />
                      <span className={`text-sm transition-colors ${filters.roomType === rt.value ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {rt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Primary Material</label>
                <div className="flex flex-wrap gap-2">
                  {MATERIALS.map((mat) => (
                    <button
                      key={mat}
                      onClick={() => toggleMaterial(mat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        activeMaterials.includes(mat)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs text-red-500 font-semibold flex items-center gap-1 hover:text-red-700"
              >
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Active filters display ──────────────────── */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">Active:</span>
            {filters.category && (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                {CATEGORIES.find(c => c.value === filters.category)?.label}
                <button onClick={() => setFilters(p => ({...p, category: ''}))}><X size={10} /></button>
              </span>
            )}
            {filters.roomType && (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                {ROOM_TYPES.find(r => r.value === filters.roomType)?.label}
                <button onClick={() => setFilters(p => ({...p, roomType: ''}))}><X size={10} /></button>
              </span>
            )}
            {activeMaterials.map(mat => (
              <span key={mat} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                {mat}
                <button onClick={() => toggleMaterial(mat)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Gallery Grid ─────────────────────────────── */}
      <div className="px-6 max-w-screen-2xl mx-auto pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-gray-100 animate-pulse"
                style={{ aspectRatio: i % 4 === 1 || i % 4 === 3 ? '3/4' : '4/5' }}
              />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-gray-400 text-4xl">image_search</span>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No pieces found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your filters</p>
            <button onClick={clearFilters} className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-400 mb-8">
              {displayItems.length} piece{displayItems.length !== 1 ? 's' : ''} in the collection
            </div>
            <MasonryGrid items={displayItems} onItemClick={setSelectedItem} />
          </>
        )}

        {/* ── Load More ─────────────────────────────── */}
        {hasMore && !loading && items.length > 0 && (
          <div className="flex justify-center mt-16">
            <button
              onClick={() => loadGallery(filters, page + 1)}
              disabled={loadingMore}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronDown size={18} />
              )}
              Load More Pieces
            </button>
          </div>
        )}

        {/* ── CTA Banner ────────────────────────────── */}
        <div className="mt-24 bg-gray-900 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
          <div className="relative z-10">
            <p className="text-gray-400 text-xs uppercase tracking-[0.2em] mb-4">Commission Your Own</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Every piece starts<br />with a conversation.
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto mb-8">
              Share your vision and our master craftsmen will bring it to life — exactly as you imagined it.
            </p>
            <Link
              to="/custom-order"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all"
            >
              Start Your Project <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────── */}
      {selectedItem && <LightBox item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  )
}

export default GalleryPage
