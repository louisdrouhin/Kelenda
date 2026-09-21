import { passwordRules } from '../password-policy'

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {passwordRules.map((rule) => {
        const met = rule.test(password)
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-600' : 'text-ink/45'}`}
          >
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] leading-none ${
                met ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-ink/30'
              }`}
              aria-hidden="true"
            >
              {met ? '✓' : ''}
            </span>
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
