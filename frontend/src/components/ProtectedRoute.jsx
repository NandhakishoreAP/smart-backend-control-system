import { Navigate, useLocation } from 'react-router-dom'

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token')

const isTokenExpired = (token) => {
  try {
    const payload = token.split('.')[1]
    if (!payload) {
      return false
    }
    const decoded = JSON.parse(atob(payload))
    if (!decoded?.exp) {
      return false
    }
    return Date.now() >= decoded.exp * 1000
  } catch (err) {
    return false
  }
}

const clearSession = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('role')
}

function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isTokenExpired(token)) {
    clearSession()
    return <Navigate to="/login" replace state={{ from: location, reason: 'expired' }} />
  }

  return children
}

export default ProtectedRoute
