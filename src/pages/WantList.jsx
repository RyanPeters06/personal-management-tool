import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import TagSelect, { tagColor } from '../components/shared/TagSelect'
import { Plus, Trash2, Pencil, ExternalLink, ShoppingCart, X, Check } from 'lucide-react'

const PRIORITY_COLORS = { high: 'red', medium: 'yellow', low: 'slate' }

function OptionRow({ option, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <input
        className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
        placeholder="Label (e.g. Amazon)"
        value={option.label}
        onChange={(e) => onChange({ ...option, label: e.target.value })}
      />
      <input
        className="flex-[2] border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
        placeholder="URL"
        value={option.url}
        onChange={(e) => onChange({ ...option, url: e.target.value })}
      />
      <input
        className="w-20 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
        placeholder="Price"
        value={option.price}
        onChange={(e) => onChange({ ...option, price: e.target.value })}
      />
      <button type="button" onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500"><X size={12} /></button>
    </div>
  )
}

function WantItemForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { title: '', notes: '', options: [], priority: 'medium', tags: [], purchased: false }
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addOption = () => set('options', [...form.options, { label: '', url: '', price: '' }])
  const updateOption = (i, val) => set('options', form.options.map((o, idx) => idx === i ? val : o))
  const removeOption = (i) => set('options', form.options.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Item Name</label>
        <input
          autoFocus
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="What do you want?"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes (optional)</label>
        <textarea
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none resize-none"
          rows={2}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Priority</label>
        <select
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          value={form.priority}
          onChange={(e) => set('priority', e.target.value)}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Where to buy (URL options)</label>
          <button type="button" onClick={addOption} className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600">
            <Plus size={11} /> Add option
          </button>
        </div>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <OptionRow key={i} option={opt} onChange={(v) => updateOption(i, v)} onDelete={() => removeOption(i)} />
          ))}
          {form.options.length === 0 && (
            <p className="text-xs text-slate-400 italic">No URL options yet — click "Add option" to add links.</p>
          )}
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

export default function WantList() {
  const { wantList, addWantItem, updateWantItem, deleteWantItem } = useStore()
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const filtered = wantList.filter((i) => {
    if (filter === 'pending') return !i.purchased
    if (filter === 'purchased') return i.purchased
    return true
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Want List"
        subtitle="Things you want to buy, with links to compare options"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Item
          </Button>
        }
      />

      <div className="flex gap-1 mb-5 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 w-fit">
        {['all', 'pending', 'purchased'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              filter === f ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            style={filter === f ? { backgroundColor: 'var(--accent-500)' } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ShoppingCart size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Your want list is empty.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 group ${item.purchased ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => updateWantItem(item.id, { purchased: !item.purchased })}
                  className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                    item.purchased ? 'border-transparent' : 'border-slate-300 dark:border-slate-500'
                  }`}
                  style={item.purchased ? { backgroundColor: 'var(--accent-500)' } : {}}
                  title={item.purchased ? 'Mark as pending' : 'Mark as purchased'}
                >
                  {item.purchased && <Check size={11} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${item.purchased ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {item.title}
                    </p>
                    <Badge color={PRIORITY_COLORS[item.priority]}>{item.priority}</Badge>
                  </div>
                  {item.notes && <p className="text-xs text-slate-400 mt-1">{item.notes}</p>}
                  {item.options?.filter((o) => o.url).length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.options.filter((o) => o.url).map((opt, i) => (
                        <a
                          key={i}
                          href={opt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-400 transition-colors"
                        >
                          <ExternalLink size={10} />
                          {opt.label || `Option ${i + 1}`}
                          {opt.price && <span className="text-slate-400">· {opt.price}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                  {item.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.tags.map((t) => (
                        <span key={t} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(t)}`}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => setEditItem(item)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                <button onClick={() => deleteWantItem(item.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Add to Want List" onClose={() => setShowAdd(false)}>
          <WantItemForm onSave={(f) => { addWantItem(f); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}

      {editItem && (
        <Modal title="Edit Item" onClose={() => setEditItem(null)}>
          <WantItemForm
            initial={editItem}
            onSave={(f) => { updateWantItem(editItem.id, f); setEditItem(null) }}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}
    </div>
  )
}
