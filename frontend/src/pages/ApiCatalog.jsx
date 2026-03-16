import { useEffect, useState } from 'react'
import ApiCard from '../components/ApiCard'
import { getApis } from '../services/apiClient'

function ApiCatalog() {
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchApis = async () => {
      try {
        setLoading(true)
        const data = await getApis()
        if (isMounted) {
          setApis(data)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load APIs')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchApis()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <p className="text-sm text-ink-600">Loading APIs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-signal-400/40 bg-white/80 p-6 shadow-glass backdrop-blur">
        <p className="text-sm font-semibold text-ink-900">Unable to load APIs</p>
        <p className="mt-2 text-sm text-ink-600">{error}</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-ink-600">Browse APIs available in the marketplace.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {apis.map((api) => (
          <ApiCard
            key={api.id}
            name={api.name}
            description={api.description}
            rateLimit={api.rateLimit}
            slug={api.slug}
          />
        ))}
      </div>
      {apis.length === 0 && (
        <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
          <p className="text-sm text-ink-600">No APIs found.</p>
        </div>
      )}
    </section>
  )
}

export default ApiCatalog
