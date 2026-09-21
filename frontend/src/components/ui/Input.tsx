import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-md border px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/45 focus:border-ink/40 focus:ring-2 focus:ring-ink/10 ${
          error ? 'border-red-500' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
})
