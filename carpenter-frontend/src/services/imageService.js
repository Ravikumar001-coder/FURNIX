import api from './api'

export const imageService = {

  upload: async (file, folder = 'products') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data.imageUrl
  },
}