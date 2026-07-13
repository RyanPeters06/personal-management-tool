import { useMemo } from 'react'
import useStore from '../store/useStore'
import { playCompleteSound } from '../utils/completeSound'
import { tagColor } from '../components/shared/TagSelect'
import { format, isToday, isTomorrow, isPast, parseISO, differenceInCalendarDays } from 'date-fns'
import { Sun, Star, DollarSign, Calendar, Target, AlertCircle, Clock, Check, ShoppingCart, Lightbulb, Layers } from 'lucide-react'

function DashCard({ title, icon: Icon, children, onClick, count }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        {count != null && count > 0 && (
          <span className="ml-auto text-xs font-semibold text-white rounded-full px-1.5 min-w-[18px] text-center" style={{ backgroundColor: 'var(--accent-500)' }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ label }) {
  return <p className="text-sm text-slate-400 italic">{label}</p>
}

function StatTile({ icon: Icon, label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent-100)' }}>
        <Icon size={16} style={{ color: 'var(--accent-600)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1 truncate">{label}</p>
      </div>
    </button>
  )
}

export default function Dashboard({ onNavigate }) {
  const { tasks, finance, calendar, projects, deadlines, wantList, ideas, journal, settings, updateTask2, toggleSubtask } = useStore()
  const customTagColors = settings.customTagColors || {}
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const handleCheckTask = (t) => {
    playCompleteSound()
    updateTask2(t.id, { done: true })
  }
  const handleCheckSubtask = (projId, stId) => {
    playCompleteSound()
    toggleSubtask(projId, stId)
  }

  // Tasks flagged for "today" — standalone + project subtasks, not yet done.
  // These persist day to day until completed or unflagged.
  const todayFocus = useMemo(() => {
    const standalone = tasks
      .filter((t) => t.today && !t.done)
      .map((t) => ({ kind: 'task', id: t.id, title: t.title, tags: t.tags || [] }))
    const subs = projects.flatMap((p) =>
      (p.subtasks || [])
        .filter((st) => st.today && !st.done)
        .map((st) => ({ kind: 'subtask', id: st.id, projId: p.id, title: st.title, projectTitle: p.title }))
    )
    return [...standalone, ...subs]
  }, [tasks, projects])

  const overdueTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.done && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [tasks]
  )

  const todayEvents = useMemo(
    () => calendar.events.filter((e) => isToday(parseISO(e.date))).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [calendar]
  )

  const tomorrowEvents = useMemo(
    () => calendar.events.filter((e) => isTomorrow(parseISO(e.date))),
    [calendar]
  )

  const upcomingDeadlines = useMemo(
    () =>
      (deadlines || [])
        .filter((d) => !d.done && d.endDate)
        .map((d) => ({ ...d, daysLeft: differenceInCalendarDays(parseISO(d.endDate), today) }))
        .filter((d) => d.daysLeft >= 0)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 4),
    [deadlines]
  )

  // Subscriptions renew on a day-of-month (1–31). Compute the next occurrence.
  const renewalsSoon = useMemo(() => {
    return finance.subscriptions
      .filter((s) => s.active !== false && s.renewalDate)
      .map((s) => {
        const day = parseInt(String(s.renewalDate), 10)
        if (!day) return null
        let next = new Date(today.getFullYear(), today.getMonth(), day)
        if (day < today.getDate()) next = new Date(today.getFullYear(), today.getMonth() + 1, day)
        return { ...s, daysLeft: differenceInCalendarDays(next, today) }
      })
      .filter((s) => s && s.daysLeft >= 0 && s.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [finance])

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'active').slice(0, 4),
    [projects]
  )

  const monthlySubTotal = useMemo(() => {
    return finance.subscriptions
      .filter((s) => s.active !== false)
      .reduce((sum, s) => {
        const cost = parseFloat(s.cost) || 0
        return sum + (s.cycle === 'annual' ? cost / 12 : cost)
      }, 0)
  }, [finance])

  const wantCount = (wantList || []).filter((i) => !i.purchased).length
  const ideaCount = (ideas || []).length
  const journaledToday = (journal?.entries || []).some((e) => e.date === todayStr && e.content?.trim())

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {format(today, 'EEEE, MMMM d')}
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Here's what's on your plate</p>
      </div>

      {/* Row 1: Priorities + Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DashCard title="Priorities" icon={Star} onClick={() => onNavigate('tasks')} count={todayFocus.length}>
          {todayFocus.length === 0 ? (
            <EmptyState label="Nothing prioritized — star tasks in Tasks to focus on them." />
          ) : (
            <div className="space-y-1.5">
              {todayFocus.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="flex items-start gap-2.5 group" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => item.kind === 'task' ? handleCheckTask(item) : handleCheckSubtask(item.projId, item.id)}
                    className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 shrink-0 flex items-center justify-center hover:border-transparent transition-colors"
                    style={{}}
                    title="Mark done"
                  >
                    <Check size={9} className="text-transparent group-hover:text-slate-400" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{item.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {item.kind === 'subtask' && (
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Layers size={10} /> {item.projectTitle}</span>
                      )}
                      {item.tags?.map((t) => (
                        <span key={t} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(t, customTagColors)}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        <DashCard title="Today & Tomorrow" icon={Calendar} onClick={() => onNavigate('calendar')}>
          {todayEvents.length === 0 && tomorrowEvents.length === 0 ? (
            <EmptyState label="Nothing scheduled today or tomorrow" />
          ) : (
            <div className="space-y-2">
              {todayEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-2">
                  <span className="text-xs text-slate-400 w-12 shrink-0 pt-0.5">{e.time || 'All day'}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200">{e.title}</span>
                </div>
              ))}
              {tomorrowEvents.length > 0 && (
                <>
                  <p className="text-xs font-medium text-slate-400 pt-1 uppercase tracking-wide">Tomorrow</p>
                  {tomorrowEvents.map((e) => (
                    <div key={e.id} className="flex items-start gap-2">
                      <span className="text-xs text-slate-400 w-12 shrink-0 pt-0.5">{e.time || 'All day'}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{e.title}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </DashCard>
      </div>

      {/* Row 2: Overdue Tasks + Active Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DashCard title="Overdue Tasks" icon={AlertCircle} onClick={() => onNavigate('tasks')}>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">All caught up!</p>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map((t) => (
                <div key={t.id} className="flex items-start gap-2">
                  <span className="text-xs text-red-400 mt-0.5 shrink-0">
                    {format(parseISO(t.dueDate), 'MMM d')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{t.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {t.tags?.map((tag) => (
                        <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(tag, customTagColors)}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        <DashCard title="Active Projects" icon={Target} onClick={() => onNavigate('projects')}>
          {activeProjects.length === 0 ? (
            <EmptyState label="No active projects" />
          ) : (
            <div className="space-y-2.5">
              {activeProjects.map((p) => {
                const done = p.subtasks.filter((s) => s.done).length
                const total = p.subtasks.length
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{p.title}</p>
                        {p.tag && <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${tagColor(p.tag, customTagColors)}`}>{p.tag}</span>}
                      </div>
                      {total > 0 && (
                        <span className="text-xs text-slate-400 shrink-0">{done}/{total}</span>
                      )}
                    </div>
                    {total > 0 && (
                      <div className="mt-1 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${(done / total) * 100}%`, backgroundColor: 'var(--accent-500)' }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </DashCard>
      </div>

      {/* Row 3: Subscriptions + Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DashCard title="Subscriptions" icon={DollarSign} onClick={() => onNavigate('finance')}>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            ${monthlySubTotal.toFixed(2)}<span className="text-sm font-normal text-slate-400">/mo</span>
          </p>
          {renewalsSoon.length === 0 ? (
            <p className="text-xs text-slate-400">No renewals in the next 7 days</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Renewing soon</p>
              {renewalsSoon.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{s.name}</span>
                  <span className="text-xs text-amber-500">
                    {s.daysLeft === 0 ? 'Today' : `in ${s.daysLeft}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        <DashCard title="Upcoming Deadlines" icon={Clock} onClick={() => onNavigate('finance')}>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState label="No upcoming deadlines" />
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{d.title}</span>
                  <span className={`text-xs shrink-0 ${d.daysLeft <= 2 ? 'text-red-500' : 'text-slate-400'}`}>
                    {d.daysLeft === 0 ? 'Today' : d.daysLeft === 1 ? 'Tomorrow' : `in ${d.daysLeft}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashCard>
      </div>

      {/* Row 4: Quick stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile icon={ShoppingCart} label={wantCount === 1 ? 'item on your want list' : 'items on your want list'} value={wantCount} onClick={() => onNavigate('want-list')} />
        <StatTile icon={Lightbulb} label={ideaCount === 1 ? 'idea saved' : 'ideas saved'} value={ideaCount} onClick={() => onNavigate('ideas')} />
        <StatTile icon={Sun} label={journaledToday ? 'journaled today' : 'no journal entry today'} value={journaledToday ? '✓' : '—'} onClick={() => onNavigate('journal')} />
      </div>
    </div>
  )
}
