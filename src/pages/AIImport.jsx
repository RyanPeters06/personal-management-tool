import { useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import { Sparkles, Upload, FileText, Check, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'

const SYSTEM_PROMPT = `You are a personal life organizer assistant. The user will give you unstructured text (a to-do list, notes, a dump of tasks, markdown, etc.) and you must parse it into structured JSON for their life manager app.

Return ONLY a valid JSON object with these optional keys. Only include keys that have items to add:

{
  "todos": [
    { "categoryName": "string (e.g. Personal, Work, Shopping)", "title": "string", "notes": "string or empty", "dueDate": "YYYY-MM-DD or null", "priority": "none|medium|high" }
  ],
  "calendar": [
    { "title": "string", "date": "YYYY-MM-DD", "time": "HH:MM or empty", "category": "work|personal|health|finance|other", "notes": "string or empty" }
  ],
  "goals": [
    { "title": "string", "description": "string or empty", "targetDate": "YYYY-MM-DD or null" }
  ],
  "projects": [
    { "title": "string", "description": "string or empty", "tag": "Side Hustle|Work|Personal|Health|Finance or empty", "subtasks": ["string", "string"] }
  ],
  "deadlines": [
    { "title": "string", "endDate": "YYYY-MM-DD", "notes": "string or empty", "category": "sale|offer|event|other" }
  ],
  "watchlist": {
    "games": [{ "title": "string", "platform": "string or empty", "status": "want|playing|done", "notes": "string or empty" }],
    "shows": [{ "title": "string", "service": "string or empty", "status": "want|watching|done", "notes": "string or empty" }]
  },
  "moneyTracker": {
    "owed": [{ "person": "string", "amount": "number as string", "reason": "string or empty", "dueDate": "YYYY-MM-DD or empty" }],
    "incoming": [{ "source": "string", "amount": "number as string", "reason": "string or empty", "expectedDate": "YYYY-MM-DD or empty" }]
  }
}

Rules:
- Tasks that are general to-dos go in "todos". Group related tasks under the same categoryName.
- Events with a specific date go in "calendar". Tasks with due dates go in "todos" with dueDate set.
- Long-term ambitions go in "goals". Active work with steps goes in "projects".
- Games and shows/movies/TV go in "watchlist".
- If someone owes the user money, or the user expects money (cashback, refunds, offers), put in "moneyTracker".
- Time-sensitive items like sales or promotions with end dates go in "deadlines".
- Today's date is ${new Date().toISOString().slice(0, 10)}.
- Return ONLY the JSON object. No explanation, no markdown code fences, no prose.`

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
  const { settings, todos, addCategory, addTask, addEvent, addGoal, addProject, addSubtask,
    addDeadline, addGame, addShow, addOwed, addIncoming } = store

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)
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

  const runImport = async () => {
    if (!text.trim()) return
    if (!hasKey) { setError('Add your Claude API key in Settings first.'); return }
    setLoading(true)
    setError('')
    setParsed(null)
    try {
      const client = new Anthropic({ apiKey: settings.claudeApiKey, dangerouslyAllowBrowser: true })
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      })
      const raw = message.content[0].text.trim()
      const result = JSON.parse(raw)
      setParsed(result)
    } catch (e) {
      setError(e.message || 'Something went wrong. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const acceptAll = () => {
    if (!parsed) return

    // Todos — find or create categories
    if (parsed.todos?.length) {
      parsed.todos.forEach((item) => {
        const catName = item.categoryName || 'Imported'
        let cat = todos.categories.find((c) => c.name.toLowerCase() === catName.toLowerCase())
        if (!cat) {
          addCategory(catName)
          // Re-read store after adding (Zustand is synchronous)
          cat = useStore.getState().todos.categories.find((c) => c.name.toLowerCase() === catName.toLowerCase())
        }
        if (cat) {
          addTask(cat.id, { title: item.title, notes: item.notes || '', dueDate: item.dueDate || null, priority: item.priority || 'none' })
        }
      })
    }

    // Calendar
    parsed.calendar?.forEach((e) => addEvent(e))

    // Goals
    parsed.goals?.forEach((g) => addGoal(g))

    // Projects
    parsed.projects?.forEach((p) => {
      addProject({ title: p.title, description: p.description || '', tag: p.tag || '' })
      if (p.subtasks?.length) {
        const proj = useStore.getState().projects.find((pr) => pr.title === p.title)
        if (proj) p.subtasks.forEach((st) => addSubtask(proj.id, st))
      }
    })

    // Deadlines
    parsed.deadlines?.forEach((d) => addDeadline(d))

    // Watchlist
    parsed.watchlist?.games?.forEach((g) => addGame(g))
    parsed.watchlist?.shows?.forEach((s) => addShow(s))

    // Money tracker
    parsed.moneyTracker?.owed?.forEach((o) => addOwed(o))
    parsed.moneyTracker?.incoming?.forEach((i) => addIncoming(i))

    setAccepted(true)
  }

  const reset = () => {
    setText('')
    setParsed(null)
    setAccepted(false)
    setError('')
  }

  const totalItems = parsed ? [
    parsed.todos?.length || 0,
    parsed.calendar?.length || 0,
    parsed.goals?.length || 0,
    parsed.projects?.length || 0,
    parsed.deadlines?.length || 0,
    parsed.watchlist?.games?.length || 0,
    parsed.watchlist?.shows?.length || 0,
    parsed.moneyTracker?.owed?.length || 0,
    parsed.moneyTracker?.incoming?.length || 0,
  ].reduce((a, b) => a + b, 0) : 0

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

      {!parsed && !accepted && (
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

      {parsed && !accepted && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Found <strong>{totalItems}</strong> item{totalItems !== 1 ? 's' : ''} to add. Review below and accept.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>Start Over</Button>
              <Button onClick={acceptAll} disabled={totalItems === 0}>
                <Check size={14} /> Accept All
              </Button>
            </div>
          </div>

          <SectionPreview title="To-Do Tasks" count={parsed.todos?.length || 0}>
            {parsed.todos?.map((t, i) => (
              <PreviewItem key={i} text={t.title} sub={[t.categoryName, t.dueDate, t.priority !== 'none' && t.priority].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Calendar Events" count={parsed.calendar?.length || 0}>
            {parsed.calendar?.map((e, i) => (
              <PreviewItem key={i} text={e.title} sub={[e.date, e.time].filter(Boolean).join(' at ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Goals" count={parsed.goals?.length || 0}>
            {parsed.goals?.map((g, i) => (
              <PreviewItem key={i} text={g.title} sub={[g.description, g.targetDate].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Projects" count={parsed.projects?.length || 0}>
            {parsed.projects?.map((p, i) => (
              <PreviewItem key={i} text={p.title} sub={[p.tag, p.subtasks?.length ? `${p.subtasks.length} subtasks` : null].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Deadlines" count={parsed.deadlines?.length || 0}>
            {parsed.deadlines?.map((d, i) => (
              <PreviewItem key={i} text={d.title} sub={[d.category, d.endDate].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Games" count={parsed.watchlist?.games?.length || 0}>
            {parsed.watchlist?.games?.map((g, i) => (
              <PreviewItem key={i} text={g.title} sub={[g.platform, g.status].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="Shows / Movies" count={parsed.watchlist?.shows?.length || 0}>
            {parsed.watchlist?.shows?.map((s, i) => (
              <PreviewItem key={i} text={s.title} sub={[s.service, s.status].filter(Boolean).join(' · ')} />
            ))}
          </SectionPreview>

          <SectionPreview title="People Who Owe Me" count={parsed.moneyTracker?.owed?.length || 0}>
            {parsed.moneyTracker?.owed?.map((o, i) => (
              <PreviewItem key={i} text={`${o.person} — $${o.amount}`} sub={o.reason} />
            ))}
          </SectionPreview>

          <SectionPreview title="Money Coming My Way" count={parsed.moneyTracker?.incoming?.length || 0}>
            {parsed.moneyTracker?.incoming?.map((inc, i) => (
              <PreviewItem key={i} text={`${inc.source} — $${inc.amount}`} sub={inc.reason} />
            ))}
          </SectionPreview>
        </>
      )}

      {accepted && (
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
