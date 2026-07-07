import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import Badge from '../components/shared/Badge'
import { Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { format } from 'date-fns'

const SUB_CATEGORIES = ['streaming', 'tools', 'utilities', 'health', 'food', 'entertainment', 'other']
const CAT_COLORS = { streaming: 'purple', tools: 'blue', utilities: 'orange', health: 'green', food: 'yellow', entertainment: 'pink', other: 'slate' }

function SubForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: '', cost: '', cycle: 'monthly', renewalDate: '', category: 'other', active: true }
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Name</label>
          <input
            autoFocus
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            placeholder="e.g. Netflix"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Cost ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            placeholder="15.99"
            value={form.cost}
            onChange={(e) => set('cost', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Billing Cycle</label>
          <select
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.cycle}
            onChange={(e) => set('cycle', e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Renews on day of month</label>
          <input
            type="number"
            min="1"
            max="31"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            placeholder="e.g. 15"
            value={form.renewalDate}
            onChange={(e) => set('renewalDate', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
          <select
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {SUB_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name || !form.cost}>Save</Button>
      </div>
    </div>
  )
}

function ExpenseForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ label: '', amount: '', month: new Date().toISOString().slice(0, 7) })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Label</label>
        <input
          autoFocus
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          placeholder="e.g. Groceries"
          value={form.label}
          onChange={(e) => set('label', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Month</label>
          <input
            type="month"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            value={form.month}
            onChange={(e) => set('month', e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.label || !form.amount}>Add</Button>
      </div>
    </div>
  )
}

function MoneyEntryForm({ type, onSave, onCancel }) {
  const isOwed = type === 'owed'
  const [form, setForm] = useState(
    isOwed
      ? { person: '', amount: '', reason: '', dueDate: '' }
      : { source: '', amount: '', reason: '', expectedDate: '' }
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const valid = isOwed ? (form.person && form.amount) : (form.source && form.amount)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
            {isOwed ? 'Person' : 'Source'}
          </label>
          <input
            autoFocus
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            placeholder={isOwed ? 'e.g. John' : 'e.g. Amazon cashback'}
            value={isOwed ? form.person : form.source}
            onChange={(e) => set(isOwed ? 'person' : 'source', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
            {isOwed ? 'Due Date (optional)' : 'Expected Date (optional)'}
          </label>
          <input
            type="date"
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            value={isOwed ? form.dueDate : form.expectedDate}
            onChange={(e) => set(isOwed ? 'dueDate' : 'expectedDate', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Reason / Notes (optional)</label>
          <input
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!valid}>Save</Button>
      </div>
    </div>
  )
}

export default function Finance() {
  const { finance, addSubscription, updateSubscription, deleteSubscription, setIncome, addExpense, deleteExpense, updateFinanceNotes } = useStore()
  const [tab, setTab] = useState('subscriptions')
  const [notesDraft, setNotesDraft] = useState(finance.notes || '')
  const [showAddSub, setShowAddSub] = useState(false)
  const [editSub, setEditSub] = useState(null)
  const [showAddExp, setShowAddExp] = useState(false)
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeDraft, setIncomeDraft] = useState('')
  const monthlyTotal = useMemo(() =>
    finance.subscriptions
      .filter((s) => s.active !== false)
      .reduce((sum, s) => sum + (parseFloat(s.cost) || 0) / (s.cycle === 'annual' ? 12 : 1), 0),
    [finance.subscriptions]
  )

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthExpenses = useMemo(
    () => finance.expenses.filter((e) => e.month === currentMonth),
    [finance.expenses, currentMonth]
  )
  const expenseTotal = useMemo(
    () => thisMonthExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    [thisMonthExpenses]
  )
  const totalMonthly = monthlyTotal + expenseTotal
  const remaining = (parseFloat(finance.income) || 0) - totalMonthly

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Finance" subtitle="Subscriptions & budget" />

      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden text-sm mb-6 w-fit">
        {['subscriptions', 'budget', 'notes'].map((t) => (
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

      {tab === 'subscriptions' && (
        <>
          {/* Summary card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Active subscriptions / month</p>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-0.5">${monthlyTotal.toFixed(2)}</p>
            </div>
            <Button onClick={() => setShowAddSub(true)}>
              <Plus size={14} /> Add Subscription
            </Button>
          </div>

          {finance.subscriptions.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-8">No subscriptions yet</p>
          )}

          <div className="space-y-2">
            {finance.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 ${sub.active === false ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{sub.name}</p>
                    <Badge label={sub.category ? sub.category.charAt(0).toUpperCase() + sub.category.slice(1) : ''} color={CAT_COLORS[sub.category] || 'slate'} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ${parseFloat(sub.cost).toFixed(2)} / {sub.cycle}
                    {sub.renewalDate && (() => { const d = String(sub.renewalDate); const ord = ['11','12','13'].includes(d) ? 'th' : d.endsWith('1') ? 'st' : d.endsWith('2') ? 'nd' : d.endsWith('3') ? 'rd' : 'th'; const today = new Date(); const renewDay = parseInt(d, 10); const useNext = renewDay <= today.getDate(); const renewMonth = new Date(today.getFullYear(), today.getMonth() + (useNext ? 1 : 0), 1); return ` · Renews on the ${d}${ord} of ${format(renewMonth, 'MMMM')}` })()}
                  </p>
                </div>
                <button
                  onClick={() => updateSubscription(sub.id, { active: sub.active === false ? true : false })}
                  className="text-slate-400 hover:text-slate-600"
                  title={sub.active === false ? 'Enable' : 'Disable'}
                >
                  {sub.active === false ? <ToggleLeft size={18} /> : <ToggleRight size={18} style={{ color: 'var(--accent-500)' }} />}
                </button>
                <button onClick={() => setEditSub(sub)} className="text-slate-400 hover:text-slate-600">
                  <Pencil size={14} />
                </button>
                <button onClick={() => deleteSubscription(sub.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'budget' && (
        <>
          {/* Income */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Monthly Income</p>
              {!editingIncome ? (
                <button onClick={() => { setEditingIncome(true); setIncomeDraft(String(finance.income || '')) }} className="text-xs text-slate-400 hover:text-slate-600">
                  <Pencil size={12} />
                </button>
              ) : null}
            </div>
            {editingIncome ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="number"
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none"
                  value={incomeDraft}
                  onChange={(e) => setIncomeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setIncome(parseFloat(incomeDraft) || 0); setEditingIncome(false) }
                    if (e.key === 'Escape') setEditingIncome(false)
                  }}
                />
                <Button size="xs" onClick={() => { setIncome(parseFloat(incomeDraft) || 0); setEditingIncome(false) }}>Save</Button>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">${(parseFloat(finance.income) || 0).toFixed(2)}</p>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Subscriptions', value: monthlyTotal, color: 'text-slate-700 dark:text-slate-200' },
              { label: 'Other Expenses', value: expenseTotal, color: 'text-slate-700 dark:text-slate-200' },
              { label: 'Remaining', value: remaining, color: remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-lg font-semibold ${color}`}>${Math.abs(value).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">This Month's Expenses</p>
            <Button size="xs" onClick={() => setShowAddExp(true)}>
              <Plus size={13} /> Add
            </Button>
          </div>

          {thisMonthExpenses.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-6">No expenses logged this month</p>
          )}

          <div className="space-y-2">
            {thisMonthExpenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5">
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{e.label}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">${parseFloat(e.amount).toFixed(2)}</span>
                <button onClick={() => deleteExpense(e.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'notes' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Financial Notes</p>
          <textarea
            className="w-full h-64 text-sm bg-transparent text-slate-700 dark:text-slate-200 outline-none resize-none placeholder-slate-400"
            placeholder="Jot down anything financial — money owed, expected cashback, refunds, notes to yourself..."
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => updateFinanceNotes(notesDraft)}
          />
          <p className="text-xs text-slate-400 mt-2">Auto-saves when you click away.</p>
        </div>
      )}

      {showAddSub && (
        <Modal title="Add Subscription" onClose={() => setShowAddSub(false)} size="lg">
          <SubForm
            onSave={(f) => { addSubscription(f); setShowAddSub(false) }}
            onCancel={() => setShowAddSub(false)}
          />
        </Modal>
      )}

      {editSub && (
        <Modal title="Edit Subscription" onClose={() => setEditSub(null)} size="lg">
          <SubForm
            initial={editSub}
            onSave={(f) => { updateSubscription(editSub.id, f); setEditSub(null) }}
            onCancel={() => setEditSub(null)}
          />
        </Modal>
      )}

      {showAddExp && (
        <Modal title="Add Expense" onClose={() => setShowAddExp(false)}>
          <ExpenseForm
            onSave={(f) => { addExpense(f); setShowAddExp(false) }}
            onCancel={() => setShowAddExp(false)}
          />
        </Modal>
      )}
    </div>
  )
}
