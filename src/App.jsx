import { useEffect, useState } from 'react'
import useStore from './store/useStore'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import TodoLists from './pages/TodoLists'
import Finance from './pages/Finance'
import CalendarPage from './pages/CalendarPage'
import GoalsProjects from './pages/GoalsProjects'
import Settings from './pages/Settings'

const PAGES = {
  dashboard: Dashboard,
  todos: TodoLists,
  finance: Finance,
  calendar: CalendarPage,
  goals: GoalsProjects,
  settings: Settings,
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const { loadFromDisk, loaded, settings } = useStore()

  useEffect(() => {
    loadFromDisk()
  }, [])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    )
  }

  const PageComponent = PAGES[page] || Dashboard

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100`}>
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        <PageComponent onNavigate={setPage} />
      </main>
    </div>
  )
}
