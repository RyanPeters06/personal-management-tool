import { useState } from 'react'
import Button from './shared/Button'
import { useSyncStatus, signIn, signUp, signOut, reconcile, listSnapshots, restoreSnapshot } from '../store/sync'
import { Cloud, CloudOff, RefreshCw, LogOut, History, Check } from 'lucide-react'
import { format } from 'date-fns'

export default function SyncSettings() {
  const { configured, user, syncing, pendingChanges, lastSyncedAt, error } = useSyncStatus()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // signin | signup
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authNotice, setAuthNotice] = useState('')
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [restoredIdx, setRestoredIdx] = useState(null)

  const snapshots = showSnapshots ? listSnapshots() : []

  const submitAuth = async () => {
    setAuthError('')
    setAuthNotice('')
    setAuthLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
      } else {
        const u = await signUp(email.trim(), password)
        // If email confirmation is enabled in Supabase, there's no session yet
        if (u && !u.confirmed_at) setAuthNotice('Account created. If a confirmation email was sent, confirm it, then sign in.')
      }
      setPassword('')
    } catch (e) {
      setAuthError(e.message || 'Authentication failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRestore = (i) => {
    if (restoreSnapshot(i)) {
      setRestoredIdx(i)
      setTimeout(() => setRestoredIdx(null), 3000)
    }
  }

  if (!configured) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <CloudOff size={15} className="text-slate-400" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Cloud Sync</p>
        </div>
        <p className="text-xs text-slate-400">
          Not configured. Add <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to enable syncing between devices.
          Your data stays fully local until then.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Account */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Cloud size={15} className="text-slate-400" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Cloud Sync</p>
        </div>

        {user ? (
          <>
            <p className="text-xs text-slate-400 mb-3">
              Signed in as <span className="font-medium text-slate-600 dark:text-slate-300">{user.email}</span>.
              Your data syncs automatically between devices — a full local copy is always kept on this device.
            </p>

            {/* Sync status row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs">
                {syncing ? (
                  <span className="text-slate-400">Syncing…</span>
                ) : error ? (
                  <span className="text-red-500">Sync error: {error}</span>
                ) : pendingChanges ? (
                  <span className="text-amber-500">Changes waiting to sync (will send when online)</span>
                ) : lastSyncedAt ? (
                  <span className="text-green-600 dark:text-green-400">✓ Synced {format(lastSyncedAt, 'MMM d, h:mm a')}</span>
                ) : (
                  <span className="text-slate-400">Waiting for first sync…</span>
                )}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="xs" onClick={() => reconcile('manual')} disabled={syncing}>
                  <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Sync now
                </Button>
                <Button variant="ghost" size="xs" onClick={signOut}>
                  <LogOut size={12} /> Sign out
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">
              Sign in to sync your data between this device and your phone. Data stays fully local until you sign in.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                autoComplete="email"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitAuth() }}
              />
              {authError && <p className="text-xs text-red-500">{authError}</p>}
              {authNotice && <p className="text-xs text-green-600 dark:text-green-400">{authNotice}</p>}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setAuthError('') }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {mode === 'signin' ? 'Create an account instead' : 'Have an account? Sign in'}
                </button>
                <Button onClick={submitAuth} disabled={!email.trim() || !password || authLoading}>
                  {authLoading ? 'Working…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Local snapshots */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={15} className="text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Local Snapshots</p>
          </div>
          <button
            onClick={() => setShowSnapshots(!showSnapshots)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showSnapshots ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Automatic safety copies taken before sync ever overwrites this device. Restore one if something looks wrong.
        </p>
        {showSnapshots && (
          <div className="mt-3 space-y-2">
            {snapshots.length === 0 && <p className="text-xs text-slate-400 italic">No snapshots yet.</p>}
            {snapshots.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{format(new Date(s.at), 'MMM d, yyyy h:mm a')}</p>
                  <p className="text-xs text-slate-400 truncate">{s.reason}</p>
                </div>
                <Button variant="secondary" size="xs" onClick={() => handleRestore(i)}>
                  {restoredIdx === i ? <><Check size={12} /> Restored</> : 'Restore'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
