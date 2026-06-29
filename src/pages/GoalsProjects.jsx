import { useState, useCallback } from 'react'
import useStore from '../store/useStore'
import { playCompleteSound } from '../utils/completeSound'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import TagSelect from '../components/shared/TagSelect'
import { Plus, Trash2, Pencil, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const STATUS_COLORS = { active: 'green', paused: 'yellow', done: 'slate' }
const TAG_COLORS = { 'Side Hustle': 'purple', Work: 'blue', Personal: 'orange', Health: 'green', Finance: 'yellow' }

function GoalForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', description: '', targetDate: '', progress: 0, status: 'active' })
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
          placeholder="Goal title"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Description</label>
        <textarea
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none resize-none"
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Target Date</label>
          <input
            type="date"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
            value={form.targetDate}
            onChange={(e) => set('targetDate', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Progress (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
            value={form.progress}
            onChange={(e) => set('progress', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
        <select
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Save</Button>
      </div>
    </div>
  )
}

function ProjectForm({ initial, goals, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', description: '', goalId: '', tag: '', status: 'active' })
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
          placeholder="Project title"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Description</label>
        <textarea
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none resize-none"
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Tag</label>
          <TagSelect value={form.tag} onChange={(v) => set('tag', v)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Link to Goal</label>
          <select
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.goalId}
            onChange={(e) => set('goalId', e.target.value)}
          >
            <option value="">None</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
        <select
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Save</Button>
      </div>
    </div>
  )
}

function ProjectCard({ project, goals }) {
  const { updateProject, deleteProject, addSubtask, toggleSubtask, deleteSubtask } = useStore()
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(project.notes || '')
  const [poppingSubtasks, setPoppingSubtasks] = useState(new Set())

  const handleToggleSubtask = useCallback((projId, stId, isDone) => {
    if (!isDone) {
      playCompleteSound()
      setPoppingSubtasks((s) => new Set(s).add(stId))
      setTimeout(() => setPoppingSubtasks((s) => { const n = new Set(s); n.delete(stId); return n }), 400)
    }
    toggleSubtask(projId, stId)
  }, [toggleSubtask])

  const done = project.subtasks.filter((s) => s.done).length
  const total = project.subtasks.length
  const linkedGoal = goals.find((g) => g.id === project.goalId)

  const submitSubtask = () => {
    if (!subtaskInput.trim()) return
    addSubtask(project.id, subtaskInput.trim())
    setSubtaskInput('')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-slate-400 shrink-0">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{project.title}</span>
            {project.tag && <Badge label={project.tag} color={TAG_COLORS[project.tag] || 'slate'} />}
            <Badge label={project.status} color={STATUS_COLORS[project.status]} />
            {linkedGoal && <span className="text-xs text-slate-400">→ {linkedGoal.title}</span>}
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-slate-700 max-w-32">
                <div className="h-1 rounded-full" style={{ width: `${(done / total) * 100}%`, backgroundColor: 'var(--accent-500)' }} />
              </div>
              <span className="text-xs text-slate-400">{done}/{total}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
          <button onClick={() => deleteProject(project.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 border-t border-slate-100 dark:border-slate-700">
          {project.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 pb-1">{project.description}</p>
          )}

          {/* Subtasks */}
          <div className="mt-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Tasks</p>
            <div className="space-y-1">
              {project.subtasks.map((st) => (
                <div key={st.id} className={`flex items-center gap-2 group ${st.done ? 'task-done' : ''}`}>
                  <button
                    onClick={() => handleToggleSubtask(project.id, st.id, st.done)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      st.done ? 'border-transparent text-white' : 'border-slate-300 dark:border-slate-500'
                    }`}
                    style={st.done ? { backgroundColor: 'var(--accent-500)', borderColor: 'var(--accent-500)' } : {}}
                  >
                    {st.done && <Check size={9} className={poppingSubtasks.has(st.id) ? 'task-check-pop' : ''} />}
                  </button>
                  <span className={`text-sm flex-1 ${st.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{st.title}</span>
                  <button
                    onClick={() => deleteSubtask(project.id, st.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-transparent text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400"
                placeholder="Add task..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSubtask() }}
              />
              <Button size="xs" onClick={submitSubtask}>Add</Button>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Notes</p>
            {editingNotes ? (
              <div>
                <textarea
                  autoFocus
                  className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-transparent text-slate-700 dark:text-slate-200 outline-none resize-none"
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => { updateProject(project.id, { notes: notesDraft }); setEditingNotes(false) }}
                />
              </div>
            ) : (
              <p
                className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 min-h-[20px]"
                onClick={() => setEditingNotes(true)}
              >
                {project.notes || <span className="italic text-slate-400">Click to add notes...</span>}
              </p>
            )}
          </div>
        </div>
      )}

      {editing && (
        <Modal title="Edit Project" onClose={() => setEditing(false)}>
          <ProjectForm
            initial={project}
            goals={goals}
            onSave={(f) => { updateProject(project.id, f); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
    </div>
  )
}

export default function GoalsProjects() {
  const { goals, projects, addGoal, updateGoal, deleteGoal, addProject } = useStore()
  const [tab, setTab] = useState('projects')
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [showAddProject, setShowAddProject] = useState(false)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Goals & Projects" subtitle="Track what you're working toward" />

      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-sm mb-6 w-fit">
        {['projects', 'goals'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 capitalize transition-colors ${
              tab === t ? 'text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            style={tab === t ? { backgroundColor: 'var(--accent-500)' } : {}}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowAddProject(true)}>
              <Plus size={14} /> New Project
            </Button>
          </div>
          {projects.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-8">No projects yet</p>
          )}
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} goals={goals} />
          ))}
        </>
      )}

      {tab === 'goals' && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowAddGoal(true)}>
              <Plus size={14} /> New Goal
            </Button>
          </div>
          {goals.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-8">No goals yet</p>
          )}
          <div className="space-y-3">
            {goals.map((g) => (
              <div key={g.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{g.title}</p>
                      <Badge label={g.status} color={STATUS_COLORS[g.status]} />
                    </div>
                    {g.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{g.description}</p>}
                    {g.targetDate && (
                      <p className="text-xs text-slate-400 mt-0.5">Due {format(parseISO(g.targetDate), 'MMM d, yyyy')}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${g.progress}%`, backgroundColor: 'var(--accent-500)' }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{g.progress}%</span>
                    </div>
                    {/* Progress slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={g.progress}
                      onChange={(e) => updateGoal(g.id, { progress: parseInt(e.target.value) })}
                      className="w-full mt-1 accent-current"
                      style={{ accentColor: 'var(--accent-500)' }}
                    />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditGoal(g)} className="p-1 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                    <button onClick={() => deleteGoal(g.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddGoal && (
        <Modal title="New Goal" onClose={() => setShowAddGoal(false)}>
          <GoalForm
            onSave={(f) => { addGoal(f); setShowAddGoal(false) }}
            onCancel={() => setShowAddGoal(false)}
          />
        </Modal>
      )}

      {editGoal && (
        <Modal title="Edit Goal" onClose={() => setEditGoal(null)}>
          <GoalForm
            initial={editGoal}
            onSave={(f) => { updateGoal(editGoal.id, f); setEditGoal(null) }}
            onCancel={() => setEditGoal(null)}
          />
        </Modal>
      )}

      {showAddProject && (
        <Modal title="New Project" onClose={() => setShowAddProject(false)}>
          <ProjectForm
            goals={goals}
            onSave={(f) => { addProject(f); setShowAddProject(false) }}
            onCancel={() => setShowAddProject(false)}
          />
        </Modal>
      )}
    </div>
  )
}
