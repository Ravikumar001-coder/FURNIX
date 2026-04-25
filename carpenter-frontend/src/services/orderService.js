import api from './api'

export const orderService = {

  // Public: customer submits order
  submit: async (orderData) => {
    const response = await api.post('/orders', orderData, {
      headers: {
        'Idempotency-Key': Date.now().toString() + Math.random().toString()
      }
    })
    return response.data
  },

  getMyOrders: async (page = 0, size = 10) => {
    const response = await api.get(`/orders/my-orders?page=${page}&size=${size}`)
    return response.data.data
  },

  // Admin: get all orders
  getAll: async (status = null, keyword = null, page = 0, size = 10) => {
    const params = { page, size }
    if (status) params.status = status
    if (keyword) params.keyword = keyword
    
    const response = await api.get('/orders', { params })
    return response.data.data // This is the PageResponse object
  },

  // Admin: get single order
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response.data.data
  },

  // Admin: update order status
  updateStatus: async (id, status, adminNotes = null) => {
    const payload = { status }
    if (adminNotes !== null && adminNotes !== '') {
      payload.adminNotes = adminNotes
    }
    const response = await api.put(`/orders/${id}/status`, payload)
    return response.data.data
  },

  // Admin: delete order
  delete: async (id) => {
    const response = await api.delete(`/orders/${id}`)
    return response.data
  },

  // Admin: dashboard stats
  getStats: async () => {
    const response = await api.get('/admin/dashboard')
    return response.data.data
  },
}