import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  const apiKey = localStorage.getItem('apiKey')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (apiKey) {
    config.headers['X-API-KEY'] = apiKey
  }

  return config
})

export const getApiKeys = async () => {
  const response = await api.get('/api-keys')
  return response.data
}

export const createApiKey = async (userId) => {
  const response = await api.post('/api-keys', null, {
    params: { userId },
  })
  return response.data
}

export const deleteApiKey = async (id) => {
  const response = await api.delete(`/api-keys/${id}`)
  return response.data
}

export const getApis = async () => {
  const response = await api.get('/apis/marketplace')
  return response.data
}

export const getApiDetails = async (slug) => {
  const response = await api.get(`/apis/${slug}`)
  return response.data
}

export const getSubscriptions = async (userId) => {
  const response = await api.get(`/subscriptions/user/${encodeURIComponent(userId)}`)
  return response.data
}

export const subscribeToApi = async (userId, apiId) => {
  const response = await api.post('/subscriptions/subscribe', null, {
    params: { userId, apiId },
  })
  return response.data
}

export const unsubscribeFromApi = async (subscriptionId) => {
  const response = await api.delete(`/subscriptions/${subscriptionId}`)
  return response.data
}

export const getDashboardAnalytics = async () => {
  const response = await api.get('/analytics/dashboard')
  return response.data
}

export default api
