// Vercel serverless function — proxies Anthropic Messages API calls so the
// API key lives only in Vercel env vars and is never shipped to the client.

const ALLOWED_MODEL_PREFIX = 'claude-'
const MAX_TOKENS_CAP = 8192

// Optional gate: when PROXY_REQUIRE_AUTH is "true", only signed-in users (valid
// Supabase session token in the Authorization header) may use the server key.
// This stops anyone who discovers the URL from spending your Anthropic budget.
async function isAuthorized(req) {
  if (process.env.PROXY_REQUIRE_AUTH !== 'true') return true
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return false
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return false
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, authorization: `Bearer ${token}` },
    })
    return r.ok
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!(await isAuthorized(req))) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { model, max_tokens, system, messages, apiKey } = req.body || {}

  // Basic input validation — reject anything that isn't a sane Messages call
  if (typeof model !== 'string' || !model.startsWith(ALLOWED_MODEL_PREFIX)) {
    res.status(400).json({ error: 'Invalid model' })
    return
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages must be a non-empty array' })
    return
  }
  const tokens = Math.min(Number(max_tokens) || 1024, MAX_TOKENS_CAP)

  // Server key by default; optional bring-your-own-key override from Settings
  const key = (typeof apiKey === 'string' && apiKey.startsWith('sk-ant-')) ? apiKey : process.env.ANTHROPIC_API_KEY
  if (!key) {
    res.status(500).json({ error: 'No API key configured on the server' })
    return
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: tokens,
        ...(system ? { system } : {}),
        messages,
      }),
    })

    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (e) {
    res.status(502).json({ error: e?.message || 'Upstream request failed' })
  }
}
