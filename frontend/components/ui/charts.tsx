'use client';

/**
 * Lightweight chart components using pure CSS/SVG — no external dependencies.
 */

type BarChartProps = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
};

export function BarChart({ data, height = 200 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  // Reserve space for the value label on top and the axis label at bottom
  const labelTopHeight = 18;
  const labelBottomHeight = 18;
  const barAreaHeight = height - labelTopHeight - labelBottomHeight;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-2 min-w-[300px]" style={{ height: height + labelTopHeight + labelBottomHeight }}>
        {data.map((item, i) => {
          const barHeight = (item.value / max) * barAreaHeight;
          return (
            <div key={i} className="flex flex-col items-center justify-end flex-1" style={{ height: '100%' }}>
              <span className="text-[10px] font-semibold text-[var(--heading)] shrink-0" style={{ height: labelTopHeight, lineHeight: `${labelTopHeight}px` }}>
                {item.value > 0 ? (item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value) : ''}
              </span>
              <div className="flex-1 flex items-end w-full justify-center">
                <div
                  className="w-full max-w-[48px] rounded-t-md transition-all duration-500 ease-out"
                  style={{
                    height: barHeight,
                    backgroundColor: item.color || 'var(--accent)',
                    minHeight: item.value > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span className="text-[9px] text-[var(--muted)] text-center leading-tight shrink-0 mt-1" style={{ height: labelBottomHeight }}>
                {item.label}
              </span>
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
