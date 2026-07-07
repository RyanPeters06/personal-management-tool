import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import { Plus, Trash2, Pencil, Gamepad2, Tv, ChevronDown, ChevronRight, ListTree } from 'lucide-react'

const GAME_PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'Other']
const STREAMING_SERVICES = ['Netflix', 'Disney+', 'Hulu', 'HBO Max', 'Apple TV+', 'Amazon Prime', 'YouTube', 'Other']
const WATCH_STATUS_COLORS = { want: 'slate', playing: 'blue', watching: 'blue', done: 'green' }

function GameForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', platform: '', status: 'want', notes: '', isSeries: false })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Game Title</label>
        <input autoFocus className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Game or series name" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isSeries} onChange={(e) => set('isSeries', e.target.checked)} className="rounded" />
        <span className="text-sm text-slate-600 dark:text-slate-300">This is a series (e.g. Pokémon, Final Fantasy)</span>
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Save</Button>
      </div>
    </div>
  )
}

function SubGameForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', platform: '', status: 'want', notes: '' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Game Title</label>
        <input autoFocus className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Pokémon Red" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Platform (optional)</label>
          <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.platform} onChange={(e) => set('platform', e.target.value)}>
            <option value="">Same as series</option>
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
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Add</Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

function GameCard({ game }) {
  const { updateGame, deleteGame, addSubGame, updateSubGame, deleteSubGame } = useStore()
  const [expanded, setExpanded] = useState(false)
  const [editingGame, setEditingGame] = useState(false)
  const [addingSubGame, setAddingSubGame] = useState(false)

  const subGames = game.subGames || []
  const doneCount = subGames.filter((sg) => sg.status === 'done').length

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 group">
        <Gamepad2 size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{game.title}</p>
            {game.platform && <Badge label={game.platform} color="slate" />}
            {game.isSeries
              ? <Badge label={`Series · ${doneCount}/${subGames.length}`} color="purple" />
              : <Badge label={game.status === 'want' ? 'Want to Play' : game.status === 'playing' ? 'Playing' : 'Done'} color={WATCH_STATUS_COLORS[game.status]} />
            }
          </div>
          {game.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{game.notes}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
          {!game.isSeries && (
            <select
              className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-transparent text-slate-600 dark:text-slate-300"
              value={game.status}
              onChange={(e) => updateGame(game.id, { status: e.target.value })}
            >
              <option value="want">Want to Play</option>
              <option value="playing">Playing</option>
              <option value="done">Done</option>
            </select>
          )}
          <button onClick={() => setEditingGame(true)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
          <button onClick={() => deleteGame(game.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
          {game.isSeries && (
            <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
        {game.isSeries && (
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-400 shrink-0">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {game.isSeries && expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <ListTree size={11} /> Games in Series
            </p>
            <button
              onClick={() => setAddingSubGame(true)}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600"
            >
              <Plus size={11} /> Add game
            </button>
          </div>
          <div className="space-y-1.5">
            {subGames.map((sg) => (
              <div key={sg.id} className="flex items-center gap-2 group/sg pl-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sg.status === 'done' ? 'var(--accent-500)' : sg.status === 'playing' ? '#3b82f6' : '#cbd5e1' }} />
                <span className={`text-sm flex-1 min-w-0 truncate ${sg.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{sg.title}</span>
                {sg.platform && <span className="text-xs text-slate-400 shrink-0">{sg.platform}</span>}
                <select
                  className="text-xs border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 bg-transparent text-slate-500 dark:text-slate-400 opacity-0 group-hover/sg:opacity-100 transition-opacity"
                  value={sg.status}
                  onChange={(e) => updateSubGame(game.id, sg.id, { status: e.target.value })}
                >
                  <option value="want">Want</option>
                  <option value="playing">Playing</option>
                  <option value="done">Done</option>
                </select>
                <button onClick={() => deleteSubGame(game.id, sg.id)} className="opacity-0 group-hover/sg:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-opacity shrink-0">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            {subGames.length === 0 && <p className="text-xs text-slate-400 italic pl-2">No games added yet.</p>}
          </div>
        </div>
      )}

      {editingGame && (
        <Modal title="Edit Game" onClose={() => setEditingGame(false)}>
          <GameForm initial={game} onSave={(f) => { updateGame(game.id, f); setEditingGame(false) }} onCancel={() => setEditingGame(false)} />
        </Modal>
      )}
      {addingSubGame && (
        <Modal title={`Add game to ${game.title}`} onClose={() => setAddingSubGame(false)}>
          <SubGameForm onSave={(f) => { addSubGame(game.id, f); setAddingSubGame(false) }} onCancel={() => setAddingSubGame(false)} />
        </Modal>
      )}
    </div>
  )
}

export default function Library() {
  const { watchlist, addGame, updateShow, deleteShow, addShow } = useStore()
  const [tab, setTab] = useState('games')
  const [showAddGame, setShowAddGame] = useState(false)
  const [showAddShow, setShowAddShow] = useState(false)
  const [editShow, setEditShow] = useState(false)
  const [gameFilter, setGameFilter] = useState('all')
  const [showFilter, setShowFilter] = useState('all')

  const filteredGames = useMemo(() =>
    gameFilter === 'all' ? watchlist.games : watchlist.games.filter((g) => {
      if (g.isSeries) return true
      return g.status === gameFilter
    }),
    [watchlist.games, gameFilter])

  const filteredShows = useMemo(() =>
    showFilter === 'all' ? watchlist.shows : watchlist.shows.filter((s) => s.status === showFilter),
    [watchlist.shows, showFilter])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Library" subtitle="Games and shows you want to play or watch" />

      <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-sm mb-6 w-fit">
        {[{ id: 'games', label: 'Games', Icon: Gamepad2 }, { id: 'shows', label: 'Shows', Icon: Tv }].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${tab === id ? 'text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            style={tab === id ? { backgroundColor: 'var(--accent-500)' } : {}}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {tab === 'games' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-xs">
              {['all', 'want', 'playing', 'done'].map((f) => (
                <button key={f} onClick={() => setGameFilter(f)}
                  className={`px-3 py-1.5 capitalize transition-colors ${gameFilter === f ? 'text-white font-medium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  style={gameFilter === f ? { backgroundColor: 'var(--accent-500)' } : {}}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowAddGame(true)}><Plus size={14} /> Add Game</Button>
          </div>
          {filteredGames.length === 0 && <p className="text-sm text-slate-400 italic text-center py-8">No games here</p>}
          <div className="space-y-2">
            {filteredGames.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </>
      )}

      {tab === 'shows' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-xs">
              {['all', 'want', 'watching', 'done'].map((f) => (
                <button key={f} onClick={() => setShowFilter(f)}
                  className={`px-3 py-1.5 capitalize transition-colors ${showFilter === f ? 'text-white font-medium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  style={showFilter === f ? { backgroundColor: 'var(--accent-500)' } : {}}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
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
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.title}</p>
                    {s.service && <Badge label={s.service} color="purple" />}
                    <Badge label={s.status === 'want' ? 'Want to Watch' : s.status === 'watching' ? 'Watching' : 'Done'} color={WATCH_STATUS_COLORS[s.status]} />
                  </div>
                  {s.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{s.notes}</p>}
                </div>
                <select
                  className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-transparent text-slate-600 dark:text-slate-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                  value={s.status}
                  onChange={(e) => updateShow(s.id, { status: e.target.value })}
                >
                  <option value="want">Want to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="done">Done</option>
                </select>
                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setEditShow(s)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                  <button onClick={() => deleteShow(s.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddGame && (
        <Modal title="Add Game" onClose={() => setShowAddGame(false)}>
          <GameForm onSave={(f) => { addGame(f); setShowAddGame(false) }} onCancel={() => setShowAddGame(false)} />
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
