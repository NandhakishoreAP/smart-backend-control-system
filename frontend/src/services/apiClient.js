import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
})

apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey')
  if (apiKey) {
    config.headers['X-API-KEY'] = apiKey
  }
  return config
})

export const getApis = async () => {
  const response = await apiClient.get('/apis/marketplace')
  return response.data
}

export const getApiDetails = async (slug) => {
  const response = await apiClient.get(`/apis/${slug}`)
  return response.data
}

export const getApiKeys = async (userId) => {
  const response = await apiClient.get(`/api-keys/${encodeURIComponent(userId)}`)
  return response.data
}

export const createApiKey = async (userId) => {
  const response = await apiClient.post(`/api-keys`, null, {
    params: { userId },
  })
  return response.data
}

export const revokeApiKey = async (id) => {
  const response = await apiClient.delete(`/api-keys/${id}`)
  return response.data
}

export default apiClient
