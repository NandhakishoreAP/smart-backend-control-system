import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getApiDetails } from '../services/apiClient'

function ApiDetails() {
  const { slug } = useParams()
  const [api, setApi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchApi = async () => {
      try {
        setLoading(true)
        const data = await getApiDetails(slug)
        if (isMounted) {
          setApi(data)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load API details')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (slug) {
      fetchApi()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <p className="text-sm text-ink-600">Loading API details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-signal-400/40 bg-white/80 p-6 shadow-glass backdrop-blur">
        <p className="text-sm font-semibold text-ink-900">Unable to load API</p>
        <p className="mt-2 text-sm text-ink-600">{error}</p>
      </div>
    )
  }

  if (!api) {
    return null
  }

  const testEndpoint = `GET /gateway/${api.slug}/posts`
  const curlCommand = `curl http://localhost:8080/gateway/${api.slug}/posts \\\n-H "X-API-KEY: YOUR_API_KEY"`

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ink-600">API Details</p>
            <h2 className="font-display text-2xl font-semibold text-ink-900">{api.name}</h2>
            <p className="mt-2 text-sm text-ink-600">{api.description}</p>
          </div>
          <div className="rounded-2xl border border-fog-100 bg-fog-50 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Slug</p>
            <p className="mt-1 font-semibold text-ink-900">{api.slug}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-fog-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Rate Limit</p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{api.rateLimit} rpm</p>
          </div>
          <div className="rounded-2xl border border-fog-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Status</p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{api.active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <h3 className="font-display text-xl font-semibold text-ink-900">Test Endpoint</h3>
        <p className="mt-2 text-sm text-ink-600">{testEndpoint}</p>
        <div className="mt-4 rounded-2xl border border-ink-900/10 bg-ink-900 text-fog-50">
          <pre className="overflow-x-auto px-4 py-4 text-sm">
            <code>{curlCommand}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

export default ApiDetails
