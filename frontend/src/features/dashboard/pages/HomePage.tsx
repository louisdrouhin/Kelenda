import { Link } from 'react-router-dom'
import {
  CalendarIcon,
  FinanceIcon,
  MissionsIcon,
  NotificationsIcon,
  RevisionIcon,
} from '../../../components/layout/nav-icons'
import { useAuth } from '../../auth/auth-context'

const shortcuts = [
  { to: '/calendrier', label: 'Calendrier', icon: CalendarIcon },
  { to: '/revisions', label: 'Révisions', icon: RevisionIcon },
  { to: '/finance', label: 'Finance', icon: FinanceIcon },
  { to: '/missions', label: 'Missions', icon: MissionsIcon },
  { to: '/notifications', label: 'Notifications', icon: NotificationsIcon },
]

export function HomePage() {
  const { user } = useAuth()
  const firstName = user?.display_name?.split(' ')[0]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-10 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl text-ink">{firstName ? `Salut ${firstName}` : 'Salut'}</h1>
        <p className="text-sm text-ink/60">Accès rapide à tes outils Kelenda</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-cream"
          >
            <Icon className="text-ink" width={22} height={22} />
            <span className="text-sm text-ink">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
