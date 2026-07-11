export function NoDataIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Empty box/folder */}
      <rect x="25" y="35" width="70" height="50" rx="6" stroke="var(--panel-line)" strokeWidth="1.5" fill="var(--surface-subtle)" />
      <path d="M25 45C25 41.6863 27.6863 39 31 39H50L55 35H89C92.3137 35 95 37.6863 95 41V45H25Z" fill="var(--surface-subtle)" stroke="var(--panel-line)" strokeWidth="1.5" />
      {/* Papers inside */}
      <rect x="38" y="50" width="30" height="4" rx="2" fill="var(--panel-line)" opacity="0.5" />
      <rect x="38" y="58" width="44" height="4" rx="2" fill="var(--panel-line)" opacity="0.35" />
      <rect x="38" y="66" width="22" height="4" rx="2" fill="var(--panel-line)" opacity="0.25" />
      {/* Magnifying glass */}
      <circle cx="82" cy="24" r="12" stroke="var(--muted)" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M91 33L97 39" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      {/* Question mark */}
      <path d="M79 20C79 17.5 81 16 83 16C85 16 87 17.5 87 20C87 22 85 22.5 83 23.5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="83" cy="27" r="1" fill="var(--muted)" opacity="0.6" />
    </svg>
  );
}
