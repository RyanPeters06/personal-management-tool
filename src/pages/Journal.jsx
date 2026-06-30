import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import { Trash2, ChevronDown, ChevronRight, ChevronLeft, BookOpen, Search, X } from 'lucide-react'
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameMonth, isSameDay,
} from 'date-fns'

const TODAY = new Date().toISOString().slice(0, 10)

function formatDate(dateStr) {
  try {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')
  } catch {
    return dateStr
  }
}

function EntryCard({ entry, onDelete, defaultExpanded = false }) {
  const { upsertJournalEntry } = useStore()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [draft, setDraft] = useState(entry.content)

  const preview = entry.content.slice(0, 120) + (entry.content.length > 120 ? '…' : '')

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
      >
        {expanded ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(entry.date)}</p>
          {!expanded && entry.content && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{preview}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
          className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3">
          <textarea
            className="w-full text-sm bg-transparent text-slate-700 dark:text-slate-200 outline-none resize-none placeholder-slate-400 min-h-[80px]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { if (draft !== entry.content) upsertJournalEntry(entry.date, draft) }}
            placeholder="Nothing written yet..."
          />
          <p className="text-xs text-slate-400 mt-1">Auto-saves when you click away.</p>
        </div>
      )}
    </div>
  )
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function EntryCalendar({ entryDates, selectedDate, onSelect }) {
  const [month, setMonth] = useState(startOfMonth(new Date()))

  const days = useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    return eachDayOfInterval({ start, end })
  }, [month])

  const leadingBlanks = getDay(startOfMonth(month))

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonth((m) => subMonths(m, 1))} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{format(month, 'MMMM yyyy')}</p>
        <button onClick={() => setMonth((m) => addMonths(m, 1))} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasEntry = entryDates.has(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = dateStr === TODAY
          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                isSelected ? 'text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isToday && !isSelected ? 'ring-1 ring-inset ring-slate-300 dark:ring-slate-600' : ''}`}
              style={isSelected ? { backgroundColor: 'var(--accent-500)' } : {}}
            >
              {format(day, 'd')}
              {hasEntry && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: isSelected ? '#fff' : 'var(--accent-500)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Journal() {
  const { journal, upsertJournalEntry, deleteJournalEntry } = useStore()
  const entries = journal?.entries || []

  const todayEntry = entries.find((e) => e.date === TODAY)
  const [todayDraft, setTodayDraft] = useState(todayEntry?.content || '')
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)

  const entryDates = useMemo(
    () => new Set(entries.filter((e) => e.content?.trim()).map((e) => e.date)),
    [entries]
  )

  const pastEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter((e) => e.date !== TODAY)
      .filter((e) => !q || e.content.toLowerCase().includes(q) || formatDate(e.date).toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, search])

  const selectedEntry = selectedDate
    ? (entries.find((e) => e.date === selectedDate) || { id: `temp-${selectedDate}`, date: selectedDate, content: '' })
    : null

  const handleTodayBlur = () => {
    upsertJournalEntry(TODAY, todayDraft)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Journal"
        subtitle={formatDate(TODAY)}
      />

      {/* Entry calendar */}
      <EntryCalendar
        entryDates={entryDates}
        selectedDate={selectedDate}
        onSelect={(d) => setSelectedDate(d === selectedDate ? null : (d === TODAY ? null : d))}
      />

      {/* Selected-day editor (when a non-today day is picked) */}
      {selectedDate && selectedDate !== TODAY && selectedEntry && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Selected Day</p>
            <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-xs">
              <X size={12} /> Close
            </button>
          </div>
          <EntryCard
            key={selectedDate}
            entry={selectedEntry}
            onDelete={(id) => { deleteJournalEntry(id); setSelectedDate(null) }}
            defaultExpanded
          />
        </div>
      )}

      {/* Today's entry */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Today</p>
        <textarea
          className="w-full text-sm bg-transparent text-slate-700 dark:text-slate-200 outline-none resize-none placeholder-slate-400 min-h-[140px]"
          placeholder="What's on your mind today? Brain dump, plans, reflections..."
          value={todayDraft}
          onChange={(e) => setTodayDraft(e.target.value)}
          onBlur={handleTodayBlur}
        />
        <p className="text-xs text-slate-400 mt-2">Auto-saves when you click away.</p>
      </div>

      {/* Past entries */}
      {entries.some((e) => e.date !== TODAY) && (
        <>
          <div className="flex items-center justify-between mb-3 gap-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Past Entries</p>
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries..."
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg pl-8 pr-7 py-1.5 text-xs bg-transparent text-slate-700 dark:text-slate-200 outline-none focus:border-slate-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {pastEntries.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-6">No entries match "{search}".</p>
            ) : (
              pastEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={deleteJournalEntry}
                />
              ))
            )}
          </div>
        </>
      )}

      {entries.length === 0 && !todayDraft && (
        <div className="text-center py-12">
          <BookOpen size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Start writing above — your entries will appear here.</p>
        </div>
      )}
    </div>
  )
}
