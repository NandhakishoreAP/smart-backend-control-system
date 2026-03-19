import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('authToken')
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

export const getApiDetails = async (slug, version) => {
  const path = version ? `/apis/${slug}/${version}` : `/apis/${slug}`
  const response = await api.get(path)
  return response.data
}

export const getApiVersions = async (slug) => {
  const response = await api.get(`/apis/${slug}/versions`)
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

export const getConsumerDashboard = async (apiKey) => {
  const response = await api.get('/analytics/consumer-dashboard', {
    params: { apiKey },
  })
  return response.data
}

export const getConsumerEndpointStats = async (apiKey) => {
  const response = await api.get('/analytics/consumer-endpoints', {
    params: { apiKey },
  })
  return response.data
}

export const getUsageByUser = async (userId) => {
  const response = await api.get(`/analytics/usage/${encodeURIComponent(userId)}`)
  return response.data
}

export const getRequestLogsByUser = async (userId) => {
  const response = await api.get(`/analytics/logs/${encodeURIComponent(userId)}`)
  return response.data
}

export const getProviderApis = async (userId) => {
  const response = await api.get(`/api-management/provider/${encodeURIComponent(userId)}`)
  return response.data
}

export const getProviderApiById = async (apiId) => {
  const response = await api.get(`/api-management/${apiId}`)
  return response.data
}

export const updateProviderApi = async (apiId, payload) => {
  const response = await api.put(`/api-management/${apiId}`, payload)
  return response.data
}

export const toggleProviderApi = async (apiId) => {
  const response = await api.put(`/api-management/${apiId}/toggle`)
  return response.data
}

export const deleteProviderApi = async (apiId) => {
  const response = await api.delete(`/api-management/${apiId}`)
  return response.data
}

export const deleteProviderApiBySlug = async (slug, version) => {
  const response = await api.delete(`/api-management/slug/${slug}/${version}`)
  return response.data
}

export const createProviderApi = async (payload) => {
  const response = await api.post('/api-management/provider/apis', payload)
  return response.data
}

export const getProviderAnalytics = async () => {
  const response = await api.get('/api-management/provider/analytics')
  return response.data
}

export const getProviderAnalyticsByUser = async (userId) => {
  const response = await api.get(`/analytics/provider/${encodeURIComponent(userId)}`)
  return response.data
}

export const getProviderHealthByUser = async (userId) => {
  const response = await api.get(`/api-management/health/provider/${encodeURIComponent(userId)}`)
  return response.data
}

export const registerUser = async (payload) => {
  const response = await api.post('/api/users/register', payload)
  return response.data
}

export const loginUser = async (payload) => {
  const response = await api.post('/api/users/login', payload)
  return response.data
}

export const getUserNotifications = async (userId) => {
  const response = await api.get(`/notifications/${encodeURIComponent(userId)}`)
  return response.data
}

export const getUnreadNotifications = async (userId) => {
  const response = await api.get(`/notifications/${encodeURIComponent(userId)}`)
  return response.data.filter((item) => !item.read)
}

export const markNotificationRead = async (id) => {
  const response = await api.post(`/notifications/read/${id}`)
  return response.data
}

export default api
