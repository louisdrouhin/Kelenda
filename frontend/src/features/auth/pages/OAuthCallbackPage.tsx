import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../../../components/ui/toast-context'
import { tokenStorage } from '../../../lib/token-storage'
import { exchangeOAuthCode } from '../api/auth-api'
import { useAuth } from '../auth-context'

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { showToast } = useToast()
  const [error, setError] = useState<string | null>(null)
  // StrictMode monte les effets deux fois en dev — le code d'échange est à
  // usage unique côté serveur, donc un second appel échouerait sans ce garde.
  const hasExchanged = useRef(false)

  useEffect(() => {
    if (hasExchanged.current) return
    hasExchanged.current = true

    const code = searchParams.get('code')
    if (!code) {
      setError('Lien de connexion invalide.')
      return
    }

    exchangeOAuthCode(code)
      .then((tokens) => {
        tokenStorage.set(tokens)
        signIn()
        showToast('Connexion réussie, bienvenue !')
        navigate('/', { replace: true })
      })
      .catch(() => {
        setError('Ce lien de connexion a expiré ou a déjà été utilisé. Réessaie de te connecter.')
      })
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="text-sm text-ink underline"
        >
          Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <p className="text-sm text-ink/60">Connexion en cours…</p>
    </div>
  )
}
