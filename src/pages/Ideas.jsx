import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { Plus, Trash2, Lightbulb, Search } from 'lucide-react'

const CATEGORY_COLORS = {
  startup: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  build: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  creative: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const CATEGORIES = ['startup', 'build', 'creative', 'other']

export default function Ideas() {
  const { ideas, addIdea, updateIdea, deleteIdea } = useStore()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [bodyDraft, setBodyDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const titleRef = useRef(null)
  const bodyRef = useRef(null)

  const filtered = ideas.filter((i) =>
    !search ||
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const selected = ideas.find((i) => i.id === selectedId)

  useEffect(() => {
    if (selected) {
      setTitleDraft(selected.title)
      setBodyDraft(selected.description || '')
    }
  }, [selectedId])

  useEffect(() => {
    if (!selectedId && ideas.length > 0) setSelectedId(ideas[0].id)
  }, [ideas.length])

  function handleNew() {
    addIdea({ title: 'Untitled', description: '', category: 'other', status: 'raw', tags: [] })
    setTimeout(() => {
      const all = useStore.getState().ideas
      const newest = all[all.length - 1]
      if (newest) {
        setSelectedId(newest.id)
        setTitleDraft('Untitled')
        setBodyDraft('')
        setTimeout(() => titleRef.current?.select(), 50)
      }
    }, 0)
  }

  function saveTitle() {
    if (!selected) return
    const val = titleDraft.trim() || 'Untitled'
    if (val !== selected.title) updateIdea(selected.id, { title: val })
    if (!titleDraft.trim()) setTitleDraft('Untitled')
  }

  function saveBody() {
    if (!selected) return
    if (bodyDraft !== (selected.description || '')) updateIdea(selected.id, { description: bodyDraft })
  }

  function handleDelete(id) {
    if (confirmDelete === id) {
      const idx = ideas.findIndex((i) => i.id === id)
      deleteIdea(id)
      const remaining = ideas.filter((i) => i.id !== id)
      setSelectedId(remaining[Math.min(idx, remaining.length - 1)]?.id || null)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  function autoResize(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => {
    autoResize(bodyRef.current)
  }, [bodyDraft])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800">
        <div className="px-3 pt-4 pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ideas</span>
            <button
              onClick={handleNew}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="New idea"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              placeholder="Search ideas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Lightbulb size={24} className="text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">{search ? 'No results' : 'No ideas yet'}</p>
            </div>
          )}
          {filtered.map((idea) => (
            <button
              key={idea.id}
              onClick={() => setSelectedId(idea.id)}
              className={`w-full text-left px-3 py-2.5 transition-colors group relative ${
                selectedId === idea.id
                  ? 'bg-slate-100 dark:bg-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate pr-6">
                {idea.title || 'Untitled'}
              </p>
              {idea.description && (
                <p className="text-xs text-slate-400 truncate mt-0.5 leading-tight">{idea.description}</p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(idea.id) }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-all ${
                  confirmDelete === idea.id
                    ? 'text-red-500 opacity-100'
                    : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-400'
                }`}
                title={confirmDelete === idea.id ? 'Click again to confirm' : 'Delete'}
              >
                <Trash2 size={12} />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
        {selected ? (
          <div className="flex-1 overflow-y-auto px-10 py-8 max-w-3xl w-full mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <select
                value={selected.category || 'other'}
                onChange={(e) => updateIdea(selected.id, { category: e.target.value })}
                className={`text-xs px-2.5 py-1 rounded-full border-0 outline-none font-medium cursor-pointer ${CATEGORY_COLORS[selected.category || 'other']}`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              {selected.createdAt && (
                <span className="text-xs text-slate-400">
                  {new Date(selected.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            <input
              ref={titleRef}
              className="w-full text-2xl font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none border-none placeholder:text-slate-300 dark:placeholder:text-slate-600 mb-5"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); bodyRef.current?.focus() } }}
              placeholder="Idea title"
            />

            <textarea
              ref={bodyRef}
              className="w-full bg-transparent outline-none border-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none min-h-[400px]"
              value={bodyDraft}
              onChange={(e) => { setBodyDraft(e.target.value); autoResize(e.target) }}
              onBlur={saveBody}
              placeholder="Start writing..."
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <Lightbulb size={40} className="text-slate-200 dark:text-slate-700 mb-4" />
            <p className="text-sm text-slate-400 mb-4">Select an idea or create a new one</p>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--accent-500)' }}
            >
              <Plus size={15} /> New Idea
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
