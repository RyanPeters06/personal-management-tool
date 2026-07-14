import { useState, useRef, useEffect, Component } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { callAnthropic, hasAIAccess } from '../lib/anthropic'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import { Sparkles, Upload, Check, ChevronDown, ChevronRight, AlertCircle, Trash2, RefreshCw, Send, MessageSquare, Import, Pencil } from 'lucide-react'
import { format, parseISO } from 'date-fns'

// ─── Context builder for chat mode ───────────────────────────────────────────

function buildContextSummary(state) {
  const today = new Date().toISOString().slice(0, 10)
  const lines = [`Today's date: ${today}\n`]

  // Tasks
  const activeTasks = (state.tasks || []).filter((t) => !t.done)
  const doneTasks = (state.tasks || []).filter((t) => t.done)
  if (activeTasks.length > 0) {
    lines.push('## Active Tasks')
    activeTasks.forEach((t) => {
      let s = `- ${t.title}`
      if (t.dueDate) s += ` (due ${t.dueDate})`
      if (t.priority && t.priority !== 'none') s += ` [${t.priority} priority]`
      if (t.notes) s += ` — ${t.notes}`
      lines.push(s)
    })
  }
  if (doneTasks.length > 0) {
    lines.push(`\n## Completed Tasks (${doneTasks.length} total)`)
    doneTasks.slice(0, 10).forEach((t) => lines.push(`- ✓ ${t.title}`))
    if (doneTasks.length > 10) lines.push(`  ...and ${doneTasks.length - 10} more`)
  }

  // Projects
  if ((state.projects || []).length > 0) {
    lines.push('\n## Projects')
    state.projects.forEach((p) => {
      const done = (p.subtasks || []).filter((s) => s.done).length
      const total = (p.subtasks || []).length
      let s = `- **${p.title}** [${p.status}]`
      if (p.tag) s += ` [${p.tag}]`
      if (total > 0) s += ` — ${done}/${total} tasks done`
      if (p.description) s += `\n  Description: ${p.description}`
      lines.push(s)
      p.subtasks?.forEach((st) => {
        lines.push(`  ${st.done ? '  ✓' : '  ○'} ${st.title}`)
      })
    })
  }

  // Calendar events
  const events = (state.calendar?.events || []).filter((e) => e.date >= today)
  if (events.length > 0) {
    lines.push('\n## Upcoming Calendar Events')
    events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20).forEach((e) => {
      let s = `- ${e.date}${e.time ? ` at ${e.time}` : ''}: ${e.title}`
      if (e.category) s += ` [${e.category}]`
      if (e.notes) s += ` — ${e.notes}`
      lines.push(s)
    })
  }

  // Deadlines
  const activeDeadlines = (state.deadlines || []).filter((d) => !d.done)
  if (activeDeadlines.length > 0) {
    lines.push('\n## Active Deadlines')
    activeDeadlines.sort((a, b) => a.endDate.localeCompare(b.endDate)).forEach((d) => {
      let s = `- ${d.endDate}: ${d.title}`
      if (d.category) s += ` [${d.category}]`
      if (d.notes) s += ` — ${d.notes}`
      lines.push(s)
    })
  }

  // Finance: subscriptions
  const activeSubs = (state.finance?.subscriptions || []).filter((s) => s.active)
  if (activeSubs.length > 0) {
    const monthlyTotal = activeSubs.reduce((sum, s) => sum + (s.cycle === 'annual' ? Number(s.cost) / 12 : Number(s.cost)), 0)
    lines.push(`\n## Subscriptions (${activeSubs.length} active, ~$${monthlyTotal.toFixed(2)}/mo)`)
    activeSubs.forEach((s) => {
      lines.push(`- ${s.name}: $${s.cost}/${s.cycle === 'annual' ? 'yr' : 'mo'} [${s.category}]${s.renewalDate ? ` renews ${s.renewalDate}` : ''}`)
    })
  }

  // Finance: budget
  const income = state.finance?.budget?.income || 0
  const expenses = state.finance?.budget?.expenses || []
  if (income || expenses.length > 0) {
    lines.push(`\n## Budget`)
    if (income) lines.push(`- Income: $${income}/mo`)
    expenses.forEach((e) => lines.push(`- Expense: ${e.label} $${e.amount}`))
  }

  // Finance: notes
  if (state.finance?.notes) {
    lines.push(`\n## Financial Notes\n${state.finance.notes}`)
  }

  // Want list
  const pendingWants = (state.wantList || []).filter((i) => !i.purchased)
  if (pendingWants.length > 0) {
    lines.push('\n## Want List')
    pendingWants.forEach((item) => {
      let s = `- ${item.title} [${item.timeframe || 'soon'}]`
      if (item.notes) s += ` — ${item.notes}`
      lines.push(s)
    })
  }

  // Ideas
  if ((state.ideas || []).length > 0) {
    lines.push('\n## Ideas')
    state.ideas.forEach((idea) => {
      let s = `- **${idea.title}** [${idea.status}]`
      if (idea.description) s += `\n  ${idea.description}`
      lines.push(s)
    })
  }

  // Workouts
  const sessions = state.workouts?.sessions || []
  if (sessions.length > 0) {
    lines.push('\n## Workout Sessions')
    sessions.forEach((s) => {
      const exList = (s.exercises || []).map((e) => e.name).join(', ')
      lines.push(`- ${s.name}${exList ? `: ${exList}` : ''}`)
    })
  }

  // Library: games
  const games = state.watchlist?.games || []
  const activeGames = games.filter((g) => g.status !== 'done')
  if (activeGames.length > 0) {
    lines.push('\n## Games')
    activeGames.forEach((g) => {
      lines.push(`- ${g.title}${g.platform ? ` (${g.platform})` : ''} [${g.status}]`)
    })
  }

  // Library: shows
  const shows = state.watchlist?.shows || []
  const activeShows = shows.filter((s) => s.status !== 'done')
  if (activeShows.length > 0) {
    lines.push('\n## Shows & Movies')
    activeShows.forEach((s) => {
      lines.push(`- ${s.title}${s.service ? ` (${s.service})` : ''} [${s.status}]`)
    })
  }

  return lines.join('\n')
}

function buildChatSystemPrompt(state) {
  const context = buildContextSummary(state)
  return `You are a personal assistant for the user's life manager app. You have full access to their current data shown below. Answer questions helpfully, concisely, and conversationally. When the user asks about schedules, summaries, or what they need to do, pull directly from their data. Use bullet points or short sentences — no unnecessary filler. Do not suggest adding things to the app unless asked.

${context}`
}

// ─── Import mode helpers ──────────────────────────────────────────────────────

// Robustly extract the first complete JSON object from a model response,
// tolerating code fences, leading prose, or trailing text after the object.
function extractJSON(raw) {
  let s = (raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const start = s.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in the response.')
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (esc) { esc = false; continue }
    if (c === '\\') { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (!inStr) {
      if (c === '{') depth++
      else if (c === '}') { depth--; if (depth === 0) return JSON.parse(s.slice(start, i + 1)) }
    }
  }
  throw new Error('The response contained incomplete JSON. Try again.')
}

function buildSystemPrompt(state) {
  const existingIdeas = state.ideas || []
  const ideasContext = existingIdeas.length > 0
    ? `\n\nThe user already has these ideas saved:\n${existingIdeas.map((idea, i) => `${i + 1}. "${idea.title}"${idea.description ? ` — ${idea.description}` : ''}`).join('\n')}\n\nIMPORTANT: If the user's text appears to build on, expand, or add new thoughts to one of those existing ideas, put it in "ideaUpdates" instead of "data.ideas". If you are not certain whether it's related or a new idea, add it to "questions" to ask the user.`
    : ''

  const dataContext = `\n\n=== THE USER'S CURRENT DATA ===\nThis is everything currently in their app. Use it to match items the user wants to EDIT or REMOVE. Match by title, even if the user's wording is slightly different or a different case (e.g. "updating request supervisor system" matches the project "Updating Request Supervisor App").\n\n${buildContextSummary(state)}\n=== END OF CURRENT DATA ===`

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
      { "title": "string", "description": "string or empty", "status": "raw" }
    ],
    "wantList": [
      { "title": "string", "notes": "string or empty", "timeframe": "soon|eventually", "options": [{ "label": "string", "url": "string", "price": "string" }] }
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
  "updates": [
    { "section": "projects|tasks|deadlines|ideas|wantList|subscriptions|goals|calendar|watchlist.games|watchlist.shows", "title": "exact title of the existing item to edit (from the current data above)", "patch": { "onlyTheFieldsThatChange": "newValue" } }
  ],
  "questions": [],
  "flagged": [],
  "removals": []
}

The "ideaUpdates" array is for content that expands an existing idea rather than creating a new one. Only use it when you are confident the new text relates to an existing idea.${ideasContext}

The "updates" array is for EDITING an item the user already has (shown in the current data above). Use it when the user wants to change a property of an existing item — e.g. "change the tag of the Royal Ops System project to Royal Containers", "rename task X", "mark the Steam Deck as eventually instead of soon". CRITICAL RULES for updates:
- The "patch" object must contain ONLY the fields that are actually changing. Never include fields you aren't changing.
- NEVER include subtasks, completion status, done flags, or any field the user did not ask to change. The app merges your patch on top of the existing item, so leaving a field out keeps it exactly as it was. Including it risks overwriting/erasing the user's data.
- For project tag changes, the field is "tag". Valid project tags: "Side Hustle", "Work", "Personal", "Health", "Finance" — or any custom label the user names (e.g. "Royal Containers").
- The "title" MUST exactly match the title of an existing item from the current data above. If you cannot find a matching item, do NOT invent an update — instead add a "questions" entry asking the user to confirm.
- Use "updates" for edits, NOT "removals" + re-add. Editing preserves all other data.

The "removals" array is for things the user says they cancelled, finished, deleted, unsubscribed from, or no longer want tracked. Each entry: { "section": "subscriptions|tasks|goals|projects|deadlines|ideas|wantList|watchlist.games|watchlist.shows|moneyTracker.owed|moneyTracker.incoming|workouts", "title": "string (the name/title to match)", "reason": "one line explaining why it should be removed" }.

The "questions" array is for items where a date is ambiguous (e.g. "next Friday" without a clear year, or "soon") OR when you are unsure whether an idea is new or building on an existing one. Each entry: { "item": "what the item is", "question": "what you need clarified" }.

The "flagged" array is for items where you are genuinely unsure which category fits (e.g. something that could be a goal OR an idea). Each entry: { "title": "string", "description": "string", "suggestedCategories": ["goal", "idea"], "reason": "why you're unsure" }.

Rules:
- Quick tasks and to-dos go in "tasks".
- Events with a specific date go in "calendar". Time-sensitive sales/offers go in "deadlines".
- Long-term ambitions go in "goals". Active work with steps goes in "projects".
- Brain dump / startup / build ideas go in "ideas". The "description" field of an idea can be long — use it for full notes, bullet lists, or multi-line content.
- Things the user wants to buy go in "wantList". Use timeframe "soon" if they want it soon/now, "eventually" if it's down the line or not urgent.
- Recurring paid services (Netflix, Spotify, SaaS tools, gym memberships, etc.) go in "subscriptions".
- Workout routines, exercise plans, or gym sessions go in "workouts". Group exercises under a named session (e.g. "Leg Day", "Push Day").
- Games and shows/movies/TV go in "watchlist".
- Money owed or expected goes in "moneyTracker".
- GROUPING RULE: If the user's input is a list of items under a single heading or topic (e.g. "Feature ideas:", "Books to read:", "Things to do this week:"), create ONE single entry with the heading as the title and ALL items combined in the description/notes field. Do NOT split a bulleted or numbered list into multiple separate entries. Only create multiple entries when each item is clearly independent (different dates, different categories, or obviously unrelated subjects).
- If a date is relative (e.g. "next week") and you can resolve it from today's date, do so. If you cannot, add it to "questions".
- If you are confident about category, put item in data and do NOT flag it.
- If the user mentions cancelling, unsubscribing, finishing, removing, or no longer wanting something tracked, add it to "removals". Do NOT add it to "data" as well.
- Today's date is ${new Date().toISOString().slice(0, 10)}.
- Return ONLY the JSON object. No explanation, no markdown code fences, no prose.`
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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

// ─── Safe markdown renderer with error boundary ───────────────────────────────

class SafeMarkdown extends Component {
  constructor(props) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  render() {
    if (this.state.crashed) return <p className="text-sm whitespace-pre-wrap">{this.props.content}</p>
    // NOTE: react-markdown v9+ removed the `className` prop — passing it throws
    // and trips the error boundary, which is why raw markdown (#, *) used to
    // show. Wrap in a div for styling instead.
    return (
      <div className="text-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 pl-5 space-y-0.5 list-disc">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 pl-5 space-y-0.5 list-decimal">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            h1: ({ children }) => <p className="font-semibold text-sm mt-3 mb-1">{children}</p>,
            h2: ({ children }) => <p className="font-semibold text-sm mt-3 mb-1">{children}</p>,
            h3: ({ children }) => <p className="font-semibold text-sm mt-2 mb-1">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--accent-500)' }}>{children}</a>,
            code: ({ children }) => <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">{children}</code>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 dark:border-slate-600 pl-3 italic text-slate-500 dark:text-slate-400">{children}</blockquote>,
            del: ({ children }) => <del className="opacity-60">{children}</del>,
            hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
            table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse">{children}</table></div>,
            th: ({ children }) => <th className="border border-slate-200 dark:border-slate-600 px-2 py-1 text-left font-semibold">{children}</th>,
            td: ({ children }) => <td className="border border-slate-200 dark:border-slate-600 px-2 py-1">{children}</td>,
          }}
        >
          {this.props.content}
        </ReactMarkdown>
      </div>
    )
  }
}

// ─── Chat mode ────────────────────────────────────────────────────────────────

// Session-persistent chat history (survives tab switches, resets on app close)
const chatSession = { messages: [], input: '' }

function ChatMode({ settings, storeState }) {
  const [messages, setMessages] = useState(chatSession.messages)
  const [input, setInput] = useState(chatSession.input)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Keep the module-level session in sync so navigating away doesn't lose the chat
  useEffect(() => { chatSession.messages = messages }, [messages])
  useEffect(() => { chatSession.input = input }, [input])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    if (!text || loading) return
    if (!hasAIAccess(settings)) { setError('Add your Claude API key in Settings first.'); return }
    if (!navigator.onLine) { setError("You're offline."); return }

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const systemPrompt = buildChatSystemPrompt(storeState)
      const response = await callAnthropic({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: newMessages,
      }, settings.claudeApiKey)
      const reply = response.content?.[0]?.text || '(No response)'
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      const msg = e?.message || e?.error?.message || String(e) || 'Something went wrong.'
      setError(msg)
      setMessages(messages)
    } finally {
      setLoading(false)
      // Desktop only — auto-refocusing on mobile keeps the iOS keyboard
      // open permanently, hiding the top bar and trapping the user.
      if (window.matchMedia('(min-width: 768px)').matches) inputRef.current?.focus()
    }
  }

  const send = () => sendMessage(input.trim())

  const clearChat = () => {
    setMessages([])
    setError('')
    if (window.matchMedia('(min-width: 768px)').matches) inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-13rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-4">Ask me anything about your data.</p>

            {/* Weekly Digest button */}
            <button
              onClick={() => sendMessage(`Give me a full weekly digest for this week. Cover:
- Tasks that are overdue or due within the next 7 days
- Upcoming calendar events in the next 7 days
- Active deadlines and how many days are left
- Project status (active projects with subtask progress)
- Any subscriptions renewing soon
Format it clearly with sections and bullet points. Be concise.`)}
              disabled={loading}
              className="flex items-center gap-2 mx-auto mb-5 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent-500)' }}
            >
              <Sparkles size={14} /> Weekly Digest
            </button>

            <div className="flex flex-wrap justify-center gap-2">
              {[
                'What do I have on this weekend?',
                'Summarize my active projects',
                'What tasks are overdue?',
                'What deadlines are coming up?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mr-2 mt-0.5" style={{ backgroundColor: 'var(--accent-500)' }}>
                <Sparkles size={12} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: 'var(--accent-500)' } : {}}
            >
              {msg.role === 'assistant' ? (
                <SafeMarkdown content={msg.content} />
              ) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mr-2 mt-0.5" style={{ backgroundColor: 'var(--accent-500)' }}>
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent-500)', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent-500)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent-500)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="mt-3 flex gap-2 items-end">
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 focus-within:border-slate-400 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            className="w-full text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none resize-none placeholder-slate-400 max-h-32"
            placeholder="Ask about your schedule, tasks, projects..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
          />
        </div>
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
          style={{ backgroundColor: 'var(--accent-500)' }}
        >
          <Send size={16} className="text-white" />
        </button>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 transition-colors shrink-0"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">Shift+Enter for new line · Enter to send</p>
    </div>
  )
}

// ─── Session-persistent draft state (survives navigation, resets on app close) ─
const sessionDraft = {
  mode: 'chat', text: '',
  phase: 'input', parsed: null, answers: {}, flaggedChoices: {}, confirmedRemovals: {},
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIImport() {
  const store = useStore()
  const { settings, ideas, addEvent, addGoal, addProject, addSubtask,
    addDeadline, addGame, addShow, addOwed, addIncoming, addTask2, addIdea, updateIdea, addWantItem,
    addSubscription, addSession, addExercise,
    updateProject, updateTask2, updateWantItem, updateDeadline, updateGoal,
    updateSubscription, updateEvent, updateGame, updateShow,
    deleteTask2, deleteEvent, deleteGoal, deleteProject, deleteDeadline, deleteIdea,
    deleteWantItem, deleteSubscription, deleteSession, deleteGame, deleteShow, deleteOwed, deleteIncoming } = store

  const [mode, setMode] = useState(sessionDraft.mode)
  const [text, setText] = useState(sessionDraft.text)
  const persistMode = (m) => { sessionDraft.mode = m; setMode(m) }
  const persistText = (t) => { sessionDraft.text = t; setText(t) }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState(sessionDraft.phase) // input | clarify | preview | done
  const [parsed, setParsed] = useState(sessionDraft.parsed)
  const [answers, setAnswers] = useState(sessionDraft.answers)
  const [flaggedChoices, setFlaggedChoices] = useState(sessionDraft.flaggedChoices)
  const [confirmedRemovals, setConfirmedRemovals] = useState(sessionDraft.confirmedRemovals)
  const [refineText, setRefineText] = useState('')
  const [refineLoading, setRefineLoading] = useState(false)
  const [refineError, setRefineError] = useState('')

  // Persist import progress so switching tabs mid-flow doesn't lose it
  useEffect(() => { sessionDraft.phase = phase }, [phase])
  useEffect(() => { sessionDraft.parsed = parsed }, [parsed])
  useEffect(() => { sessionDraft.answers = answers }, [answers])
  useEffect(() => { sessionDraft.flaggedChoices = flaggedChoices }, [flaggedChoices])
  useEffect(() => { sessionDraft.confirmedRemovals = confirmedRemovals }, [confirmedRemovals])

  const hasKey = hasAIAccess(settings)

  const loadFile = async () => {
    if (window.electronAPI?.openFile) {
      const content = await window.electronAPI.openFile()
      if (content) persistText(content)
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.md'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => persistText(ev.target.result)
        reader.readAsText(file)
      }
      input.click()
    }
  }

  const callClaude = async (messages) => {
    const message = await callAnthropic({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: buildSystemPrompt(useStore.getState()),
      messages,
    }, settings.claudeApiKey)
    return extractJSON(message.content?.[0]?.text || '')
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
    else if (cat === 'ideas') { if (!data.ideas) data.ideas = []; data.ideas.push({ title: item.title, description: item.description, status: 'raw' }) }
    else if (cat === 'projects') { if (!data.projects) data.projects = []; data.projects.push({ title: item.title, description: item.description }) }
    else if (cat === 'wantList') { if (!data.wantList) data.wantList = []; data.wantList.push({ title: item.title, notes: item.description, timeframe: 'soon', options: [] }) }
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
        const newDesc = existing.description ? `${existing.description}\n\n${upd.appendText}` : upd.appendText
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

    const state = useStore.getState()
    const match = (list, title) => list?.find((x) => (x.title || x.name || x.person || x.source || '')?.toLowerCase() === title?.toLowerCase())

    // Apply edits to existing items (patch-merge — leaves untouched fields intact)
    parsed.updates?.forEach((u) => {
      if (!u?.patch || typeof u.patch !== 'object') return
      const t = u.title
      const s = u.section
      if (s === 'projects') { const x = match(state.projects, t); if (x) updateProject(x.id, u.patch) }
      else if (s === 'tasks') { const x = match(state.tasks, t); if (x) updateTask2(x.id, u.patch) }
      else if (s === 'deadlines') { const x = match(state.deadlines, t); if (x) updateDeadline(x.id, u.patch) }
      else if (s === 'ideas') { const x = match(state.ideas, t); if (x) updateIdea(x.id, u.patch) }
      else if (s === 'wantList') { const x = match(state.wantList, t); if (x) updateWantItem(x.id, u.patch) }
      else if (s === 'subscriptions') { const x = match(state.finance.subscriptions, t); if (x) updateSubscription(x.id, u.patch) }
      else if (s === 'goals') { const x = match(state.goals, t); if (x) updateGoal(x.id, u.patch) }
      else if (s === 'calendar') { const x = match(state.calendar.events, t); if (x) updateEvent(x.id, u.patch) }
      else if (s === 'watchlist.games') { const x = match(state.watchlist.games, t); if (x) updateGame(x.id, u.patch) }
      else if (s === 'watchlist.shows') { const x = match(state.watchlist.shows, t); if (x) updateShow(x.id, u.patch) }
    })

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

    setPhase('done')
  }

  const refineItems = async () => {
    if (!refineText.trim() || !parsed) return
    setRefineLoading(true)
    setRefineError('')
    try {
      const message = await callAnthropic({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: `You are editing a pending import payload for a life manager app. The user has already parsed their data into the JSON structure below and wants to refine it before accepting. Apply the user's instruction to the JSON and return the updated JSON in exactly the same format. Only change what the user asks — preserve everything else. Return ONLY the JSON object, no explanation, no code fences.`,
        messages: [
          { role: 'user', content: `Current pending data:\n${JSON.stringify(parsed, null, 2)}\n\nInstruction: ${refineText.trim()}` },
        ],
      }, settings.claudeApiKey)
      const updated = extractJSON(message.content?.[0]?.text || '')
      setParsed(updated)
      const initRemovals = {}
      updated.removals?.forEach((_, i) => { initRemovals[i] = true })
      setConfirmedRemovals(initRemovals)
      setRefineText('')
    } catch (e) {
      setRefineError(e.message || 'Something went wrong.')
    } finally {
      setRefineLoading(false)
    }
  }

  const reset = () => {
    persistText('')
    setParsed(null)
    setError('')
    setAnswers({})
    setFlaggedChoices({})
    setConfirmedRemovals({})
    setRefineText('')
    setRefineError('')
    setPhase('input')
  }

  const d = parsed?.data || {}
  const ideaUpdates = parsed?.ideaUpdates || []
  const edits = parsed?.updates || []
  const totalItems = [
    d.tasks?.length || 0, d.calendar?.length || 0, d.goals?.length || 0, d.projects?.length || 0,
    d.deadlines?.length || 0, d.ideas?.length || 0, ideaUpdates.length, edits.length, d.wantList?.length || 0,
    d.subscriptions?.length || 0, d.workouts?.length || 0, d.watchlist?.games?.length || 0,
    d.watchlist?.shows?.length || 0, d.moneyTracker?.owed?.length || 0, d.moneyTracker?.incoming?.length || 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Assistant"
        subtitle={mode === 'chat' ? 'Ask questions about your data' : 'Paste text to add or remove things'}
      />

      {!hasKey && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            AI isn't configured here. Use the deployed app, or add your own Claude API key in <strong>Settings</strong>.
          </p>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm mb-6 w-fit">
        <button
          onClick={() => persistMode('chat')}
          className={`flex items-center gap-2 px-4 py-2 transition-colors ${mode === 'chat' ? 'text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          style={mode === 'chat' ? { backgroundColor: 'var(--accent-500)' } : {}}
        >
          <MessageSquare size={14} /> Chat
        </button>
        <button
          onClick={() => persistMode('import')}
          className={`flex items-center gap-2 px-4 py-2 transition-colors ${mode === 'import' ? 'text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          style={mode === 'import' ? { backgroundColor: 'var(--accent-500)' } : {}}
        >
          <Upload size={14} /> Import
        </button>
      </div>

      {/* ── Chat mode ── */}
      {mode === 'chat' && (
        <ChatMode settings={settings} storeState={useStore.getState()} />
      )}

      {/* ── Import mode ── */}
      {mode === 'import' && (
        <>
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
                  onChange={(e) => persistText(e.target.value)}
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
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${flaggedChoices[i] === cat ? 'text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
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
                {d.tasks?.map((t, i) => <PreviewItem key={i} text={t.title} sub={[t.dueDate, t.priority !== 'none' && t.priority].filter(Boolean).join(' · ')} />)}
              </SectionPreview>
              <SectionPreview title="Calendar Events" count={d.calendar?.length || 0}>
                {d.calendar?.map((e, i) => <PreviewItem key={i} text={e.title} sub={[e.date, e.time].filter(Boolean).join(' at ')} />)}
              </SectionPreview>
              <SectionPreview title="Goals" count={d.goals?.length || 0}>
                {d.goals?.map((g, i) => <PreviewItem key={i} text={g.title} sub={[g.description, g.targetDate].filter(Boolean).join(' · ')} />)}
              </SectionPreview>
              <SectionPreview title="Projects" count={d.projects?.length || 0}>
                {d.projects?.map((p, i) => <PreviewItem key={i} text={p.title} sub={[p.tag, p.subtasks?.length ? `${p.subtasks.length} subtasks` : null].filter(Boolean).join(' · ')} />)}
              </SectionPreview>
              <SectionPreview title="Deadlines" count={d.deadlines?.length || 0}>
                {d.deadlines?.map((dl, i) => <PreviewItem key={i} text={dl.title} sub={[dl.category ? dl.category.charAt(0).toUpperCase() + dl.category.slice(1) : null, dl.endDate].filter(Boolean).join(' · ')} />)}
              </SectionPreview>
              <SectionPreview title="Ideas (New)" count={d.ideas?.length || 0}>
                {d.ideas?.map((idea, i) => <PreviewItem key={i} text={idea.title} sub={idea.description ? idea.description.slice(0, 80) + (idea.description.length > 80 ? '…' : '') : null} />)}
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
              {edits.length > 0 && (
                <SectionPreview title="Edits to Existing Items" count={edits.length}>
                  {edits.map((u, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Pencil size={13} className="mt-0.5 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                          {u.title} <span className="text-xs text-slate-400 font-normal capitalize">({u.section?.replace('watchlist.', '')})</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {Object.entries(u.patch || {}).map(([k, v]) => `${k} → ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </SectionPreview>
              )}
              <SectionPreview title="Want List" count={d.wantList?.length || 0}>
                {d.wantList?.map((item, i) => <PreviewItem key={i} text={item.title} sub={[item.timeframe, item.notes].filter(Boolean).join(' · ')} />)}
              </SectionPreview>

              {parsed.removals?.length > 0 && (
                <div className="border-2 border-red-400 dark:border-red-700 rounded-xl overflow-hidden mb-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20">
                    <Trash2 size={14} className="text-red-500 shrink-0" />
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Removals — {parsed.removals.filter((_, i) => confirmedRemovals[i]).length} of {parsed.removals.length} selected
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-400">Warning: checked items will be permanently deleted when you click Accept. Uncheck anything you want to keep.</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {parsed.removals.map((r, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer group">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${confirmedRemovals[i] ? 'border-red-500 bg-red-500' : 'border-slate-300 dark:border-slate-500'}`}
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
                {d.subscriptions?.map((s, i) => <PreviewItem key={i} text={s.name} sub={[`$${s.cost}/${s.cycle === 'annual' ? 'yr' : 'mo'}`, s.category, s.renewDate].filter(Boolean).join(' · ')} />)}
              </SectionPreview>
              <SectionPreview title="Workout Sessions" count={d.workouts?.length || 0}>
                {d.workouts?.map((w, i) => <PreviewItem key={i} text={w.name} sub={w.exercises?.length ? `${w.exercises.length} exercise${w.exercises.length !== 1 ? 's' : ''}: ${w.exercises.map(e => e.name).join(', ')}` : 'No exercises'} />)}
              </SectionPreview>
              <SectionPreview title="Games" count={d.watchlist?.games?.length || 0}>
                {d.watchlist?.games?.map((g, i) => <PreviewItem key={i} text={g.title} sub={[g.platform, g.status].filter(Boolean).join(' · ')} />)}
              </SectionPreview>
              <SectionPreview title="Shows / Movies" count={d.watchlist?.shows?.length || 0}>
                {d.watchlist?.shows?.map((s, i) => <PreviewItem key={i} text={s.title} sub={[s.service, s.status].filter(Boolean).join(' · ')} />)}
              </SectionPreview>
              <SectionPreview title="People Who Owe Me" count={d.moneyTracker?.owed?.length || 0}>
                {d.moneyTracker?.owed?.map((o, i) => <PreviewItem key={i} text={`${o.person} — $${o.amount}`} sub={o.reason} />)}
              </SectionPreview>
              <SectionPreview title="Money Coming My Way" count={d.moneyTracker?.incoming?.length || 0}>
                {d.moneyTracker?.incoming?.map((inc, i) => <PreviewItem key={i} text={`${inc.source} — $${inc.amount}`} sub={inc.reason} />)}
              </SectionPreview>

              {/* Refine with AI */}
              <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Refine with AI</p>
                <p className="text-xs text-slate-400 mb-3">Tell Claude to edit these items before you accept them — e.g. "expand Pokemon games to list specific titles" or "change the priority of task X to high".</p>
                <textarea
                  className="w-full h-20 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 outline-none resize-none placeholder-slate-400 focus:border-slate-400 mb-2"
                  placeholder="Describe what you want changed..."
                  value={refineText}
                  onChange={(e) => setRefineText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); refineItems() } }}
                />
                {refineError && <p className="text-xs text-red-500 mb-2">{refineError}</p>}
                <div className="flex justify-end">
                  <Button onClick={refineItems} disabled={!refineText.trim() || refineLoading} variant="secondary">
                    {refineLoading ? (
                      <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Refining...</>
                    ) : (
                      <><Sparkles size={13} /> Refine</>
                    )}
                  </Button>
                </div>
              </div>
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
        </>
      )}
    </div>
  )
}
