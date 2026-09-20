import { useAuth } from '../../auth/auth-context'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-10 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl text-ink">Paramètres</h1>
        <p className="text-sm text-ink/60">Gère ton compte et tes préférences</p>
      </div>

      <section className="flex max-w-md flex-col gap-4 rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium text-ink">Profil</h2>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Nom affiché</span>
          <span className="text-sm text-ink">{user?.display_name ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Email</span>
          <span className="text-sm text-ink">{user?.email}</span>
        </div>
      </section>
    </div>
  )
}
