const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

export const getStoredApiKey = () => localStorage.getItem("scs_api_key") || ""

export const apiFetch = async (path, options = {}) => {
  const apiKey = getStoredApiKey()
  const headers = {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-API-KEY": apiKey } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
