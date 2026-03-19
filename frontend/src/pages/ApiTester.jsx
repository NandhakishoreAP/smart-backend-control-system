import { useEffect, useMemo, useRef, useState } from 'react'
import apiClient from '../api/api'

const HISTORY_KEY = 'scs_consumer_tester_history'
const COLLECTIONS_KEY = 'scs_consumer_tester_collections'

const applyTemplate = (value, vars) => {
  if (!value) {
    return ''
  }
  return value.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => vars[key] ?? '')
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

function ApiTester() {
  const [method, setMethod] = useState('GET')
  const [endpoint, setEndpoint] = useState('/gateway/weather/v1/posts')
  const [params, setParams] = useState([{ key: '', value: '' }])
  const [headers, setHeaders] = useState([{ key: '', value: '' }])
  const [bodyType, setBodyType] = useState('json')
  const [bodyJson, setBodyJson] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [requestTab, setRequestTab] = useState('params')
  const [authType, setAuthType] = useState('none')
  const [authApiKey, setAuthApiKey] = useState('')
  const [authBearer, setAuthBearer] = useState('')
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }])
  const [preRequestScript, setPreRequestScript] = useState('')
  const [preRequestError, setPreRequestError] = useState('')
  const [response, setResponse] = useState(null)
  const [responseMeta, setResponseMeta] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [responseBlobUrl, setResponseBlobUrl] = useState('')
  const [previewMode, setPreviewMode] = useState('json')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [collections, setCollections] = useState([])
  const [collectionName, setCollectionName] = useState('')
  const [toast, setToast] = useState('')
  const previewContentTypeRef = useRef('')

  const responseSummary = useMemo(() => summarizeResponse(response), [response])

  useEffect(() => {
    const storedHistory = localStorage.getItem(HISTORY_KEY)
    const storedCollections = localStorage.getItem(COLLECTIONS_KEY)
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory))
      } catch {
        setHistory([])
      }
    }
    if (storedCollections) {
      try {
        setCollections(JSON.parse(storedCollections))
      } catch {
        setCollections([])
      }
    }
  }, [])

  useEffect(() => {
    if (responseBlobUrl) {
      return () => URL.revokeObjectURL(responseBlobUrl)
    }
  }, [responseBlobUrl])

  const envMap = useMemo(() => {
    return envVars.reduce((acc, item) => {
      if (item.key.trim()) {
        acc[item.key.trim()] = item.value
      }
      return acc
    }, {})
  }, [envVars])

  const resolvedEndpoint = useMemo(() => applyTemplate(endpoint, envMap), [endpoint, envMap])

  useEffect(() => {
    if (!responseMeta) {
      return
    }
    const contentType = responseMeta.headers?.['content-type'] || ''
    if (contentType === previewContentTypeRef.current) {
      return
    }
    previewContentTypeRef.current = contentType
    if (contentType.includes('text/html')) {
      setPreviewMode('html')
      return
    }
    if (contentType.startsWith('image/')) {
      setPreviewMode('image')
      return
    }
    if (contentType.includes('application/json')) {
      setPreviewMode('json')
      return
    }
    setPreviewMode('raw')
  }, [responseMeta])

  const persistHistory = (items) => {
    setHistory(items)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  }

  const persistCollections = (items) => {
    setCollections(items)
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(items))
  }

  const updatePair = (setter, index, field, value) => {
    setter((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)))
  }

  const addPair = (setter) => setter((prev) => [...prev, { key: '', value: '' }])

  const removePair = (setter, index) =>
    setter((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))

  const saveHistory = (entry) => {
    const next = [entry, ...history].slice(0, 12)
    persistHistory(next)
  }

  const saveCollection = () => {
    if (!collectionName.trim()) {
      setError('Collection name is required.')
      return
    }
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: collectionName.trim(),
      method,
      endpoint,
      params,
      headers,
      bodyType,
      bodyJson,
      bodyText,
      authType,
      authApiKey,
      authBearer,
      envVars,
    }
    const next = [entry, ...collections]
    persistCollections(next)
    setCollectionName('')
    setToast('Saved to collections')
    window.setTimeout(() => setToast(''), 1800)
  }

  const loadRequest = (entry) => {
    setMethod(entry.method || 'GET')
    setEndpoint(entry.endpoint || '')
    setParams(entry.params?.length ? entry.params : [{ key: '', value: '' }])
    setHeaders(entry.headers?.length ? entry.headers : [{ key: '', value: '' }])
    setBodyType(entry.bodyType || 'json')
    setBodyJson(entry.bodyJson || '')
    setBodyText(entry.bodyText || '')
    setAuthType(entry.authType || 'none')
    setAuthApiKey(entry.authApiKey || '')
    setAuthBearer(entry.authBearer || '')
    setEnvVars(entry.envVars?.length ? entry.envVars : [{ key: '', value: '' }])
  }

  const removeItem = (items, setter, key, id) => {
    const next = items.filter((item) => item.id !== id)
    setter(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  const buildCurl = (requestUrl, requestHeaders, data) => {
    const headerParts = Object.entries(requestHeaders).map(
      ([key, value]) => `-H "${key}: ${String(value)}"`,
    )
    const dataPart = data !== undefined && data !== null ? `-d '${JSON.stringify(data)}'` : ''
    return `curl -X ${method} ${headerParts.join(' ')} ${dataPart} "${requestUrl}"`.replace(/\s+/g, ' ').trim()
  }

  const handleSend = async () => {
    setError('')
    setResponse(null)
    setResponseMeta(null)
    setResponseText('')
    setResponseBlobUrl('')
    setPreRequestError('')

    let scriptOverrides = {}
    if (preRequestScript.trim()) {
      try {
        const runner = new Function('context', `"use strict";\n${preRequestScript}`)
        const result = runner({
          env: { ...envMap },
          headers: buildHeaders(headers),
          params: buildHeaders(params),
          body: bodyType === 'json' ? bodyJson : bodyText,
          method,
          endpoint,
        })
        scriptOverrides = result && typeof result === 'object' ? result : {}
      } catch (scriptError) {
        setPreRequestError(`Pre-request script error: ${scriptError.message}`)
        return
      }
    }

    try {
      setLoading(true)
      const scriptEnv = scriptOverrides.env || {}
      const mergedEnv = { ...envMap, ...scriptEnv }
      const scriptEndpoint = scriptOverrides.endpoint
        ? resolveStringWithEnv(String(scriptOverrides.endpoint), mergedEnv)
        : resolveStringWithEnv(endpoint, mergedEnv)

      const resolvedParams = resolvePairsWithEnv(params, mergedEnv)
      const scriptParams = buildPairsFromMap(scriptOverrides.params)
      const paramPairs = [...resolvedParams, ...scriptParams]
      const queryString = buildQueryString(paramPairs)
      const requestUrl = scriptEndpoint.includes('?')
        ? `${scriptEndpoint}${queryString.replace('?', '&')}`
        : `${scriptEndpoint}${queryString}`

      let data
      if (method !== 'GET' && method !== 'DELETE') {
        if (scriptOverrides.body !== undefined) {
          data = scriptOverrides.body
        } else if (bodyType === 'json' && bodyJson) {
          try {
            data = JSON.parse(resolveStringWithEnv(bodyJson, mergedEnv))
          } catch {
            setError('Request body must be valid JSON.')
            setLoading(false)
            return
          }
        } else if (bodyType === 'text') {
          data = resolveStringWithEnv(bodyText, mergedEnv)
        }
      }

      const resolvedHeaders = buildHeaders(resolvePairsWithEnv(headers, mergedEnv))
      const scriptHeaders = scriptOverrides.headers || {}
      Object.entries(scriptHeaders).forEach(([key, value]) => {
        resolvedHeaders[key] = value
      })
      if (authType === 'apiKey' && authApiKey.trim()) {
        resolvedHeaders['X-API-KEY'] = authApiKey.trim()
      }
      if (authType === 'bearer' && authBearer.trim()) {
        resolvedHeaders.Authorization = `Bearer ${authBearer.trim()}`
      }
      if (method !== 'GET' && method !== 'DELETE') {
        if (bodyType === 'json' && !resolvedHeaders['Content-Type']) {
          resolvedHeaders['Content-Type'] = 'application/json'
        }
        if (bodyType === 'text' && !resolvedHeaders['Content-Type']) {
          resolvedHeaders['Content-Type'] = 'text/plain'
        }
      }

      const start = performance.now()
      const responseResult = await apiClient.request({
        url: requestUrl,
        method,
        data,
        headers: resolvedHeaders,
        responseType: 'blob',
      })
      const duration = Math.round(performance.now() - start)
      const contentType = responseResult.headers?.['content-type'] || ''
      const responseBlob = responseResult.data
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

      setResponse(parsedData)
      setResponseText(rawText)
      if (isImage) {
        setResponseBlobUrl(URL.createObjectURL(responseBlob))
      }
      setResponseMeta({
        status: responseResult.status,
        statusText: responseResult.statusText,
        headers: responseResult.headers,
        duration,
        url: requestUrl,
        method,
      })

      saveHistory({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        method,
        endpoint,
        params,
        headers,
        bodyType,
        bodyJson,
        bodyText,
      })
    } catch (err) {
      const status = err?.response?.status
      const message = err?.response?.data?.message || err?.message || 'Request failed.'
      if (status === 401) {
        setError('Unauthorized. Check your API key or token.')
      } else if (status === 403) {
        setError('Forbidden. You may not be subscribed.')
      } else if (status === 429) {
        setError('Rate limit exceeded')
      } else {
        setError(message)
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

        setResponse(parsedData)
        setResponseText(
          rawText || (typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData, null, 2)),
        )
        setResponseMeta({
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          duration: 0,
          url: resolvedEndpoint,
          method,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCurl = async () => {
    const resolvedParams = resolvePairsWithEnv(params, envMap)
    const queryString = buildQueryString(resolvedParams)
    const requestUrl = resolvedEndpoint.includes('?')
      ? `${resolvedEndpoint}${queryString.replace('?', '&')}`
      : `${resolvedEndpoint}${queryString}`
    const resolvedHeaders = buildHeaders(resolvePairsWithEnv(headers, envMap))
    if (authType === 'apiKey' && authApiKey.trim()) {
      resolvedHeaders['X-API-KEY'] = authApiKey.trim()
    }
    if (authType === 'bearer' && authBearer.trim()) {
      resolvedHeaders.Authorization = `Bearer ${authBearer.trim()}`
    }
    let data
    if (method !== 'GET' && method !== 'DELETE') {
      if (bodyType === 'json' && bodyJson) {
        try {
          data = JSON.parse(resolveStringWithEnv(bodyJson, envMap))
        } catch {
          data = resolveStringWithEnv(bodyJson, envMap)
        }
      }
      if (bodyType === 'text') {
        data = resolveStringWithEnv(bodyText, envMap)
      }
    }
    const curl = buildCurl(requestUrl, resolvedHeaders, data)
    await navigator.clipboard.writeText(curl)
    setToast('Copied cURL')
    window.setTimeout(() => setToast(''), 1800)
  }

  return (
    <section className="space-y-6">
      <div className="min-h-[140px] rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-600">Testing</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">API Tester</h2>
        <p className="mt-2 text-sm text-ink-600">
          Build requests with headers, params, auth, and body like a lightweight Postman.
        </p>
      </div>

      {toast && (
        <div className="rounded-xl border border-mint-400/40 bg-mint-400/15 p-4 text-sm font-semibold text-ink-900">
          {toast}
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
              placeholder="/gateway/your-api/posts"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCurl}
              className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50"
            >
              Copy cURL
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-fog-50 transition hover:bg-ink-700 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-fog-100 bg-fog-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'params', label: 'Params' },
              { key: 'headers', label: 'Headers' },
              { key: 'auth', label: 'Auth' },
              { key: 'body', label: 'Body' },
              { key: 'env', label: 'Environment' },
              { key: 'pre', label: 'Pre-request' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRequestTab(tab.key)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  requestTab === tab.key
                    ? 'bg-ink-900 text-fog-50'
                    : 'border border-fog-100 bg-white text-ink-700 hover:bg-fog-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {requestTab === 'params' && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Query Params</p>
                <button type="button" onClick={() => addPair(setParams)} className="text-xs font-semibold text-ink-700">
                  + Add
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {params.map((param, index) => (
                  <div key={`param-${index}`} className="flex items-center gap-2">
                    <input
                      value={param.key}
                      onChange={(event) => updatePair(setParams, index, 'key', event.target.value)}
                      placeholder="key"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <input
                      value={param.value}
                      onChange={(event) => updatePair(setParams, index, 'value', event.target.value)}
                      placeholder="value"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <button type="button" onClick={() => removePair(setParams, index)} className="text-xs text-ink-500">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requestTab === 'headers' && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Headers</p>
                <button type="button" onClick={() => addPair(setHeaders)} className="text-xs font-semibold text-ink-700">
                  + Add
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {headers.map((header, index) => (
                  <div key={`header-${index}`} className="flex items-center gap-2">
                    <input
                      value={header.key}
                      onChange={(event) => updatePair(setHeaders, index, 'key', event.target.value)}
                      placeholder="Header"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <input
                      value={header.value}
                      onChange={(event) => updatePair(setHeaders, index, 'value', event.target.value)}
                      placeholder="Value"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <button type="button" onClick={() => removePair(setHeaders, index)} className="text-xs text-ink-500">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requestTab === 'auth' && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Auth</p>
              <div className="mt-3 grid gap-2">
                <select
                  value={authType}
                  onChange={(event) => setAuthType(event.target.value)}
                  className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
                >
                  <option value="none">None</option>
                  <option value="apiKey">API Key</option>
                  <option value="bearer">Bearer Token</option>
                </select>
                {authType === 'apiKey' && (
                  <input
                    value={authApiKey}
                    onChange={(event) => setAuthApiKey(event.target.value)}
                    placeholder="X-API-KEY"
                    className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
                  />
                )}
                {authType === 'bearer' && (
                  <input
                    value={authBearer}
                    onChange={(event) => setAuthBearer(event.target.value)}
                    placeholder="Bearer token"
                    className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
                  />
                )}
              </div>
            </div>
          )}

          {requestTab === 'body' && (
            <div className="mt-4">
              {method === 'GET' || method === 'DELETE' ? (
                <p className="text-sm text-ink-500">Body is disabled for GET/DELETE.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Body</p>
                    <select
                      value={bodyType}
                      onChange={(event) => setBodyType(event.target.value)}
                      className="rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    >
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  {bodyType === 'json' ? (
                    <textarea
                      rows="6"
                      value={bodyJson}
                      onChange={(event) => setBodyJson(event.target.value)}
                      placeholder='{"name":"example"}'
                      className="mt-2 w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
                    />
                  ) : (
                    <textarea
                      rows="6"
                      value={bodyText}
                      onChange={(event) => setBodyText(event.target.value)}
                      placeholder="Plain text body"
                      className="mt-2 w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {requestTab === 'env' && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Environment</p>
              <div className="mt-3 space-y-2">
                {envVars.map((item, index) => (
                  <div key={`env-${index}`} className="flex items-center gap-2">
                    <input
                      value={item.key}
                      onChange={(event) => updatePair(setEnvVars, index, 'key', event.target.value)}
                      placeholder="BASE_URL"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <input
                      value={item.value}
                      onChange={(event) => updatePair(setEnvVars, index, 'value', event.target.value)}
                      placeholder="https://api.example.com"
                      className="w-full rounded-lg border border-fog-100 bg-white px-2 py-1 text-xs text-ink-900"
                    />
                    <button type="button" onClick={() => removePair(setEnvVars, index)} className="text-xs text-ink-500">
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addPair(setEnvVars)} className="text-xs font-semibold text-ink-700">
                  + Add variable
                </button>
                <p className="text-xs text-ink-500">Use {'{{VAR}}'} in endpoint, headers, or body.</p>
              </div>
            </div>
          )}

          {requestTab === 'pre' && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Pre-request Script</p>
                <p className="mt-2 text-xs text-ink-500">
                  Return an object with optional fields: env, headers, params, body, endpoint.
                </p>
              </div>
              <textarea
                rows="6"
                value={preRequestScript}
                onChange={(event) => setPreRequestScript(event.target.value)}
                placeholder={`return {\n  env: { BASE_URL: 'https://api.example.com' },\n  headers: { 'X-Trace': 'true' },\n  params: { q: 'search' }\n}`}
                className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-mint-400"
              />
              {preRequestError && (
                <div className="rounded-lg border border-signal-400/40 bg-signal-400/10 px-3 py-2 text-xs text-ink-800">
                  {preRequestError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {responseMeta && (
        <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-600">Response</p>
              <p className="mt-2 text-sm text-ink-800">
                {responseMeta.method} {responseMeta.status} ({responseMeta.duration}ms)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {['json', 'raw', 'headers', 'html', 'image'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    previewMode === mode
                      ? 'bg-ink-900 text-fog-50'
                      : 'border border-fog-100 bg-white text-ink-700 hover:bg-fog-50'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {responseSummary && responseSummary.kind !== 'empty' && (
            <div className="mt-4 rounded-xl border border-fog-100 bg-fog-50 p-4 text-xs text-ink-800">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-600">Summary</p>
              {responseSummary.kind === 'array-object' && (
                <div className="mt-2">
                  <p className="text-[11px] text-ink-500">{responseSummary.count} items</p>
                  <div className="mt-2 overflow-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-ink-500">
                          {responseSummary.keys.map((key) => (
                            <th key={key} className="px-2 py-1 font-semibold">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {responseSummary.rows.map((row, idx) => (
                          <tr key={`row-${idx}`} className="border-t border-fog-100">
                            {row.map((cell, cellIdx) => (
                              <td key={`cell-${cellIdx}`} className="px-2 py-1 text-ink-700">
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
                  <p className="text-[11px] text-ink-500">{responseSummary.count} items</p>
                  <ul className="mt-2 space-y-1">
                    {responseSummary.items.map((item, idx) => (
                      <li key={`item-${idx}`} className="text-ink-700">
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
                      <span className="font-semibold text-ink-700">{entry.key}</span>
                      <span className="text-ink-600">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {responseSummary.kind === 'primitive' && (
                <p className="mt-2 text-ink-700">{responseSummary.value}</p>
              )}
            </div>
          )}
          <div className="mt-4 rounded-xl border border-fog-100 bg-ink-900 text-fog-50">
            {previewMode === 'headers' ? (
              <div className="px-4 py-4 text-xs">
                {Object.entries(responseMeta.headers || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span>{key}</span>
                    <span className="text-fog-300">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : previewMode === 'html' ? (
              <div className="bg-white">
                <iframe
                  title="html-preview"
                  sandbox=""
                  className="h-80 w-full rounded-xl bg-white"
                  srcDoc={responseText}
                />
              </div>
            ) : previewMode === 'image' ? (
              <div className="flex items-center justify-center bg-ink-900 px-4 py-4">
                {responseBlobUrl ? (
                  <img src={responseBlobUrl} alt="Response preview" className="max-h-80 rounded-lg" />
                ) : (
                  <p className="text-sm text-fog-200">No image response.</p>
                )}
              </div>
            ) : (
              <pre className="max-h-80 overflow-auto px-4 py-4 text-sm">
                <code>
                  {previewMode === 'raw'
                    ? responseText || (typeof response === 'string' ? response : JSON.stringify(response))
                    : typeof response === 'string'
                      ? response
                      : JSON.stringify(response, null, 2)}
                </code>
              </pre>
            )}
          </div>
        </div>
      )}

      {(history.length > 0 || collections.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-ink-900">History</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Last 12</span>
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
                        onClick={() => removeItem(history, setHistory, HISTORY_KEY, item.id)}
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
            <div className="mt-3 flex items-center gap-2">
              <input
                value={collectionName}
                onChange={(event) => setCollectionName(event.target.value)}
                placeholder="Collection name"
                className="w-full rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm text-ink-900"
              />
              <button
                type="button"
                onClick={saveCollection}
                className="rounded-lg border border-fog-100 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:bg-fog-50"
              >
                Save
              </button>
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
                        onClick={() => removeItem(collections, setCollections, COLLECTIONS_KEY, item.id)}
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
    </section>
  )
}

export default ApiTester
