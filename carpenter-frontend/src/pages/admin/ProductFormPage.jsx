import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import { productService } from '../../services/productService'
import { CATEGORIES } from '../../utils/constants'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category: 'CHAIR',
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
  const isEditMode = Boolean(id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const categoryOptions = useMemo(
    () => CATEGORIES.filter((category) => category.value !== 'ALL'),
    []
  )

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    const loadProduct = async () => {
      setLoading(true)
      setError('')
      try {
        const product = await productService.getById(id)
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: product.price ?? '',
          category: product.category || 'CHAIR',
          imageUrl: product.imageUrl || '',
          arModelUrl: product.arModelUrl || '',
          material: product.material || '',
          dimensions: product.dimensions || '',
          finishOptions: product.finishOptions || '',
          leadTime: product.leadTime || '',
          inStock: product.inStock ?? true,
          active: product.active ?? true,
        })
      } catch (err) {
        setError('Failed to load product details')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id, isEditMode])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        price: Number.parseFloat(form.price),
      }

      if (Number.isNaN(payload.price)) {
        throw new Error('Please enter a valid price')
      }

      if (isEditMode) {
        await productService.update(id, payload)
        toast.success('Product updated successfully')
      } else {
        await productService.create(payload)
        toast.success('Product created successfully')
      }

      navigate('/admin/products')
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to save product'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="font-headline text-3xl text-on-surface mb-2">
            {isEditMode ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="font-body text-on-surface-variant">
            Manage real catalog data instead of placeholder content.
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse bg-surface-container-low h-80 rounded-2xl" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20">
            {error && (
              <div className="flex items-center gap-3 bg-error-container text-on-error-container px-4 py-3 rounded-lg font-body text-sm">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <label className="block">
                <span className="block text-sm font-medium text-on-surface mb-2">Product Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-on-surface mb-2">Category</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                  required
                >
                  {categoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-medium text-on-surface mb-2">Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-on-surface mb-2">Price</span>
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-on-surface mb-2">Lead Time</span>
                <input
                  name="leadTime"
                  value={form.leadTime}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-on-surface mb-2">Material</span>
                <input
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-on-surface mb-2">Dimensions</span>
                <input
                  name="dimensions"
                  value={form.dimensions}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-medium text-on-surface mb-2">Finish Options</span>
                <input
                  name="finishOptions"
                  value={form.finishOptions}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-medium text-on-surface mb-2">Image URL</span>
                <input
                  name="imageUrl"
                  type="url"
                  value={form.imageUrl}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-medium text-on-surface mb-2">AR Model URL</span>
                <input
                  name="arModelUrl"
                  type="url"
                  value={form.arModelUrl}
                  onChange={handleChange}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="inline-flex items-center gap-3 text-sm text-on-surface">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={form.inStock}
                  onChange={handleChange}
                />
                In stock
              </label>
              <label className="inline-flex items-center gap-3 text-sm text-on-surface">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Visible to customers
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-medium hover:bg-outline-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-medium hover:bg-primary-container transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  )
}

export default ProductFormPage
