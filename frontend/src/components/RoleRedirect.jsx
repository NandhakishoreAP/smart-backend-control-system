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

function RoleRedirect() {
  const role = normalizeRole(localStorage.getItem('role'))
  const target = role === 'API_PROVIDER' ? '/provider/dashboard' : '/dashboard'
  return <Navigate to={target} replace />
}

export default RoleRedirect
