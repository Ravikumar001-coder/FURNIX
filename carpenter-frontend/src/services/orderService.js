import api from './api'

export const orderService = {

  // Public: customer submits inquiry
  submit: async (inquiryData) => {
    const response = await api.post('/inquiries', inquiryData)
    return response.data
  },

  getMyInquiries: async (page = 0, size = 10) => {
    const response = await api.get(`/inquiries/my-inquiries?page=${page}&size=${size}`)
    return response.data.data
  },

  getMyInquiryById: async (id) => {
    const response = await api.get(`/inquiries/my-inquiries/${id}`)
    return response.data.data
  },

  // Admin: get all inquiries
  getAll: async (status = null, keyword = null, page = 0, size = 10) => {
    const params = { page, size }
    if (status) params.status = status
    if (keyword) params.keyword = keyword
    
    const response = await api.get('/inquiries', { params })
    return response.data.data // This is the PageResponse object
  },

  // Admin: get single inquiry
  getById: async (id) => {
    const response = await api.get(`/inquiries/${id}`)
    return response.data.data
  },

  // Admin: update inquiry status
  updateStatus: async (id, status, adminNotes = null) => {
    const payload = { status }
    if (adminNotes !== null && adminNotes !== '') {
      payload.adminNotes = adminNotes
    }
    const response = await api.put(`/inquiries/${id}/status`, payload)
    return response.data.data
  },

  // Admin: get dashboard stats
  getStats: async () => {
    const response = await api.get('/admin/dashboard')
    return response.data.data
  },

  // Admin: delete inquiry
  delete: async (id) => {
    const response = await api.delete(`/inquiries/${id}`)
    return response.data
  },

  // Draft Management
  saveDraft: async (draftData) => {
    const response = await api.post('/inquiries/draft', draftData)
    return response.data
  },

  getDraft: async () => {
    const response = await api.get('/inquiries/draft')
    return response.data.data
  },

  deleteDraft: async () => {
    const response = await api.delete('/inquiries/draft')
    return response.data
  },
}