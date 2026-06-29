import { create } from 'zustand'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const defaultData = {
  todos: {
    categories: [
      {
        id: generateId(),
        name: 'Personal',
        color: 'blue',
        tasks: [],
      },
    ],
  },
  finance: {
    subscriptions: [],
    income: 0,
    expenses: [],
  },
  calendar: {
    events: [],
  },
  goals: [],
  projects: [],
  settings: {
    darkMode: false,
    accent: 'slate',
    sidebarCollapsed: false,
  },
}

const useStore = create((set, get) => ({
  ...defaultData,
  loaded: false,

  loadFromDisk: async () => {
    if (window.electronAPI) {
      const saved = await window.electronAPI.loadData()
      if (saved) {
        // merge settings defaults in case new fields were added
        const merged = {
          ...defaultData,
          ...saved,
          settings: { ...defaultData.settings, ...(saved.settings || {}) },
        }
        set({ ...merged, loaded: true })
        applyTheme(merged.settings)
      } else {
        set({ loaded: true })
        applyTheme(defaultData.settings)
      }
    } else {
      // Running in browser preview without Electron
      const raw = localStorage.getItem('lifeManagerData')
      if (raw) {
        try {
          const saved = JSON.parse(raw)
          const merged = {
            ...defaultData,
            ...saved,
            settings: { ...defaultData.settings, ...(saved.settings || {}) },
          }
          set({ ...merged, loaded: true })
          applyTheme(merged.settings)
        } catch {
          set({ loaded: true })
          applyTheme(defaultData.settings)
        }
      } else {
        set({ loaded: true })
        applyTheme(defaultData.settings)
      }
    }
  },

  save: () => {
    const s = get()
    const data = {
      todos: s.todos,
      finance: s.finance,
      calendar: s.calendar,
      goals: s.goals,
      projects: s.projects,
      settings: s.settings,
    }
    if (window.electronAPI) {
      window.electronAPI.saveData(data)
    } else {
      localStorage.setItem('lifeManagerData', JSON.stringify(data))
    }
  },

  updateSettings: (patch) => {
    set((s) => {
      const settings = { ...s.settings, ...patch }
      applyTheme(settings)
      return { settings }
    })
    get().save()
  },

  // ── TODOS ──
  addCategory: (name, color = 'blue') => {
    set((s) => ({
      todos: {
        ...s.todos,
        categories: [
          ...s.todos.categories,
          { id: generateId(), name, color, tasks: [] },
        ],
      },
    }))
    get().save()
  },

  deleteCategory: (catId) => {
    set((s) => ({
      todos: {
        ...s.todos,
        categories: s.todos.categories.filter((c) => c.id !== catId),
      },
    }))
    get().save()
  },

  renameCategory: (catId, name) => {
    set((s) => ({
      todos: {
        ...s.todos,
        categories: s.todos.categories.map((c) =>
          c.id === catId ? { ...c, name } : c
        ),
      },
    }))
    get().save()
  },

  addTask: (catId, task) => {
    const newTask = {
      id: generateId(),
      title: task.title,
      notes: task.notes || '',
      dueDate: task.dueDate || null,
      priority: task.priority || 'none',
      done: false,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({
      todos: {
        ...s.todos,
        categories: s.todos.categories.map((c) =>
          c.id === catId ? { ...c, tasks: [...c.tasks, newTask] } : c
        ),
      },
    }))
    get().save()
  },

  updateTask: (catId, taskId, patch) => {
    set((s) => ({
      todos: {
        ...s.todos,
        categories: s.todos.categories.map((c) =>
          c.id === catId
            ? {
                ...c,
                tasks: c.tasks.map((t) =>
                  t.id === taskId ? { ...t, ...patch } : t
                ),
              }
            : c
        ),
      },
    }))
    get().save()
  },

  deleteTask: (catId, taskId) => {
    set((s) => ({
      todos: {
        ...s.todos,
        categories: s.todos.categories.map((c) =>
          c.id === catId
            ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
            : c
        ),
      },
    }))
    get().save()
  },

  // ── FINANCE ──
  addSubscription: (sub) => {
    const newSub = { id: generateId(), ...sub }
    set((s) => ({
      finance: {
        ...s.finance,
        subscriptions: [...s.finance.subscriptions, newSub],
      },
    }))
    get().save()
  },

  updateSubscription: (id, patch) => {
    set((s) => ({
      finance: {
        ...s.finance,
        subscriptions: s.finance.subscriptions.map((sub) =>
          sub.id === id ? { ...sub, ...patch } : sub
        ),
      },
    }))
    get().save()
  },

  deleteSubscription: (id) => {
    set((s) => ({
      finance: {
        ...s.finance,
        subscriptions: s.finance.subscriptions.filter((sub) => sub.id !== id),
      },
    }))
    get().save()
  },

  setIncome: (amount) => {
    set((s) => ({ finance: { ...s.finance, income: amount } }))
    get().save()
  },

  addExpense: (expense) => {
    const newExpense = { id: generateId(), ...expense }
    set((s) => ({
      finance: {
        ...s.finance,
        expenses: [...s.finance.expenses, newExpense],
      },
    }))
    get().save()
  },

  deleteExpense: (id) => {
    set((s) => ({
      finance: {
        ...s.finance,
        expenses: s.finance.expenses.filter((e) => e.id !== id),
      },
    }))
    get().save()
  },

  // ── CALENDAR ──
  addEvent: (event) => {
    const newEvent = { id: generateId(), ...event }
    set((s) => ({
      calendar: { events: [...s.calendar.events, newEvent] },
    }))
    get().save()
  },

  updateEvent: (id, patch) => {
    set((s) => ({
      calendar: {
        events: s.calendar.events.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        ),
      },
    }))
    get().save()
  },

  deleteEvent: (id) => {
    set((s) => ({
      calendar: {
        events: s.calendar.events.filter((e) => e.id !== id),
      },
    }))
    get().save()
  },

  // ── GOALS ──
  addGoal: (goal) => {
    const newGoal = {
      id: generateId(),
      title: goal.title,
      description: goal.description || '',
      targetDate: goal.targetDate || null,
      progress: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ goals: [...s.goals, newGoal] }))
    get().save()
  },

  updateGoal: (id, patch) => {
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
    get().save()
  },

  deleteGoal: (id) => {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
    get().save()
  },

  // ── PROJECTS ──
  addProject: (project) => {
    const newProject = {
      id: generateId(),
      title: project.title,
      description: project.description || '',
      goalId: project.goalId || null,
      tag: project.tag || '',
      status: 'active',
      notes: '',
      subtasks: [],
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ projects: [...s.projects, newProject] }))
    get().save()
  },

  updateProject: (id, patch) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
    get().save()
  },

  deleteProject: (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    get().save()
  },

  addSubtask: (projectId, title) => {
    const subtask = { id: generateId(), title, done: false }
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, subtasks: [...p.subtasks, subtask] }
          : p
      ),
    }))
    get().save()
  },

  toggleSubtask: (projectId, subtaskId) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              subtasks: p.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, done: !st.done } : st
              ),
            }
          : p
      ),
    }))
    get().save()
  },

  deleteSubtask: (projectId, subtaskId) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, subtasks: p.subtasks.filter((st) => st.id !== subtaskId) }
          : p
      ),
    }))
    get().save()
  },
}))

function applyTheme(settings) {
  const root = document.documentElement
  if (settings.darkMode) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.classList.remove('accent-slate', 'accent-sage', 'accent-violet', 'accent-rose')
  root.classList.add(`accent-${settings.accent || 'slate'}`)
}

export default useStore
