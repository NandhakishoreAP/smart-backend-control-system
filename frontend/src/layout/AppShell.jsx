import UserProfileModal from '../components/UserProfileModal';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import { ProviderApiProvider } from '../context/ProviderApiContext'
import { PinnedApiProvider } from '../context/PinnedApiContext'
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
  // Always sync userId from JWT on mount
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'))

  // Helper to decode JWT and extract userId
  function decodeJwt(token) {
    if (!token) return null;
    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      return decoded
    } catch (e) {
      return null
    }
  }

  // Always sync userId from JWT and force logout if missing/expired
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      localStorage.clear();
      sessionStorage.clear();
      setUserId(null);
      navigate('/login');
      return;
    }
    const decoded = decodeJwt(token)
    const resolvedUserId = decoded?.userId || decoded?.id || decoded?.user_id || decoded?.sub
    if (!resolvedUserId) {
      localStorage.clear();
      sessionStorage.clear();
      setUserId(null);
      navigate('/login');
      return;
    }
    if (resolvedUserId !== localStorage.getItem('userId')) {
      localStorage.setItem('userId', resolvedUserId)
      setUserId(resolvedUserId)
    }
  }, [navigate])
  // Determine header info based on current path
  const header = pageTitles[location.pathname] || { eyebrow: '', title: '' };
  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
  // Choose nav items based on role
  const navItems = role === 'API_PROVIDER' ? providerNavItems : consumerNavItems;
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  // Ref for dropdown to handle outside click
  const dropdownRef = useRef(null)
  // Ref for notification button to avoid closing when clicking the bell
  const notifBtnRef = useRef(null)
  const loadNotifications = async () => {
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
    if (userId) {
      loadNotifications()
    }
  }, [userId])

  const handleToggleNotifications = async () => {
    const next = !showNotifications
    setShowNotifications(next)
    if (next) {
      await loadNotifications()
    }
  }

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(event.target)
      ) {
        setShowNotifications(false)
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNotifications])

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n => markNotificationRead(n.id))
      )
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark all as read', error)
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
    <PinnedApiProvider>
      <ProviderApiProvider>
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
                <div className="flex items-center gap-4 relative">
                  {/* Notification Icon */}
                  <button
                    type="button"
                    ref={notifBtnRef}
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
                  {/* Profile Avatar Icon */}
                  <button
                    type="button"
                    onClick={() => setShowProfile(true)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-fog-100 bg-white shadow-sm transition hover:bg-fog-50 ml-2"
                    aria-label="Profile"
                  >
                    {/* Replace with user photo if available */}
                    <span className="w-10 h-10 rounded-full bg-fog-100 flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-ink-400">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </span>
                  </button>
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div
                      ref={dropdownRef}
                      className="fixed top-0 left-0 w-screen h-screen z-40 flex items-start justify-end"
                      style={{ pointerEvents: 'none' }}
                    >
                      <div
                        className="mt-24 mr-8 w-96 max-h-[80vh] overflow-y-auto rounded-2xl border border-fog-100 bg-white shadow-lg"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div className="flex items-center justify-between border-b border-fog-100 px-4 py-3 sticky top-0 bg-white z-10">
                          <p className="text-sm font-semibold text-ink-900">Notifications</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-500">{unreadCount} unread</span>
                            <button
                              className="ml-2 px-2 py-1 text-xs rounded bg-fog-100 hover:bg-fog-200 text-ink-700"
                              onClick={handleMarkAllRead}
                              disabled={unreadCount === 0}
                            >
                              Mark all read
                            </button>
                            <button
                              className="ml-2 px-2 py-1 text-xs rounded bg-fog-100 hover:bg-fog-200 text-ink-700"
                              onClick={() => setShowNotifications(false)}
                              aria-label="Close notifications"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 56px)' }}>
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
                    </div>
                  )}
                  {/* Profile Modal */}
                  {showProfile && (
                    <UserProfileModal
                      open={showProfile}
                      onClose={() => setShowProfile(false)}
                      userId={userId}
                      role={role}
                    />
                  )}
                </div>
              </header>
              <Outlet />
            </main>
          </div>
        </div>
      </ProviderApiProvider>
    </PinnedApiProvider>
  )
}

export default AppShell
