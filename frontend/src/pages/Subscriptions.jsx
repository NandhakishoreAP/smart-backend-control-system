import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubscriptionCard from '../components/SubscriptionCard'
import { getSubscriptions, unsubscribeFromApi } from '../api/api'

function Subscriptions() {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [unsubscribingId, setUnsubscribingId] = useState(null)

  const formatDate = (value) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setError('Missing userId. Set localStorage userId to load subscriptions.')
      setLoading(false)
      return
    }

    const fetchSubscriptions = async () => {
      try {
        setLoading(true)
        const data = await getSubscriptions(userId)
        setSubscriptions(data)
        setError('')
      } catch (err) {
        setError(err?.message || 'Failed to load subscriptions.')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const handleUnsubscribe = async (subscriptionId) => {
    const confirmed = window.confirm('Unsubscribe from this API?')
    if (!confirmed) {
      return
    }
    try {
      setUnsubscribingId(subscriptionId)
      await unsubscribeFromApi(subscriptionId)
      setSubscriptions((prev) => prev.filter((item) => item.id !== subscriptionId))
      showToast('Unsubscribed')
    } catch (err) {
      setError(err?.message || 'Failed to unsubscribe.')
    } finally {
      setUnsubscribingId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-fog-100 bg-white/80 p-6 shadow-glass backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Subscriptions</h2>
            <p className="mt-2 text-sm text-ink-600">Track APIs you are subscribed to.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/apis')}
              className="flex items-center justify-between rounded-lg border border-fog-100 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              Browse APIs
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-signal-400/40 bg-signal-400/10 px-4 py-3 text-sm text-ink-800">
            {error}
          </div>
        )}

        {toast && (
          <div className="mt-4 rounded-xl border border-mint-400/40 bg-mint-400/15 px-4 py-3 text-sm font-semibold text-ink-900">
            {toast}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-4 text-sm text-ink-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-900/20 border-t-ink-900" />
            Loading subscriptions...
          </div>
        )}

        {!loading && !error && subscriptions.length === 0 && (
          <div className="mt-6 rounded-2xl border border-fog-100 bg-white/80 px-4 py-6 text-sm text-ink-600">
            No subscriptions yet.
            <button
              onClick={() => navigate('/apis')}
              className="ml-3 inline-flex items-center rounded-lg border border-fog-100 bg-white px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              Browse APIs
            </button>
          </div>
        )}

        {!loading && !error && subscriptions.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                name={subscription.apiName || subscription.name}
                description={subscription.description || 'No description provided.'}
                subscribedAt={formatDate(subscription.subscribedAt || subscription.createdAt)}
                status="Active"
                onUnsubscribe={() => handleUnsubscribe(subscription.id)}
                disabling={unsubscribingId === subscription.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Subscriptions
