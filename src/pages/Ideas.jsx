import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { Plus, Trash2, StickyNote, Search, ArrowLeft } from 'lucide-react'

// Two sections: general notes and ideas. Both live in the `ideas` store array,
// distinguished by noteType ('general' | 'idea'). Legacy items have no
// noteType and are treated as ideas.
const SECTIONS = [
  { key: 'general', label: 'General', empty: 'No notes yet', noun: 'note' },
  { key: 'idea', label: 'Ideas', empty: 'No ideas yet', noun: 'idea' },
]

export default function Ideas() {
  const { ideas, addIdea, updateIdea, deleteIdea } = useStore()
  const [section, setSection] = useState('general')
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [bodyDraft, setBodyDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [mobileView, setMobileView] = useState('list')
  const titleRef = useRef(null)
  const bodyRef = useRef(null)

  const sectionMeta = SECTIONS.find((s) => s.key === section)
  const noteTypeOf = (i) => i.noteType || 'idea'

  const inSection = ideas.filter((i) => noteTypeOf(i) === section)
  const filtered = inSection.filter((i) =>
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

  // When switching section, clear selection if it doesn't belong to it
  useEffect(() => {
    if (selected && noteTypeOf(selected) !== section) setSelectedId(null)
  }, [section])

  function handleNew() {
    addIdea({ title: 'Untitled', description: '', noteType: section, status: 'raw', tags: [] })
    setTimeout(() => {
      const all = useStore.getState().ideas
      const newest = all[all.length - 1]
      if (newest) {
        setSelectedId(newest.id)
        setTitleDraft('Untitled')
        setBodyDraft('')
        setMobileView('editor')
        setTimeout(() => titleRef.current?.select(), 50)
      }
    }, 0)
  }

  function openNote(id) {
    setSelectedId(id)
    setMobileView('editor')
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
      const idx = inSection.findIndex((i) => i.id === id)
      deleteIdea(id)
      const remaining = inSection.filter((i) => i.id !== id)
      setSelectedId(remaining[Math.min(idx, remaining.length - 1)]?.id || null)
      setConfirmDelete(null)
      setMobileView('list')
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
      <div className={`${mobileView === 'editor' ? 'hidden md:flex' : 'flex'} w-full md:w-64 shrink-0 border-r border-slate-200 dark:border-slate-700 flex-col bg-white dark:bg-slate-800`}>
        <div className="px-3 pt-4 pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</span>
            <button
              onClick={handleNew}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={`New ${sectionMeta.noun}`}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Section toggle */}
          <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 mb-2">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => { setSection(s.key); setSearch('') }}
                className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  section === s.key ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                style={section === s.key ? { backgroundColor: 'var(--accent-500)' } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              placeholder={`Search ${sectionMeta.label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <StickyNote size={24} className="text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">{search ? 'No results' : sectionMeta.empty}</p>
            </div>
          )}
          {filtered.map((note) => (
            <div
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => openNote(note.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') openNote(note.id) }}
              className={`w-full text-left px-3 py-2.5 transition-colors group relative cursor-pointer ${
                selectedId === note.id
                  ? 'bg-slate-100 dark:bg-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate pr-6">
                {note.title || 'Untitled'}
              </p>
              {note.description && (
                <p className="text-xs text-slate-400 truncate mt-0.5 leading-tight">{note.description}</p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-all ${
                  confirmDelete === note.id
                    ? 'text-red-500 opacity-100'
                    : 'text-slate-300 opacity-100 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100'
                }`}
                title={confirmDelete === note.id ? 'Click again to confirm' : 'Delete'}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — editor */}
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-900`}>
        {selected ? (
          <div className="flex-1 overflow-y-auto px-5 md:px-10 py-6 md:py-8 max-w-3xl w-full mx-auto">
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-4"
            >
              <ArrowLeft size={14} /> All {noteTypeOf(selected) === 'idea' ? 'ideas' : 'notes'}
            </button>

            {selected.createdAt && (
              <p className="text-xs text-slate-400 mb-4">
                {new Date(selected.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            <input
              ref={titleRef}
              className="w-full text-2xl font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none border-none placeholder:text-slate-300 dark:placeholder:text-slate-600 mb-5"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); bodyRef.current?.focus() } }}
              placeholder={noteTypeOf(selected) === 'idea' ? 'Idea title' : 'Note title'}
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
            <StickyNote size={40} className="text-slate-200 dark:text-slate-700 mb-4" />
            <p className="text-sm text-slate-400 mb-4">Select a {sectionMeta.noun} or create a new one</p>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--accent-500)' }}
            >
              <Plus size={15} /> New {sectionMeta.label === 'Ideas' ? 'Idea' : 'Note'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
