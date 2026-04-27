import api from './api'

export const quoteService = {
  create: async (quoteData) => {
    const response = await api.post('/quotes', quoteData)
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/quotes/${id}`)
    return response.data
  },

  getByInquiryId: async (inquiryId) => {
    const response = await api.get(`/quotes/inquiry/${inquiryId}`)
    return response.data
  },

  update: async (id, quoteData) => {
    const response = await api.put(`/quotes/${id}`, quoteData)
    return response.data
  },

  send: async (id) => {
    const response = await api.post(`/quotes/${id}/send`)
    return response.data
  }
}
