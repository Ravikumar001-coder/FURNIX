import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { productService } from '../../services/productService'
import { imageService } from '../../services/imageService'
import { CATEGORIES } from '../../utils/constants'

const INITIAL = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  arModelUrl: '',
  material: '',
  dimensions: '',
  finishOptions: '',
  leadTime: '',
  inStock: true,
  active: true,
}

const ProductFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchLoad, setFetchLoad] = useState(isEdit)
  const [uploading, setUploading] = useState(false)
  const [imgPreview, setImgPreview] = useState('')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const data = await productService.getById(id)
        setForm({
          name: data.name,
          description: data.description,
          price: data.price.toString(),
          category: data.category,
          imageUrl: data.imageUrl || '',
          arModelUrl: data.arModelUrl || '',
          material: data.material || '',
          dimensions: data.dimensions || '',
          finishOptions: data.finishOptions || '',
          leadTime: data.leadTime || '',
          inStock: data.inStock ?? true,
          active: data.active,
        })
        setImgPreview(data.imageUrl || '')
      } catch (err) {
        setApiError('Failed to load product')
      } finally {
        setFetchLoad(false)
      }
    }
    load()
  }, [id, isEdit])

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setImgPreview(localUrl)

    setUploading(true)
    try {
      const url = await imageService.upload(file, 'products')
      set('imageUrl', url)
      setImgPreview(url)
    } catch (err) {
      setApiError('Image upload failed')
      setImgPreview('')
    } finally {
      setUploading(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim() || form.name.length < 2) errs.name = 'Product name must be at least 2 characters'
    if (!form.description.trim() || form.description.length < 10) errs.description = 'Description must be at least 10 characters'
    if (!form.price || Number.isNaN(Number(form.price)) || parseFloat(form.price) < 0) errs.price = 'Valid price is required'
    if (!form.category) errs.category = 'Category is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
      }

      if (isEdit) {
        await productService.update(id, payload)
      } else {
        await productService.create(payload)
      }

      navigate('/admin/products')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoad) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center gap-3 py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant text-sm">Loading masterpiece details...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="premium-label mb-2">Catalog / {isEdit ? 'Refine Entry' : 'New Collection'}</p>
            <h1 className="font-headline text-4xl lg:text-5xl text-primary tracking-tight">
              {isEdit ? 'Edit Product' : 'Add New Piece'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="px-6 py-3 font-body font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              type="button"
            >
              Discard
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={loading || uploading}
              className="premium-btn-primary min-w-[160px]"
            >
              {loading ? 'Saving...' : 'Publish Piece'}
            </button>
          </div>
        </header>

        <form id="product-form" onSubmit={handleSubmit} className="space-y-12">
          {/* Basic Info */}
          <section className="premium-card p-8 lg:p-10">
            <h2 className="font-headline text-2xl text-primary mb-8 tracking-tight flex items-center gap-3">
              <span className="text-secondary/40 italic">01</span> Essential Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-1 md:col-span-2">
                <label className="premium-label">Piece Title</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g., The Windsor Lounge Chair"
                  className="premium-input"
                />
                {errors.name && <p className="text-error text-xs mt-2 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="premium-label">Category</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="premium-input appearance-none pr-12"
                  >
                    <option value="" disabled>Select category</option>
                    {CATEGORIES.filter((cat) => cat.value !== 'ALL').map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                {errors.category && <p className="text-error text-xs mt-2 font-medium">{errors.category}</p>}
              </div>

              <div>
                <label className="premium-label">Internal Price Reference (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="0.00"
                  className="premium-input"
                />
                {errors.price && <p className="text-error text-xs mt-2 font-medium">{errors.price}</p>}
              </div>
            </div>
          </section>

          {/* Specifications */}
          <section className="premium-card p-8 lg:p-10">
            <h2 className="font-headline text-2xl text-primary mb-8 tracking-tight flex items-center gap-3">
              <span className="text-secondary/40 italic">02</span> Material & Craft
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="premium-label">Core Material</label>
                <input
                  type="text"
                  value={form.material}
                  onChange={(e) => set('material', e.target.value)}
                  placeholder="e.g., Solid Walnut / White Oak"
                  className="premium-input"
                />
              </div>
              <div>
                <label className="premium-label">Dimensions</label>
                <input
                  type="text"
                  value={form.dimensions}
                  onChange={(e) => set('dimensions', e.target.value)}
                  placeholder="e.g., 180cm x 90cm x 75cm"
                  className="premium-input"
                />
              </div>
              <div>
                <label className="premium-label">Estimated Lead Time</label>
                <input
                  type="text"
                  value={form.leadTime}
                  onChange={(e) => set('leadTime', e.target.value)}
                  placeholder="e.g., 4-6 weeks"
                  className="premium-input"
                />
              </div>
              <div>
                <label className="premium-label">Available Finishes</label>
                <input
                  type="text"
                  value={form.finishOptions}
                  onChange={(e) => set('finishOptions', e.target.value)}
                  placeholder="e.g., Natural Oil / Matte Lacquer"
                  className="premium-input"
                />
              </div>
            </div>
            <div>
              <label className="premium-label">Narrative Description</label>
              <textarea
                rows="6"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the craftsmanship, jointure, and aesthetic vision..."
                className="premium-input min-h-[150px] resize-none"
              ></textarea>
              {errors.description && <p className="text-error text-xs mt-2 font-medium">{errors.description}</p>}
            </div>
          </section>

          {/* Media & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <section className="md:col-span-2 premium-card p-8">
              <h2 className="font-headline text-2xl text-primary mb-8 tracking-tight flex items-center gap-3">
                <span className="text-secondary/40 italic">03</span> Imagery & AR
              </h2>
              <div className="space-y-6">
                <label className="block border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/30 hover:bg-surface-container-low transition-colors cursor-pointer p-10 text-center group">
                  {imgPreview ? (
                    <div className="relative aspect-video max-h-48 mx-auto rounded-lg overflow-hidden shadow-md">
                      <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className="material-symbols-outlined text-4xl text-primary/40 group-hover:text-primary transition-colors">add_photo_alternate</span>
                      <p className="font-body text-sm text-on-surface-variant">Upload studio photography</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                <div>
                  <label className="premium-label">AR Model Link (.glb)</label>
                  <input
                    type="text"
                    value={form.arModelUrl}
                    onChange={(e) => set('arModelUrl', e.target.value)}
                    placeholder="https://assets.furnix.com/models/piece.glb"
                    className="premium-input"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-2 font-medium uppercase tracking-wider">Direct GLB link for AR interaction</p>
                </div>
              </div>
            </section>

            <section className="premium-card p-8 flex flex-col gap-6">
              <h2 className="font-headline text-2xl text-primary mb-2 tracking-tight flex items-center gap-3">
                <span className="text-secondary/40 italic">04</span> Visibility
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                  <span className="font-body text-sm font-bold text-on-surface">Available</span>
                  <button
                    type="button"
                    onClick={() => set('inStock', !form.inStock)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.inStock ? 'bg-primary' : 'bg-outline-variant/50'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.inStock ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                  <span className="font-body text-sm font-bold text-on-surface">Public</span>
                  <button
                    type="button"
                    onClick={() => set('active', !form.active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active ? 'bg-primary' : 'bg-outline-variant/50'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              
              <div className="mt-auto bg-surface-container/50 p-4 rounded-xl border border-primary/5">
                <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed italic">
                  Drafting a masterpiece requires patience. Ensure all details reflect the brand's commitment to quality.
                </p>
              </div>
            </section>
          </div>

          {apiError && (
            <div className="flex items-center gap-3 bg-error-container text-on-error-container px-4 py-3 rounded-xl font-body text-sm animate-fade-in">
              <span className="material-symbols-outlined text-lg">error</span>
              {apiError}
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  )
}

export default ProductFormPage