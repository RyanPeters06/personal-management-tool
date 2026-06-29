import { useState, useMemo, useCallback } from 'react'
import useStore from '../store/useStore'
import { playCompleteSound } from '../utils/completeSound'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import TagSelect, { tagColor } from '../components/shared/TagSelect'
import { Plus, Trash2, Pencil, Check, Layers, ChevronRight, ChevronDown } from 'lucide-react'
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
          <input
            type="date"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
          />
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
  const { tasks, addTask2, updateTask2, deleteTask2, projects, toggleSubtask, settings } = useStore()
  const customTagColors = settings.customTagColors || {}
  const [filter, setFilter] = useState('active')
  const [showAdd, setShowAdd] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [collapsedProjects, setCollapsedProjects] = useState(sessionCollapsed)
  const [completing, setCompleting] = useState(new Set())
  const [poppingSubtasks, setPoppingSubtasks] = useState(new Set())

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
    return projects
      .map((proj) => {
        const subtasks = (proj.subtasks || []).filter((st) => {
          if (filter === 'active') return !st.done
          if (filter === 'done') return st.done
          return true
        })
        return { proj, subtasks }
      })
      .filter(({ subtasks }) => subtasks.length > 0)
  }, [projects, filter])

  const filteredStandalone = tasks.filter((t) => {
    if (completing.has(t.id)) return true // always show animating tasks
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Tasks"
        subtitle="Standalone tasks and project subtasks in one place"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Task
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 w-fit">
        {['active', 'done', 'all'].map((f) => (
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
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditTask(task)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                    <button onClick={() => deleteTask2(task.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
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
                      <div key={st.id} className={`flex items-center gap-3 px-4 py-2.5 ${st.done ? 'task-done' : ''} ${poppingSubtasks.has(st.id) ? 'subtask-completing' : ''}`}>
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
          {filter === 'done' ? 'No completed tasks yet.' : 'No tasks — add one above.'}
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
    </div>
  )
}
