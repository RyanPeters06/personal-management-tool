import { useEffect, useState } from 'react'
import useStore from './store/useStore'
import Sidebar from './components/Sidebar'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { initSync, reconcile } from './store/sync'
import PullToRefresh from './components/PullToRefresh'
import { WifiOff, Wifi, Menu } from 'lucide-react'
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

const DRAWER_TRANSITION_MS = 220

export default function App() {
  const [page, setPage] = useState('dashboard')
  // drawerMounted keeps the drawer in the DOM long enough for the closing
  // transition to play; drawerOpen toggles the actual open/closed CSS state.
  const [drawerMounted, setDrawerMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { loadFromDisk, loaded, settings } = useStore()
  const { online, justReconnected } = useOnlineStatus()

  const openDrawer = () => {
    setDrawerMounted(true)
    // Mount closed first, then flip to open on the next frame so the
    // transition actually has a "from" state to animate away from.
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerOpen(true)))
  }
  const closeDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setDrawerMounted(false), DRAWER_TRANSITION_MS)
  }

  useEffect(() => {
    loadFromDisk().then(() => {
      // Local data is loaded first; then start cloud sync (no-op if not configured)
      initSync()
      reconcile('startup')
    })
  }, [])

  // iOS scrolls the whole window when the on-screen keyboard opens (to keep
  // the focused input visible). With the document locked to overflow:hidden
  // there is no way to scroll back, so the header ends up stuck off-screen
  // (e.g. after typing in the Assistant/AI Import textareas). Snap every
  // scroll offset back to zero whenever the keyboard is not actively holding
  // an input in view. window.scrollTo alone is not reliable in an installed
  // iOS PWA — the offset can live on documentElement/body instead, so all
  // three are reset.
  useEffect(() => {
    const hardReset = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    const keyboardLikelyOpen = () => {
      const a = document.activeElement
      return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable)
    }
    const resetIfSafe = () => {
      if (!keyboardLikelyOpen()) hardReset()
    }
    const onFocusOut = () => {
      // wait for focus to settle (tapping between inputs fires focusout too)
      setTimeout(resetIfSafe, 80)
      setTimeout(resetIfSafe, 350) // second pass: iOS keyboard dismiss animation
    }
    const vv = window.visualViewport
    const onViewportChange = () => {
      // Snap back once the keyboard is gone (viewport back to ~full height)
      if (vv && vv.height >= window.innerHeight - 60) resetIfSafe()
    }
    // Last-resort recovery: any tap while no input is focused re-anchors the app
    const onTouchEnd = () => {
      if (!keyboardLikelyOpen()) setTimeout(resetIfSafe, 50)
    }
    document.addEventListener('focusout', onFocusOut)
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    vv?.addEventListener('resize', onViewportChange)
    vv?.addEventListener('scroll', onViewportChange)
    // Watchdog: even if every event above is missed, any lingering offset is
    // cleared within 500ms once the keyboard is closed — the top bar can
    // never stay stranded off-screen.
    const watchdog = setInterval(() => {
      if (!keyboardLikelyOpen() &&
          (window.scrollY !== 0 || document.documentElement.scrollTop !== 0 || document.body.scrollTop !== 0)) {
        hardReset()
      }
    }, 500)
    return () => {
      document.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('touchend', onTouchEnd)
      vv?.removeEventListener('resize', onViewportChange)
      vv?.removeEventListener('scroll', onViewportChange)
      clearInterval(watchdog)
    }
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
      {/* Desktop sidebar (hidden on mobile) */}
      <Sidebar currentPage={page} onNavigate={setPage} />

      {/* Mobile drawer */}
      {drawerMounted && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute inset-y-0 left-0 shadow-2xl transition-transform duration-200 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <Sidebar mobile currentPage={page} onNavigate={setPage} onClose={closeDrawer} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar — padding-top extends its background up under the
            iPhone status bar / dynamic island so the whole top is one color */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <button
            onClick={openDrawer}
            className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Life Manager</span>
        </div>
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
        <main className="flex-1 flex overflow-hidden">
          <PullToRefresh onRefresh={() => reconcile('manual')}>
            <PageComponent onNavigate={setPage} />
          </PullToRefresh>
        </main>
      </div>
    </div>
  )
}
