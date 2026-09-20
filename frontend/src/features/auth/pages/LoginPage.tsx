import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoFull from '../../../assets/brand/logo-full.svg'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useToast } from '../../../components/ui/toast-context'
import { tokenStorage } from '../../../lib/token-storage'
import { login } from '../api/auth-api'
import { useAuth } from '../auth-context'
import { MicrosoftSignInButton } from '../components/MicrosoftSignInButton'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (tokens) => {
      tokenStorage.set(tokens)
      signIn()
      showToast('Connexion réussie, bienvenue !')
      navigate('/', { replace: true })
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({ email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <img src={logoFull} alt="Kelenda" className="h-[84px] w-auto" />

        <Card className="w-full">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl text-ink">Connexion à Kelenda</h1>
              <p className="text-sm text-ink/60">Gère ton alternance à un seul endroit</p>
            </div>

            <MicrosoftSignInButton />

            <div className="flex items-center gap-3 text-xs text-ink/40">
              <span className="h-px flex-1 bg-border" />
              ou avec ton email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="toi@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Mot de passe"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {mutation.isError && (
                <p className="text-sm text-red-500">Identifiants invalides. Réessaie.</p>
              )}

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>

            <Link to="/signup" className="text-center text-sm text-ink/60 hover:text-ink hover:underline">
              Pas encore de compte ? Créer un compte
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
