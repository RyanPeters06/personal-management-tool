import { useState, useMemo, useCallback } from 'react'
import useStore from '../store/useStore'
import { playCompleteSound } from '../utils/completeSound'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import TagSelect, { tagColor } from '../components/shared/TagSelect'
import { Plus, Trash2, Pencil, Check, Layers, ChevronRight, ChevronDown, Sun } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'

const PRIORITY_COLORS = { high: 'red', medium: 'yellow', none: 'slate' }

function TaskForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { title: '', notes: '', dueDate: '', priority: 'none', tags: [] }
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
          placeholder="Task title"
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Due Date</label>
          <div className="flex gap-1.5">
            <input
              type="date"
              className="flex-1 min-w-0 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
            />
            <button
              type="button"
              onClick={() => set('dueDate', format(new Date(), 'yyyy-MM-dd'))}
              className="px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
              title="Set to today"
            >
              Today
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Priority</label>
          <select
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.priority}
            onChange={(e) => set('priority', e.target.value)}
          >
            <option value="none">None</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
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

// Persists collapsed state for the session (survives navigation, resets on app close)
const sessionCollapsed = {}

export default function Tasks({ onNavigate }) {
  const { tasks, addTask2, updateTask2, deleteTask2, projects, toggleSubtask, toggleSubtaskToday, settings } = useStore()
  const customTagColors = settings.customTagColors || {}
  const [filter, setFilter] = useState('active')
  const [tagFilter, setTagFilter] = useState('all')
  const [showProjects, setShowProjects] = useState(true)
  const [planToday, setPlanToday] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [collapsedProjects, setCollapsedProjects] = useState(sessionCollapsed)
  const [completing, setCompleting] = useState(new Set())
  const [poppingSubtasks, setPoppingSubtasks] = useState(new Set())

  // Tags actually in use across standalone tasks and project tags
  const usedTags = [...new Set([
    ...tasks.flatMap((t) => t.tags || []),
    ...projects.map((p) => p.tag).filter(Boolean),
  ])]

  const toggleProject = (id) => setCollapsedProjects((c) => {
    const next = { ...c, [id]: !c[id] }
    Object.assign(sessionCollapsed, next)
    return next
  })

  const handleToggleSubtask = useCallback((projId, stId, isDone) => {
    if (!isDone) {
      playCompleteSound()
      setPoppingSubtasks((s) => new Set(s).add(stId))
      setTimeout(() => setPoppingSubtasks((s) => { const n = new Set(s); n.delete(stId); return n }), 400)
    }
    toggleSubtask(projId, stId)
  }, [toggleSubtask])

  const handleCheck = useCallback((task) => {
    const goingDone = !task.done
    if (goingDone) {
      playCompleteSound()
      setCompleting((s) => new Set(s).add(task.id))
      // Update store after animation finishes
      setTimeout(() => {
        updateTask2(task.id, { done: true })
        setCompleting((s) => { const n = new Set(s); n.delete(task.id); return n })
      }, 720)
    } else {
      updateTask2(task.id, { done: false })
    }
  }, [updateTask2])

  // Group project subtasks by project, filtered
  const projectGroups = useMemo(() => {
    if (!showProjects) return []
    return projects
      .filter((proj) => tagFilter === 'all' || proj.tag === tagFilter)
      .map((proj) => {
        const subtasks = (proj.subtasks || []).filter((st) => {
          if (filter === 'today') return st.today && !st.done
          if (filter === 'active') return !st.done
          if (filter === 'done') return st.done
          return true
        })
        return { proj, subtasks }
      })
      .filter(({ subtasks }) => subtasks.length > 0)
  }, [projects, filter, tagFilter, showProjects])

  const filteredStandalone = tasks.filter((t) => {
    if (tagFilter !== 'all' && !(t.tags || []).includes(tagFilter)) return false
    if (completing.has(t.id)) return true // always show animating tasks
    if (filter === 'today') return t.today && !t.done
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  // Items available to flag for "today" (active, not done)
  const planStandalone = tasks.filter((t) => !t.done)
  const planProjects = projects
    .map((proj) => ({ proj, subtasks: (proj.subtasks || []).filter((st) => !st.done) }))
    .filter(({ subtasks }) => subtasks.length > 0)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Tasks"
        subtitle="Standalone tasks and project subtasks in one place"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPlanToday(true)}>
              <Sun size={14} /> Plan Today
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Task
            </Button>
          </div>
        }
      />

      {/* Filter tabs + tag sort + project toggle */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 w-fit">
            {['today', 'active', 'done', 'all'].map((f) => (
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
          {usedTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 outline-none focus:border-slate-400"
            >
              <option value="all">All tags</option>
              {usedTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showProjects}
            onChange={(e) => setShowProjects(e.target.checked)}
            className="accent-current"
            style={{ accentColor: 'var(--accent-500)' }}
          />
          Show projects
        </label>
      </div>

      {/* Standalone tasks */}
      {filteredStandalone.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Quick Tasks</p>
          <div className="space-y-2">
            {filteredStandalone.map((task) => {
              const overdue = task.dueDate && !task.done && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate))
              const isCompleting = completing.has(task.id)
              return (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-start gap-3 group ${isCompleting ? 'task-row-completing' : ''}`}
                >
                  <button
                    onClick={() => handleCheck(task)}
                    className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                      task.done || isCompleting ? 'border-transparent' : 'border-slate-300 dark:border-slate-500'
                    }`}
                    style={task.done || isCompleting ? { backgroundColor: 'var(--accent-500)' } : {}}
                  >
                    {(task.done || isCompleting) && (
                      <Check size={10} className={`text-white ${isCompleting ? 'task-check-pop' : ''}`} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</p>
                    {task.notes && <p className="text-xs text-slate-400 mt-0.5">{task.notes}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {task.priority !== 'none' && <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>}
                      {task.dueDate && (
                        <span className={`text-xs ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                          {overdue ? 'Overdue · ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
                        </span>
                      )}
                      {task.tags?.map((t) => (
                        <span key={t} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(t, customTagColors)}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => updateTask2(task.id, { today: !task.today })}
                      className={`p-1 transition-colors ${task.today ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-amber-500'}`}
                      title={task.today ? 'Remove from today' : 'Add to today'}
                    >
                      <Sun size={13} />
                    </button>
                    <button onClick={() => setEditTask(task)} className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100"><Pencil size={13} /></button>
                    <button onClick={() => deleteTask2(task.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Project subtasks — grouped and collapsible per project */}
      {projectGroups.length > 0 && (
        <div className="space-y-3">
          {filteredStandalone.length > 0 && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-2">From Projects</p>
          )}
          {projectGroups.map(({ proj, subtasks }) => {
            const isCollapsed = collapsedProjects[proj.id] ?? false
            const doneCount = subtasks.filter((t) => t.done).length
            return (
              <div key={proj.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Project header row */}
                <button
                  onClick={() => toggleProject(proj.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                >
                  {isCollapsed ? <ChevronRight size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                  <Layers size={13} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{proj.title}</span>
                  <span className="text-xs text-slate-400">
                    {filter === 'all' ? `${doneCount}/${subtasks.length} done` : `${subtasks.length} task${subtasks.length !== 1 ? 's' : ''}`}
                  </span>
                </button>

                {/* Subtask list */}
                {!isCollapsed && (
                  <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60">
                    {subtasks.map((st) => (
                      <div key={st.id} className={`flex items-center gap-3 px-4 py-2.5 group ${st.done ? 'task-done' : ''} ${poppingSubtasks.has(st.id) ? 'subtask-completing' : ''}`}>
                        <button
                          onClick={() => handleToggleSubtask(proj.id, st.id, st.done)}
                          className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${st.done ? 'border-transparent' : 'border-slate-300 dark:border-slate-500'}`}
                          style={st.done ? { backgroundColor: 'var(--accent-500)', borderColor: 'var(--accent-500)' } : {}}
                        >
                          {st.done && <Check size={9} className={`text-white ${poppingSubtasks.has(st.id) ? 'task-check-pop' : ''}`} />}
                        </button>
                        <p className={`text-sm flex-1 min-w-0 truncate ${st.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {st.title}
                        </p>
                        <button
                          onClick={() => toggleSubtaskToday(proj.id, st.id)}
                          className={`p-1 shrink-0 transition-colors ${st.today ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-amber-500'}`}
                          title={st.today ? 'Remove from today' : 'Add to today'}
                        >
                          <Sun size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {filteredStandalone.length === 0 && projectGroups.length === 0 && (
        <p className="text-sm text-slate-400 italic text-center py-12">
          {filter === 'done' ? 'No completed tasks yet.'
            : filter === 'today' ? 'Nothing planned for today yet — click "Plan Today" to pick tasks.'
            : 'No tasks — add one above.'}
        </p>
      )}

      {showAdd && (
        <Modal title="Add Task" onClose={() => setShowAdd(false)}>
          <TaskForm
            onSave={(f) => { addTask2(f); setShowAdd(false) }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            initial={editTask}
            onSave={(f) => { updateTask2(editTask.id, f); setEditTask(null) }}
            onCancel={() => setEditTask(null)}
          />
        </Modal>
      )}

      {planToday && (
        <Modal title="Plan Today" onClose={() => setPlanToday(false)}>
          <p className="text-xs text-slate-400 mb-3">Check the tasks you want to focus on today. They'll show up under the <span className="font-medium text-amber-500">Today</span> tab.</p>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {planStandalone.length === 0 && planProjects.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-6">No active tasks to plan.</p>
            )}

            {planStandalone.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Quick Tasks</p>
                <div className="space-y-1">
                  {planStandalone.map((t) => (
                    <label key={t.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!t.today}
                        onChange={() => updateTask2(t.id, { today: !t.today })}
                        style={{ accentColor: 'var(--accent-500)' }}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 min-w-0 truncate">{t.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {planProjects.map(({ proj, subtasks }) => (
              <div key={proj.id}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Layers size={12} /> {proj.title}
                </p>
                <div className="space-y-1">
                  {subtasks.map((st) => (
                    <label key={st.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!st.today}
                        onChange={() => toggleSubtaskToday(proj.id, st.id)}
                        style={{ accentColor: 'var(--accent-500)' }}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 min-w-0 truncate">{st.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => { setPlanToday(false); setFilter('today') }}>
              <Check size={14} /> Done
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
