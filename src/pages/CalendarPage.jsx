import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, List, Grid } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameMonth, isToday, parseISO, isSameDay, startOfWeek, endOfWeek,
} from 'date-fns'

const CATEGORY_COLORS = {
  work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  finance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

function EventForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', category: 'other', notes: '' }
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
          placeholder="Event title"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Date</label>
          <input
            type="date"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Time (optional)</label>
          <input
            type="time"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
        <select
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          {Object.keys(CATEGORY_COLORS).map((c) => (
            <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes (optional)</label>
        <textarea
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400 resize-none"
          rows={2}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title || !form.date}>Save</Button>
      </div>
    </div>
  )
}

const TYPE_DOT = {
  event: 'var(--accent-500)',
  deadline: '#ef4444',
  goal: '#8b5cf6',
  task: '#f59e0b',
}

export default function CalendarPage() {
  const { calendar, deadlines, goals, tasks, addEvent, updateEvent, deleteEvent } = useStore()
  const [viewMode, setViewMode] = useState('grid')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [editEvent, setEditEvent] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Aggregate all date-bearing items into a unified map
  const allItemsByDate = useMemo(() => {
    const map = {}
    const push = (date, item) => {
      if (!date) return
      if (!map[date]) map[date] = []
      map[date].push(item)
    }
    calendar.events.forEach((e) => push(e.date, { ...e, _type: 'event', _label: e.title }))
    deadlines?.forEach((d) => !d.done && push(d.endDate, { ...d, _type: 'deadline', _label: d.title }))
    goals?.forEach((g) => g.targetDate && g.status !== 'done' && push(g.targetDate, { ...g, _type: 'goal', _label: g.title }))
    tasks?.forEach((t) => t.dueDate && !t.done && push(t.dueDate, { ...t, _type: 'task', _label: t.title }))
    return map
  }, [calendar.events, deadlines, goals, tasks])

  const sortedEvents = useMemo(
    () => [...calendar.events].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')),
    [calendar.events]
  )

  const dayItems = selectedDay ? (allItemsByDate[format(selectedDay, 'yyyy-MM-dd')] || []) : []
  const dayEvents = dayItems.filter((i) => i._type === 'event')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Calendar"
        subtitle="Your events and reminders"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                style={viewMode === 'grid' ? { backgroundColor: 'var(--accent-500)' } : {}}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                style={viewMode === 'list' ? { backgroundColor: 'var(--accent-500)' } : {}}
              >
                <List size={15} />
              </button>
            </div>
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Event
            </Button>
          </div>
        }
      />

      {viewMode === 'grid' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1 text-slate-400 hover:text-slate-600">
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1 text-slate-400 hover:text-slate-600">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center border-b border-slate-100 dark:border-slate-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2 text-xs font-medium text-slate-400">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const items = allItemsByDate[key] || []
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)
              const selected = selectedDay && isSameDay(day, selectedDay)

              return (
                <div
                  key={key}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  className={`min-h-[72px] p-1.5 border-b border-r border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${
                    !inMonth ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  } ${selected ? 'bg-slate-100 dark:bg-slate-700/60' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1 ${
                    today ? 'text-white font-semibold' : inMonth ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'
                  }`}
                  style={today ? { backgroundColor: 'var(--accent-500)' } : {}}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, 2).map((item, i) => (
                      <div
                        key={i}
                        className="text-xs px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: TYPE_DOT[item._type] }}
                      >
                        {item._label}
                      </div>
                    ))}
                    {items.length > 2 && (
                      <div className="text-xs text-slate-400 px-1">+{items.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {viewMode === 'grid' && (
        <div className="flex gap-4 mt-3 flex-wrap">
          {[['event', 'Events'], ['deadline', 'Deadlines'], ['goal', 'Goal Targets'], ['task', 'Tasks']].map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_DOT[type] }} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Day detail panel */}
      {viewMode === 'grid' && selectedDay && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-slate-700 dark:text-slate-200">{format(selectedDay, 'EEEE, MMMM d')}</p>
            <Button size="xs" onClick={() => { setSelectedDate(format(selectedDay, 'yyyy-MM-dd')); setShowAdd(true) }}>
              <Plus size={12} /> Add
            </Button>
          </div>
          {dayItems.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nothing scheduled</p>
          ) : (
            <div className="space-y-2">
              {dayItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: TYPE_DOT[item._type] }} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{item._label}</p>
                    <p className="text-xs text-slate-400 capitalize">{item._type}{item.time ? ` · ${item.time}` : ''}</p>
                    {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
                  </div>
                  {item._type === 'event' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditEvent(item)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={12} /></button>
                      <button onClick={() => deleteEvent(item.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-2">
          {sortedEvents.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-8">No events scheduled</p>
          )}
          {sortedEvents.map((e) => (
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-start gap-3 group">
              <div className="shrink-0 text-center">
                <p className="text-xs text-slate-400">{format(parseISO(e.date), 'MMM')}</p>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 leading-none">{format(parseISO(e.date), 'd')}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{e.title}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>{e.category}</span>
                </div>
                {e.time && <p className="text-xs text-slate-400 mt-0.5">{e.time}</p>}
                {e.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{e.notes}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditEvent(e)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                <button onClick={() => deleteEvent(e.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Event" onClose={() => { setShowAdd(false); setSelectedDate(null) }}>
          <EventForm
            initial={selectedDate ? { title: '', date: selectedDate, time: '', category: 'other', notes: '' } : undefined}
            onSave={(f) => { addEvent(f); setShowAdd(false); setSelectedDate(null) }}
            onCancel={() => { setShowAdd(false); setSelectedDate(null) }}
          />
        </Modal>
      )}

      {editEvent && (
        <Modal title="Edit Event" onClose={() => setEditEvent(null)}>
          <EventForm
            initial={editEvent}
            onSave={(f) => { updateEvent(editEvent.id, f); setEditEvent(null) }}
            onCancel={() => setEditEvent(null)}
          />
        </Modal>
      )}
    </div>
  )
}
