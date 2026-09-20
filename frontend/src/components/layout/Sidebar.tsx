import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import logoMark from '../../assets/brand/logo-mark.svg'
import { useAuth } from '../../features/auth/auth-context'
import {
  CalendarIcon,
  ChevronLeftIcon,
  FinanceIcon,
  HomeIcon,
  LogoutIcon,
  MissionsIcon,
  NotificationsIcon,
  RevisionIcon,
  SettingsIcon,
} from './nav-icons'

const SIDEBAR_COLLAPSED_KEY = 'kelenda.sidebar_collapsed'

const navItems = [
  { to: '/', label: 'Accueil', icon: HomeIcon, end: true },
  { to: '/calendrier', label: 'Calendrier', icon: CalendarIcon },
  { to: '/revisions', label: 'Révisions', icon: RevisionIcon },
  { to: '/finance', label: 'Finance', icon: FinanceIcon },
  { to: '/missions', label: 'Missions', icon: MissionsIcon },
  { to: '/notifications', label: 'Notifications', icon: NotificationsIcon },
]

const secondaryNavItems = [{ to: '/parametres', label: 'Paramètres', icon: SettingsIcon }]

interface SidebarNavLinkProps {
  to: string
  label: string
  icon: (props: { className?: string }) => React.JSX.Element
  end?: boolean
  collapsed: boolean
}

function SidebarNavLink({ to, label, icon: Icon, end, collapsed }: SidebarNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${
          isActive ? 'bg-white text-ink shadow-sm' : 'text-ink/70 hover:bg-white/60 hover:text-ink'
        }`
      }
    >
      <Icon className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

export function Sidebar() {
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    } catch {
      // stockage indisponible (navigation privée, etc.) : on ignore, l'état reste en mémoire
    }
  }, [collapsed])

  const initial = (user?.display_name ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-border bg-cream transition-[width] duration-200 ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <div className={`flex items-center gap-2.5 border-b border-border px-4 py-5 ${collapsed ? 'justify-center px-0' : ''}`}>
        <img src={logoMark} alt="Kelenda" className="h-8 w-8 shrink-0" />
        {!collapsed && <span className="text-lg text-ink">Kelenda</span>}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <SidebarNavLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <nav className="flex flex-col gap-1 border-t border-border px-3 py-3">
        {secondaryNavItems.map((item) => (
          <SidebarNavLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-md border border-border py-2 text-xs text-ink/60 transition-colors hover:bg-white"
      >
        <ChevronLeftIcon className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} width={16} height={16} />
        {!collapsed && 'Réduire'}
      </button>

      <div className={`flex items-center gap-3 border-t border-border p-4 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
          {initial}
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-ink">{user?.display_name ?? user?.email}</span>
            <span className="truncate text-xs text-ink/50">{user?.email}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut()}
          title="Se déconnecter"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink/50 transition-colors hover:bg-white hover:text-ink"
        >
          <LogoutIcon width={17} height={17} />
        </button>
      </div>
    </aside>
  )
}
