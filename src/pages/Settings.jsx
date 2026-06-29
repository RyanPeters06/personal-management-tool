import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import { Moon, Sun, Eye, EyeOff } from 'lucide-react'

const ACCENTS = [
  { id: 'slate', label: 'Sky Blue', color: '#0ea5e9' },
  { id: 'sage', label: 'Sage Green', color: '#22c55e' },
  { id: 'violet', label: 'Violet', color: '#8b5cf6' },
  { id: 'rose', label: 'Rose', color: '#f43f5e' },
]

export default function Settings() {
  const { settings, updateSettings } = useStore()
  const [showKey, setShowKey] = useState(false)
  const [keyDraft, setKeyDraft] = useState(settings.claudeApiKey || '')

  return (
    <div className="p-6 max-w-lg mx-auto">
      <PageHeader title="Settings" subtitle="Customize your experience" />

      {/* Dark mode */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
            <p className="text-xs text-slate-400 mt-0.5">Switch between light and dark theme</p>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`relative w-11 h-6 rounded-full transition-colors`}
            style={{ backgroundColor: settings.darkMode ? 'var(--accent-500)' : '#cbd5e1' }}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform flex items-center justify-center ${settings.darkMode ? 'translate-x-5' : ''}`}
            >
              {settings.darkMode ? <Moon size={9} className="text-slate-500" /> : <Sun size={9} className="text-yellow-500" />}
            </span>
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Accent Color</p>
        <div className="flex gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => updateSettings({ accent: a.id })}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-8 h-8 rounded-full transition-all ${settings.accent === a.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                style={{ backgroundColor: a.color }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Claude API Key */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Claude API Key</p>
        <p className="text-xs text-slate-400 mb-3">Required for AI Import. Get yours at <span className="font-medium">console.anthropic.com</span>. Stored locally only, never synced.</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400 pr-9"
              placeholder="sk-ant-..."
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Button onClick={() => updateSettings({ claudeApiKey: keyDraft })}>Save</Button>
        </div>
        {settings.claudeApiKey && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ API key saved</p>
        )}
      </div>

      {/* About */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Life Manager</p>
        <p className="text-xs text-slate-400">Version 1.0.0 · All data stored locally on your machine</p>
      </div>
    </div>
  )
}
