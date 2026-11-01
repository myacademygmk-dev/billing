'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export type CountdownDraft = { title: string; date: string };
export function localCountdownDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function WebsiteCountdownEditor({ value, onChange, disabled }: {
  value: CountdownDraft[]; onChange: (value: CountdownDraft[]) => void; disabled?: boolean;
}) {
  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-sm font-semibold">Countdowns ({value.length}/4)</h3><p className="text-xs text-[var(--muted)]">Up to four events. Dates use your device timezone. Expired events are hidden on the website.</p></div>
      <Button type="button" disabled={disabled || value.length >= 4} onClick={() => onChange([...value, { title: '', date: '' }])}>Add countdown</Button>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {value.map((item, index) => <fieldset disabled={disabled} key={index} className="min-w-0 space-y-3 rounded-xl border border-[var(--panel-line)] p-4">
        <legend className="px-1 text-xs font-semibold">Event {index + 1}</legend>
        <label className="block text-xs">Event title<Input value={item.title} maxLength={200} onChange={(e) => onChange(value.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} /></label>
        <label className="block text-xs">Date and time<Input type="datetime-local" value={item.date} onChange={(e) => onChange(value.map((row, i) => i === index ? { ...row, date: e.target.value } : row))} /></label>
        <Button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove countdown {index + 1}</Button>
      </fieldset>)}
    </div>
  </section>;
}
