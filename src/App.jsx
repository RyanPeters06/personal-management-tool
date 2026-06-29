import { useEffect, useState } from 'react'
import useStore from './store/useStore'
import Sidebar from './components/Sidebar'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { WifiOff, Wifi } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import CalendarPage from './pages/CalendarPage'
import AIImport from './pages/AIImport'
import Settings from './pages/Settings'
import Tasks from './pages/Tasks'
import Ideas from './pages/Ideas'
import WantList from './pages/WantList'
import Workouts from './pages/Workouts'
import Projects from './pages/Projects'
import Library from './pages/Library'
import SideHustles from './pages/SideHustles'
import Journal from './pages/Journal'

const PAGES = {
  dashboard: Dashboard,
  tasks: Tasks,
  projects: Projects,
  'side-hustles': SideHustles,
  finance: Finance,
  calendar: CalendarPage,
  library: Library,
  workouts: Workouts,
  'want-list': WantList,
  ideas: Ideas,
  journal: Journal,
  assistant: AIImport,
  settings: Settings,
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const { loadFromDisk, loaded, settings } = useStore()
  const { online, justReconnected } = useOnlineStatus()

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {!online && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs shrink-0">
            <WifiOff size={13} />
            <span><strong>You're offline.</strong> All local data is safe and fully accessible. The Assistant won't work until you reconnect.</span>
          </div>
        )}
        {justReconnected && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/40 border-b border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs shrink-0">
            <Wifi size={13} />
            <span>Back online — the Assistant is available again.</span>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <PageComponent onNavigate={setPage} />
        </main>
      </div>
    </div>
  )
}
