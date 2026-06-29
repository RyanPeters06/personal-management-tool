import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import { Plus, Trash2, Pencil, Check, ChevronRight, ChevronDown, Dumbbell, CalendarDays, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns'

// ── Helpers ──────────────────────────────────────────────────────────────────

function weekInterval(date = new Date()) {
  return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
}

// ── Exercise form row (inline) ───────────────────────────────────────────────

function ExerciseRow({ exercise, sessionId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(exercise)

  const save = () => { onUpdate(draft); setEditing(false) }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1">
        <input
          autoFocus
          className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Exercise name"
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        />
        <input
          className="w-16 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={draft.sets}
          onChange={(e) => setDraft((d) => ({ ...d, sets: e.target.value }))}
          placeholder="Sets"
        />
        <input
          className="w-16 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={draft.reps}
          onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
          placeholder="Reps"
        />
        <input
          className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder="Notes (optional)"
        />
        <button onClick={save} className="p-1 text-slate-400 hover:text-slate-600"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={14} /></button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <div className="flex-1 text-sm text-slate-700 dark:text-slate-200">{exercise.name}</div>
      {(exercise.sets || exercise.reps) && (
        <span className="text-xs text-slate-400 shrink-0">
          {[exercise.sets && `${exercise.sets} sets`, exercise.reps && `${exercise.reps} reps`].filter(Boolean).join(' · ')}
        </span>
      )}
      {exercise.notes && <span className="text-xs text-slate-400 truncate max-w-[120px]">{exercise.notes}</span>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={12} /></button>
        <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

// ── Add exercise inline ──────────────────────────────────────────────────────

function AddExerciseRow({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', sets: '', reps: '', notes: '' })

  const submit = () => {
    if (!form.name.trim()) return
    onAdd(form)
    setForm({ name: '', sets: '', reps: '', notes: '' })
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1 transition-colors"
      >
        <Plus size={12} /> Add exercise
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        autoFocus
        className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="Exercise name"
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
      />
      <input
        className="w-16 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
        value={form.sets}
        onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))}
        placeholder="Sets"
      />
      <input
        className="w-16 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
        value={form.reps}
        onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
        placeholder="Reps"
      />
      <input
        className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Notes"
      />
      <button onClick={submit} className="p-1 text-slate-400 hover:text-slate-600"><Check size={14} /></button>
      <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={14} /></button>
    </div>
  )
}

// ── Log workout modal ────────────────────────────────────────────────────────

function LogModal({ session, onSave, onClose }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [checked, setChecked] = useState({})

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }))

  const submit = () => {
    const completedExercises = session.exercises
      .filter((ex) => checked[ex.id])
      .map((ex) => ({ exerciseId: ex.id, exerciseName: ex.name, sets: ex.sets, reps: ex.reps }))
    onSave({ date, sessionId: session.id, sessionName: session.name, completedExercises })
    onClose()
  }

  const anyChecked = Object.values(checked).some(Boolean)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Date</label>
        <input
          type="date"
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Select exercises you completed:</p>
        <div className="space-y-2">
          {session.exercises.length === 0 && (
            <p className="text-sm text-slate-400 italic">No exercises in this session yet.</p>
          )}
          {session.exercises.map((ex) => (
            <label key={ex.id} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                  checked[ex.id] ? 'border-transparent' : 'border-slate-300 dark:border-slate-500'
                }`}
                style={checked[ex.id] ? { backgroundColor: 'var(--accent-500)' } : {}}
                onClick={() => toggle(ex.id)}
              >
                {checked[ex.id] && <Check size={10} className="text-white" />}
              </div>
              <div className="flex-1" onClick={() => toggle(ex.id)}>
                <span className="text-sm text-slate-700 dark:text-slate-200">{ex.name}</span>
                {(ex.sets || ex.reps) && (
                  <span className="text-xs text-slate-400 ml-2">
                    {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={!anyChecked || !date}>Log Session</Button>
      </div>
    </div>
  )
}

// ── Weekly progress card ─────────────────────────────────────────────────────

function WeeklyCard({ session, logs }) {
  const interval = weekInterval()
  const weekLogs = logs.filter(
    (l) => l.sessionId === session.id && isWithinInterval(parseISO(l.date), interval)
  )

  // Union of all completed exercise IDs this week
  const doneIds = new Set(weekLogs.flatMap((l) => l.completedExercises.map((e) => e.exerciseId)))
  const total = session.exercises.length
  const done = session.exercises.filter((ex) => doneIds.has(ex.id)).length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{session.name}</p>
        <span className="text-xs text-slate-400">{done}/{total} this week</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : 'var(--accent-500)' }}
        />
      </div>
      <div className="space-y-1.5">
        {session.exercises.map((ex) => (
          <div key={ex.id} className="flex items-center gap-2">
            <div
              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                doneIds.has(ex.id) ? 'border-transparent' : 'border-slate-300 dark:border-slate-600'
              }`}
              style={doneIds.has(ex.id) ? { backgroundColor: 'var(--accent-500)' } : {}}
            >
              {doneIds.has(ex.id) && <Check size={8} className="text-white" />}
            </div>
            <span className={`text-xs ${doneIds.has(ex.id) ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
              {ex.name}
            </span>
            {(ex.sets || ex.reps) && (
              <span className="text-xs text-slate-400">
                {[ex.sets && `${ex.sets}×`, ex.reps].filter(Boolean).join('')}
              </span>
            )}
          </div>
        ))}
        {total === 0 && <p className="text-xs text-slate-400 italic">No exercises added.</p>}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Workouts() {
  const {
    workouts,
    addSession, updateSession, deleteSession,
    addExercise, updateExercise, deleteExercise,
    addLog, deleteLog,
  } = useStore()

  const { sessions, logs } = workouts

  const [tab, setTab] = useState('sessions') // sessions | weekly | history
  const [newSessionName, setNewSessionName] = useState('')
  const [addingSession, setAddingSession] = useState(false)
  const [logTarget, setLogTarget] = useState(null) // session to log
  const [editSessionId, setEditSessionId] = useState(null)
  const [editName, setEditName] = useState('')
  const [collapsed, setCollapsed] = useState({}) // sessionId → bool

  const toggleCollapsed = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))

  const weeklySessions = sessions.filter((s) => s.trackWeekly)

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => b.date.localeCompare(a.date)),
    [logs]
  )

  const createSession = () => {
    const name = newSessionName.trim()
    if (!name) return
    addSession({ name })
    setNewSessionName('')
    setAddingSession(false)
  }

  const startEditName = (session) => {
    setEditSessionId(session.id)
    setEditName(session.name)
  }

  const saveEditName = (id) => {
    if (editName.trim()) updateSession(id, { name: editName.trim() })
    setEditSessionId(null)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Workouts"
        subtitle="Track your sessions and weekly progress"
        action={
          tab === 'sessions' && (
            <Button onClick={() => setAddingSession(true)}>
              <Plus size={14} /> New Session
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 w-fit">
        {[['sessions', 'Sessions'], ['weekly', 'Weekly View'], ['history', 'History']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === id ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            style={tab === id ? { backgroundColor: 'var(--accent-500)' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SESSIONS TAB ── */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          {addingSession && (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
                placeholder="Session name (e.g. Leg Day)"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createSession(); if (e.key === 'Escape') setAddingSession(false) }}
              />
              <Button onClick={createSession} disabled={!newSessionName.trim()}>Create</Button>
              <button onClick={() => setAddingSession(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
          )}

          {sessions.length === 0 && !addingSession && (
            <div className="text-center py-16">
              <Dumbbell size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No sessions yet — create one to get started.</p>
            </div>
          )}

          {sessions.map((session) => {
            const isCollapsed = collapsed[session.id] ?? false
            return (
              <div key={session.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Session header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  {/* Collapse toggle */}
                  <button
                    onClick={() => toggleCollapsed(session.id)}
                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                  >
                    {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {editSessionId === session.id ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm font-semibold border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1 bg-transparent text-slate-700 dark:text-slate-200 outline-none"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEditName(session.id); if (e.key === 'Escape') setEditSessionId(null) }}
                      onBlur={() => saveEditName(session.id)}
                    />
                  ) : (
                    <h3
                      className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                      onClick={() => toggleCollapsed(session.id)}
                    >
                      {session.name}
                      {isCollapsed && session.exercises.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-slate-400">{session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}</span>
                      )}
                    </h3>
                  )}

                  {/* Weekly tracking toggle */}
                  <button
                    onClick={() => updateSession(session.id, { trackWeekly: !session.trackWeekly })}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title={session.trackWeekly ? 'Weekly tracking on — click to disable' : 'Enable weekly tracking'}
                  >
                    {session.trackWeekly
                      ? <ToggleRight size={15} style={{ color: 'var(--accent-500)' }} />
                      : <ToggleLeft size={15} />
                    }
                    <span style={session.trackWeekly ? { color: 'var(--accent-500)' } : {}}>Weekly</span>
                  </button>

                  <button
                    onClick={() => setLogTarget(session)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <CalendarDays size={12} /> Log
                  </button>

                  <button
                    onClick={() => { if (editSessionId === session.id) setEditSessionId(null); else startEditName(session) }}
                    className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                    title="Rename"
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Exercise body — hidden when collapsed */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                    {session.exercises.length === 0 && (
                      <p className="text-xs text-slate-400 italic mb-2">No exercises yet.</p>
                    )}
                    {session.exercises.length > 0 && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700 mb-1">
                        <div className="grid grid-cols-[1fr_80px_80px_1fr_auto] gap-2 pb-1 mb-1">
                          {['Exercise', 'Sets', 'Reps', 'Notes', ''].map((h, i) => (
                            <span key={i} className="text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</span>
                          ))}
                        </div>
                        {session.exercises.map((ex) => (
                          <ExerciseRow
                            key={ex.id}
                            exercise={ex}
                            sessionId={session.id}
                            onUpdate={(patch) => updateExercise(session.id, ex.id, patch)}
                            onDelete={() => deleteExercise(session.id, ex.id)}
                          />
                        ))}
                      </div>
                    )}
                    <AddExerciseRow onAdd={(ex) => addExercise(session.id, ex)} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── WEEKLY VIEW TAB ── */}
      {tab === 'weekly' && (
        <div>
          <p className="text-xs text-slate-400 mb-4">
            Week of {format(weekInterval().start, 'MMM d')} – {format(weekInterval().end, 'MMM d, yyyy')} ·
            Only sessions with Weekly tracking enabled appear here.
          </p>
          {weeklySessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-400">No sessions have weekly tracking enabled.</p>
              <p className="text-xs text-slate-400 mt-1">Go to Sessions and toggle "Weekly" on any session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklySessions.map((session) => (
                <WeeklyCard key={session.id} session={session} logs={logs} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          {sortedLogs.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-12">No workouts logged yet.</p>
          )}
          {sortedLogs.map((log) => (
            <div key={log.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-400">{format(parseISO(log.date), 'EEE, MMM d yyyy')}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {log.sessionName}
                    </span>
                  </div>
                  {log.completedExercises.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No exercises recorded.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {log.completedExercises.map((ex, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600">
                          {ex.exerciseName}
                          {(ex.sets || ex.reps) && (
                            <span className="text-slate-400 ml-1">{[ex.sets && `${ex.sets}×`, ex.reps].filter(Boolean).join('')}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {logTarget && (
        <Modal title={`Log — ${logTarget.name}`} onClose={() => setLogTarget(null)}>
          <LogModal
            session={logTarget}
            onSave={addLog}
            onClose={() => setLogTarget(null)}
          />
        </Modal>
      )}
    </div>
  )
}
