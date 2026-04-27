import api from './api'

export const galleryService = {
  getAll: async ({ category, roomType, material, page = 0, size = 24 } = {}) => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (roomType) params.append('roomType', roomType)
    if (material) params.append('material', material)
    params.append('page', page)
    params.append('size', size)
    const response = await api.get(`/gallery?${params.toString()}`)
    return response.data.data
  },

  getFeatured: async () => {
    const response = await api.get('/gallery/featured')
    return response.data.data
  },

  getById: async (id) => {
    const response = await api.get(`/gallery/${id}`)
    return response.data.data
  },

  create: async (data) => {
    const response = await api.post('/gallery', data)
    return response.data.data
  },

  update: async (id, data) => {
    const response = await api.put(`/gallery/${id}`, data)
    return response.data.data
  },

  delete: async (id) => {
    await api.delete(`/gallery/${id}`)
  }
}
