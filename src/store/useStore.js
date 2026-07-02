import { create } from 'zustand'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Deep-merges `saved` data onto `defaults`, so:
// - Any key added to defaultData in the future automatically gets its default value
// - All existing saved values (arrays, primitives, nested objects) are preserved
// - Arrays are always taken from saved (user data wins, never reset)
function mergeWithDefaults(defaults, saved) {
  if (saved === null || saved === undefined) return defaults
  if (typeof defaults !== 'object' || Array.isArray(defaults)) return saved ?? defaults
  const result = { ...defaults }
  for (const key of Object.keys(defaults)) {
    if (key in saved) {
      if (Array.isArray(defaults[key]) || typeof defaults[key] !== 'object' || defaults[key] === null) {
        result[key] = saved[key]
      } else {
        result[key] = mergeWithDefaults(defaults[key], saved[key])
      }
    }
    // if key not in saved, result[key] keeps the default — new fields are safe
  }
  // preserve any extra keys in saved that aren't in defaults (forward compat)
  for (const key of Object.keys(saved)) {
    if (!(key in defaults)) result[key] = saved[key]
  }
  return result
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
    notes: '',
    moneyTracker: {
      owed: [],
      incoming: [],
    },
  },
  calendar: {
    events: [],
  },
  goals: [],
  projects: [],
  deadlines: [],
  watchlist: {
    games: [],
    shows: [],
  },
  tasks: [],
  wantList: [],
  ideas: [],
  workouts: {
    sessions: [],
    logs: [],
  },
  journal: {
    entries: [],
  },
  settings: {
    darkMode: false,
    accent: 'slate',
    sidebarCollapsed: false,
    claudeApiKey: import.meta.env.VITE_CLAUDE_API_KEY || '',
    customTags: [],
    customTagColors: {},
  },
}

const useStore = create((set, get) => ({
  ...defaultData,
  loaded: false,

  loadFromDisk: async () => {
    const apply = (saved) => {
      const merged = mergeWithDefaults(defaultData, saved)
      set({ ...merged, loaded: true })
      applyTheme(merged.settings)
    }

    if (window.electronAPI) {
      const saved = await window.electronAPI.loadData()
      if (saved) {
        apply(saved)
      } else {
        set({ loaded: true })
        applyTheme(defaultData.settings)
      }
    } else {
      const raw = localStorage.getItem('lifeManagerData')
      if (raw) {
        try {
          apply(JSON.parse(raw))
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
      deadlines: s.deadlines,
      watchlist: s.watchlist,
      tasks: s.tasks,
      wantList: s.wantList,
      ideas: s.ideas,
      workouts: s.workouts,
      journal: s.journal,
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

  // ── FINANCE NOTES ──
  updateFinanceNotes: (notes) => {
    set((s) => ({ finance: { ...s.finance, notes } }))
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

  // ── MONEY TRACKER ──
  addOwed: (entry) => {
    const item = { id: generateId(), received: false, ...entry }
    set((s) => ({
      finance: {
        ...s.finance,
        moneyTracker: {
          ...s.finance.moneyTracker,
          owed: [...s.finance.moneyTracker.owed, item],
        },
      },
    }))
    get().save()
  },

  updateOwed: (id, patch) => {
    set((s) => ({
      finance: {
        ...s.finance,
        moneyTracker: {
          ...s.finance.moneyTracker,
          owed: s.finance.moneyTracker.owed.map((o) =>
            o.id === id ? { ...o, ...patch } : o
          ),
        },
      },
    }))
    get().save()
  },

  deleteOwed: (id) => {
    set((s) => ({
      finance: {
        ...s.finance,
        moneyTracker: {
          ...s.finance.moneyTracker,
          owed: s.finance.moneyTracker.owed.filter((o) => o.id !== id),
        },
      },
    }))
    get().save()
  },

  addIncoming: (entry) => {
    const item = { id: generateId(), received: false, ...entry }
    set((s) => ({
      finance: {
        ...s.finance,
        moneyTracker: {
          ...s.finance.moneyTracker,
          incoming: [...s.finance.moneyTracker.incoming, item],
        },
      },
    }))
    get().save()
  },

  updateIncoming: (id, patch) => {
    set((s) => ({
      finance: {
        ...s.finance,
        moneyTracker: {
          ...s.finance.moneyTracker,
          incoming: s.finance.moneyTracker.incoming.map((i) =>
            i.id === id ? { ...i, ...patch } : i
          ),
        },
      },
    }))
    get().save()
  },

  deleteIncoming: (id) => {
    set((s) => ({
      finance: {
        ...s.finance,
        moneyTracker: {
          ...s.finance.moneyTracker,
          incoming: s.finance.moneyTracker.incoming.filter((i) => i.id !== id),
        },
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

  updateSubtask: (projectId, subtaskId, patch) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, subtasks: p.subtasks.map((st) => st.id === subtaskId ? { ...st, ...patch } : st) }
          : p
      ),
    }))
    get().save()
  },

  moveSubtask: (projectId, subtaskId, dir) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p
        const idx = p.subtasks.findIndex((st) => st.id === subtaskId)
        if (idx < 0) return p
        const target = idx + dir
        if (target < 0 || target >= p.subtasks.length) return p
        const arr = [...p.subtasks]
        const [item] = arr.splice(idx, 1)
        arr.splice(target, 0, item)
        return { ...p, subtasks: arr }
      }),
    }))
    get().save()
  },

  toggleSubtaskToday: (projectId, subtaskId) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, subtasks: p.subtasks.map((st) => st.id === subtaskId ? { ...st, today: !st.today } : st) }
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

  // ── DEADLINES ──
  addDeadline: (deadline) => {
    const item = {
      id: generateId(),
      title: deadline.title,
      endDate: deadline.endDate,
      notes: deadline.notes || '',
      category: deadline.category || 'other',
      done: false,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ deadlines: [...s.deadlines, item] }))
    get().save()
  },

  updateDeadline: (id, patch) => {
    set((s) => ({
      deadlines: s.deadlines.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }))
    get().save()
  },

  deleteDeadline: (id) => {
    set((s) => ({ deadlines: s.deadlines.filter((d) => d.id !== id) }))
    get().save()
  },

  // ── WATCHLIST ──
  addGame: (game) => {
    const item = {
      id: generateId(),
      title: game.title,
      platform: game.platform || '',
      status: game.status || 'want',
      notes: game.notes || '',
      isSeries: game.isSeries || false,
      subGames: game.subGames || [],
      addedAt: new Date().toISOString(),
    }
    set((s) => ({
      watchlist: { ...s.watchlist, games: [...s.watchlist.games, item] },
    }))
    get().save()
  },

  updateGame: (id, patch) => {
    set((s) => ({
      watchlist: {
        ...s.watchlist,
        games: s.watchlist.games.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      },
    }))
    get().save()
  },

  deleteGame: (id) => {
    set((s) => ({
      watchlist: {
        ...s.watchlist,
        games: s.watchlist.games.filter((g) => g.id !== id),
      },
    }))
    get().save()
  },

  addSubGame: (gameId, subGame) => {
    const item = { id: generateId(), title: subGame.title, platform: subGame.platform || '', status: subGame.status || 'want', notes: subGame.notes || '' }
    set((s) => ({
      watchlist: {
        ...s.watchlist,
        games: s.watchlist.games.map((g) => g.id === gameId ? { ...g, subGames: [...(g.subGames || []), item] } : g),
      },
    }))
    get().save()
  },

  updateSubGame: (gameId, subGameId, patch) => {
    set((s) => ({
      watchlist: {
        ...s.watchlist,
        games: s.watchlist.games.map((g) => g.id === gameId
          ? { ...g, subGames: (g.subGames || []).map((sg) => sg.id === subGameId ? { ...sg, ...patch } : sg) }
          : g),
      },
    }))
    get().save()
  },

  deleteSubGame: (gameId, subGameId) => {
    set((s) => ({
      watchlist: {
        ...s.watchlist,
        games: s.watchlist.games.map((g) => g.id === gameId
          ? { ...g, subGames: (g.subGames || []).filter((sg) => sg.id !== subGameId) }
          : g),
      },
    }))
    get().save()
  },

  addShow: (show) => {
    const item = {
      id: generateId(),
      title: show.title,
      service: show.service || '',
      status: show.status || 'want',
      notes: show.notes || '',
      addedAt: new Date().toISOString(),
    }
    set((s) => ({
      watchlist: { ...s.watchlist, shows: [...s.watchlist.shows, item] },
    }))
    get().save()
  },

  updateShow: (id, patch) => {
    set((s) => ({
      watchlist: {
        ...s.watchlist,
        shows: s.watchlist.shows.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)),
      },
    }))
    get().save()
  },

  deleteShow: (id) => {
    set((s) => ({
      watchlist: {
        ...s.watchlist,
        shows: s.watchlist.shows.filter((sh) => sh.id !== id),
      },
    }))
    get().save()
  },

  // ── TASKS (standalone) ──
  addTask2: (task) => {
    const item = { id: generateId(), title: task.title, notes: task.notes || '', dueDate: task.dueDate || null, priority: task.priority || 'none', tags: task.tags || [], today: task.today || false, done: false, createdAt: new Date().toISOString() }
    set((s) => ({ tasks: [...s.tasks, item] }))
    get().save()
  },
  updateTask2: (id, patch) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    get().save()
  },
  deleteTask2: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    get().save()
  },

  // ── WANT LIST ──
  addWantItem: (item) => {
    const newItem = { id: generateId(), title: item.title, notes: item.notes || '', options: item.options || [], priority: item.priority || 'medium', tags: item.tags || [], timeframe: item.timeframe || 'soon', purchased: false, createdAt: new Date().toISOString() }
    set((s) => ({ wantList: [...s.wantList, newItem] }))
    get().save()
  },
  updateWantItem: (id, patch) => {
    set((s) => ({ wantList: s.wantList.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
    get().save()
  },
  deleteWantItem: (id) => {
    set((s) => ({ wantList: s.wantList.filter((i) => i.id !== id) }))
    get().save()
  },

  // ── IDEAS ──
  addIdea: (idea) => {
    const item = { id: generateId(), title: idea.title, description: idea.description || '', category: idea.category || 'other', status: idea.status || 'raw', tags: idea.tags || [], createdAt: new Date().toISOString() }
    set((s) => ({ ideas: [...s.ideas, item] }))
    get().save()
  },
  updateIdea: (id, patch) => {
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
    get().save()
  },
  deleteIdea: (id) => {
    set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) }))
    get().save()
  },

  // ── CUSTOM TAGS ──
  addCustomTag: (tag, colorKey) => {
    set((s) => {
      if (s.settings.customTags.includes(tag)) return s
      const colors = colorKey ? { ...s.settings.customTagColors, [tag]: colorKey } : s.settings.customTagColors
      return { settings: { ...s.settings, customTags: [...s.settings.customTags, tag], customTagColors: colors } }
    })
    get().save()
  },
  removeCustomTag: (tag) => {
    set((s) => {
      const colors = { ...s.settings.customTagColors }
      delete colors[tag]
      return { settings: { ...s.settings, customTags: s.settings.customTags.filter((t) => t !== tag), customTagColors: colors } }
    })
    get().save()
  },
  setCustomTagColor: (tag, colorKey) => {
    set((s) => ({ settings: { ...s.settings, customTagColors: { ...s.settings.customTagColors, [tag]: colorKey } } }))
    get().save()
  },

  // ── WORKOUTS ──
  addSession: (session) => {
    const item = { id: generateId(), name: session.name, trackWeekly: session.trackWeekly || false, exercises: [] }
    set((s) => ({ workouts: { ...s.workouts, sessions: [...s.workouts.sessions, item] } }))
    get().save()
  },
  updateSession: (id, patch) => {
    set((s) => ({ workouts: { ...s.workouts, sessions: s.workouts.sessions.map((ses) => ses.id === id ? { ...ses, ...patch } : ses) } }))
    get().save()
  },
  deleteSession: (id) => {
    set((s) => ({ workouts: { ...s.workouts, sessions: s.workouts.sessions.filter((ses) => ses.id !== id), logs: s.workouts.logs.filter((l) => l.sessionId !== id) } }))
    get().save()
  },
  addExercise: (sessionId, exercise) => {
    const ex = { id: generateId(), name: exercise.name, sets: exercise.sets || '', reps: exercise.reps || '', notes: exercise.notes || '' }
    set((s) => ({ workouts: { ...s.workouts, sessions: s.workouts.sessions.map((ses) => ses.id === sessionId ? { ...ses, exercises: [...ses.exercises, ex] } : ses) } }))
    get().save()
  },
  updateExercise: (sessionId, exerciseId, patch) => {
    set((s) => ({ workouts: { ...s.workouts, sessions: s.workouts.sessions.map((ses) => ses.id === sessionId ? { ...ses, exercises: ses.exercises.map((ex) => ex.id === exerciseId ? { ...ex, ...patch } : ex) } : ses) } }))
    get().save()
  },
  deleteExercise: (sessionId, exerciseId) => {
    set((s) => ({ workouts: { ...s.workouts, sessions: s.workouts.sessions.map((ses) => ses.id === sessionId ? { ...ses, exercises: ses.exercises.filter((ex) => ex.id !== exerciseId) } : ses) } }))
    get().save()
  },
  addLog: (log) => {
    const item = { id: generateId(), date: log.date, sessionId: log.sessionId, sessionName: log.sessionName, completedExercises: log.completedExercises || [] }
    set((s) => ({ workouts: { ...s.workouts, logs: [...s.workouts.logs, item] } }))
    get().save()
  },
  deleteLog: (id) => {
    set((s) => ({ workouts: { ...s.workouts, logs: s.workouts.logs.filter((l) => l.id !== id) } }))
    get().save()
  },

  // ── JOURNAL ──
  upsertJournalEntry: (date, content) => {
    const entries = get().journal.entries
    const existing = entries.find((e) => e.date === date)
    if (existing) {
      set((s) => ({ journal: { entries: s.journal.entries.map((e) => e.date === date ? { ...e, content, updatedAt: new Date().toISOString() } : e) } }))
    } else {
      const item = { id: generateId(), date, content, updatedAt: new Date().toISOString() }
      set((s) => ({ journal: { entries: [...s.journal.entries, item] } }))
    }
    get().save()
  },
  deleteJournalEntry: (id) => {
    set((s) => ({ journal: { entries: s.journal.entries.filter((e) => e.id !== id) } }))
    get().save()
  },

  // ── RESTORE FROM BACKUP ──
  restoreFromBackup: (data) => {
    const merged = mergeWithDefaults(defaultData, data)
    set({ ...merged, loaded: true })
    applyTheme(merged.settings)
    get().save()
  },

  // ── WIPE ALL DATA ──
  wipeAllData: () => {
    set({ ...defaultData, settings: { ...get().settings }, loaded: true })
    get().save()
  },

  // ── WIPE SECTION ──
  wipeSectionData: (section) => {
    const s = get()
    const patches = {
      tasks: () => set({ tasks: [] }),
      projects: () => set({ projects: [], deadlines: [] }),
      deadlines: () => set({ deadlines: [] }),
      ideas: () => set({ ideas: [] }),
      wantList: () => set({ wantList: [] }),
      journal: () => set({ journal: { entries: [] } }),
      workouts: () => set({ workouts: { sessions: [], logs: [] } }),
      games: () => set({ watchlist: { ...s.watchlist, games: [] } }),
      shows: () => set({ watchlist: { ...s.watchlist, shows: [] } }),
      calendar: () => set({ calendar: { events: [] } }),
      subscriptions: () => set({ finance: { ...s.finance, subscriptions: [] } }),
      finance: () => set({ finance: { ...defaultData.finance, notes: s.finance.notes } }),
    }
    patches[section]?.()
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
