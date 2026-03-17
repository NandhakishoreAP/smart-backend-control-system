import { useEffect, useState } from 'react'
import ApiKeyCard from '../components/ApiKeyCard'
import { createApiKey, deleteApiKey, getApiKeys } from '../api/api'

function ApiKeys() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const formatDate = (value) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }

  const maskKey = (value) => {
    if (!value) {
      return ''
    }
    const last4 = value.slice(-4)
    return `****${last4}`
  }

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const data = await getApiKeys()
      setKeys(data)
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to load API keys.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleCreateKey = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setError('Missing userId. Set localStorage userId to create a key.')
        return
      }
      setCreating(true)
      const newKey = await createApiKey(userId)
      setKeys((prev) => [newKey, ...prev])
      showToast('API Key created')
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to create API key.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (id) => {
    const confirmed = window.confirm('Delete this API key? This action cannot be undone.')
    if (!confirmed) {
      return
    }
    try {
      setDeletingId(id)
      await deleteApiKey(id)
      setKeys((prev) => prev.filter((item) => item.id !== id))
      showToast('API Key deleted')
    } catch (err) {
      setError(err?.message || 'Failed to delete API key.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopyKey = async (value) => {
    if (!value) {
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      showToast('API Key copied')
    } catch (err) {
      setError('Failed to copy API key.')
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">API Keys</h2>
            <p className="mt-2 text-sm text-ink-600">Manage gateway keys for your applications.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleCreateKey}
              className="flex items-center justify-between rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700"
            >
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>

        {toast && (
          <div className="mt-4 rounded-xl border border-mint-400/40 bg-mint-400/15 px-4 py-3 text-sm font-semibold text-ink-900">
            {toast}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-signal-400/40 bg-signal-400/10 px-4 py-3 text-sm text-ink-800">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-4 text-sm text-ink-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-900/20 border-t-ink-900" />
            Loading API keys...
          </div>
        )}

        {!loading && keys.length === 0 && (
          <div className="mt-6 rounded-2xl border border-fog-100 bg-white/80 px-4 py-6 text-sm text-ink-600">
            No API keys found. Create one to get started.
          </div>
        )}

        {!loading && keys.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {keys.map((key) => (
              <ApiKeyCard
                key={key.id}
                apiKey={maskKey(key.apiKey)}
                createdAt={formatDate(key.createdAt)}
                status="Active"
                deleting={deletingId === key.id}
                onCopy={() => handleCopyKey(key.apiKey)}
                onDelete={() => handleDeleteKey(key.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ApiKeys
