import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProviderApiById, updateProviderApi } from '../../api/api'

const slugPattern = /^[a-z0-9-]+$/

const getErrorMessage = (err) => {
  if (!err) {
    return 'Failed to update API.'
  }
  const data = err?.response?.data
  if (typeof data === 'string') {
    return data
  }
  if (data?.message) {
    return data.message
  }
  if (err?.message) {
    return err.message
  }
  return 'Failed to update API.'
}

function EditApi() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [version, setVersion] = useState('v1')
  const [description, setDescription] = useState('')
  const [rateLimit, setRateLimit] = useState('')
  const [upstreamUrl, setUpstreamUrl] = useState('')
  const [violationThreshold, setViolationThreshold] = useState('3')
  const [violationWindowSeconds, setViolationWindowSeconds] = useState('300')
  const [violationWindowUnit, setViolationWindowUnit] = useState('seconds')
  const [blockDurationSeconds, setBlockDurationSeconds] = useState('900')
  const [blockDurationUnit, setBlockDurationUnit] = useState('seconds')
  const [usageThresholdPercent, setUsageThresholdPercent] = useState('80')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const slugError = useMemo(() => {
    if (!slug) return 'Slug is required'
    if (!slugPattern.test(slug)) return 'Slug must be lowercase with no spaces'
    return ''
  }, [slug])

  useEffect(() => {
    let isMounted = true

    const loadApi = async () => {
      try {
        setInitialLoading(true)
        const data = await getProviderApiById(id)
        if (!isMounted) return
        setName(data?.name || '')
        setSlug(data?.slug || '')
        setVersion(data?.version || 'v1')
        setDescription(data?.description || '')
        setRateLimit(data?.rateLimit != null ? String(data.rateLimit) : '')
        setUpstreamUrl(data?.upstreamUrl || '')
        setViolationThreshold(
          data?.violationThreshold != null ? String(data.violationThreshold) : '3',
        )
        setViolationWindowSeconds(
          data?.violationWindowSeconds != null ? String(data.violationWindowSeconds) : '300',
        )
        setViolationWindowUnit('seconds')
        setBlockDurationSeconds(
          data?.blockDurationSeconds != null ? String(data.blockDurationSeconds) : '900',
        )
        setBlockDurationUnit('seconds')
        setUsageThresholdPercent(
          data?.usageThresholdPercent != null ? String(data.usageThresholdPercent) : '80',
        )
        setActive(Boolean(data?.active))
        setError('')
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false)
        }
      }
    }

    loadApi()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!slugPattern.test(slug)) {
      setError('Slug must be lowercase with no spaces.')
      return
    }
    if (!upstreamUrl.trim()) {
      setError('Upstream URL is required.')
      return
    }

    try {
      setLoading(true)
      const unitMultipliers = {
        seconds: 1,
        minutes: 60,
        hours: 3600,
        days: 86400,
      }
      const toSeconds = (value, unit) =>
        value ? Number(value) * (unitMultipliers[unit] || 1) : null

      await updateProviderApi(id, {
        name,
        slug,
        description,
        rateLimit: rateLimit ? Number(rateLimit) : null,
        upstreamUrl,
        active,
        violationThreshold: violationThreshold ? Number(violationThreshold) : null,
        violationWindowSeconds: toSeconds(violationWindowSeconds, violationWindowUnit),
        blockDurationSeconds: toSeconds(blockDurationSeconds, blockDurationUnit),
        usageThresholdPercent: usageThresholdPercent ? Number(usageThresholdPercent) : null,
      })
      setSuccess('API updated successfully')
      window.setTimeout(() => navigate('/provider/apis'), 900)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Edit API</h2>
        <p className="mt-2 text-sm text-ink-600">Update your API configuration.</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        {initialLoading ? (
          <div className="text-sm text-ink-600">Loading API details...</div>
        ) : (
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
                required
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
              {slugError && <span className="text-xs text-amber-600">{slugError}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Version</label>
              <input
                type="text"
                value={version}
                readOnly
                className="rounded-lg border border-fog-100 bg-fog-50 px-3 py-2 text-sm text-ink-700"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Description</label>
              <textarea
                rows="3"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Upstream URL</label>
              <input
                type="text"
                value={upstreamUrl}
                onChange={(event) => setUpstreamUrl(event.target.value)}
                required
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Rate Limit</label>
              <input
                type="number"
                value={rateLimit}
                onChange={(event) => setRateLimit(event.target.value)}
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Usage alert (%)</label>
              <input
                type="number"
                value={usageThresholdPercent}
                onChange={(event) => setUsageThresholdPercent(event.target.value)}
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Violations before block</label>
              <input
                type="number"
                value={violationThreshold}
                onChange={(event) => setViolationThreshold(event.target.value)}
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Violation window</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={violationWindowSeconds}
                  onChange={(event) => setViolationWindowSeconds(event.target.value)}
                  className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
                />
                <select
                  value={violationWindowUnit}
                  onChange={(event) => setViolationWindowUnit(event.target.value)}
                  className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Block duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={blockDurationSeconds}
                  onChange={(event) => setBlockDurationSeconds(event.target.value)}
                  className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
                />
                <select
                  value={blockDurationUnit}
                  onChange={(event) => setBlockDurationUnit(event.target.value)}
                  className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm text-ink-700 md:col-span-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 rounded border-fog-200"
              />
              Active
            </label>

            {error && (
              <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800 md:col-span-2">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-mint-400/40 bg-mint-400/15 p-4 text-sm font-semibold text-ink-900 md:col-span-2">
                {success}
              </div>
            )}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update API'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/provider/apis')}
                className="rounded-lg border border-fog-200 px-4 py-2 text-sm font-semibold text-ink-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default EditApi
