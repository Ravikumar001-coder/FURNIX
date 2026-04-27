import api from './api'

export const projectService = {
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`)
    return response.data.data
  },

  getByQuoteId: async (quoteId) => {
    const response = await api.get(`/projects/quote/${quoteId}`)
    return response.data.data
  },

  getByInquiryId: async (inquiryId) => {
    const response = await api.get(`/projects/inquiry/${inquiryId}`)
    return response.data.data
  }
}
