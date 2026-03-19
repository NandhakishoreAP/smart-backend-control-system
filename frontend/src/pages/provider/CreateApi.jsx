import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createProviderApi, getProviderApiById, updateProviderApi } from '../../api/api'

const presets = [
  {
    id: 'jsonplaceholder',
    name: 'JSONPlaceholder Posts',
    slug: 'json-posts',
    upstreamUrl: 'https://jsonplaceholder.typicode.com',
    description: 'Sample posts API for testing gateway calls.',
    rateLimit: 120,
  },
  {
    id: 'httpbin',
    name: 'HTTPBin Anything',
    slug: 'httpbin-anything',
    upstreamUrl: 'https://httpbin.org',
    description: 'Echo service for testing methods, headers, and bodies.',
    rateLimit: 120,
  },
]

const getErrorMessage = (err) => {
  if (!err) {
    return 'Failed to publish API.'
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
  return 'Failed to publish API.'
}

function CreateApi() {
  const [searchParams] = useSearchParams()
  const apiId = searchParams.get('apiId')
  const cloneFromId = searchParams.get('cloneFrom')
  const isEditing = useMemo(() => Boolean(apiId), [apiId])
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
  const [presetId, setPresetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadApi = async () => {
      const targetId = apiId || cloneFromId
      if (!targetId) return
      try {
        setInitialLoading(true)
        const data = await getProviderApiById(targetId)
        if (!isMounted) return
        setName(data?.name || '')
        setSlug(data?.slug || '')
        setVersion(apiId ? data?.version || 'v1' : '')
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
  }, [apiId, cloneFromId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

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

      const payload = {
        name,
        slug,
        version: version ? version.trim() : null,
        description,
        rateLimit: rateLimit ? Number(rateLimit) : null,
        upstreamUrl,
        violationThreshold: violationThreshold ? Number(violationThreshold) : null,
        violationWindowSeconds: toSeconds(violationWindowSeconds, violationWindowUnit),
        blockDurationSeconds: toSeconds(blockDurationSeconds, blockDurationUnit),
        usageThresholdPercent: usageThresholdPercent ? Number(usageThresholdPercent) : null,
      }

      if (isEditing) {
        await updateProviderApi(apiId, payload)
        setSuccess('API updated successfully.')
      } else {
        await createProviderApi(payload)
        setSuccess('API published successfully.')
        setName('')
        setSlug('')
        setDescription('')
        setRateLimit('')
        setUpstreamUrl('')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (value) => {
    setPresetId(value)
    const preset = presets.find((item) => item.id === value)
    if (!preset) {
      return
    }
    setName(preset.name)
    setSlug(preset.slug)
    setDescription(preset.description)
    setRateLimit(String(preset.rateLimit))
    setUpstreamUrl(preset.upstreamUrl)
  }

  return (
    <section className="space-y-6">
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        <h2 className="font-display text-2xl font-semibold text-ink-900">
          {isEditing ? 'Edit API' : 'Create API'}
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          {isEditing ? 'Update your API details and gateway settings.' : 'Publish a new API for consumers.'}
        </p>
      </div>
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        {initialLoading && (
          <div className="rounded-xl bg-white p-4 text-sm text-ink-600">Loading API details...</div>
        )}
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Quick presets</p>
            <p className="mt-1 text-sm text-ink-600">Auto-fill a working upstream URL for testing.</p>
          </div>
          <select
            value={presetId}
            onChange={(event) => applyPreset(event.target.value)}
            className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
          >
            <option value="">Select preset</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Payments API"
              required
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="payments"
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Version</label>
            <input
              type="text"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="v1"
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Description</label>
            <textarea
              rows="3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the API capability and use cases."
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Rate limit</label>
            <input
              type="number"
              value={rateLimit}
              onChange={(event) => setRateLimit(event.target.value)}
              placeholder="120"
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Usage alert (%)</label>
            <input
              type="number"
              value={usageThresholdPercent}
              onChange={(event) => setUsageThresholdPercent(event.target.value)}
              placeholder="80"
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Violations before block</label>
            <input
              type="number"
              value={violationThreshold}
              onChange={(event) => setViolationThreshold(event.target.value)}
              placeholder="3"
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
                placeholder="5"
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
                placeholder="15"
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
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Upstream URL</label>
            <input
              type="text"
              value={upstreamUrl}
              onChange={(event) => setUpstreamUrl(event.target.value)}
              placeholder="https://api.example.com"
              required
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
            />
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-between rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700 disabled:cursor-not-allowed md:col-span-2"
          >
            {loading ? (isEditing ? 'Updating...' : 'Publishing...') : isEditing ? 'Update API' : 'Publish API'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default CreateApi
