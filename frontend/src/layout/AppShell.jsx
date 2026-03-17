import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const navItems = [
  { label: 'Overview', path: '/' },
  { label: 'APIs', path: '/apis' },
  { label: 'API Keys', path: '/api-keys' },
  { label: 'Subscriptions', path: '/subscriptions' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Settings', path: '/settings' },
]

const pageTitles = {
  '/': { eyebrow: 'Dashboard', title: 'Control & Notifications' },
  '/apis': { eyebrow: 'Catalog', title: 'API Portfolio' },
  '/api-keys': { eyebrow: 'Access', title: 'Key Management' },
  '/subscriptions': { eyebrow: 'Plans', title: 'Subscriptions' },
  '/analytics': { eyebrow: 'Insights', title: 'Traffic Analytics' },
  '/alerts': { eyebrow: 'Signals', title: 'Alerts Center' },
  '/settings': { eyebrow: 'System', title: 'Gateway Settings' },
}

function AppShell() {
  const location = useLocation()
  const [apiKey, setApiKey] = useState('')
  const [showCopied, setShowCopied] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [savedVisible, setSavedVisible] = useState(false)

  useEffect(() => {
    const storedPrimary = localStorage.getItem('apiKey')
    const storedLegacy = localStorage.getItem('scs_api_key')
    if (storedPrimary) {
      setApiKey(storedPrimary)
      return
    }
    if (storedLegacy) {
      localStorage.setItem('apiKey', storedLegacy)
      localStorage.removeItem('scs_api_key')
      setApiKey(storedLegacy)
    }
  }, [])

  const handleSaveKey = () => {
    const trimmed = apiKey.trim()
    localStorage.setItem('apiKey', trimmed)
    localStorage.removeItem('scs_api_key')
    setApiKey(trimmed)
    setShowSaved(true)
    setSavedVisible(true)
    window.setTimeout(() => setSavedVisible(false), 1400)
    window.setTimeout(() => setShowSaved(false), 1800)
  }

  const handleCopyHeader = async () => {
    const value = `X-API-KEY: ${apiKey.trim() || '<your-key>'}`
    try {
      await navigator.clipboard.writeText(value)
      setShowCopied(true)
      setToastVisible(true)
      window.setTimeout(() => setToastVisible(false), 1400)
      window.setTimeout(() => setShowCopied(false), 1800)
    } catch (err) {
      console.error('Failed to copy header', err)
    }
  }

  const header = useMemo(() => {
    if (location.pathname.startsWith('/apis/')) {
      return { eyebrow: 'Catalog', title: 'API Details' }
    }
    return pageTitles[location.pathname] || pageTitles['/']
  }, [location.pathname])

  const showMissingKey = localStorage.getItem('apiKey')?.trim().length === 0

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
          <nav className="flex flex-col space-y-1 px-4 py-6">
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
          </div>
        </aside>

        <main className="flex-1 px-6 py-6 lg:px-10">
          {showCopied && (
            <div
              className={`fixed bottom-6 right-6 z-50 rounded-xl border border-mint-400/40 bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
                toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              Copied!
            </div>
          )}
          {showSaved && (
            <div
              className={`fixed bottom-16 right-6 z-50 rounded-xl border border-mint-400/40 bg-mint-400/15 px-4 py-2 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
                savedVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              Saved!
            </div>
          )}
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-600">{header.eyebrow}</p>
              <h1 className="font-display text-3xl font-semibold text-ink-900">{header.title}</h1>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-fog-100 bg-white/70 p-4 shadow-glass backdrop-blur lg:flex-row lg:items-center">
              <div>
                <p className="text-xs text-ink-600">API Key Header</p>
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="X-API-KEY"
                  className="mt-1 w-64 rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
                />
              </div>
              <button
                onClick={handleSaveKey}
                className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700"
              >
                Save Key
              </button>
            </div>
          </header>

          {showMissingKey && (
            <div className="mb-6 rounded-2xl border border-signal-400/40 bg-signal-400/10 px-4 py-3 text-sm text-ink-800">
              API key is missing. Add your key above or visit{' '}
              <Link to="/api-keys" className="font-semibold text-ink-900 underline underline-offset-4">
                API Keys
              </Link>{' '}
              to create one.
              <button
                type="button"
                onClick={handleCopyHeader}
                className="ml-3 inline-flex items-center rounded-lg border border-ink-900/10 bg-white px-2 py-1 text-xs font-semibold text-ink-900 transition hover:bg-fog-50"
              >
                Copy header
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
