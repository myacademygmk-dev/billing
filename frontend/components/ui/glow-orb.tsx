/**
 * Soft ambient color glow for section backgrounds — a large blurred circle
 * sitting behind content. This is the "premium SaaS" way to add color and
 * atmosphere to a section without putting a gradient on the content itself.
 * Place inside a `relative overflow-hidden` section.
 */
export function GlowOrb({ className = '', color = 'bg-indigo-200/40' }: { className?: string; color?: string }) {
  return <div aria-hidden className={`pointer-events-none absolute rounded-full blur-3xl ${color} ${className}`} />;
}
