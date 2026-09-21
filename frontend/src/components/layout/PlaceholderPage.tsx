export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-start justify-center gap-2 overflow-y-auto px-10">
      <h1 className="text-2xl text-ink">{title}</h1>
      <p className="text-sm text-ink/60">{description}</p>
    </div>
  )
}
