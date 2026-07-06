// Client-side helper for Claude calls.
//
// Preferred path: POST to the /api/anthropic serverless proxy (the API key
// lives in Vercel env vars, never in this bundle).
// Fallback path: if no proxy is reachable (e.g. local dev) and the user has
// pasted their own key in Settings, call Anthropic directly from the client.

const API_BASE = import.meta.env.VITE_API_BASE || ''

// Deployed origins (Vercel, or Electron loading the deployed URL) are https —
// the proxy lives on the same origin there. Local dev is http://localhost.
function proxyLikelyAvailable() {
  if (API_BASE) return true
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
}

export function hasAIAccess(settings) {
  return proxyLikelyAvailable() || !!settings?.claudeApiKey
}

async function parseAnthropicError(res) {
  try {
    const data = await res.json()
    return data?.error?.message || data?.error || `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

async function callDirect({ model, max_tokens, system, messages }, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens, ...(system ? { system } : {}), messages }),
  })
  if (!res.ok) throw new Error(await parseAnthropicError(res))
  return res.json()
}

async function callProxy(payload, apiKey) {
  const res = await fetch(`${API_BASE}/api/anthropic`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // apiKey is only forwarded as an optional bring-your-own-key override
    body: JSON.stringify({ ...payload, ...(apiKey ? { apiKey } : {}) }),
  })
  if (!res.ok) {
    // 404/405 means no proxy at this origin (e.g. plain vite dev server)
    if (res.status === 404 || res.status === 405) {
      const err = new Error('proxy-unavailable')
      err.code = 'proxy-unavailable'
      throw err
    }
    throw new Error(await parseAnthropicError(res))
  }
  return res.json()
}

// payload: { model, max_tokens, system?, messages }
// settingsKey: optional user-provided key from Settings
export async function callAnthropic(payload, settingsKey) {
  if (proxyLikelyAvailable()) {
    try {
      return await callProxy(payload, settingsKey)
    } catch (e) {
      if (e.code !== 'proxy-unavailable' || !settingsKey) throw e
      // fall through to direct call with the user's own key
    }
  }
  if (!settingsKey) throw new Error('AI is not configured. Add your Claude API key in Settings, or use the deployed app.')
  return callDirect(payload, settingsKey)
}
