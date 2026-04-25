import api from './api'

export const productService = {

  getAll: async (category = null, keyword = null, page = 0, size = 10) => {
    const params = { page, size }
    if (category && category !== 'ALL') params.category = category
    if (keyword) params.keyword = keyword
    
    const response = await api.get('/products', { params })
    return response.data.data // This is the PageResponse object
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data.data
  },

  search: async (keyword) => {
    const response = await api.get('/products/search', { params: { q: keyword } })
    return response.data.data
  },

  create: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data.data
  },

  update: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData)
    return response.data.data
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },

  toggle: async (id) => {
    const response = await api.patch(`/products/${id}/toggle`)
    return response.data.data
  },
}