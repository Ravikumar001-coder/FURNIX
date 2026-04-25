import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="text-on-surface-variant font-body">Loading product...</div>
      </div>
    )
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex selection:bg-primary selection:text-on-primary">
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f5f3ee] shadow-[40px_0_60px_-15px_rgba(27,28,25,0.04)] flex flex-col p-6 gap-2 z-50">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0">
            <img
              alt="Admin Avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNI2-qFyIUseGo6az5SBv3QrRJNda_XVJiAxsRM8Y1JkVvbPfNFMRkUrARjYjj9eW5bSJFKHliNy5dgI-bKTWGkn9YJAqilUp0TdwtEHky4nAQdcnmaMWOjo6xq5c9zTcHFANI6-PEd8n5BrtgV3Nuz72OO8xy6d3J2KWtczx3jUxysB24oOKyuZWfvdYSs4hq15RDD4RIIFPajIYgoSIzAHoTpTEQ7D06PoLCb1G-2NavdqN571f27ogrchbK1gjqcMvVE3M8i8k"
            />
          </div>
          <div>
            <h2 className="font-headline text-[#173028] font-bold text-lg leading-tight tracking-tight">Furnix Admin</h2>
            <p className="font-body text-sm font-medium text-stone-500">Master Workshop</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-3 text-stone-500 px-4 py-3 hover:bg-stone-200/50 rounded-xl transition-all font-body text-sm font-medium text-left">
            <span className="material-symbols-outlined">dashboard</span>
            Overview
          </button>
          <button onClick={() => navigate('/admin/products')} className="flex items-center gap-3 bg-[#ffffff] text-[#173028] rounded-xl px-4 py-3 shadow-sm font-body text-sm font-medium text-left">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>weekend</span>
            Catalog
          </button>
          <button className="flex items-center gap-3 text-stone-500 px-4 py-3 hover:bg-stone-200/50 rounded-xl transition-all font-body text-sm font-medium text-left">
            <span className="material-symbols-outlined">handyman</span>
            Craftsmen
          </button>
          <button className="flex items-center gap-3 text-stone-500 px-4 py-3 hover:bg-stone-200/50 rounded-xl transition-all font-body text-sm font-medium text-left">
            <span className="material-symbols-outlined">texture</span>
            Materials
          </button>
          <button className="flex items-center gap-3 text-stone-500 px-4 py-3 hover:bg-stone-200/50 rounded-xl transition-all font-body text-sm font-medium text-left">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
        </nav>

        <div className="mt-auto">
          <button
            onClick={() => navigate('/admin/products/new')}
            className="w-full bg-primary text-on-primary font-body text-sm font-medium py-3 px-4 rounded-xl hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            New Product
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-12 lg:p-16 max-w-5xl mx-auto w-full">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <p className="font-body text-sm font-medium text-on-surface-variant mb-2 tracking-wide uppercase">
              Catalog / New Entry
            </p>
            <h1 className="font-headline text-4xl lg:text-5xl text-primary tracking-tight">Add New Product</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="px-6 py-3 font-body font-medium text-secondary hover:text-tertiary transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={loading || uploading}
              className="px-6 py-3 bg-primary text-on-primary font-body font-medium rounded-xl hover:bg-primary-container shadow-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </header>

        <form id="product-form" onSubmit={handleSubmit} className="space-y-12">
          <section className="bg-surface-container-low p-8 lg:p-10 rounded-2xl relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-surface-container-lowest opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl z-0 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="font-headline text-2xl text-primary mb-8 tracking-tight flex items-center gap-3">
                <span className="text-secondary opacity-50">01</span> Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="product-name">Product Name</label>
                  <input
                    id="product-name"
                    name="product-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g., The Windsor Lounge Chair"
                    className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors placeholder:text-on-surface-variant/50"
                  />
                  {errors.name && <p className="text-error text-sm mt-2">{errors.name}</p>}
                </div>

                <div>
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="category">Category</label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors appearance-none pr-12"
                    >
                      <option value="" disabled>Select a category</option>
                      {CATEGORIES.filter((cat) => cat.value !== 'ALL').map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                  {errors.category && <p className="text-error text-sm mt-2">{errors.category}</p>}
                </div>

                <div>
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="price">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-body">$</span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface-container-high border-none text-on-surface font-body text-base pl-10 pr-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors placeholder:text-on-surface-variant/50"
                    />
                  </div>
                  {errors.price && <p className="text-error text-sm mt-2">{errors.price}</p>}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-low p-8 lg:p-10 rounded-2xl relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-surface-container-lowest opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl z-0 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="font-headline text-2xl text-primary mb-8 tracking-tight flex items-center gap-3">
                <span className="text-secondary opacity-50">02</span> Product Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="material">Material</label>
                  <input
                    id="material"
                    type="text"
                    value={form.material}
                    onChange={(e) => set('material', e.target.value)}
                    placeholder="e.g., Solid Walnut / White Oak"
                    className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="dimensions">Dimensions</label>
                  <input
                    id="dimensions"
                    type="text"
                    value={form.dimensions}
                    onChange={(e) => set('dimensions', e.target.value)}
                    placeholder="e.g., 180cm x 90cm x 75cm"
                    className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="leadTime">Lead Time</label>
                  <input
                    id="leadTime"
                    type="text"
                    value={form.leadTime}
                    onChange={(e) => set('leadTime', e.target.value)}
                    placeholder="e.g., 4-6 weeks"
                    className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="finishOptions">Finish Options</label>
                  <input
                    id="finishOptions"
                    type="text"
                    value={form.finishOptions}
                    onChange={(e) => set('finishOptions', e.target.value)}
                    placeholder="e.g., Natural Oil / Matte Lacquer"
                    className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block font-headline text-lg text-primary mb-3" htmlFor="description">Detailed Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe the materials, craftsmanship, and aesthetic of the piece..."
                  className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors placeholder:text-on-surface-variant/50 resize-y"
                ></textarea>
                {errors.description && <p className="text-error text-sm mt-2">{errors.description}</p>}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <section className="md:col-span-2 bg-surface-container-low p-8 lg:p-10 rounded-2xl relative overflow-hidden group transition-all duration-300">
              <div className="absolute inset-0 bg-surface-container-lowest opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl z-0 pointer-events-none"></div>
              <div className="relative z-10 h-full flex flex-col">
                <h2 className="font-headline text-2xl text-primary mb-8 tracking-tight flex items-center gap-3">
                  <span className="text-secondary opacity-50">03</span> Media Gallery
                </h2>
                <label className="flex-1 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-high/50 flex flex-col items-center justify-center p-12 text-center hover:bg-surface-container-high transition-colors cursor-pointer group/upload">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover/upload:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-secondary">add_photo_alternate</span>
                  </div>
                  <p className="font-headline text-lg text-primary mb-2">Upload Product Photography</p>
                  <p className="font-body text-sm text-on-surface-variant max-w-xs mx-auto">Drag and drop high-resolution images here, or click to browse. Ensure deep shadows and natural lighting.</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <div className="mt-6">
                  <label className="block font-headline text-lg text-primary mb-3" htmlFor="arModelUrl">AR Model URL (.glb format)</label>
                  <input
                    id="arModelUrl"
                    name="arModelUrl"
                    type="text"
                    value={form.arModelUrl}
                    onChange={(e) => set('arModelUrl', e.target.value)}
                    placeholder="https://example.com/model.glb"
                    className="w-full bg-surface-container-high border-none text-on-surface font-body text-base px-5 py-4 rounded-sm focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-colors placeholder:text-on-surface-variant/50"
                  />
                  <p className="text-xs text-on-surface-variant mt-2">Provide a direct link to a 3D model to enable AR preview.</p>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-low p-8 lg:p-10 rounded-2xl relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
              <div className="absolute inset-0 bg-surface-container-lowest opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-2xl z-0 pointer-events-none"></div>
              <div className="relative z-10 space-y-6">
                <h2 className="font-headline text-2xl text-primary mb-8 tracking-tight flex items-center gap-3">
                  <span className="text-secondary opacity-50">04</span> Status
                </h2>
                <div className="flex items-center justify-between p-5 bg-surface-container-high rounded-xl">
                  <div>
                    <p className="font-headline text-lg text-primary">In Stock</p>
                    <p className="font-body text-sm text-on-surface-variant mt-1">Available for order</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => set('inStock', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-outline-variant/50 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-5 bg-surface-container-high rounded-xl">
                  <div>
                    <p className="font-headline text-lg text-primary">Publicly Visible</p>
                    <p className="font-body text-sm text-on-surface-variant mt-1">Show on storefront</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => set('active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-outline-variant/50 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {apiError && (
            <div className="text-error bg-error-container px-4 py-3 rounded-lg font-body text-sm">
              {apiError}
            </div>
          )}

          <div className="sm:hidden flex flex-col gap-4 mt-8 pt-8 border-t border-outline-variant/20">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full px-6 py-4 bg-primary text-on-primary font-body font-medium rounded-xl hover:bg-primary-container shadow-sm transition-colors text-lg disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="w-full px-6 py-4 font-body font-medium text-secondary hover:text-tertiary transition-colors text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default ProductFormPage