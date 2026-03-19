import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import apiClient, { getApiDetails, getApiVersions, getSubscriptions, subscribeToApi } from '../api/api'

const HISTORY_KEY = 'scs_tester_history'
const COLLECTIONS_KEY = 'scs_tester_collections'

const applyTemplate = (value, vars) => {
  if (!value) {
    return ''
  }
  return value.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => vars[key] ?? '')
}

const buildPairsFromMap = (values) => {
  if (!values) {
    return []
  }
  return Object.entries(values).map(([key, value]) => ({ key, value: String(value ?? '') }))
}

const resolvePairsWithEnv = (pairs, vars) => {
  return pairs.map((pair) => ({
    key: applyTemplate(pair.key, vars),
    value: applyTemplate(pair.value, vars),
  }))
}

const resolveStringWithEnv = (value, vars) => {
  if (!value) {
    return ''
  }
  return applyTemplate(value, vars)
}

const formatSummaryValue = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[object]'
    }
  }
  return String(value)
}

const summarizeResponse = (value) => {
  if (value === null || value === undefined) {
    return { kind: 'empty' }
  }
  if (Array.isArray(value)) {
    const count = value.length
    const firstObject = value.find(
      (item) => item && typeof item === 'object' && !Array.isArray(item),
    )
    if (firstObject) {
      const keys = Object.keys(firstObject).slice(0, 4)
      const rows = value.slice(0, 5).map((item) =>
        keys.map((key) => formatSummaryValue(item?.[key])),
      )
      return { kind: 'array-object', count, keys, rows }
    }
    const items = value.slice(0, 5).map((item) => formatSummaryValue(item))
    return { kind: 'array-primitive', count, items }
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .slice(0, 8)
      .map(([key, entryValue]) => ({ key, value: formatSummaryValue(entryValue) }))
    return { kind: 'object', entries }
  }
  return { kind: 'primitive', value: formatSummaryValue(value) }
}

const normalizeVersion = (value) => {
  if (!value) return 'v1'
  const trimmed = String(value).trim()
  if (!trimmed) return 'v1'
  if (trimmed.startsWith('v') || trimmed.startsWith('V')) {
    return `v${trimmed.slice(1)}`
  }
  return `v${trimmed}`
}

const extractVersionNumber = (value) => {
  if (!value) return 0
  let normalized = String(value).trim()
  if (normalized.startsWith('v') || normalized.startsWith('V')) {
    normalized = normalized.slice(1)
  }
  let digits = ''
  for (const char of normalized) {
    if (char >= '0' && char <= '9') {
      digits += char
    } else {
      break
    }
  }
  return digits ? Number(digits) : 0
}

const compareVersions = (left, right) => {
  const leftValue = extractVersionNumber(left)
  const rightValue = extractVersionNumber(right)
  if (leftValue !== rightValue) {
    return leftValue - rightValue
  }
  return String(left).localeCompare(String(right))
}

function ApiDetails() {
  const { slug } = useParams()
  const [apiDetails, setApiDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailsError, setDetailsError] = useState('')
  const [actionError, setActionError] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [toasts, setToasts] = useState([])
  const [testerMethod, setTesterMethod] = useState('GET')
  const [testerEndpoint, setTesterEndpoint] = useState('')
  const [availableVersions, setAvailableVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [testerRequestTab, setTesterRequestTab] = useState('params')
  const [testerBody, setTesterBody] = useState('')
  const [testerBodyType, setTesterBodyType] = useState('json')
  const [testerTextBody, setTesterTextBody] = useState('')
  const [testerParams, setTesterParams] = useState([{ key: '', value: '' }])
  const [testerHeaders, setTesterHeaders] = useState([{ key: '', value: '' }])
  const [testerEnvVars, setTesterEnvVars] = useState([{ key: '', value: '' }])
  const [testerPreRequestScript, setTesterPreRequestScript] = useState('')
  const [testerPreRequestError, setTesterPreRequestError] = useState('')
  const [testerResponseMeta, setTesterResponseMeta] = useState(null)
  const [testerResponseText, setTesterResponseText] = useState('')
  const [testerResponseBlobUrl, setTesterResponseBlobUrl] = useState('')
  const [testerPreviewMode, setTesterPreviewMode] = useState('json')
  const [history, setHistory] = useState([])
  const [collections, setCollections] = useState([])
  const [collectionName, setCollectionName] = useState('')
  const [testerResponse, setTesterResponse] = useState(null)
  const [testerError, setTesterError] = useState('')
  const [testerLoading, setTesterLoading] = useState(false)
  const previewContentTypeRef = useRef('')

  const responseSummary = useMemo(() => summarizeResponse(testerResponse), [testerResponse])

  const versionOptions = useMemo(() => {
    const list = Array.isArray(availableVersions) ? availableVersions : []
    const fromApi = apiDetails?.version ? [apiDetails.version] : []
    const combined = Array.from(new Set([...list, ...fromApi].map(normalizeVersion)))
    if (!combined.length) {
      return ['v1']
    }
    return combined.sort(compareVersions)
  }, [availableVersions, apiDetails?.version])

  const latestVersion = useMemo(() => {
    if (!versionOptions.length) return 'v1'
    return versionOptions[versionOptions.length - 1]
  }, [versionOptions])

  useEffect(() => {
    let isMounted = true

    const loadVersions = async () => {
      try {
        const data = await getApiVersions(slug)
        const list = Array.isArray(data) ? data : []
        const normalized = Array.from(new Set(list.map(normalizeVersion))).sort(compareVersions)
        if (isMounted) {
          setAvailableVersions(normalized)
          const latest = normalized.length ? normalized[normalized.length - 1] : 'v1'
          setSelectedVersion((prev) => prev || latest)
        }
      } catch {
        if (isMounted) {
          setAvailableVersions([])
          setSelectedVersion((prev) => prev || 'v1')
        }
      }
    }

    if (slug) {
      loadVersions()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  useEffect(() => {
    let isMounted = true

    const fetchApi = async () => {
      try {
        setLoading(true)
        const version = normalizeVersion(selectedVersion || 'v1')
        const data = await getApiDetails(slug, version)
        const userId = localStorage.getItem('userId')
        let subscriptions = []
        if (userId) {
          subscriptions = await getSubscriptions(userId)
        }
        if (isMounted) {
          setApiDetails(data)
          setSubscribed(subscriptions.some((item) => item.apiId === data.id))
          setDetailsError('')
        }
      } catch (err) {
        if (isMounted) {
          setDetailsError(err?.message || 'Failed to load API details')
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
  }, [slug, selectedVersion])

  useEffect(() => {
    const storedHistory = localStorage.getItem(HISTORY_KEY)
    const storedCollections = localStorage.getItem(COLLECTIONS_KEY)
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory))
      } catch (err) {
        setHistory([])
      }
    }
    if (storedCollections) {
      try {
        setCollections(JSON.parse(storedCollections))
      } catch (err) {
        setCollections([])
      }
    }
  }, [])

  useEffect(() => {
    if (!apiDetails?.slug) {
      return
    }
    const version = normalizeVersion(selectedVersion || apiDetails.version || 'v1')
    const basePrefix = `/gateway/${apiDetails.slug}/`
    const desiredPrefix = `/gateway/${apiDetails.slug}/${version}`
    if (testerEndpoint?.startsWith(basePrefix)) {
      const segments = testerEndpoint.split('/')
      if (segments.length >= 4 && segments[3] !== version) {
        const remainder = segments.slice(4).join('/')
        const nextEndpoint = remainder ? `${desiredPrefix}/${remainder}` : `${desiredPrefix}/`
        setTesterEndpoint(nextEndpoint)
        return
      }
    }
    const defaultEndpoint = `/gateway/${apiDetails.slug}/${version}/posts`
    if (!testerEndpoint || testerEndpoint === defaultEndpoint) {
      setTesterEndpoint(inferEndpoint(apiDetails.upstreamUrl, apiDetails.slug, version))
    }
  }, [apiDetails, selectedVersion, testerEndpoint])

  useEffect(() => {
    if (testerResponseBlobUrl) {
      return () => URL.revokeObjectURL(testerResponseBlobUrl)
    }
  }, [testerResponseBlobUrl])

  const envMap = useMemo(() => {
    return testerEnvVars.reduce((acc, item) => {
      if (item.key.trim()) {
        acc[item.key.trim()] = item.value
      }
      return acc
    }, {})
  }, [testerEnvVars])

  useEffect(() => {
    if (!testerResponseMeta) {
      return
    }
    const contentType = testerResponseMeta.headers?.['content-type'] || ''
    if (contentType === previewContentTypeRef.current) {
      return
    }
    previewContentTypeRef.current = contentType
    if (contentType.includes('text/html')) {
      setTesterPreviewMode('html')
      return
    }
    if (contentType.startsWith('image/')) {
      setTesterPreviewMode('image')
      return
    }
    if (contentType.includes('application/json')) {
      setTesterPreviewMode('json')
      return
    }
    setTesterPreviewMode('raw')
  }, [testerResponseMeta])

  const showToast = (message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, message, visible: true }])
    window.setTimeout(() => {
      setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, visible: false } : item)))
    }, 1400)
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 1800)
  }

  const handleSubscribe = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId || !apiDetails?.id) {
      setActionError('Missing userId. Set localStorage userId to subscribe.')
      return
    }
    try {
      setSubscribing(true)
      await subscribeToApi(userId, apiDetails.id)
      setSubscribed(true)
      showToast('Subscribed successfully')
      setActionError('')
    } catch (err) {
      setActionError(err?.message || 'Failed to subscribe.')
    } finally {
      setSubscribing(false)
    }
  }

  const resolvedVersion = normalizeVersion(selectedVersion || latestVersion || 'v1')
  const baseEndpoint = `/gateway/${apiDetails?.slug || slug || ''}/${resolvedVersion}`
  const exampleEndpoint = `GET ${baseEndpoint}/posts`
  const curlCommand = `curl http://localhost:8080${baseEndpoint}/posts \\n+-H "X-API-KEY: YOUR_API_KEY"`

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand)
      showToast('Copied!')
    } catch {
      showToast('Copy failed')
    }
  }

  const inferEndpoint = (upstreamUrl, currentSlug, version) => {
    if (!upstreamUrl || !currentSlug) {
      return `/gateway/${currentSlug}/${version}/posts`
    }
    const lower = upstreamUrl.toLowerCase()
    if (lower.includes('jsonplaceholder')) {
      return `/gateway/${currentSlug}/${version}/posts`
    }
    if (lower.includes('httpbin')) {
      return `/gateway/${currentSlug}/${version}/anything`
    }
    return `/gateway/${currentSlug}/${version}/`
  }

  const buildQueryString = (pairs) => {
    const params = new URLSearchParams()
    pairs
      .filter((pair) => pair.key.trim())
      .forEach((pair) => params.append(pair.key.trim(), pair.value))
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  const buildHeaders = (pairs) => {
    return pairs
      .filter((pair) => pair.key.trim())
      .reduce((acc, pair) => {
        acc[pair.key.trim()] = pair.value
        return acc
      }, {})
  }

  const persistHistory = (items) => {
    setHistory(items)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  }

  const persistCollections = (items) => {
    setCollections(items)
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(items))
  }

  const updateParam = (index, field, value) => {
    setTesterParams((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    )
  }

  const updateHeader = (index, field, value) => {
    setTesterHeaders((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    )
  }

  const addParam = () => setTesterParams((prev) => [...prev, { key: '', value: '' }])

  const addHeader = () => setTesterHeaders((prev) => [...prev, { key: '', value: '' }])

  const addEnvVar = () => setTesterEnvVars((prev) => [...prev, { key: '', value: '' }])

  const removeParam = (index) =>
    setTesterParams((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))

  const removeHeader = (index) =>
    setTesterHeaders((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))

  const removeEnvVar = (index) =>
    setTesterEnvVars((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))

  const handleTestApi = async () => {
    if (!apiDetails?.upstreamUrl) {
      setTesterError('Upstream URL not configured for this API.')
      setTesterResponse(null)
      return
    }
    const apiKey = localStorage.getItem('apiKey')
    if (!apiKey || !apiKey.trim()) {
      setTesterError('Missing API key. Save one in the header first.')
      setTesterResponse(null)
      return
    }

    let scriptOverrides = {}
    if (testerPreRequestScript.trim()) {
      try {
        const runner = new Function('context', `"use strict";\n${testerPreRequestScript}`)
        const result = runner({
          env: { ...envMap },
          headers: buildHeaders(testerHeaders),
          params: buildHeaders(testerParams),
          body: testerBodyType === 'json' ? testerBody : testerTextBody,
          method: testerMethod,
          endpoint: testerEndpoint,
        })
        scriptOverrides = result && typeof result === 'object' ? result : {}
      } catch (scriptError) {
        setTesterPreRequestError(`Pre-request script error: ${scriptError.message}`)
        return
      }
    }

    try {
      setTesterLoading(true)
      setTesterError('')
      setTesterResponse(null)
      setTesterResponseMeta(null)
      setTesterResponseText('')
      setTesterResponseBlobUrl('')
      setTesterPreRequestError('')

      const scriptEnv = scriptOverrides.env || {}
      const mergedEnv = { ...envMap, ...scriptEnv }
      const scriptEndpoint = scriptOverrides.endpoint
        ? resolveStringWithEnv(String(scriptOverrides.endpoint), mergedEnv)
        : resolveStringWithEnv(testerEndpoint, mergedEnv)

      const resolvedParams = resolvePairsWithEnv(testerParams, mergedEnv)
      const scriptParams = buildPairsFromMap(scriptOverrides.params)
      const paramPairs = [...resolvedParams, ...scriptParams]
      const queryString = buildQueryString(paramPairs)
      const requestUrl = scriptEndpoint.includes('?')
        ? `${scriptEndpoint}${queryString.replace('?', '&')}`
        : `${scriptEndpoint}${queryString}`

      let data
      if (testerMethod !== 'GET' && testerMethod !== 'DELETE') {
        if (scriptOverrides.body !== undefined) {
          data = scriptOverrides.body
        } else if (testerBodyType === 'json' && testerBody) {
          try {
            data = JSON.parse(resolveStringWithEnv(testerBody, mergedEnv))
          } catch (parseError) {
            setTesterError('Request body must be valid JSON.')
            setTesterLoading(false)
            return
          }
        } else if (testerBodyType === 'text') {
          data = resolveStringWithEnv(testerTextBody, mergedEnv)
        }
      }

      const headers = buildHeaders(resolvePairsWithEnv(testerHeaders, mergedEnv))
      const scriptHeaders = scriptOverrides.headers || {}
      Object.entries(scriptHeaders).forEach(([key, value]) => {
        headers[key] = value
      })
      if (testerMethod !== 'GET' && testerMethod !== 'DELETE') {
        if (testerBodyType === 'json' && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json'
        }
        if (testerBodyType === 'text' && !headers['Content-Type']) {
          headers['Content-Type'] = 'text/plain'
        }
      }

      const start = performance.now()
      const response = await apiClient.request({
        url: requestUrl,
        method: testerMethod,
        data,
        headers,
        responseType: 'blob',
      })
      const duration = Math.round(performance.now() - start)

      const contentType = response.headers?.['content-type'] || ''
      const responseBlob = response.data
      const rawText = await responseBlob.text()
      const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json')
      const isImage = contentType.startsWith('image/')
      let parsedData = rawText
      if (isJson) {
        try {
          parsedData = JSON.parse(rawText)
        } catch {
          parsedData = rawText
        }
      }

      setTesterResponse(parsedData)
      setTesterResponseText(rawText)
      if (isImage) {
        setTesterResponseBlobUrl(URL.createObjectURL(responseBlob))
      }
      setTesterResponseMeta({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        duration,
        url: requestUrl,
        method: testerMethod,
      })

      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        method: testerMethod,
        endpoint: testerEndpoint,
        params: testerParams,
        headers: testerHeaders,
        bodyType: testerBodyType,
        bodyJson: testerBody,
        bodyText: testerTextBody,
        envVars: testerEnvVars,
        preRequestScript: testerPreRequestScript,
      }
      const nextHistory = [entry, ...history].slice(0, 10)
      persistHistory(nextHistory)
    } catch (err) {
      const duration = 0
      const status = err?.response?.status
      if (status === 401) {
        setTesterError('Unauthorized. Check your API key.')
      } else if (status === 403) {
        setTesterError('You are not subscribed')
      } else if (status === 429) {
        setTesterError('Rate limit exceeded')
      } else {
        setTesterError(err?.message || 'Failed to call gateway endpoint.')
      }
      if (err?.response) {
        const contentType = err.response.headers?.['content-type'] || ''
        const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json')
        let rawText = ''
        let parsedData = err.response.data

        if (err.response.data instanceof Blob) {
          rawText = await err.response.data.text()
          parsedData = rawText
          if (isJson) {
            try {
              parsedData = JSON.parse(rawText)
            } catch {
              parsedData = rawText
            }
          }
        }

        setTesterResponse(parsedData)
        setTesterResponseText(
          rawText || (typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData, null, 2)),
        )
        setTesterResponseMeta({
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          duration,
          url: testerEndpoint,
          method: testerMethod,
        })
      }
    } finally {
      setTesterLoading(false)
    }
  }

  const saveCollection = () => {
    if (!collectionName.trim()) {
      setTesterError('Collection name is required.')
      return
    }
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: collectionName.trim(),
      method: testerMethod,
      endpoint: testerEndpoint,
      params: testerParams,
      headers: testerHeaders,
      bodyType: testerBodyType,
      bodyJson: testerBody,
      bodyText: testerTextBody,
      envVars: testerEnvVars,
      preRequestScript: testerPreRequestScript,
    }
    const nextCollections = [entry, ...collections]
    persistCollections(nextCollections)
    setCollectionName('')
    showToast('Saved to collections')
  }

  const loadRequest = (entry) => {
    setTesterMethod(entry.method || 'GET')
    setTesterEndpoint(entry.endpoint || '')
    setTesterParams(entry.params?.length ? entry.params : [{ key: '', value: '' }])
    setTesterHeaders(entry.headers?.length ? entry.headers : [{ key: '', value: '' }])
    setTesterBodyType(entry.bodyType || 'json')
    setTesterBody(entry.bodyJson || '')
    setTesterTextBody(entry.bodyText || '')
    setTesterEnvVars(entry.envVars?.length ? entry.envVars : [{ key: '', value: '' }])
    setTesterPreRequestScript(entry.preRequestScript || '')
  }

  const removeHistoryItem = (id) => {
    const next = history.filter((item) => item.id !== id)
    persistHistory(next)
  }

  const removeCollectionItem = (id) => {
    const next = collections.filter((item) => item.id !== id)
    persistCollections(next)
  }

  const handleCopyResponse = async () => {
    if (!testerResponse) {
      return
    }
    try {
      const payload = testerResponseText
        ? testerResponseText
        : typeof testerResponse === 'string'
          ? testerResponse
          : JSON.stringify(testerResponse, null, 2)
      await navigator.clipboard.writeText(payload)
      showToast('Copied!')
    } catch (err) {
      setTesterError('Failed to copy response.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-ink-600">Loading API details...</p>
      </div>
    )
  }

  if (detailsError) {
    return (
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold text-ink-900">Unable to load API</p>
        <p className="mt-2 text-sm text-ink-600">{detailsError}</p>
      </div>
    )
  }

    if (!apiDetails) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="h-fit max-h-[520px] rounded-xl bg-white p-4 shadow transition hover:shadow-md">
        <div className="grid w-full gap-4 md:grid-cols-3 md:justify-between">
          <div className="flex h-full flex-col">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-600">API Details</p>
            <h2 className="font-display text-2xl font-semibold text-ink-900">{apiDetails.name}</h2>
            <p className="mt-2 text-sm text-ink-600">{apiDetails.description}</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-fog-100 bg-fog-50 px-4 py-4 text-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-600">Rate Limit</p>
                <p className="mt-2 text-xl font-semibold text-ink-900">{apiDetails.rateLimit} rpm</p>
              </div>
              <div className="rounded-xl border border-fog-100 bg-fog-50 px-4 py-4 text-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-600">Status</p>
                <p className="mt-2 text-xl font-semibold text-ink-900">
                  {apiDetails.active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-fog-100 bg-fog-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Slug</p>
              <p className="mt-1 font-semibold text-ink-900">{apiDetails.slug}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-fog-100 bg-fog-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Version</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {versionOptions.map((version) => (
                  <span
                    key={version}
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      version === latestVersion
                        ? 'bg-ink-900 text-fog-50'
                        : version === 'v1'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-fog-100 text-ink-600'
                    }`}
                  >
                    {version === latestVersion ? `${version} (latest)` : version === 'v1' ? `${version} (stable)` : version}
                  </span>
                ))}
              </div>
              <label className="mt-3 block text-xs font-semibold text-ink-600">Select version</label>
              <select
                value={normalizeVersion(selectedVersion || latestVersion)}
                onChange={(event) => setSelectedVersion(event.target.value)}
                className="mt-2 w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
              >
                {versionOptions.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={subscribing || subscribed}
              className="flex items-center justify-between rounded-xl border border-fog-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {subscribed ? 'Subscribed' : subscribing ? 'Subscribing...' : 'Subscribe'}
              </span>
            </button>
          </div>
        </div>
        {toasts.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`rounded-xl border border-mint-400/40 bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-glass transition duration-300 ${
                  toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
        )}
        {actionError && (
          <div className="mt-4 rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
            {actionError}
          </div>
        )}
      </div>

      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink-900">Test API</h3>
            <p className="mt-2 text-sm text-ink-600">Send a request to the gateway endpoint.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                value={collectionName}
                onChange={(event) => setCollectionName(event.target.value)}
                placeholder="Save as..."
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
              <button
                type="button"
                onClick={saveCollection}
                className="flex items-center justify-between rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50"
              >
                Save
              </button>
            </div>
            <button
              onClick={handleTestApi}
              disabled={testerLoading}
              className="flex items-center justify-between rounded-xl border border-fog-100 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                {testerLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/20 border-t-ink-900" />
                )}
                {testerLoading ? 'Sending...' : 'Send Request'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[140px_1fr]">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Method</label>
            <select
              value={testerMethod}
              onChange={(event) => setTesterMethod(event.target.value)}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Endpoint</label>
            <input
              value={testerEndpoint}
              onChange={(event) => setTesterEndpoint(event.target.value)}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-fog-100 bg-fog-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'params', label: 'Params' },
              { key: 'headers', label: 'Headers' },
              { key: 'body', label: 'Body' },
              { key: 'env', label: 'Environment' },
              { key: 'pre', label: 'Pre-request' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTesterRequestTab(tab.key)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  testerRequestTab === tab.key
                    ? 'bg-ink-900 text-fog-50'
                    : 'border border-fog-100 bg-white text-ink-700 hover:bg-fog-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {testerRequestTab === 'params' && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Query Params</p>
                <button
                  type="button"
                  onClick={addParam}
                  className="text-xs font-semibold text-ink-700"
                >
                  + Add
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {testerParams.map((param, index) => (
                  <div key={`param-${index}`} className="flex items-center gap-2">
                    <input
                      value={param.key}
                      onChange={(event) => updateParam(index, 'key', event.target.value)}
                      placeholder="key"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <input
                      value={param.value}
                      onChange={(event) => updateParam(index, 'value', event.target.value)}
                      placeholder="value"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeParam(index)}
                      className="text-xs text-ink-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {testerRequestTab === 'headers' && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Headers</p>
                <button
                  type="button"
                  onClick={addHeader}
                  className="text-xs font-semibold text-ink-700"
                >
                  + Add
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {testerHeaders.map((header, index) => (
                  <div key={`header-${index}`} className="flex items-center gap-2">
                    <input
                      value={header.key}
                      onChange={(event) => updateHeader(index, 'key', event.target.value)}
                      placeholder="Header"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <input
                      value={header.value}
                      onChange={(event) => updateHeader(index, 'value', event.target.value)}
                      placeholder="Value"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(index)}
                      className="text-xs text-ink-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {testerRequestTab === 'body' && (
            <div className="mt-4">
              {testerMethod === 'GET' || testerMethod === 'DELETE' ? (
                <p className="text-sm text-ink-500">Body is disabled for GET/DELETE.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-[0.2em] text-ink-600">Request Body</label>
                    <select
                      value={testerBodyType}
                      onChange={(event) => setTesterBodyType(event.target.value)}
                      className="rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    >
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  {testerBodyType === 'json' ? (
                    <textarea
                      rows="4"
                      value={testerBody}
                      onChange={(event) => setTesterBody(event.target.value)}
                      placeholder='{"name":"example"}'
                      className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
                    />
                  ) : (
                    <textarea
                      rows="4"
                      value={testerTextBody}
                      onChange={(event) => setTesterTextBody(event.target.value)}
                      placeholder="Plain text body"
                      className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {testerRequestTab === 'env' && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Environment</p>
              <div className="mt-3 space-y-2">
                {testerEnvVars.map((item, index) => (
                  <div key={`env-${index}`} className="flex items-center gap-2">
                    <input
                      value={item.key}
                      onChange={(event) =>
                        setTesterEnvVars((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, key: event.target.value } : entry,
                          ),
                        )
                      }
                      placeholder="BASE_URL"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <input
                      value={item.value}
                      onChange={(event) =>
                        setTesterEnvVars((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, value: event.target.value } : entry,
                          ),
                        )
                      }
                      placeholder="https://api.example.com"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvVar(index)}
                      className="text-xs text-ink-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEnvVar}
                  className="text-xs font-semibold text-ink-700"
                >
                  + Add variable
                </button>
                <p className="text-xs text-ink-500">Use {'{{VAR}}'} in endpoint, headers, or body.</p>
              </div>
            </div>
          )}

          {testerRequestTab === 'pre' && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Pre-request Script</p>
                <p className="mt-2 text-xs text-ink-500">
                  Return an object with optional fields: env, headers, params, body, endpoint.
                </p>
              </div>
              <textarea
                rows="6"
                value={testerPreRequestScript}
                onChange={(event) => setTesterPreRequestScript(event.target.value)}
                placeholder={`return {\n  env: { BASE_URL: 'https://api.example.com' },\n  headers: { 'X-Trace': 'true' },\n  params: { q: 'search' }\n}`}
                className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
              {testerPreRequestError && (
                <div className="rounded-lg border border-signal-400/40 bg-signal-400/10 px-3 py-2 text-xs text-ink-800">
                  {testerPreRequestError}
                </div>
              )}
            </div>
          )}
        </div>

        {testerError && (
          <div className="mt-4 rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
            {testerError}
          </div>
        )}

        {testerResponseMeta && (
          <div className="mt-4 rounded-2xl border border-ink-900/10 bg-ink-900 text-fog-50">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-fog-200">
              <span>Response</span>
              <span className="text-fog-200">
                {testerResponseMeta.method} {testerResponseMeta.status} ({testerResponseMeta.duration}ms)
              </span>
              <div className="flex items-center gap-2">
                {['json', 'raw', 'headers', 'html', 'image'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTesterPreviewMode(mode)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                      testerPreviewMode === mode
                        ? 'bg-white/20 text-fog-50'
                        : 'border border-white/20 text-fog-50 hover:bg-white/10'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={handleCopyResponse}
                  className="rounded-lg border border-white/20 px-2 py-1 text-[11px] font-semibold text-fog-50 transition hover:bg-white/10"
                >
                  Copy
                </button>
              </div>
            </div>
            {responseSummary && responseSummary.kind !== 'empty' && (
              <div className="border-b border-white/10 px-4 py-3 text-[11px] text-fog-100">
                <p className="text-[11px] uppercase tracking-[0.2em] text-fog-300">Summary</p>
                {responseSummary.kind === 'array-object' && (
                  <div className="mt-2">
                    <p className="text-[11px] text-fog-300">{responseSummary.count} items</p>
                    <div className="mt-2 overflow-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="text-fog-300">
                            {responseSummary.keys.map((key) => (
                              <th key={key} className="px-2 py-1 font-semibold">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {responseSummary.rows.map((row, idx) => (
                            <tr key={`row-${idx}`} className="border-t border-white/10">
                              {row.map((cell, cellIdx) => (
                                <td key={`cell-${cellIdx}`} className="px-2 py-1 text-fog-100">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {responseSummary.kind === 'array-primitive' && (
                  <div className="mt-2">
                    <p className="text-[11px] text-fog-300">{responseSummary.count} items</p>
                    <ul className="mt-2 space-y-1">
                      {responseSummary.items.map((item, idx) => (
                        <li key={`item-${idx}`} className="text-fog-100">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {responseSummary.kind === 'object' && (
                  <div className="mt-2 space-y-1">
                    {responseSummary.entries.map((entry) => (
                      <div key={entry.key} className="flex items-start justify-between gap-4">
                        <span className="font-semibold text-fog-100">{entry.key}</span>
                        <span className="text-fog-300">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {responseSummary.kind === 'primitive' && (
                  <p className="mt-2 text-fog-100">{responseSummary.value}</p>
                )}
              </div>
            )}
            {testerPreviewMode === 'headers' ? (
              <div className="border-b border-white/10 px-4 py-3 text-xs text-fog-200">
                {Object.entries(testerResponseMeta.headers || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span>{key}</span>
                    <span className="text-fog-300">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : testerPreviewMode === 'html' ? (
              <div className="bg-white">
                <iframe
                  title="html-preview"
                  sandbox=""
                  className="h-80 w-full rounded-xl bg-white"
                  srcDoc={testerResponseText}
                />
              </div>
            ) : testerPreviewMode === 'image' ? (
              <div className="flex items-center justify-center bg-ink-900 px-4 py-4">
                {testerResponseBlobUrl ? (
                  <img src={testerResponseBlobUrl} alt="Response preview" className="max-h-80 rounded-lg" />
                ) : (
                  <p className="text-sm text-fog-200">No image response.</p>
                )}
              </div>
            ) : (
              <pre className="max-h-80 overflow-auto px-4 py-4 text-sm">
                <code>
                  {testerPreviewMode === 'raw'
                    ? testerResponseText ||
                      (typeof testerResponse === 'string' ? testerResponse : JSON.stringify(testerResponse))
                    : typeof testerResponse === 'string'
                      ? testerResponse
                      : JSON.stringify(testerResponse, null, 2)}
                </code>
              </pre>
            )}
          </div>
        )}
      </div>

      {(history.length > 0 || collections.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-ink-900">History</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Last 10</span>
            </div>
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-xl border border-fog-100 bg-fog-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {item.method} {item.endpoint}
                      </p>
                      <p className="text-xs text-ink-500">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadRequest(item)}
                        className="text-xs font-semibold text-ink-700"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => removeHistoryItem(item.id)}
                        className="text-xs text-ink-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-ink-900">Collections</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Saved</span>
            </div>
            <div className="mt-4 space-y-3">
              {collections.length === 0 && (
                <p className="text-sm text-ink-600">No saved requests yet.</p>
              )}
              {collections.map((item) => (
                <div key={item.id} className="rounded-xl border border-fog-100 bg-fog-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                      <p className="text-xs text-ink-500">{item.method} {item.endpoint}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadRequest(item)}
                        className="text-xs font-semibold text-ink-700"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCollectionItem(item.id)}
                        className="text-xs text-ink-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-600">API Documentation</p>
            <h3 className="font-display text-xl font-semibold text-ink-900">
              {apiDetails?.name || 'API'}
            </h3>
            <p className="text-sm text-ink-600">{apiDetails?.description}</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-fog-100 bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Endpoint</p>
              <p className="mt-2 text-sm text-ink-800">Base endpoint</p>
              <div className="mt-2 rounded-xl bg-ink-900 p-4 text-sm text-fog-50">
                <pre>{baseEndpoint}</pre>
              </div>
              <p className="mt-3 text-sm text-ink-800">Example endpoint</p>
              <div className="mt-2 rounded-xl bg-ink-900 p-4 text-sm text-fog-50">
                <pre>{exampleEndpoint}</pre>
              </div>
            </div>

            <div className="rounded-xl border border-fog-100 bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Headers</p>
              <div className="mt-3 rounded-xl bg-ink-900 p-4 text-sm text-fog-50">
                <pre>X-API-KEY: &lt;your-api-key&gt;</pre>
              </div>
              <p className="mt-3 text-xs text-ink-600">Required for all gateway requests.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-fog-100 bg-fog-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Example Request</p>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="rounded-lg border border-fog-100 bg-white px-3 py-1 text-xs font-semibold text-ink-800 transition hover:bg-fog-50"
                >
                  Copy
                </button>
              </div>
              <div className="mt-3 rounded-xl bg-ink-900 p-4 text-sm text-fog-50">
                <pre>{curlCommand}</pre>
              </div>
            </div>

            <div className="rounded-xl border border-fog-100 bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Example Response</p>
              <div className="mt-3 rounded-xl bg-ink-900 p-4 text-sm text-fog-50">
                <pre>{`[
  {
    "id": 1,
    "title": "Example",
    "body": "Sample response"
  }
]`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}

export default ApiDetails
