import { useState } from 'react'
import useStore from '../../store/useStore'
import { Plus, X } from 'lucide-react'

const PREDEFINED = ['Side Hustle', 'Work', 'Personal', 'Health', 'Finance']

const TAG_COLORS = {
  'Side Hustle': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Personal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Finance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
}

export const COLOR_OPTIONS = [
  { key: 'slate',  classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',     dot: '#94a3b8' },
  { key: 'red',    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',           dot: '#f87171' },
  { key: 'orange', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: '#fb923c' },
  { key: 'yellow', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', dot: '#facc15' },
  { key: 'green',  classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   dot: '#4ade80' },
  { key: 'teal',   classes: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',       dot: '#2dd4bf' },
  { key: 'blue',   classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',       dot: '#60a5fa' },
  { key: 'purple', classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', dot: '#c084fc' },
  { key: 'pink',   classes: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',       dot: '#f472b6' },
]

const COLOR_MAP = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.key, c.classes]))

export function tagColor(tag, customTagColors) {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  const colorKey = customTagColors?.[tag]
  return colorKey ? COLOR_MAP[colorKey] : COLOR_MAP.slate
}

export default function TagSelect({ value, onChange, multi = false, placeholder = 'Select tag' }) {
  const { settings, addCustomTag } = useStore()
  const [newTag, setNewTag] = useState('')
  const [selectedColor, setSelectedColor] = useState('slate')
  const [adding, setAdding] = useState(false)
  const allTags = [...PREDEFINED, ...(settings.customTags || [])]
  const customTagColors = settings.customTagColors || {}

  const toggle = (tag) => {
    if (!multi) {
      onChange(value === tag ? '' : tag)
      return
    }
    const arr = value || []
    onChange(arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag])
  }

  const isSelected = (tag) => multi ? (value || []).includes(tag) : value === tag

  const handleAdd = () => {
    const t = newTag.trim()
    if (!t || allTags.includes(t)) return
    addCustomTag(t, selectedColor)
    if (multi) onChange([...(value || []), t])
    else onChange(t)
    setNewTag('')
    setSelectedColor('slate')
    setAdding(false)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {!multi && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            !value ? 'text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          style={!value ? { backgroundColor: 'var(--accent-500)' } : {}}
        >
          None
        </button>
      )}
      {allTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            isSelected(tag) ? 'text-white' : `${tagColor(tag, customTagColors)} hover:opacity-80`
          }`}
          style={isSelected(tag) ? { backgroundColor: 'var(--accent-500)' } : {}}
        >
          {tag}
        </button>
      ))}
      {adding ? (
        <div className="flex flex-col gap-2 mt-1 p-2 bg-slate-50 dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-600">
          <input
            autoFocus
            className="border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none w-36"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Tag name"
          />
          <div className="flex items-center gap-1 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedColor(c.key)}
                className={`w-5 h-5 rounded-full transition-all ${selectedColor === c.key ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-300 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c.dot }}
                title={c.key}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={handleAdd} className="px-2 py-1 text-xs font-medium text-white rounded-md transition-colors" style={{ backgroundColor: 'var(--accent-500)' }}>Add</button>
            <button type="button" onClick={() => { setAdding(false); setNewTag(''); setSelectedColor('slate') }} className="p-1 text-slate-400 hover:text-slate-600"><X size={12} /></button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1"
        >
          <Plus size={10} /> New tag
        </button>
      )}
    </div>
  )
}
