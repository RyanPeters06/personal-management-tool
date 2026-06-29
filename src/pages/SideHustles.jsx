import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/shared/PageHeader'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import { Plus, Briefcase } from 'lucide-react'
import { ProjectCard } from './Projects'

function SideHustleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', description: '', status: 'active' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Name</label>
        <input
          autoFocus
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. YouTube Channel, TikTok, Etsy Store"
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

export default function SideHustles() {
  const { projects, addProject } = useStore()
  const [showAdd, setShowAdd] = useState(false)

  const hustles = projects.filter((p) => p.tag === 'Side Hustle')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Side Hustles"
        subtitle="All your operations and ventures in one place"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={14} /> New Side Hustle
          </Button>
        }
      />

      {hustles.length === 0 && (
        <div className="text-center py-16">
          <Briefcase size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No side hustles yet. Add one to get started.</p>
        </div>
      )}

      {hustles.map((p) => (
        <ProjectCard key={p.id} project={p} hideTag />
      ))}

      {showAdd && (
        <Modal title="New Side Hustle" onClose={() => setShowAdd(false)}>
          <SideHustleForm
            onSave={(f) => { addProject({ ...f, tag: 'Side Hustle' }); setShowAdd(false) }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
    </div>
  )
}
