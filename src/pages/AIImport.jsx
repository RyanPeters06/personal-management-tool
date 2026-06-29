import { useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import { Sparkles, Upload, Check, ChevronDown, ChevronRight, AlertCircle, Trash2, RefreshCw } from 'lucide-react'

function buildSystemPrompt(existingIdeas) {
  const ideasContext = existingIdeas.length > 0
    ? `\n\nThe user already has these ideas saved:\n${existingIdeas.map((idea, i) => `${i + 1}. "${idea.title}"${idea.description ? ` — ${idea.description}` : ''}`).join('\n')}\n\nIMPORTANT: If the user's text appears to build on, expand, or add new thoughts to one of those existing ideas, put it in "ideaUpdates" instead of "data.ideas". If you are not certain whether it's related or a new idea, add it to "questions" to ask the user.`
    : ''

  return `You are a personal life organizer assistant. The user will give you unstructured text and you must parse it into structured JSON for their life manager app.

Return ONLY a valid JSON object. Only include keys that have items to add:

{
  "data": {
    "tasks": [
      { "title": "string", "notes": "string or empty", "dueDate": "YYYY-MM-DD or null", "priority": "none|medium|high" }
    ],
    "calendar": [
      { "title": "string", "date": "YYYY-MM-DD", "time": "HH:MM or empty", "category": "work|personal|health|finance|other", "notes": "string or empty" }
    ],
    "goals": [
      { "title": "string", "description": "string or empty", "targetDate": "YYYY-MM-DD or null" }
    ],
    "projects": [
      { "title": "string", "description": "string or empty", "tag": "Side Hustle|Work|Personal|Health|Finance or empty", "subtasks": ["string"] }
    ],
    "deadlines": [
      { "title": "string", "endDate": "YYYY-MM-DD", "notes": "string or empty", "category": "sale|offer|event|other" }
    ],
    "ideas": [
      { "title": "string", "description": "string or empty", "category": "startup|build|creative|other", "status": "raw" }
    ],
    "wantList": [
      { "title": "string", "notes": "string or empty", "options": [{ "label": "string", "url": "string", "price": "string" }], "priority": "high|medium|low" }
    ],
    "subscriptions": [
      { "name": "string", "cost": "number", "cycle": "monthly|annual", "renewDate": "YYYY-MM-DD or empty", "category": "streaming|tools|utilities|health|other", "active": true }
    ],
    "workouts": [
      { "name": "string (session name, e.g. Leg Day)", "exercises": [{ "name": "string", "sets": "string or empty", "reps": "string or empty", "notes": "string or empty" }] }
    ],
    "watchlist": {
      "games": [{ "title": "string", "platform": "string or empty", "status": "want|playing|done" }],
      "shows": [{ "title": "string", "service": "string or empty", "status": "want|watching|done" }]
    },
    "moneyTracker": {
      "owed": [{ "person": "string", "amount": "number as string", "reason": "string or empty", "dueDate": "YYYY-MM-DD or empty" }],
      "incoming": [{ "source": "string", "amount": "number as string", "reason": "string or empty", "expectedDate": "YYYY-MM-DD or empty" }]
    }
  },
  "ideaUpdates": [
    { "existingTitle": "string (exact title of the existing idea to update)", "appendText": "string (the new thoughts/content to append to that idea's description)" }
  ],
  "questions": [],
  "flagged": [],
  "removals": []
}

The "ideaUpdates" array is for content that expands an existing idea rather than creating a new one. Only use it when you are confident the new text relates to an existing idea.${ideasContext}

The "removals" array is for things the user says they cancelled, finished, deleted, unsubscribed from, or no longer want tracked. Each entry: { "section": "subscriptions|tasks|goals|projects|deadlines|ideas|wantList|watchlist.games|watchlist.shows|moneyTracker.owed|moneyTracker.incoming|workouts", "title": "string (the name/title to match)", "reason": "one line explaining why it should be removed" }.

The "questions" array is for items where a date is ambiguous (e.g. "next Friday" without a clear year, or "soon") OR when you are unsure whether an idea is new or building on an existing one. Each entry: { "item": "what the item is", "question": "what you need clarified" }.

The "flagged" array is for items where you are genuinely unsure which category fits (e.g. something that could be a goal OR an idea). Each entry: { "title": "string", "description": "string", "suggestedCategories": ["goal", "idea"], "reason": "why you're unsure" }.

Rules:
- Quick tasks and to-dos go in "tasks".
- Events with a specific date go in "calendar". Time-sensitive sales/offers go in "deadlines".
- Long-term ambitions go in "goals". Active work with steps goes in "projects".
- Brain dump / startup / build ideas go in "ideas".
- Things the user wants to buy go in "wantList".
- Recurring paid services (Netflix, Spotify, SaaS tools, gym memberships, etc.) go in "subscriptions".
- Workout routines, exercise plans, or gym sessions go in "workouts". Group exercises under a named session (e.g. "Leg Day", "Push Day").
- Games and shows/movies/TV go in "watchlist".
- Money owed or expected goes in "moneyTracker".
- If a date is relative (e.g. "next week") and you can resolve it from today's date, do so. If you cannot, add it to "questions".
- If you are confident about category, put item in data and do NOT flag it.
- If the user mentions cancelling, unsubscribing, finishing, removing, or no longer wanting something tracked, add it to "removals". Do NOT add it to "data" as well.
- Today's date is ${new Date().toISOString().slice(0, 10)}.
- Return ONLY the JSON object. No explanation, no markdown code fences, no prose.`
}

function SectionPreview({ title, count, children }) {
  const [open, setOpen] = useState(true)
  if (count === 0) return null
  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title} <span className="text-slate-400 font-normal">({count})</span></span>
        {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 py-3 space-y-1.5">{children}</div>}
    </div>
  )
}

function PreviewItem({ text, sub }) {
  return (
    <div className="flex items-start gap-2">
      <Check size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-500)' }} />
      <div>
        <p className="text-sm text-slate-700 dark:text-slate-200">{text}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

export default function AIImport() {
  const store = useStore()
  const { settings, ideas, addEvent, addGoal, addProject, addSubtask,
    addDeadline, addGame, addShow, addOwed, addIncoming, addTask2, addIdea, updateIdea, addWantItem,
    addSubscription, addSession, addExercise,
    deleteTask2, deleteEvent, deleteGoal, deleteProject, deleteDeadline, deleteIdea,
    deleteWantItem, deleteSubscription, deleteSession, deleteGame, deleteShow, deleteOwed, deleteIncoming } = store

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('input') // input | clarify | preview | done
  const [parsed, setParsed] = useState(null)
  const [answers, setAnswers] = useState({})
  const [flaggedChoices, setFlaggedChoices] = useState({})
  const [confirmedRemovals, setConfirmedRemovals] = useState({})
  const [accepted, setAccepted] = useState(false)

  const hasKey = !!settings.claudeApiKey

  const loadFile = async () => {
    if (window.electronAPI?.openFile) {
      const content = await window.electronAPI.openFile()
      if (content) setText(content)
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.md'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => setText(ev.target.result)
        reader.readAsText(file)
      }
      input.click()
    }
  }

  const callClaude = async (messages) => {
    const client = new Anthropic({ apiKey: settings.claudeApiKey, dangerouslyAllowBrowser: true })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: buildSystemPrompt(ideas),
      messages,
    })
    const raw = message.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(raw)
  }

  const runImport = async () => {
    if (!text.trim()) return
    if (!hasKey) { setError('Add your Claude API key in Settings first.'); return }
    if (!navigator.onLine) { setError("You're offline. Connect to the internet to use AI Import."); return }
    setLoading(true)
    setError('')
    setParsed(null)
    try {
      const result = await callClaude([{ role: 'user', content: text }])
      setParsed(result)
      // Pre-check all removals by default
      const initRemovals = {}
      result.removals?.forEach((_, i) => { initRemovals[i] = true })
      setConfirmedRemovals(initRemovals)

      const hasQuestions = result.questions?.length > 0
      const hasFlagged = result.flagged?.length > 0
      if (hasQuestions || hasFlagged) {
        const initChoices = {}
        result.flagged?.forEach((f, i) => { initChoices[i] = f.suggestedCategories?.[0] || 'ideas' })
        setFlaggedChoices(initChoices)
        setPhase('clarify')
      } else {
        setPhase('preview')
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitClarifications = async () => {
    if (!parsed) return
    const hasQuestions = parsed.questions?.length > 0
    if (!hasQuestions && parsed.flagged?.length === 0) { setPhase('preview'); return }

    // If only flagged (no questions), resolve locally
    if (!hasQuestions) {
      resolveFlaggedLocally()
      setPhase('preview')
      return
    }

    setLoading(true)
    setError('')
    try {
      const clarificationText = parsed.questions.map((q, i) => `Q: ${q.question}\nA: ${answers[i] || 'no info'}`).join('\n\n')
      const result = await callClaude([
        { role: 'user', content: text },
        { role: 'assistant', content: JSON.stringify(parsed) },
        { role: 'user', content: `Here are my answers to your questions:\n${clarificationText}\n\nPlease re-parse the original text with this context. Return the same JSON format.` },
      ])
      // Merge flagged resolutions
      resolveFlaggedInto(result)
      setParsed(result)
      setPhase('preview')
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const resolveFlaggedLocally = () => {
    if (!parsed?.flagged?.length) return
    const updated = { ...parsed, data: { ...parsed.data } }
    parsed.flagged.forEach((f, i) => {
      const cat = flaggedChoices[i] || 'ideas'
      addToCategory(updated.data, cat, { title: f.title, description: f.description || '' })
    })
    setParsed(updated)
  }

  const resolveFlaggedInto = (result) => {
    if (!parsed?.flagged?.length) return
    parsed.flagged.forEach((f, i) => {
      const cat = flaggedChoices[i] || 'ideas'
      if (!result.data) result.data = {}
      addToCategory(result.data, cat, { title: f.title, description: f.description || '' })
    })
  }

  const addToCategory = (data, cat, item) => {
    if (cat === 'tasks') { if (!data.tasks) data.tasks = []; data.tasks.push({ title: item.title, notes: item.description, priority: 'none' }) }
    else if (cat === 'goals') { if (!data.goals) data.goals = []; data.goals.push({ title: item.title, description: item.description }) }
    else if (cat === 'ideas') { if (!data.ideas) data.ideas = []; data.ideas.push({ title: item.title, description: item.description, category: 'other', status: 'raw' }) }
    else if (cat === 'projects') { if (!data.projects) data.projects = []; data.projects.push({ title: item.title, description: item.description }) }
    else if (cat === 'wantList') { if (!data.wantList) data.wantList = []; data.wantList.push({ title: item.title, notes: item.description, priority: 'medium', options: [] }) }
    else if (cat === 'workouts') { if (!data.workouts) data.workouts = []; data.workouts.push({ name: item.title, exercises: [] }) }
    else if (cat === 'subscriptions') { if (!data.subscriptions) data.subscriptions = []; data.subscriptions.push({ name: item.title, cost: 0, cycle: 'monthly', category: 'other', active: true }) }
  }

  const acceptAll = () => {
    if (!parsed?.data) return
    const d = parsed.data

    d.tasks?.forEach((t) => addTask2({ title: t.title, notes: t.notes || '', dueDate: t.dueDate || null, priority: t.priority || 'none' }))
    d.calendar?.forEach((e) => addEvent(e))
    d.goals?.forEach((g) => addGoal(g))
    d.projects?.forEach((p) => {
      addProject({ title: p.title, description: p.description || '', tag: p.tag || '' })
      if (p.subtasks?.length) {
        const proj = useStore.getState().projects.find((pr) => pr.title === p.title)
        if (proj) p.subtasks.forEach((st) => addSubtask(proj.id, st))
      }
    })
    d.deadlines?.forEach((dl) => addDeadline(dl))
    d.ideas?.forEach((idea) => addIdea(idea))
    parsed.ideaUpdates?.forEach((upd) => {
      const existing = useStore.getState().ideas.find(
        (idea) => idea.title.toLowerCase() === upd.existingTitle.toLowerCase()
      )
      if (existing) {
        const newDesc = existing.description
          ? `${existing.description}\n\n${upd.appendText}`
          : upd.appendText
        updateIdea(existing.id, { description: newDesc })
      }
    })
    d.wantList?.forEach((item) => addWantItem(item))
    d.subscriptions?.forEach((sub) => addSubscription({ name: sub.name, cost: Number(sub.cost) || 0, cycle: sub.cycle || 'monthly', renewDate: sub.renewDate || '', category: sub.category || 'other', active: true }))
    d.workouts?.forEach((w) => {
      addSession({ name: w.name, trackWeekly: false })
      const created = useStore.getState().workouts.sessions.find((s) => s.name === w.name)
      if (created && w.exercises?.length) {
        w.exercises.forEach((ex) => addExercise(created.id, { name: ex.name, sets: ex.sets || '', reps: ex.reps || '', notes: ex.notes || '' }))
      }
    })
    d.watchlist?.games?.forEach((g) => addGame(g))
    d.watchlist?.shows?.forEach((s) => addShow(s))
    d.moneyTracker?.owed?.forEach((o) => addOwed(o))
    d.moneyTracker?.incoming?.forEach((inc) => addIncoming(inc))

    // Process confirmed removals
    const state = useStore.getState()
    const match = (list, title) => list?.find((x) => (x.title || x.name || x.person || x.source || '')?.toLowerCase() === title?.toLowerCase())
    parsed.removals?.forEach((r, i) => {
      if (!confirmedRemovals[i]) return
      const t = r.title
      const s = r.section
      if (s === 'subscriptions') { const x = match(state.finance.subscriptions, t); if (x) deleteSubscription(x.id) }
      else if (s === 'tasks') { const x = match(state.tasks, t); if (x) deleteTask2(x.id) }
      else if (s === 'goals') { const x = match(state.goals, t); if (x) deleteGoal(x.id) }
      else if (s === 'projects') { const x = match(state.projects, t); if (x) deleteProject(x.id) }
      else if (s === 'deadlines') { const x = match(state.deadlines, t); if (x) deleteDeadline(x.id) }
      else if (s === 'ideas') { const x = match(state.ideas, t); if (x) deleteIdea(x.id) }
      else if (s === 'wantList') { const x = match(state.wantList, t); if (x) deleteWantItem(x.id) }
      else if (s === 'workouts') { const x = match(state.workouts.sessions, t); if (x) deleteSession(x.id) }
      else if (s === 'watchlist.games') { const x = match(state.watchlist.games, t); if (x) deleteGame(x.id) }
      else if (s === 'watchlist.shows') { const x = match(state.watchlist.shows, t); if (x) deleteShow(x.id) }
      else if (s === 'moneyTracker.owed') { const x = match(state.finance.moneyTracker.owed, t); if (x) deleteOwed(x.id) }
      else if (s === 'moneyTracker.incoming') { const x = match(state.finance.moneyTracker.incoming, t); if (x) deleteIncoming(x.id) }
      else if (s === 'calendar') { const x = match(state.calendar.events, t); if (x) deleteEvent(x.id) }
    })

    setAccepted(true)
    setPhase('done')
  }

  const reset = () => {
    setText('')
    setParsed(null)
    setAccepted(false)
    setError('')
    setAnswers({})
    setFlaggedChoices({})
    setConfirmedRemovals({})
    setPhase('input')
  }

  const d = parsed?.data || {}
  const ideaUpdates = parsed?.ideaUpdates || []
  const totalItems = [
    d.tasks?.length || 0,
    d.calendar?.length || 0,
    d.goals?.length || 0,
    d.projects?.length || 0,
    d.deadlines?.length || 0,
    d.ideas?.length || 0,
    ideaUpdates.length,
    d.wantList?.length || 0,
    d.subscriptions?.length || 0,
    d.workouts?.length || 0,
    d.watchlist?.games?.length || 0,
    d.watchlist?.shows?.length || 0,
    d.moneyTracker?.owed?.length || 0,
    d.moneyTracker?.incoming?.length || 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="AI Import"
        subtitle="Paste any text and Claude will organize it for you"
      />

      {!hasKey && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            No API key found. Go to <strong>Settings</strong> and add your Claude API key to use this feature.
          </p>
        </div>
      )}

      {phase === 'input' && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Paste your text or load a file</p>
              <button
                onClick={loadFile}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Upload size={12} /> Load .txt / .md
              </button>
            </div>
            <textarea
              className="w-full h-56 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 outline-none resize-none placeholder-slate-400 focus:border-slate-400"
              placeholder={`Paste anything here — a to-do list, notes, a brain dump...\n\nExamples:\n• "Buy new headphones by Friday"\n• "John owes me $40 for dinner"\n• "Watch Oppenheimer on Netflix"\n• "Goal: Launch my YouTube channel by December"`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 mb-4">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Uses Claude Haiku — typically &lt;$0.01 per import</p>
            <Button onClick={runImport} disabled={!text.trim() || loading || !hasKey} size="md">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <><Sparkles size={15} /> Import with AI</>
              )}
            </Button>
          </div>
        </>
      )}

      {phase === 'clarify' && parsed && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Claude needs a bit more info before importing.</p>
            <Button variant="secondary" onClick={reset}>Start Over</Button>
          </div>

          {parsed.questions?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Clarify Ambiguous Dates</p>
              <div className="space-y-3">
                {parsed.questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1"><span className="font-medium">{q.item}</span> — {q.question}</p>
                    <input
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
                      placeholder="Your answer..."
                      value={answers[i] || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsed.flagged?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Categorize Flagged Items</p>
              <p className="text-xs text-slate-400 mb-3">Claude wasn't sure where these belong — pick a category for each.</p>
              <div className="space-y-3">
                {parsed.flagged.map((f, i) => (
                  <div key={i} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-0.5">{f.title}</p>
                    {f.description && <p className="text-xs text-slate-400 mb-2">{f.description}</p>}
                    <p className="text-xs text-slate-400 mb-2 italic">{f.reason}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(f.suggestedCategories || ['tasks', 'goals', 'ideas']).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFlaggedChoices((fc) => ({ ...fc, [i]: cat }))}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            flaggedChoices[i] === cat ? 'text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                          style={flaggedChoices[i] === cat ? { backgroundColor: 'var(--accent-500)' } : {}}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 mb-4">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={submitClarifications} disabled={loading}>
              {loading ? 'Processing...' : <><Check size={14} /> Continue</>}
            </Button>
          </div>
        </>
      )}

      {phase === 'preview' && parsed && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {totalItems > 0 && <><strong>{totalItems}</strong> item{totalItems !== 1 ? 's' : ''} to add{parsed?.removals?.length > 0 ? ' · ' : '.'}</>}
                {parsed?.removals?.length > 0 && (
                  <span className="text-red-500 font-medium">
                    {parsed.removals.filter((_, i) => confirmedRemovals[i]).length} deletion{parsed.removals.filter((_, i) => confirmedRemovals[i]).length !== 1 ? 's' : ''} queued.
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>Start Over</Button>
              <Button onClick={acceptAll} disabled={totalItems === 0 && !Object.values(confirmedRemovals).some(Boolean)}>
                <Check size={14} /> Accept All
              </Button>
            </div>
          </div>

          <SectionPreview title="Tasks" count={d.tasks?.length || 0}>
            {d.tasks?.map((t, i) => (
              <PreviewItem key={i} text={t.title} sub={[t.dueDate, t.priority !== 'none' && t.priority].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Calendar Events" count={d.calendar?.length || 0}>
            {d.calendar?.map((e, i) => (
              <PreviewItem key={i} text={e.title} sub={[e.date, e.time].filter(Boolean).join(' at ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Goals" count={d.goals?.length || 0}>
            {d.goals?.map((g, i) => (
              <PreviewItem key={i} text={g.title} sub={[g.description, g.targetDate].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Projects" count={d.projects?.length || 0}>
            {d.projects?.map((p, i) => (
              <PreviewItem key={i} text={p.title} sub={[p.tag, p.subtasks?.length ? `${p.subtasks.length} subtasks` : null].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Deadlines" count={d.deadlines?.length || 0}>
            {d.deadlines?.map((dl, i) => (
              <PreviewItem key={i} text={dl.title} sub={[dl.category, dl.endDate].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Ideas (New)" count={d.ideas?.length || 0}>
            {d.ideas?.map((idea, i) => (
              <PreviewItem key={i} text={idea.title} sub={[idea.category, idea.status].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          {ideaUpdates.length > 0 && (
            <SectionPreview title="Ideas (Updates to Existing)" count={ideaUpdates.length}>
              {ideaUpdates.map((upd, i) => (
                <div key={i} className="flex items-start gap-2">
                  <RefreshCw size={13} className="mt-0.5 shrink-0 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{upd.existingTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5 italic">"{upd.appendText}"</p>
                  </div>
                </div>
              ))}
            </SectionPreview>
          )}

          <SectionPreview title="Want List" count={d.wantList?.length || 0}>
            {d.wantList?.map((item, i) => (
              <PreviewItem key={i} text={item.title} sub={item.priority} />
            ))}
          </SectionPreview>

          {/* Removals warning block */}
          {parsed.removals?.length > 0 && (
            <div className="border-2 border-red-400 dark:border-red-700 rounded-xl overflow-hidden mb-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20">
                <Trash2 size={14} className="text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Removals — {parsed.removals.filter((_, i) => confirmedRemovals[i]).length} of {parsed.removals.length} selected
                </p>
              </div>
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Warning: checked items will be permanently deleted when you click Accept. Uncheck anything you want to keep.
                </p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {parsed.removals.map((r, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        confirmedRemovals[i] ? 'border-red-500 bg-red-500' : 'border-slate-300 dark:border-slate-500'
                      }`}
                      onClick={() => setConfirmedRemovals((c) => ({ ...c, [i]: !c[i] }))}
                    >
                      {confirmedRemovals[i] && <Check size={10} className="text-white" />}
                    </div>
                    <div className="flex-1" onClick={() => setConfirmedRemovals((c) => ({ ...c, [i]: !c[i] }))}>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-medium">{r.title}</span>
                        <span className="text-xs text-slate-400 ml-2 capitalize">({r.section.replace('watchlist.', '').replace('moneyTracker.', '')})</span>
                      </p>
                      {r.reason && <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <SectionPreview title="Subscriptions" count={d.subscriptions?.length || 0}>
            {d.subscriptions?.map((s, i) => (
              <PreviewItem key={i} text={s.name} sub={[`$${s.cost}/${s.cycle === 'annual' ? 'yr' : 'mo'}`, s.category, s.renewDate].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Workout Sessions" count={d.workouts?.length || 0}>
            {d.workouts?.map((w, i) => (
              <PreviewItem key={i} text={w.name} sub={w.exercises?.length ? `${w.exercises.length} exercise${w.exercises.length !== 1 ? 's' : ''}: ${w.exercises.map(e => e.name).join(', ')}` : 'No exercises'} />
            ))}
          </SectionPreview>

          <SectionPreview title="Games" count={d.watchlist?.games?.length || 0}>
            {d.watchlist?.games?.map((g, i) => (
              <PreviewItem key={i} text={g.title} sub={[g.platform, g.status].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Shows / Movies" count={d.watchlist?.shows?.length || 0}>
            {d.watchlist?.shows?.map((s, i) => (
              <PreviewItem key={i} text={s.title} sub={[s.service, s.status].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="People Who Owe Me" count={d.moneyTracker?.owed?.length || 0}>
            {d.moneyTracker?.owed?.map((o, i) => (
              <PreviewItem key={i} text={`${o.person} — $${o.amount}`} sub={o.reason} />
            ))}
          </SectionPreview>

          <SectionPreview title="Money Coming My Way" count={d.moneyTracker?.incoming?.length || 0}>
            {d.moneyTracker?.incoming?.map((inc, i) => (
              <PreviewItem key={i} text={`${inc.source} — $${inc.amount}`} sub={inc.reason} />
            ))}
          </SectionPreview>
        </>
      )}

      {phase === 'done' && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--accent-100)' }}>
            <Check size={24} style={{ color: 'var(--accent-600)' }} />
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">All done!</p>
          <p className="text-sm text-slate-400 mb-6">{totalItems} items added to your app.</p>
          <Button onClick={reset}>Import More</Button>
        </div>
      )}
    </div>
  )
}
