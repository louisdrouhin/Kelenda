import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoFull from '../../../assets/brand/logo-full.svg'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useToast } from '../../../components/ui/toast-context'
import { isEmailAlreadyUsedError, register } from '../api/auth-api'
import { MicrosoftSignInButton } from '../components/MicrosoftSignInButton'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { isPasswordValid } from '../password-policy'

export function SignupPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ email: '', password: '', workspace_name: '', display_name: '' })
  const [passwordTouched, setPasswordTouched] = useState(false)

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      showToast('Compte créé avec succès, connecte-toi pour continuer.')
      navigate('/login', { replace: true })
    },
  })

  const emailAlreadyUsed = mutation.isError && isEmailAlreadyUsedError(mutation.error)
  const passwordValid = isPasswordValid(form.password)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!passwordValid) {
      setPasswordTouched(true)
      return
    }
    mutation.mutate(form)
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      if (field === 'email' && mutation.isError) mutation.reset()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <img src={logoFull} alt="Kelenda" className="h-[84px] w-auto" />

        <Card className="w-full">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl text-ink">Créer un compte</h1>
              <p className="text-sm text-ink/60">Rejoins Kelenda pour organiser ton alternance</p>
            </div>

            <MicrosoftSignInButton />

            <div className="flex items-center gap-3 text-xs text-ink/40">
              <span className="h-px flex-1 bg-border" />
              ou avec ton email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Nom affiché"
                name="display_name"
                autoComplete="name"
                placeholder="Ton prénom"
                value={form.display_name}
                onChange={update('display_name')}
              />
              <Input
                label="Nom de l'espace de travail"
                name="workspace_name"
                placeholder="Ex : Promo BTS SIO 2026"
                value={form.workspace_name}
                onChange={update('workspace_name')}
                required
              />
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="toi@exemple.com"
                value={form.email}
                onChange={update('email')}
                error={emailAlreadyUsed ? 'Un compte existe déjà avec cet email.' : undefined}
                required
              />
              <div className="flex flex-col gap-2.5">
                <Input
                  label="Mot de passe"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update('password')}
                  onBlur={() => setPasswordTouched(true)}
                  error={passwordTouched && !passwordValid ? 'Le mot de passe ne respecte pas tous les critères.' : undefined}
                  required
                  minLength={8}
                />
                {(passwordTouched || form.password.length > 0) && <PasswordChecklist password={form.password} />}
              </div>

              {emailAlreadyUsed ? (
                <p className="text-sm text-red-500">
                  Un compte existe déjà avec cet email.{' '}
                  <Link to="/login" className="underline">
                    Se connecter à la place
                  </Link>
                </p>
              ) : (
                mutation.isError && (
                  <p className="text-sm text-red-500">Impossible de créer le compte. Vérifie les champs.</p>
                )
              )}

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Création…' : 'Créer mon compte'}
              </Button>
            </form>

            <Link to="/login" className="text-center text-sm text-ink/60 hover:text-ink hover:underline">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
