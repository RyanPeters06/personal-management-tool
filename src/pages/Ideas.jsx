import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import TagSelect, { tagColor } from '../components/shared/TagSelect'
import { Plus, Trash2, Pencil, Lightbulb } from 'lucide-react'

const CATEGORIES = ['startup', 'build', 'creative', 'other']
const STATUSES = ['raw', 'exploring', 'archived']

const CATEGORY_COLORS = {
  startup: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  build: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  creative: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const STATUS_BADGE = { raw: 'slate', exploring: 'green', archived: 'yellow' }

function IdeaForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { title: '', description: '', category: 'other', status: 'raw', tags: [] }
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Title</label>
        <input
          autoFocus
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Idea title"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Description</label>
        <textarea
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none resize-none"
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Describe the idea..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
          <select
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
          <select
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Tags</label>
        <TagSelect value={form.tags} onChange={(v) => set('tags', v)} multi />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title.trim()}>Save</Button>
      </div>
    </div>
  )
}

export default function Ideas() {
  const { ideas, addIdea, updateIdea, deleteIdea } = useStore()
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editIdea, setEditIdea] = useState(null)

  const filtered = ideas.filter((i) => filter === 'all' || i.category === filter || i.status === filter)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Ideas"
        subtitle="Brain dump — startup ideas, build ideas, or just something silly"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Idea
          </Button>
        }
      />

      {/* Filter */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {['all', ...CATEGORIES, ...STATUSES].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
              filter === f
                ? 'text-white border-transparent'
                : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            style={filter === f ? { backgroundColor: 'var(--accent-500)' } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Lightbulb size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No ideas yet — let the brain dump begin.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((idea) => (
          <div key={idea.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{idea.title}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[idea.category]}`}>
                    {idea.category}
                  </span>
                  <Badge color={STATUS_BADGE[idea.status]}>{idea.status}</Badge>
                </div>
                {idea.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{idea.description}</p>
                )}
                {idea.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {idea.tags.map((t) => (
                      <span key={t} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(t)}`}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => setEditIdea(idea)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                <button onClick={() => deleteIdea(idea.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Add Idea" onClose={() => setShowAdd(false)}>
          <IdeaForm onSave={(f) => { addIdea(f); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}

      {editIdea && (
        <Modal title="Edit Idea" onClose={() => setEditIdea(null)}>
          <IdeaForm
            initial={editIdea}
            onSave={(f) => { updateIdea(editIdea.id, f); setEditIdea(null) }}
            onCancel={() => setEditIdea(null)}
          />
        </Modal>
      )}
    </div>
  )
}
