'use client';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { uploadWebsiteFile } from '@/lib/website-upload';
type Entry = Record<string, string | number>;
export function WebsiteCollectionEditor({ title, value, onChange, fields, disabled, onBusyChange }: {
  title: string; value: string; onChange: (value: string) => void;
  fields: { key: string; label: string }[]; disabled?: boolean; onBusyChange: (busy: boolean) => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  let entries: Entry[] = [];
  let parseError = false;
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) throw new Error();
    entries = parsed.map((entry) => typeof entry === 'string' ? { name: entry } : entry);
    if (entries.some((entry) => !entry || typeof entry !== 'object')) throw new Error();
  } catch { parseError = true; }
  const update = (index: number, changes: Entry) => onChange(JSON.stringify(entries.map((entry, i) => i === index ? { ...entry, ...changes } : entry)));
  const locked = disabled || busy !== null;
  return <section className="space-y-3" aria-labelledby={id}>
    <div className="flex items-center justify-between gap-3"><h3 id={id} className="text-sm font-semibold">{title}</h3>
      <Button type="button" disabled={locked || parseError} onClick={() => onChange(JSON.stringify([...entries, { name: '', photo_url: '' }]))}>Add {title.toLowerCase()} entry</Button>
    </div>
    <p className="text-xs text-[var(--muted)]">Edit details, replace photos or remove entries, then save website settings. Photos are compressed automatically.</p>
    {parseError && <p role="alert">Existing data could not be read. Reload settings before editing this section.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="grid gap-3 lg:grid-cols-2">
      {!parseError && entries.map((entry, index) => {
        const photo = String(entry.photo_url ?? entry.image ?? entry.image_url ?? '');
        return <fieldset disabled={locked} key={index} className="min-w-0 space-y-3 rounded-xl border border-[var(--panel-line)] p-4">
          <legend className="px-1 text-xs font-semibold">{title} {index + 1}</legend>
          {fields.map((field) => <label key={field.key} className="block text-xs">{field.label}
            <Input value={String(entry[field.key] ?? (field.key === 'name' ? entry.title : field.key === 'designation' ? entry.role : '') ?? '')} onChange={(e) => update(index, { [field.key]: e.target.value })} />
          </label>)}
          {photo && <img src={photo.replace(/^\/api\/backend\/uploads\//, '/api/uploads/')} alt={`${entry.name || title} preview`} className="h-32 w-full rounded-lg bg-slate-100 object-contain" />}
          <label className="block text-xs">{busy === index ? 'Uploading image…' : photo ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-2 block w-full text-xs" onChange={async (event) => {
              const file = event.target.files?.[0]; event.target.value = '';
              if (!file) return;
              setBusy(index); onBusyChange(true); setError('');
              try { const result = await uploadWebsiteFile(file); update(index, { photo_url: result.url, image: '', image_url: '' }); }
              catch (cause) { setError(cause instanceof Error ? cause.message : 'Upload failed'); }
              finally { setBusy(null); onBusyChange(false); }
            }} />
          </label>
          <div className="flex flex-wrap gap-2">
            {photo && <Button type="button" onClick={() => update(index, { photo_url: '', image: '', image_url: '' })}>Remove image</Button>}
            <Button type="button" onClick={() => onChange(JSON.stringify(entries.filter((_, i) => i !== index)))}>Remove entry {index + 1}</Button>
          </div>
        </fieldset>;
      })}
    </div>
  </section>;
}
