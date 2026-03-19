import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  getUnreadNotifications,
  getUserNotifications,
  markNotificationRead,
} from '../api/api'

const consumerNavItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Usage', path: '/usage' },
  { label: 'Request Logs', path: '/request-logs' },
  { label: 'API Catalog', path: '/apis' },
  { label: 'Subscriptions', path: '/subscriptions' },
  { label: 'API Keys', path: '/api-keys' },
  { label: 'API Tester', path: '/tester' },
]

const providerNavItems = [
  { label: 'Dashboard', path: '/provider/dashboard' },
  { label: 'My APIs', path: '/provider/apis' },
  { label: 'Create API', path: '/provider/create' },
  { label: 'Analytics', path: '/provider/analytics' },
  { label: 'Health Monitor', path: '/provider/health' },
]

const pageTitles = {
  '/dashboard': { eyebrow: 'Dashboard', title: 'Control & Notifications' },
  '/apis': { eyebrow: 'Catalog', title: 'API Portfolio' },
  '/api-keys': { eyebrow: 'Access', title: 'Key Management' },
  '/subscriptions': { eyebrow: 'Plans', title: 'Subscriptions' },
  '/tester': { eyebrow: 'Testing', title: 'API Tester' },
  '/analytics': { eyebrow: 'Insights', title: 'Traffic Analytics' },
  '/usage': { eyebrow: 'Insights', title: 'Usage Tracking' },
  '/request-logs': { eyebrow: 'Insights', title: 'Request Logs' },
  '/alerts': { eyebrow: 'Signals', title: 'Alerts Center' },
  '/settings': { eyebrow: 'System', title: 'Gateway Settings' },
  '/provider/dashboard': { eyebrow: 'Publisher', title: 'API Provider Dashboard' },
  '/provider/apis': { eyebrow: 'Publisher', title: 'My APIs' },
  '/provider/create': { eyebrow: 'Publisher', title: 'Create API' },
  '/provider/analytics': { eyebrow: 'Publisher', title: 'API Analytics' },
  '/provider/health': { eyebrow: 'Publisher', title: 'Health Monitor' },
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const userId = localStorage.getItem('userId')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('role')
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('token')
    setNotifications([])
    setUnreadCount(0)
    navigate('/login', { replace: true })
  }

  const header = useMemo(() => {
    if (location.pathname.startsWith('/apis/')) {
      return { eyebrow: 'Catalog', title: 'API Details' }
    }
    return pageTitles[location.pathname] || pageTitles['/dashboard']
  }, [location.pathname])

  const navItems = role === 'API_PROVIDER' ? providerNavItems : consumerNavItems

  const loadNotifications = async () => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    try {
      const [all, unread] = await Promise.all([
        getUserNotifications(userId),
        getUnreadNotifications(userId),
      ])
      const sorted = [...all].sort((left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      setNotifications(sorted)
      setUnreadCount(unread.length)
    } catch (error) {
      console.error('Failed to load notifications', error)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const handleToggleNotifications = async () => {
    const next = !showNotifications
    setShowNotifications(next)
    if (next) {
      await loadNotifications()
    }
  }

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId)
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read', error)
    }
  }


  return (
    <div className="min-h-screen text-ink-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="bg-ink-900 text-fog-50 lg:w-64">
          <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-mint-400 to-signal-400" />
            <div>
              <p className="font-display text-lg font-semibold">Smart Control</p>
              <p className="text-xs text-fog-200">Gateway Console</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2 px-4 py-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive ? 'bg-white/15 text-fog-50' : 'text-fog-100 hover:bg-white/10'
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-xs text-fog-200">{item.label === 'Alerts' ? '6' : ''}</span>
              </NavLink>
            ))}
          </nav>
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-white/10 p-4 text-xs text-fog-100">
              <p className="font-semibold text-fog-50">Control Plane</p>
              <p className="mt-2">Region: ap-south-1</p>
              <p>Cluster: smart-gw-02</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-left text-xs font-semibold text-fog-50 transition hover:bg-white/10"
            >
              <span>Logout</span>
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 px-6 py-6 lg:px-10">
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-600">{header.eyebrow}</p>
              <h1 className="font-display text-3xl font-semibold text-ink-900">{header.title}</h1>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-fog-100 bg-white shadow-sm transition hover:bg-fog-50"
                aria-label="Notifications"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5 text-ink-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 18h-4m8-6V9a6 6 0 10-12 0v3l-2 2v1h16v-1l-2-2z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-signal-400 px-1 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-20 mt-3 w-80 overflow-hidden rounded-2xl border border-fog-100 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-fog-100 px-4 py-3">
                    <p className="text-sm font-semibold text-ink-900">Notifications</p>
                    <span className="text-xs text-ink-500">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-ink-500">
                        No notifications yet.
                      </div>
                    )}
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleMarkRead(item.id)}
                        className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition hover:bg-fog-50 ${
                          item.read ? 'text-ink-700' : 'bg-mint-400/10 text-ink-900'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-[0.2em] text-ink-400">
                          {item.type}
                        </span>
                        <span className="text-sm text-ink-800">{item.message}</span>
                        <span className="text-[10px] text-ink-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
