export function MathLabel({ label, accessibleLabel }: { label: string; accessibleLabel: string }) {
  const fraction = /^(-?\d+)\/(-?\d+)$/.exec(label)
  if (!fraction) {
    return <span aria-label={accessibleLabel}>{label}</span>
  }
  return (
    <span className="inline-flex items-center" aria-label={accessibleLabel}>
      <span aria-hidden="true" className="inline-flex min-w-10 flex-col items-center leading-none font-display text-2xl">
        <span className="px-1">{fraction[1]}</span>
        <span className="w-full border-t-2 border-current px-1 pt-0.5">{fraction[2]}</span>
      </span>
    </span>
  )
}
