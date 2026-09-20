const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? '/auth'

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

export function MicrosoftSignInButton() {
  return (
    <a
      href={`${AUTH_BASE_URL}/login/microsoft`}
      className="inline-flex items-center justify-center gap-3 rounded-md border border-border bg-white px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
    >
      <MicrosoftLogo />
      Continuer avec Microsoft
    </a>
  )
}
