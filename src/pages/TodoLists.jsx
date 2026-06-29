import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const PRIORITY_COLORS = { high: 'red', medium: 'yellow', none: 'slate' }
const CATEGORY_COLORS = ['blue', 'green', 'purple', 'pink', 'orange', 'slate']

function TaskRow({ task, catId }) {
  const { updateTask, deleteTask } = useStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: task.title, notes: task.notes, dueDate: task.dueDate || '', priority: task.priority })

  const save = () => {
    updateTask(catId, task.id, draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600 space-y-2">
        <input
          autoFocus
          className="w-full text-sm bg-transparent border-b border-slate-300 dark:border-slate-500 pb-1 outline-none text-slate-800 dark:text-slate-100"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        />
        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            className="text-xs bg-transparent border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-600 dark:text-slate-300"
            value={draft.dueDate}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          />
          <select
            className="text-xs bg-transparent border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-600 dark:text-slate-300"
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
          >
            <option value="none">No priority</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <input
          className="w-full text-xs bg-transparent border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-500 dark:text-slate-400 outline-none"
          placeholder="Notes (optional)"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
        <div className="flex gap-2">
          <Button size="xs" onClick={save}>Save</Button>
          <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 py-2 group ${task.done ? 'task-done' : ''}`}>
      <button
        onClick={() => updateTask(catId, task.id, { done: !task.done })}
        className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.done ? 'border-transparent text-white' : 'border-slate-300 dark:border-slate-500 hover:border-slate-400'
        }`}
        style={task.done ? { backgroundColor: 'var(--accent-500)', borderColor: 'var(--accent-500)' } : {}}
      >
        {task.done && <Check size={10} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-slate-700 dark:text-slate-200 ${task.done ? 'line-through' : ''}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.dueDate && (
            <span className="text-xs text-slate-400">{format(parseISO(task.dueDate), 'MMM d')}</span>
          )}
          {task.priority !== 'none' && (
            <Badge label={task.priority} color={PRIORITY_COLORS[task.priority]} />
          )}
          {task.notes && <span className="text-xs text-slate-400 truncate max-w-xs">{task.notes}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <Pencil size={13} />
        </button>
        <button onClick={() => deleteTask(catId, task.id)} className="p-1 text-slate-400 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function AddTaskInline({ catId, onDone }) {
  const { addTask } = useStore()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('none')

  const submit = () => {
    if (!title.trim()) return
    addTask(catId, { title: title.trim(), dueDate: dueDate || null, priority })
    setTitle('')
    setDueDate('')
    setPriority('none')
    onDone()
  }

  return (
    <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600 space-y-2">
      <input
        autoFocus
        placeholder="Task title..."
        className="w-full text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone() }}
      />
      <div className="flex gap-2 flex-wrap">
        <input
          type="date"
          className="text-xs bg-transparent border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-600 dark:text-slate-300"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <select
          className="text-xs bg-transparent border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-600 dark:text-slate-300"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="none">No priority</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="xs" onClick={submit}>Add task</Button>
        <Button size="xs" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  )
}

function CategoryBlock({ cat, filter }) {
  const { deleteCategory, renameCategory } = useStore()
  const [collapsed, setCollapsed] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(cat.name)

  const tasks = cat.tasks.filter((t) => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const donePct = cat.tasks.length ? Math.round((cat.tasks.filter((t) => t.done).length / cat.tasks.length) * 100) : 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <button className="text-slate-400 shrink-0" onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        {renaming ? (
          <input
            autoFocus
            className="flex-1 text-sm font-semibold bg-transparent border-b border-slate-300 outline-none text-slate-800 dark:text-slate-100"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { renameCategory(cat.id, newName); setRenaming(false) }
              if (e.key === 'Escape') setRenaming(false)
            }}
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
        )}
        <span className="text-xs text-slate-400">{donePct}%</span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setRenaming(true)} className="p-1 text-slate-400 hover:text-slate-600">
            <Pencil size={13} />
          </button>
          <button onClick={() => deleteCategory(cat.id)} className="p-1 text-slate-400 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-3 divide-y divide-slate-100 dark:divide-slate-700">
          {tasks.map((t) => <TaskRow key={t.id} task={t} catId={cat.id} />)}
          {tasks.length === 0 && !addingTask && (
            <p className="text-xs text-slate-400 italic py-2">No tasks</p>
          )}
          {addingTask && <AddTaskInline catId={cat.id} onDone={() => setAddingTask(false)} />}
          {!addingTask && (
            <button
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 pt-2 transition-colors"
              onClick={() => setAddingTask(true)}
            >
              <Plus size={13} /> Add task
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function TodoLists() {
  const { todos, addCategory } = useStore()
  const [filter, setFilter] = useState('all')
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const submitNewCat = () => {
    if (!newCatName.trim()) return
    addCategory(newCatName.trim())
    setNewCatName('')
    setShowNewCat(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="To-Do Lists"
        subtitle="Organized by category"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-xs">
              {['all', 'active', 'done'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    filter === f ? 'text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  style={filter === f ? { backgroundColor: 'var(--accent-500)' } : {}}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowNewCat(true)}>
              <Plus size={14} /> New List
            </Button>
          </div>
        }
      />

      {todos.categories.map((cat) => (
        <CategoryBlock key={cat.id} cat={cat} filter={filter} />
      ))}

      {todos.categories.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No lists yet. Create your first one.</p>
        </div>
      )}

      {showNewCat && (
        <Modal title="New List" onClose={() => setShowNewCat(false)}>
          <div className="space-y-3">
            <input
              autoFocus
              placeholder="List name (e.g. Personal, Work, YouTube)"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitNewCat() }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowNewCat(false)}>Cancel</Button>
              <Button onClick={submitNewCat}>Create</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
