import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { productService } from '../../services/productService'
import { buildWhatsAppUrl } from '../../utils/helpers'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { getWhatsAppNumber } from '../../utils/siteSettings'
import { wishlistService } from '../../services/wishlistService'
import Spinner from '../../components/ui/Spinner'
import { toast } from 'react-hot-toast'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { settings } = useSiteSettings()
  const whatsappNumber = getWhatsAppNumber(settings)

  useEffect(() => {
    window.scrollTo(0, 0)
    const load = async () => {
      setLoading(true)
      try {
        const data = await productService.getById(id)
        setProduct(data)
        
        if (data.category) {
          const relData = await productService.getAll(data.category)
          const rel = Array.isArray(relData) ? relData : (relData.content || [])
          setRelated(rel.filter(p => p.id !== data.id).slice(0, 3))
        }
        setIsWishlisted(wishlistService.isWishlisted(id))
      } catch (err) {
        console.error(err)
        navigate('/gallery')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading) return (
    <div className="min-h-screen bg-[#fbf9f4] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (!product) return null

  return (
    <>
      {/* Navbar */}
      {/* Main Detail Section */}
      <main className="pt-28 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
          <div className="flex flex-col lg:flex-row gap-10 md:gap-12 xl:gap-16">
            
            {/* Left: Images */}
            <div className="w-full lg:w-[55%] flex flex-col gap-6">
              <div className="w-full aspect-[4/3] bg-surface-container-high rounded overflow-hidden relative group">
                {product.arModelUrl ? (
                  <model-viewer 
                    src={product.arModelUrl} 
                    alt={product.name} 
                    ar 
                    ar-modes="webxr scene-viewer quick-look" 
                    camera-controls 
                    poster={product.imageUrl} 
                    shadow-intensity="1" 
                    style={{ width: '100%', height: '100%' }}
                  >
                    <button slot="ar-button" className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-on-surface text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 uppercase tracking-widest hover:bg-white transition-colors cursor-pointer border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
                      View in AR
                    </button>
                  </model-viewer>
                ) : (
                  <img 
                    src={product.imageUrl || "https://images.unsplash.com/photo-1595514652250-9dfcb77ca46c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {/* Product gallery images will go here once added to the data model */}
            </div>

            {/* Right: Product Info */}
            <div className="w-full lg:w-[45%] flex flex-col pt-2">
              <div className="flex gap-2 mb-6">
                <span className="bg-[#6b4c3a] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                  {product.category || "FURNITURE"}
                </span>
                {product.material && (
                  <span className="bg-[#6b4c3a] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                    {product.material}
                  </span>
                )}
                {product.inStock === false && (
                  <span className="bg-amber-700 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                    MADE TO ORDER
                  </span>
                )}
              </div>
              
              <h1 className="font-headline text-4xl md:text-6xl text-on-surface mb-4 leading-tight">
                {product.name}
              </h1>
              
              <p className="font-body text-sm text-on-surface-variant mb-4 uppercase tracking-widest">
                Built for daily use. Designed to last.
              </p>
              <div className="flex items-center justify-between gap-4 mb-6">
                <p className="font-body text-sm text-on-surface-variant uppercase tracking-[0.2em]">
                  Bespoke Handcrafted Piece
                </p>
                <button 
                  onClick={() => {
                    wishlistService.toggle(product)
                    setIsWishlisted(!isWishlisted)
                    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
                  }}
                  className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all ${
                    isWishlisted 
                    ? 'bg-primary text-on-primary border-primary' 
                    : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isWishlisted ? 'fill-1' : ''}`} style={{fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0"}}>
                    favorite
                  </span>
                </button>
              </div>

              <div className="bg-surface-container-low p-8 rounded-lg mb-6 space-y-5">
                {product.dimensions && (
                  <div>
                    <h3 className="font-body text-xs text-on-surface-variant uppercase tracking-widest mb-2">Dimensions</h3>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                      {product.dimensions}
                    </p>
                  </div>
                )}
                {product.finishOptions && (
                  <div>
                    <h3 className="font-body text-xs text-on-surface-variant uppercase tracking-widest mb-2">Finish Options</h3>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                      {product.finishOptions}
                    </p>
                  </div>
                )}
                {product.leadTime && (
                  <div>
                    <h3 className="font-body text-xs text-on-surface-variant uppercase tracking-widest mb-2">Lead Time</h3>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                      {product.leadTime}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-body text-xs text-on-surface-variant uppercase tracking-widest mb-2">Description</h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    {product.description || 'Premium-grade wood, hand-finished for durability and texture.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-10">
                <a href={buildWhatsAppUrl(whatsappNumber, product.name)} target="_blank" rel="noreferrer" className="w-full bg-[#1a362d] hover:bg-[#122620] text-white py-4 rounded-lg flex items-center justify-center gap-3 transition-colors text-sm font-semibold tracking-wide">
                  Inquire via WhatsApp
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
                <Link to="/order" className="w-full bg-[#855a3c] hover:bg-[#6b4a31] text-white py-4 rounded-lg flex items-center justify-center gap-3 transition-colors text-sm font-semibold tracking-wide">
                  Request Customization <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              {/* Fulfillment details will be driven by data model */}
            </div>

          </div>
        </div>
      </main>

      {/* Related Masterpieces */}
      {related.length > 0 && (
        <section className="bg-surface-container py-16 md:py-24">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
            <div className="flex justify-between items-end mb-12">
              <h2 className="font-headline text-3xl md:text-4xl text-on-surface">Related Masterpieces</h2>
              <Link to="/gallery" className="text-sm font-medium text-[#855a3c] hover:text-[#6b4a31] transition-colors">
                View All Collections
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map(p => (
                <Link key={p.id} to={`/products/${p.id}`} className="bg-white p-6 shadow-sm group cursor-pointer flex flex-col items-center">
                  <div className="w-full h-64 mb-6 flex items-center justify-center overflow-hidden">
                    <img 
                      src={p.imageUrl || "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
                      alt={p.name} 
                      className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="w-full text-center">
                    <h3 className="font-headline text-xl text-on-surface mb-2 group-hover:text-[#855a3c] transition-colors">{p.name}</h3>
                    <p className="text-on-surface-variant text-xs uppercase tracking-widest">{p.category || 'Collection'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </>
  )
}

export default ProductDetailPage
