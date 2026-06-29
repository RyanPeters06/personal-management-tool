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

export function tagColor(tag) {
  return TAG_COLORS[tag] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
}

export default function TagSelect({ value, onChange, multi = false, placeholder = 'Select tag' }) {
  const { settings, addCustomTag } = useStore()
  const [newTag, setNewTag] = useState('')
  const [adding, setAdding] = useState(false)
  const allTags = [...PREDEFINED, ...(settings.customTags || [])]

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
    addCustomTag(t)
    if (multi) onChange([...(value || []), t])
    else onChange(t)
    setNewTag('')
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
            isSelected(tag) ? 'text-white' : `${tagColor(tag)} hover:opacity-80`
          }`}
          style={isSelected(tag) ? { backgroundColor: 'var(--accent-500)' } : {}}
        >
          {tag}
        </button>
      ))}
      {adding ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="border border-slate-200 dark:border-slate-600 rounded-full px-2.5 py-1 text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none w-24"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Tag name"
          />
          <button type="button" onClick={handleAdd} className="p-1 text-slate-400 hover:text-slate-600"><Plus size={12} /></button>
          <button type="button" onClick={() => setAdding(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={12} /></button>
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
