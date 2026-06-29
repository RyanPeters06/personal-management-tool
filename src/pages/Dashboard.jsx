import { useMemo } from 'react'
import useStore from '../store/useStore'
import { format, isToday, isTomorrow, isPast, parseISO, differenceInDays } from 'date-fns'
import { CheckSquare, DollarSign, Calendar, Target, AlertCircle, Clock } from 'lucide-react'

function DashCard({ title, icon: Icon, children, onClick, accent }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</span>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ label }) {
  return <p className="text-sm text-slate-400 italic">{label}</p>
}

export default function Dashboard({ onNavigate }) {
  const { todos, finance, calendar, projects } = useStore()

  const today = new Date()

  const overdueTasks = useMemo(() => {
    const result = []
    todos.categories.forEach((cat) => {
      cat.tasks.forEach((t) => {
        if (!t.done && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))) {
          result.push({ ...t, categoryName: cat.name })
        }
      })
    })
    return result.slice(0, 5)
  }, [todos])

  const todayEvents = useMemo(
    () => calendar.events.filter((e) => isToday(parseISO(e.date))).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [calendar]
  )

  const tomorrowEvents = useMemo(
    () => calendar.events.filter((e) => isTomorrow(parseISO(e.date))),
    [calendar]
  )

  const renewalsSoon = useMemo(
    () =>
      finance.subscriptions
        .filter((s) => s.active !== false && s.renewalDate)
        .map((s) => ({ ...s, daysLeft: differenceInDays(parseISO(s.renewalDate), today) }))
        .filter((s) => s.daysLeft >= 0 && s.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [finance]
  )

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'active').slice(0, 3),
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {format(today, 'EEEE, MMMM d')}
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Here's what's on your plate</p>
      </div>

      {/* Row 1: Today + Overdue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DashCard title="Today" icon={Calendar} onClick={() => onNavigate('calendar')}>
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

        <DashCard title="Overdue Tasks" icon={AlertCircle} onClick={() => onNavigate('todos')}>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">All caught up!</p>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map((t) => (
                <div key={t.id} className="flex items-start gap-2">
                  <span className="text-xs text-red-400 mt-0.5 shrink-0">
                    {format(parseISO(t.dueDate), 'MMM d')}
                  </span>
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{t.title}</p>
                    <p className="text-xs text-slate-400">{t.categoryName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashCard>
      </div>

      {/* Row 2: Active Projects + Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DashCard title="Active Projects" icon={Target} onClick={() => onNavigate('projects')}>
          {activeProjects.length === 0 ? (
            <EmptyState label="No active projects" />
          ) : (
            <div className="space-y-2">
              {activeProjects.map((p) => {
                const done = p.subtasks.filter((s) => s.done).length
                const total = p.subtasks.length
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{p.title}</p>
                      {total > 0 && (
                        <span className="text-xs text-slate-400">{done}/{total}</span>
                      )}
                    </div>
                    {p.tag && <span className="text-xs text-slate-400">{p.tag}</span>}
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
      </div>

    </div>
  )
}
