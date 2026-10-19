'use client';

import { useEffect, useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

export type PickedStudent = { id: string; name: string; student_code: string; class_name?: string | null };

export function StudentPicker({ value, onChange, onSelect, className }: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (student: PickedStudent) => void;
  className?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(value.trim()), 250);
    return () => clearTimeout(timer);
  }, [value]);
  const results = useQuery({
    queryKey: ['studentPicker', query, className],
    enabled: open && query.length > 0,
    queryFn: ({ signal }) => apiFetch<{ items: PickedStudent[]; total: number }>(
      `/students?search=${encodeURIComponent(query)}&page=1&page_size=20${className ? `&class_name=${encodeURIComponent(className)}` : ''}`, { signal }),
  });
  const items = query === value.trim() ? results.data?.items ?? [] : [];
  function select(student: PickedStudent) { onSelect(student); setOpen(false); setActive(-1); }
  return (
    <div className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <Input id={id} aria-label="Student name or roll number" role="combobox" aria-autocomplete="list"
        aria-expanded={open && !!value.trim()} aria-controls={`${id}-results`}
        aria-activedescendant={active >= 0 && items[active] ? `${id}-${active}` : undefined}
        autoComplete="off" value={value} prefix={<Search size={16} />} placeholder="Name or roll number"
        onFocus={() => setOpen(true)}
        onChange={(event) => { onChange(event.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setOpen(false); return; }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); setOpen(true);
            setActive((index) => items.length ? (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length : -1);
          }
          if (event.key === 'Enter' && open) {
            event.preventDefault();
            const exact = items.find((item) => item.student_code.toLowerCase() === value.trim().toLowerCase());
            const choice = items[active] ?? exact ?? (items.length === 1 ? items[0] : undefined);
            if (choice) select(choice);
          }
        }} />
      {open && value.trim() && (
        <div id={`${id}-results`} role="listbox" aria-label="Students" className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-[var(--panel-line)] bg-white shadow-lg">
          {results.isFetching || query !== value.trim() ? <p role="status" className="p-3 text-sm text-[var(--muted)]">Searching...</p>
            : results.isError ? <p role="alert" className="p-3 text-sm text-[var(--danger)]">Unable to search students. Try again.</p>
            : !items.length ? <p className="p-3 text-sm text-[var(--muted)]">No matching students</p>
            : items.map((student, index) => (
              <button key={student.id} id={`${id}-${index}`} type="button" role="option" aria-selected={index === active}
                className={`block w-full px-3 py-3 text-left text-sm hover:bg-[var(--accent-soft)] ${index === active ? 'bg-[var(--accent-soft)]' : ''}`}
                onMouseDown={(event) => event.preventDefault()} onClick={() => select(student)}>
                <span className="block font-semibold text-[var(--heading)]">{student.name}</span>
                <span className="text-xs text-[var(--muted)]">{student.student_code}{student.class_name ? ` / ${student.class_name}` : ''}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
