'use client';

/**
 * Lightweight chart components using pure CSS/SVG — no external dependencies.
 */

type BarChartProps = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
};

export function BarChart({ data, height = 200 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const plotHeight = Math.max(80, height - 36);
  const zero = max / range * plotHeight;
  return (
    <div className="w-full overflow-x-auto" role="region" aria-label="Monthly revenue chart" tabIndex={0}>
      <div className="relative flex gap-3 pt-5" style={{ minWidth: Math.max(280, data.length * 52), height: plotHeight + 66 }}>
        {[0, 0.5, 1].map((fraction) => <div key={fraction} aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--panel-line)]" style={{ top: 20 + fraction * plotHeight }} />)}
        {data.map((item, i) => {
          const y = (max - item.value) / range * plotHeight;
          const barHeight = Math.abs(y - zero);
          return (
            <div key={i} className="relative min-w-0 flex-1 text-center" title={`${item.label}: ${item.value.toLocaleString('en-IN')}`}>
              <div className="relative mx-auto w-full max-w-[40px]" style={{ height: plotHeight }}>
                <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-[var(--heading)]" style={{ top: Math.min(y, zero) - 19 }}>{Math.abs(item.value) >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}</span>
                <div className="absolute w-full rounded-[4px]" style={{ top: Math.min(y, zero), height: barHeight, backgroundColor: item.color || 'var(--accent)' }} />
              </div>
              <p className="mt-3 text-[11px] leading-tight text-[var(--muted)]">{item.label}</p>
              <span className="sr-only">{item.value.toLocaleString('en-IN')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DonutChartProps = {
  data: { label: string; value: number; color: string }[];
  size?: number;
};

export function DonutChart({ data, size = 160 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  let accumulated = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 120 120">
        {data.map((item, i) => {
          const percentage = item.value / total;
          const strokeDash = percentage * circumference;
          const offset = (accumulated / total) * circumference;
          accumulated += item.value;
          return (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-700"
            />
          );
        })}
        <text x="60" y="56" textAnchor="middle" className="fill-[var(--heading)] text-[14px] font-bold">{total}</text>
        <text x="60" y="72" textAnchor="middle" className="fill-[var(--muted)] text-[9px]">Total</text>
      </svg>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-[var(--muted)]">{item.label}</span>
            <span className="text-xs font-semibold text-[var(--heading)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type LinePoint = { label: string; value: number };

export function MiniLineChart({ data, color = 'var(--accent)', height = 60 }: { data: LinePoint[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const width = 300;
  const padding = 4;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polyline fill={`${color}15`} stroke="none" points={`${padding},${height} ${points} ${width - padding},${height}`} />
    </svg>
  );
}
