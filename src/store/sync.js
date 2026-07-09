// ─── Cloud sync layer (Supabase) ─────────────────────────────────────────────
// Offline-first, whole-document sync with newest-wins conflict handling and
// automatic local snapshots before any remote-driven overwrite.
//
// The local copy (electron-store / localStorage) is ALWAYS written first by
// useStore.save(); this layer only mirrors it to Supabase and pulls newer
// copies down. If Supabase isn't configured or the user isn't signed in,
// everything here is a no-op and the app behaves exactly as before.

import { create } from 'zustand'
import { supabase, syncConfigured } from '../lib/supabase'
import useStore, { serializeData, setOnLocalSave, setOnExplicitWipe } from './useStore'

const META_KEY = 'lifeManagerSyncMeta'
const BACKUPS_KEY = 'lifeManagerBackups'
const MAX_BACKUPS = 10
const PUSH_DEBOUNCE_MS = 1500
const RECONCILE_MIN_INTERVAL_MS = 2000

// The Claude API key is a local-only secret and must never leave the device —
// strip it from anything sent to the cloud (clone first, never mutate state).
function forCloud(data) {
  return { ...data, settings: { ...data.settings, claudeApiKey: '' } }
}

// Does this dataset contain any real user content? A fresh device (new
// browser profile, freshly installed PWA, new machine) starts empty — it must
// NEVER be allowed to overwrite a cloud copy that has real data in it, no
// matter what its timestamps claim.
export function isMeaningful(d) {
  if (!d) return false
  const counts = [
    d.tasks?.length,
    d.projects?.length,
    d.ideas?.length,
    d.wantList?.length,
    d.deadlines?.length,
    d.goals?.length,
    d.journal?.entries?.length,
    d.calendar?.events?.length,
    d.finance?.subscriptions?.length,
    d.finance?.expenses?.length,
    d.finance?.moneyTracker?.owed?.length,
    d.finance?.moneyTracker?.incoming?.length,
    d.watchlist?.games?.length,
    d.watchlist?.shows?.length,
    d.workouts?.sessions?.length,
    d.workouts?.logs?.length,
    ...(d.todos?.categories || []).map((c) => c.tasks?.length),
  ]
  return counts.some((n) => (n || 0) > 0)
}

// Explicit wipes are the ONE legitimate way an empty dataset may replace a
// meaningful cloud copy. useStore's wipe actions call this (via injection) to
// open a short window in which an empty push is allowed.
let emptyPushAllowedUntil = 0
export function allowEmptyPush() {
  emptyPushAllowedUntil = Date.now() + 15000
}
const emptyPushAuthorized = () => Date.now() < emptyPushAllowedUntil

// What we last learned about the cloud copy (null = never checked)
let remoteMeaningful = null

// ─── Sync status (subscribable from UI) ──────────────────────────────────────

export const useSyncStatus = create(() => ({
  configured: syncConfigured,
  user: null,          // supabase user or null
  syncing: false,
  pendingChanges: false,
  lastSyncedAt: null,  // ms timestamp
  error: '',
}))

const setStatus = (patch) => useSyncStatus.setState(patch)

// ─── Local metadata (updatedAt / dirty / deviceId) ───────────────────────────

function loadMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY)) || {}
  } catch {
    return {}
  }
}

function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

function getDeviceId() {
  const meta = loadMeta()
  if (!meta.deviceId) {
    meta.deviceId = 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    saveMeta(meta)
  }
  return meta.deviceId
}

// Data that existed locally before sync was ever added has no updatedAt.
// Stamp it with "now" so real pre-existing data competes fairly by recency —
// but ONLY if the local data is actually meaningful. Stamping an empty fresh
// device would make its empty dataset look newest and let it wipe the cloud
// (this exact bug caused a data loss once; content-aware reconcile rules now
// guard it from both directions).
function ensureLocalTimestamp() {
  const meta = loadMeta()
  if (!meta.updatedAt && isMeaningful(serializeData(useStore.getState()))) {
    meta.updatedAt = Date.now()
    saveMeta(meta)
  }
}

// ─── Local snapshots (ring buffer, written before any overwrite) ─────────────

export function listSnapshots() {
  try {
    return JSON.parse(localStorage.getItem(BACKUPS_KEY)) || []
  } catch {
    return []
  }
}

function takeSnapshot(data, reason) {
  try {
    // Never bother snapshotting empty data, and skip duplicates of the most
    // recent snapshot — repeated reconciles must not churn real backups out
    // of the ring buffer.
    if (!isMeaningful(data)) return
    const backups = listSnapshots()
    const serialized = JSON.stringify(data)
    if (backups[0] && JSON.stringify(backups[0].data) === serialized) return
    backups.unshift({ at: new Date().toISOString(), reason, data })
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups.slice(0, MAX_BACKUPS)))
  } catch (e) {
    // Snapshot failure must never block sync — but surface it
    console.warn('Snapshot failed:', e)
  }
}

export function restoreSnapshot(index) {
  const snap = listSnapshots()[index]
  if (!snap) return false
  useStore.getState().restoreFromBackup(snap.data)
  return true
}

// ─── Push (local → remote) ───────────────────────────────────────────────────

let pushTimer = null
let applyingRemote = false

async function pushNow() {
  if (!supabase) return
  const session = (await supabase.auth.getSession()).data.session
  if (!session) return

  const meta = loadMeta()
  const data = forCloud(serializeData(useStore.getState()))

  // HARD GUARD: never push an empty dataset over a cloud copy that has (or
  // may have) real data, unless the user explicitly wiped their data. A fresh
  // device syncing down is the correct flow — overwriting up never is.
  if (!isMeaningful(data) && remoteMeaningful !== false && !emptyPushAuthorized()) {
    setStatus({
      syncing: false,
      error: 'Sync paused: this device has no data, so it will not overwrite the cloud copy. It will download the cloud data instead.',
    })
    reconcile('empty-local-guard')
    return
  }

  const ts = meta.updatedAt || Date.now()

  setStatus({ syncing: true, error: '' })
  const { error } = await supabase.from('app_data').upsert({
    user_id: session.user.id,
    data,
    updated_at: new Date(ts).toISOString(),
    device_id: getDeviceId(),
  })
  if (error) {
    setStatus({ syncing: false, error: error.message, pendingChanges: true })
    return
  }
  const m = loadMeta()
  m.dirty = false
  saveMeta(m)
  setStatus({ syncing: false, pendingChanges: false, lastSyncedAt: Date.now(), error: '' })
}

function schedulePush() {
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    if (navigator.onLine) pushNow()
  }, PUSH_DEBOUNCE_MS)
}

// Called by useStore.save() after every local write
function handleLocalSave() {
  if (applyingRemote) return // change came from remote — don't echo it back
  const meta = loadMeta()
  meta.updatedAt = Date.now()
  meta.dirty = true
  saveMeta(meta)
  setStatus({ pendingChanges: true })
  schedulePush()
}

// ─── Pull / reconcile (remote ↔ local, newest wins, snapshot first) ─────────

let lastReconcileAt = 0
let reconciling = false

export async function reconcile(reason = 'manual') {
  if (!supabase || reconciling) return
  const now = Date.now()
  if (now - lastReconcileAt < RECONCILE_MIN_INTERVAL_MS && reason !== 'manual') return
  lastReconcileAt = now

  const session = (await supabase.auth.getSession()).data.session
  if (!session) return

  reconciling = true
  setStatus({ syncing: true, error: '' })
  try {
    const { data: row, error } = await supabase
      .from('app_data')
      .select('data, updated_at')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error) throw error

    const meta = loadMeta()
    const localTs = meta.updatedAt || 0
    const localData = serializeData(useStore.getState())
    const localHasData = isMeaningful(localData)
    remoteMeaningful = row ? isMeaningful(row.data) : false

    if (!row) {
      // First device to sync — seed the cloud with the local copy
      const m = loadMeta()
      m.updatedAt = m.updatedAt || Date.now()
      saveMeta(m)
      await pushNow()
      return
    }

    const remoteTs = new Date(row.updated_at).getTime()

    // ── Content-aware overrides (these outrank timestamps) ──────────────
    // An empty device NEVER beats a cloud copy with real data: always pull.
    // A device with real data ALWAYS beats an empty cloud copy: always push.
    // Timestamps only decide when both sides have real content (true
    // conflict) or both are empty (nothing at stake).
    const mustPull = remoteMeaningful && !localHasData && !emptyPushAuthorized()
    const mustPush = localHasData && !remoteMeaningful

    if (mustPush) {
      const m = loadMeta()
      m.updatedAt = m.updatedAt || Date.now()
      m.dirty = true
      saveMeta(m)
      await pushNow()
      return
    }

    if (mustPull || remoteTs > localTs) {
      // Remote is newer. Snapshot the local copy first — if we had unsynced
      // local changes this is a real conflict and the snapshot preserves them.
      takeSnapshot(
        serializeData(useStore.getState()),
        meta.dirty ? 'conflict — local changes replaced by newer cloud copy' : 'before applying cloud update'
      )
      // Keep this device's local-only API key — the cloud copy never has it.
      const localKey = useStore.getState().settings?.claudeApiKey || ''
      const incoming = { ...row.data, settings: { ...row.data.settings, claudeApiKey: localKey } }
      applyingRemote = true
      try {
        useStore.getState().restoreFromBackup(incoming)
      } finally {
        applyingRemote = false
      }
      const m = loadMeta()
      m.updatedAt = remoteTs
      m.dirty = false
      saveMeta(m)
      setStatus({ pendingChanges: false, lastSyncedAt: Date.now() })
    } else if (meta.dirty || localTs > remoteTs) {
      // Local is newer (or has queued offline changes) — it wins and overwrites
      // the cloud. If we had unsynced local changes AND the cloud copy differs,
      // this is a genuine conflict: snapshot the losing cloud copy first so it's
      // always recoverable (symmetric with the remote-wins path above).
      if (meta.dirty && JSON.stringify(row.data) !== JSON.stringify(forCloud(serializeData(useStore.getState())))) {
        takeSnapshot(row.data, 'conflict — cloud copy replaced by newer local changes')
      }
      await pushNow()
    } else {
      setStatus({ lastSyncedAt: Date.now() })
    }
  } catch (e) {
    setStatus({ error: e.message || 'Sync failed' })
  } finally {
    reconciling = false
    setStatus({ syncing: false })
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  if (!supabase) throw new Error('Sync is not configured.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signUp(email, password) {
  if (!supabase) throw new Error('Sync is not configured.')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data.user
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

// ─── Realtime (instant two-way updates when both devices are online) ────────

let realtimeChannel = null

function startRealtime(userId) {
  if (!supabase || realtimeChannel) return
  realtimeChannel = supabase
    .channel('app_data_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_data', filter: `user_id=eq.${userId}` },
      () => reconcile('realtime')
    )
    .subscribe()
}

function stopRealtime() {
  if (realtimeChannel) {
    supabase?.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

// ─── Init (call once at app start) ──────────────────────────────────────────

let initialized = false

export function initSync() {
  if (initialized || !supabase) return
  initialized = true

  ensureLocalTimestamp()
  setOnLocalSave(handleLocalSave)
  setOnExplicitWipe(allowEmptyPush)
  setStatus({ pendingChanges: !!loadMeta().dirty })

  supabase.auth.onAuthStateChange((_event, session) => {
    setStatus({ user: session?.user || null })
    if (session?.user) {
      startRealtime(session.user.id)
      reconcile('sign-in')
    } else {
      stopRealtime()
    }
  })

  // Reconcile when the app regains focus (covers "opens on device B")
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) reconcile('focus')
  })

  // Flush queued offline changes the moment connection returns
  window.addEventListener('online', () => reconcile('reconnect'))
}
