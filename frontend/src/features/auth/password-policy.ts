export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const passwordRules: PasswordRule[] = [
  { id: 'length', label: 'Au moins 8 caractères', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'Un chiffre', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Un caractère spécial', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function isPasswordValid(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password))
}
