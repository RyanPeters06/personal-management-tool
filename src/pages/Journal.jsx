import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import { Trash2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const TODAY = new Date().toISOString().slice(0, 10)

function formatDate(dateStr) {
  try {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')
  } catch {
    return dateStr
  }
}

function EntryCard({ entry, onDelete }) {
  const { upsertJournalEntry } = useStore()
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(entry.content)
  const isToday = entry.date === TODAY

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

export default function Journal() {
  const { journal, upsertJournalEntry, deleteJournalEntry } = useStore()
  const entries = journal?.entries || []

  const todayEntry = entries.find((e) => e.date === TODAY)
  const [todayDraft, setTodayDraft] = useState(todayEntry?.content || '')

  const pastEntries = useMemo(() =>
    entries
      .filter((e) => e.date !== TODAY)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  )

  const handleTodayBlur = () => {
    upsertJournalEntry(TODAY, todayDraft)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Journal"
        subtitle={formatDate(TODAY)}
      />

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
      {pastEntries.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Past Entries</p>
          <div className="space-y-2">
            {pastEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={deleteJournalEntry}
              />
            ))}
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
