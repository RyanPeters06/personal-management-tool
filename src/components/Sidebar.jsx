import useStore from '../store/useStore'
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Lightbulb,
  ListTodo,
  Dumbbell,
  Briefcase,
  FolderKanban,
  Tv,
  BookOpen,
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'side-hustles', label: 'Side Hustles', icon: Briefcase },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'library', label: 'Library', icon: Tv },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'want-list', label: 'Want List', icon: ShoppingCart },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'assistant', label: 'Assistant', icon: Sparkles },
]

export default function Sidebar({ currentPage, onNavigate }) {
  const { settings, updateSettings } = useStore()
  const collapsed = settings.sidebarCollapsed

  return (
    <aside
      className={`flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}
    >
      {/* Logo / Title */}
      <div className={`flex items-center px-3 py-4 border-b border-slate-100 dark:border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && (
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">Life Manager</span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                active
                  ? 'text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
              } ${collapsed ? 'justify-center' : ''}`}
              style={active ? { backgroundColor: 'var(--accent-500)' } : {}}
              title={collapsed ? label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Bottom: Settings + Collapse */}
      <div className="px-2 pb-3 flex flex-col gap-0.5">
        <button
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-full ${collapsed ? 'justify-center' : ''} ${currentPage === 'settings' ? 'text-white' : ''}`}
          style={currentPage === 'settings' ? { backgroundColor: 'var(--accent-500)' } : {}}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        <button
          onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors w-full justify-center"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
