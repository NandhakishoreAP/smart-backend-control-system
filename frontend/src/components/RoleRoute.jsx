import { Navigate } from 'react-router-dom'

function normalizeRole(value) {
  if (!value) {
    return ''
  }
  const normalized = value.replace(/^ROLE_/, '').toUpperCase()
  if (normalized === 'API_USER') {
    return 'API_CONSUMER'
  }
  return normalized
}

function RoleRoute({ role, children }) {
  const storedRole = normalizeRole(localStorage.getItem('role'))

  if (!storedRole) {
    return <Navigate to="/login" replace />
  }

  if (storedRole !== role) {
    const redirectTo = storedRole === 'API_PROVIDER' ? '/provider/dashboard' : '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default RoleRoute
