import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import { Moon, Sun } from 'lucide-react'

const ACCENTS = [
  { id: 'slate', label: 'Sky Blue', color: '#0ea5e9' },
  { id: 'sage', label: 'Sage Green', color: '#22c55e' },
  { id: 'violet', label: 'Violet', color: '#8b5cf6' },
  { id: 'rose', label: 'Rose', color: '#f43f5e' },
]

export default function Settings() {
  const { settings, updateSettings } = useStore()

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

      {/* About */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Life Manager</p>
        <p className="text-xs text-slate-400">Version 1.0.0 · All data stored locally on your machine</p>
      </div>
    </div>
  )
}
