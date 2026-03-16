import { useState } from 'react'
import { createApiKey, getApiKeys, revokeApiKey } from '../services/apiClient'

function ApiKeys() {
  const [userId, setUserId] = useState('')
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState(null)
  const [error, setError] = useState('')

  const formatDate = (value) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }

  const handleLoadKeys = async () => {
    if (!userId.trim()) {
      setError('User ID is required to fetch keys.')
      return
    }

    try {
      setLoading(true)
      const data = await getApiKeys(userId.trim())
      setKeys(data)
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to load API keys.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!userId.trim()) {
      setError('User ID is required to create a key.')
      return
    }

    try {
      setCreating(true)
      const newKey = await createApiKey(userId.trim())
      setKeys((prev) => [newKey, ...prev])
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to create API key.')
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeKey = async (id) => {
    try {
      setRevokingId(id)
      await revokeApiKey(id)
      setKeys((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err?.message || 'Failed to revoke API key.')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Active Keys</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLoadKeys}
              className="rounded-lg border border-fog-100 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              {loading ? 'Loading...' : 'Load Keys'}
            </button>
            <button
              onClick={handleCreateKey}
              className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700"
            >
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
          <label className="text-sm text-ink-700">
            User ID
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter user ID"
              className="mt-2 w-full rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </label>
          <div className="rounded-2xl border border-fog-100 bg-fog-50 p-4 text-xs text-ink-600">
            <p className="font-semibold text-ink-800">Tip</p>
            <p className="mt-2">Use the same user ID you use in your backend user records.</p>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl border border-signal-400/40 bg-signal-400/10 px-4 py-3 text-sm text-ink-800">
            {error}
          </div>
        )}
        <div className="mt-4 overflow-hidden rounded-2xl border border-fog-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fog-50 text-xs uppercase tracking-[0.2em] text-ink-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">API Key</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog-100 bg-white">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{key.id}</td>
                  <td className="px-4 py-3 text-ink-700">{key.apiKey}</td>
                  <td className="px-4 py-3 text-ink-700">{formatDate(key.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="rounded-lg border border-ink-900/10 bg-white px-3 py-1 text-xs font-semibold text-ink-900 transition hover:bg-fog-50"
                      disabled={revokingId === key.id}
                    >
                      {revokingId === key.id ? 'Revoking...' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && keys.length === 0 && (
          <div className="mt-4 rounded-2xl border border-fog-100 bg-white/80 px-4 py-3 text-sm text-ink-600">
            No API keys found. Enter a user ID and create a key.
          </div>
        )}
      </div>
    </section>
  )
}

export default ApiKeys
