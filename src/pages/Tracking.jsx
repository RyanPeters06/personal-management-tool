import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import { Plus, Trash2, Pencil, Check, Gamepad2, Tv, Clock } from 'lucide-react'
import { format, parseISO, differenceInDays, isToday, isPast } from 'date-fns'

const DEADLINE_CATS = ['sale', 'offer', 'event', 'other']
const CAT_COLORS = { sale: 'orange', offer: 'green', event: 'blue', other: 'slate' }
const GAME_PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'Other']
const STREAMING_SERVICES = ['Netflix', 'Disney+', 'Hulu', 'HBO Max', 'Apple TV+', 'Amazon Prime', 'YouTube', 'Other']
const WATCH_STATUS_COLORS = { want: 'slate', playing: 'blue', watching: 'blue', done: 'green' }

function countdownLabel(endDate) {
  const days = differenceInDays(parseISO(endDate), new Date())
  if (isPast(parseISO(endDate)) && !isToday(parseISO(endDate))) return { label: 'Expired', color: 'text-slate-400' }
  if (days === 0) return { label: 'Ends today!', color: 'text-red-500 font-semibold' }
  if (days <= 3) return { label: `${days}d left`, color: 'text-yellow-500 font-semibold' }
  return { label: `${days}d left`, color: 'text-green-600 dark:text-green-400' }
}

function DeadlineForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', endDate: '', notes: '', category: 'other' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Title</label>
        <input autoFocus className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          placeholder="e.g. Steam sale ends, Amazon promo expires" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">End Date</label>
          <input type="date" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
            value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
          <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.category} onChange={(e) => set('category', e.target.value)}>
            {DEADLINE_CATS.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes (optional)</label>
        <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title || !form.endDate}>Save</Button>
      </div>
    </div>
  )
}

function GameForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', platform: '', status: 'want', notes: '' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Game Title</label>
        <input autoFocus className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Game name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Platform</label>
          <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.platform} onChange={(e) => set('platform', e.target.value)}>
            <option value="">Any</option>
            {GAME_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
          <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="want">Want to Play</option>
            <option value="playing">Playing</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes (optional)</label>
        <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Save</Button>
      </div>
    </div>
  )
}

function ShowForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', service: '', status: 'want', notes: '' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Title</label>
        <input autoFocus className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Show or movie name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Where to Watch</label>
          <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.service} onChange={(e) => set('service', e.target.value)}>
            <option value="">Unknown</option>
            {STREAMING_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
          <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="want">Want to Watch</option>
            <option value="watching">Watching</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes (optional)</label>
        <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Save</Button>
      </div>
    </div>
  )
}

export default function Tracking() {
  const { deadlines, watchlist, addDeadline, updateDeadline, deleteDeadline,
    addGame, updateGame, deleteGame, addShow, updateShow, deleteShow } = useStore()
  const [tab, setTab] = useState('deadlines')
  const [showAddDeadline, setShowAddDeadline] = useState(false)
  const [editDeadline, setEditDeadline] = useState(null)
  const [showAddGame, setShowAddGame] = useState(false)
  const [editGame, setEditGame] = useState(null)
  const [showAddShow, setShowAddShow] = useState(false)
  const [editShow, setEditShow] = useState(null)
  const [gameFilter, setGameFilter] = useState('all')
  const [showFilter, setShowFilter] = useState('all')

  const sortedDeadlines = useMemo(() =>
    [...deadlines].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return a.endDate.localeCompare(b.endDate)
    }), [deadlines])

  const filteredGames = useMemo(() =>
    gameFilter === 'all' ? watchlist.games : watchlist.games.filter(g => g.status === gameFilter),
    [watchlist.games, gameFilter])

  const filteredShows = useMemo(() =>
    showFilter === 'all' ? watchlist.shows : watchlist.shows.filter(s => s.status === showFilter),
    [watchlist.shows, showFilter])

  const TABS = [
    { id: 'deadlines', label: 'Deadlines', icon: Clock },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'shows', label: 'Shows', icon: Tv },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Tracking" subtitle="Deadlines, games & shows" />

      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-sm mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${tab === id ? 'text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            style={tab === id ? { backgroundColor: 'var(--accent-500)' } : {}}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* DEADLINES */}
      {tab === 'deadlines' && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowAddDeadline(true)}><Plus size={14} /> Add Deadline</Button>
          </div>
          {sortedDeadlines.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-8">No deadlines yet</p>
          )}
          <div className="space-y-2">
            {sortedDeadlines.map((d) => {
              const cd = d.endDate ? countdownLabel(d.endDate) : null
              return (
                <div key={d.id} className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 group ${d.done ? 'opacity-50' : ''}`}>
                  <button
                    onClick={() => updateDeadline(d.id, { done: !d.done })}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${d.done ? 'border-transparent text-white' : 'border-slate-300 dark:border-slate-500'}`}
                    style={d.done ? { backgroundColor: 'var(--accent-500)', borderColor: 'var(--accent-500)' } : {}}
                  >
                    {d.done && <Check size={11} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium text-slate-700 dark:text-slate-200 ${d.done ? 'line-through' : ''}`}>{d.title}</p>
                      <Badge label={d.category} color={CAT_COLORS[d.category] || 'slate'} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {d.endDate && <span className="text-xs text-slate-400">{format(parseISO(d.endDate), 'MMM d, yyyy')}</span>}
                      {d.notes && <span className="text-xs text-slate-400 truncate">· {d.notes}</span>}
                    </div>
                  </div>
                  {cd && !d.done && <span className={`text-xs shrink-0 ${cd.color}`}>{cd.label}</span>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditDeadline(d)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                    <button onClick={() => deleteDeadline(d.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* GAMES */}
      {tab === 'games' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-xs">
              {['all', 'want', 'playing', 'done'].map((f) => (
                <button key={f} onClick={() => setGameFilter(f)}
                  className={`px-3 py-1.5 capitalize transition-colors ${gameFilter === f ? 'text-white font-medium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  style={gameFilter === f ? { backgroundColor: 'var(--accent-500)' } : {}}>
                  {f === 'want' ? 'Want' : f === 'playing' ? 'Playing' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowAddGame(true)}><Plus size={14} /> Add Game</Button>
          </div>
          {filteredGames.length === 0 && <p className="text-sm text-slate-400 italic text-center py-8">No games here</p>}
          <div className="space-y-2">
            {filteredGames.map((g) => (
              <div key={g.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 group">
                <Gamepad2 size={16} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{g.title}</p>
                    {g.platform && <Badge label={g.platform} color="slate" />}
                    <Badge label={g.status === 'want' ? 'Want to Play' : g.status === 'playing' ? 'Playing' : 'Done'} color={WATCH_STATUS_COLORS[g.status]} />
                  </div>
                  {g.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{g.notes}</p>}
                </div>
                <select
                  className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-transparent text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  value={g.status}
                  onChange={(e) => updateGame(g.id, { status: e.target.value })}
                >
                  <option value="want">Want to Play</option>
                  <option value="playing">Playing</option>
                  <option value="done">Done</option>
                </select>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditGame(g)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                  <button onClick={() => deleteGame(g.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SHOWS */}
      {tab === 'shows' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-xs">
              {['all', 'want', 'watching', 'done'].map((f) => (
                <button key={f} onClick={() => setShowFilter(f)}
                  className={`px-3 py-1.5 capitalize transition-colors ${showFilter === f ? 'text-white font-medium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  style={showFilter === f ? { backgroundColor: 'var(--accent-500)' } : {}}>
                  {f === 'want' ? 'Want' : f === 'watching' ? 'Watching' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowAddShow(true)}><Plus size={14} /> Add Show</Button>
          </div>
          {filteredShows.length === 0 && <p className="text-sm text-slate-400 italic text-center py-8">No shows here</p>}
          <div className="space-y-2">
            {filteredShows.map((s) => (
              <div key={s.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 group">
                <Tv size={16} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.title}</p>
                    {s.service && <Badge label={s.service} color="purple" />}
                    <Badge label={s.status === 'want' ? 'Want to Watch' : s.status === 'watching' ? 'Watching' : 'Done'} color={WATCH_STATUS_COLORS[s.status]} />
                  </div>
                  {s.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{s.notes}</p>}
                </div>
                <select
                  className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-transparent text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  value={s.status}
                  onChange={(e) => updateShow(s.id, { status: e.target.value })}
                >
                  <option value="want">Want to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="done">Done</option>
                </select>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditShow(s)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                  <button onClick={() => deleteShow(s.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddDeadline && (
        <Modal title="Add Deadline" onClose={() => setShowAddDeadline(false)}>
          <DeadlineForm onSave={(f) => { addDeadline(f); setShowAddDeadline(false) }} onCancel={() => setShowAddDeadline(false)} />
        </Modal>
      )}
      {editDeadline && (
        <Modal title="Edit Deadline" onClose={() => setEditDeadline(null)}>
          <DeadlineForm initial={editDeadline} onSave={(f) => { updateDeadline(editDeadline.id, f); setEditDeadline(null) }} onCancel={() => setEditDeadline(null)} />
        </Modal>
      )}
      {showAddGame && (
        <Modal title="Add Game" onClose={() => setShowAddGame(false)}>
          <GameForm onSave={(f) => { addGame(f); setShowAddGame(false) }} onCancel={() => setShowAddGame(false)} />
        </Modal>
      )}
      {editGame && (
        <Modal title="Edit Game" onClose={() => setEditGame(null)}>
          <GameForm initial={editGame} onSave={(f) => { updateGame(editGame.id, f); setEditGame(null) }} onCancel={() => setEditGame(null)} />
        </Modal>
      )}
      {showAddShow && (
        <Modal title="Add Show / Movie" onClose={() => setShowAddShow(false)}>
          <ShowForm onSave={(f) => { addShow(f); setShowAddShow(false) }} onCancel={() => setShowAddShow(false)} />
        </Modal>
      )}
      {editShow && (
        <Modal title="Edit Show / Movie" onClose={() => setEditShow(null)}>
          <ShowForm initial={editShow} onSave={(f) => { updateShow(editShow.id, f); setEditShow(null) }} onCancel={() => setEditShow(null)} />
        </Modal>
      )}
    </div>
  )
}
