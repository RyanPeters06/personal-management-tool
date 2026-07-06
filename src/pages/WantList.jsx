import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import TagSelect, { tagColor } from '../components/shared/TagSelect'
import { Plus, Trash2, Pencil, ExternalLink, ShoppingCart, X, Check, RotateCcw } from 'lucide-react'

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
    initial || { title: '', notes: '', options: [], timeframe: 'soon', tags: [], purchased: false }
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
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Timeframe</label>
        <select
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          value={form.timeframe || 'soon'}
          onChange={(e) => set('timeframe', e.target.value)}
        >
          <option value="soon">Soon — actively looking</option>
          <option value="eventually">Eventually — next few months</option>
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

function WantItemCard({ item, customTagColors, onEdit, onDelete, onMarkBought, onUndo, dimmed }) {
  const [showLinks, setShowLinks] = useState(false)
  const linkCount = item.options?.filter((o) => o.url).length || 0

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 group transition-opacity ${item.purchased ? 'opacity-60' : dimmed ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.purchased && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium shrink-0">Bought</span>
            )}
            <p className={`text-sm font-medium min-w-0 truncate ${item.purchased ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
              {item.title}
            </p>
          </div>
          {item.notes && <p className="text-xs text-slate-400 mt-1">{item.notes}</p>}
          {item.tags?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {item.tags.map((t) => (
                <span key={t} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(t, customTagColors)}`}>{t}</span>
              ))}
            </div>
          )}
          {linkCount > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowLinks(!showLinks)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <ExternalLink size={10} />
                {linkCount} {linkCount === 1 ? 'link' : 'links'}
                {showLinks ? <span className="ml-0.5">▲</span> : <span className="ml-0.5">▼</span>}
              </button>
              {showLinks && (
                <div className="mt-1.5 space-y-1 pl-1">
                  {item.options.filter((o) => o.url).map((opt, i) => (
                    <a
                      key={i}
                      href={opt.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-400 transition-colors"
                    >
                      <ExternalLink size={10} className="shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{opt.label || `Option ${i + 1}`}</span>
                      {opt.price && <span className="text-slate-400 shrink-0">{opt.price}</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {!item.purchased ? (
            <button
              onClick={onMarkBought}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              Mark Bought
            </button>
          ) : (
            <button
              onClick={onUndo}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors font-medium flex items-center gap-1"
            >
              <RotateCcw size={10} /> Undo
            </button>
          )}
          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
            <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WantList() {
  const { wantList, addWantItem, updateWantItem, deleteWantItem, settings } = useStore()
  const customTagColors = settings.customTagColors || {}
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const soon       = wantList.filter((i) => !i.purchased && (i.timeframe === 'soon' || !i.timeframe))
  const eventually = wantList.filter((i) => !i.purchased && i.timeframe === 'eventually')
  const purchased  = wantList.filter((i) => i.purchased)

  const filtered = filter === 'soon' ? soon
    : filter === 'eventually' ? eventually
    : filter === 'purchased' ? purchased
    : null // null = show grouped "all" view

  const cardProps = (item) => ({
    key: item.id,
    item,
    customTagColors,
    onEdit: () => setEditItem(item),
    onDelete: () => deleteWantItem(item.id),
    onMarkBought: () => updateWantItem(item.id, { purchased: true }),
    onUndo: () => updateWantItem(item.id, { purchased: false }),
  })

  const isEmpty = soon.length + eventually.length + purchased.length === 0

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
        {['all', 'soon', 'eventually', 'purchased'].map((f) => (
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

      {filter === 'all' ? (
        isEmpty ? (
          <div className="text-center py-16">
            <ShoppingCart size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Your want list is empty.</p>
          </div>
        ) : (
          <>
            {soon.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Soon</p>
                <div className="space-y-3">{soon.map((item) => <WantItemCard {...cardProps(item)} />)}</div>
              </div>
            )}
            {eventually.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Eventually</p>
                <div className="space-y-3">{eventually.map((item) => <WantItemCard {...cardProps(item)} />)}</div>
              </div>
            )}
            {purchased.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bought</p>
                <div className="space-y-3">{purchased.map((item) => <WantItemCard {...cardProps(item)} />)}</div>
              </div>
            )}
          </>
        )
      ) : (
        filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nothing here yet.</p>
          </div>
        ) : (
          <div className="space-y-3">{filtered.map((item) => <WantItemCard {...cardProps(item)} />)}</div>
        )
      )}

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
