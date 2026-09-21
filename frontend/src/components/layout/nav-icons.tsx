import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
    </svg>
  )
}

export function RevisionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 8v4l2.5 2.5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

export function FinanceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5v19M17 6.5H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6.5" />
    </svg>
  )
}

export function MissionsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4.5h6a1 1 0 0 1 1 1V6h-8v-.5a1 1 0 0 1 1-1Z" />
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function NotificationsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3" />
      <path d="M15.5 8 20 12l-4.5 4M9.5 12H20" />
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 11 8-6.5 8 6.5" />
      <path d="M6 10v8.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M4.9 6.4l1.4 1.4M17.7 16.2l1.4 1.4M3.5 12h2M18.5 12h2M4.9 17.6l1.4-1.4M17.7 7.8l1.4-1.4" />
    </svg>
  )
}
