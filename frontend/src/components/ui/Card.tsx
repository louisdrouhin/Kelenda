import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-white p-8 shadow-[0_4px_16px_rgba(8,7,12,0.06)] ${className}`}
      {...props}
    />
  )
}
