'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

type ClassItem = { id: string; class_name: string; section: string | null; subjects: { id: string; name: string; max_marks: number }[] };
type Mark = { student_id: string; subject_id: string; marks_obtained: string; max_marks: number };
type Student = { id: string; name: string; student_code: string };
const cellKey = (student: string, subject: string) => student + ':' + subject;
const validScore = (value: string, max: number) => /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) <= max;

export function ClassMarksDialog({ examId, examName, classes, onClose }: { examId: string; examName?: string; classes: ClassItem[]; onClose: () => void }) {
  const [classId, setClassId] = useState(classes.length === 1 ? classes[0].id : '');
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [pasteError, setPasteError] = useState('');
  const tableRef = useRef<HTMLTableElement>(null);
  const selectedClass = classes.find((item) => item.id === classId);
  const subjects = selectedClass?.subjects ?? [];
  const qc = useQueryClient();
  const { toast } = useToast();
  const roster = useQuery({
    queryKey: ['marksRoster', examId, classId], enabled: !!selectedClass,
    queryFn: () => apiFetch<{ items: Student[] }>('/exams/' + examId + '/roster?class_section_id=' + classId),
  });
  const marks = useQuery({ queryKey: ['marks', examId], queryFn: () => apiFetch<{ items: Mark[] }>('/exams/marks?exam_id=' + examId) });
  const existing = new Map(marks.data?.items.map((mark) => [cellKey(mark.student_id, mark.subject_id), mark]));
  const students = roster.data?.items ?? [];
  const visible = students.filter((student) => (student.name + ' ' + student.student_code).toLowerCase().includes(search.toLowerCase()));
  const entries = students.flatMap((student) => subjects.flatMap((subject) => {
    const key = cellKey(student.id, subject.id), value = values[key]?.trim();
    return !existing.has(key) && value ? [{ student_id: student.id, subject_id: subject.id, marks_obtained: Number(value), max_marks: subject.max_marks }] : [];
  }));
  const invalid = students.some((student) => subjects.some((subject) => {
    const key = cellKey(student.id, subject.id);
    return !existing.has(key) && !!values[key]?.trim() && !validScore(values[key], subject.max_marks);
  }));
  const dirty = Object.values(values).some((value) => value.trim());
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const save = useMutation({
    mutationFn: () => apiFetch('/exams/marks/bulk', { method: 'POST', body: JSON.stringify({ exam_id: examId, marks: entries }) }),
    onSuccess: async () => {
      const count = entries.length;
      setValues({});
      await qc.invalidateQueries({ queryKey: ['marks', examId] });
      toast({ title: count + ' marks saved', variant: 'success' });
    },
    onError: (error) => toast({ title: 'Marks could not be saved', description: error.message, variant: 'error' }),
  });
  const close = () => { if (!save.isPending && (!dirty || window.confirm('Discard unsaved marks?'))) onClose(); };
  const busy = roster.isFetching || marks.isFetching;
  const failed = roster.isError || marks.isError;

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="max-w-6xl">
    <DialogHeader>
      <DialogTitle>Marks sheet{examName ? ' — ' + examName : ''}</DialogTitle>
      <p className="mt-1 text-sm text-[var(--muted)]">Enter marks across subjects. Blank means not recorded; enter 0 for a zero score.</p>
    </DialogHeader>
    <DialogBody><fieldset disabled={save.isPending} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 text-sm font-medium">Class
          <Select aria-label="Class roster" className="mt-1" value={classId} onChange={(event) => {
            if (dirty && !window.confirm('Discard unsaved marks?')) return;
            setClassId(event.target.value); setValues({}); setSearch(''); setPasteError('');
          }}><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_name} {item.section}</option>)}</Select>
        </label>
        <label className="min-w-48 flex-1 text-sm font-medium">Find student
          <Input aria-label="Find student in marks sheet" className="mt-1" placeholder="Name or roll number" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <span className="pb-2 text-sm text-[var(--muted)]" aria-live="polite">{students.length} students · {entries.length} unsaved marks</span>
      </div>
      {!selectedClass ? <p className="py-8 text-center text-sm text-[var(--muted)]">Select a class to open its marks sheet.</p>
        : failed ? <p role="alert" className="text-sm text-[var(--danger)]">Unable to load the sheet. <Button size="sm" variant="outline" onClick={() => { roster.refetch(); marks.refetch(); }}>Retry</Button></p>
        : roster.isLoading || marks.isLoading ? <p role="status">Loading marks sheet...</p>
        : !subjects.length ? <p className="py-8 text-center text-sm text-[var(--muted)]">Add subjects to this class under Years &amp; Classes before entering marks.</p>
        : <>
          <p id="marks-sheet-help" className="text-xs text-[var(--muted)]">Tab moves across subjects. Enter moves down a column; Shift+Enter moves up. Paste a rectangular range from a spreadsheet. Saved cells are locked.</p>
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-[var(--panel-line)]" tabIndex={0} role="region" aria-label="Student marks entry table">
            <table ref={tableRef} className="w-full border-collapse text-sm">
              <caption className="sr-only">{selectedClass.class_name} student marks by subject</caption>
              <thead className="sticky top-0 z-20 bg-[var(--surface-subtle)]"><tr>
                <th scope="col" className="sticky left-0 z-30 min-w-48 bg-[var(--surface-subtle)] p-3 text-left">Student</th>
                {subjects.map((subject) => <th key={subject.id} scope="col" className="min-w-36 border-l border-[var(--panel-line)] p-3 text-left">{subject.name}<span className="block text-xs font-normal text-[var(--muted)]">Out of {subject.max_marks}</span></th>)}
                <th scope="col" className="min-w-32 p-3 text-right">Entered total</th>
              </tr></thead>
              <tbody>{visible.map((student, row) => {
                let total = 0, maximum = 0, count = 0;
                subjects.forEach((subject) => {
                  const key = cellKey(student.id, subject.id), saved = existing.get(key), value = saved?.marks_obtained ?? values[key] ?? '';
                  if (value.trim() && validScore(value, saved?.max_marks ?? subject.max_marks)) { total += Number(value); maximum += saved?.max_marks ?? subject.max_marks; count++; }
                });
                return <tr key={student.id} className="border-t border-[var(--panel-line)]">
                  <th scope="row" className="sticky left-0 z-10 bg-white p-3 text-left font-medium"><span className="block">{student.name}</span><span className="text-xs font-normal text-[var(--muted)]">{student.student_code}</span></th>
                  {subjects.map((subject, col) => {
                    const key = cellKey(student.id, subject.id), recorded = existing.get(key), value = recorded?.marks_obtained ?? values[key] ?? '';
                    const error = !recorded && !!value.trim() && !validScore(value, subject.max_marks);
                    return <td key={subject.id} className="border-l border-[var(--panel-line)] p-2 align-top">
                      <Input type="number" min={0} max={recorded?.max_marks ?? subject.max_marks} step="0.01" inputMode="decimal"
                        aria-label={student.name + ' (' + student.student_code + ') — ' + subject.name} aria-invalid={error} aria-describedby={error ? 'error-' + key : 'marks-sheet-help'}
                        data-row={row} data-col={col} value={value} disabled={!!recorded || busy} placeholder="—"
                        className={error ? 'border-[var(--danger)]' : ''}
                        onChange={(event) => setValues((old) => ({ ...old, [key]: event.target.value }))}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          event.preventDefault();
                          const step = event.shiftKey ? -1 : 1;
                          for (let next = row + step; next >= 0 && next < visible.length; next += step) {
                            const input = tableRef.current?.querySelector<HTMLInputElement>('input[data-row="' + next + '"][data-col="' + col + '"]:not(:disabled)');
                            if (input) { input.focus(); input.select(); break; }
                          }
                        }}
                        onPaste={(event) => {
                          const text = event.clipboardData.getData('text');
                          if (!/[\t\n]/.test(text)) return;
                          event.preventDefault();
                          const grid = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((line) => line.split('\t'));
                          if (row + grid.length > visible.length || grid.some((cells) => col + cells.length > subjects.length)) {
                            setPasteError('The pasted range exceeds the visible rows or subject columns. Nothing was pasted.'); return;
                          }
                          const updates: Record<string, string> = {};
                          grid.forEach((cells, r) => cells.forEach((cell, c) => {
                            const target = cellKey(visible[row + r].id, subjects[col + c].id);
                            if (!existing.has(target)) updates[target] = cell.trim();
                          }));
                          setValues((old) => ({ ...old, ...updates })); setPasteError('');
                        }} />
                      {recorded && <span className="text-xs text-[var(--muted)]">Saved{recorded.max_marks !== subject.max_marks ? ' / ' + recorded.max_marks : ''}</span>}
                      {error && <span id={'error-' + key} className="block text-xs text-[var(--danger)]">0–{subject.max_marks}, up to 2 decimals</span>}
                    </td>;
                  })}
                  <td className="p-3 text-right tabular-nums"><span className="font-semibold">{Number(total.toFixed(2))} / {maximum}</span><span className="block text-xs text-[var(--muted)]">{count}/{subjects.length} entered</span></td>
                </tr>;
              })}</tbody>
            </table>
            {!visible.length && <p className="p-6 text-center text-sm text-[var(--muted)]">{students.length ? 'No students match your search.' : 'No active students in this class.'}</p>}
          </div>
        </>}
      {pasteError && <p role="alert" className="text-sm text-[var(--danger)]">{pasteError}</p>}
      {invalid && <p role="alert" className="text-sm text-[var(--danger)]">Correct the highlighted marks before saving. Check filtered-out rows too.</p>}
      {entries.length > 5000 && <p role="alert">Save at most 5,000 marks at a time.</p>}
      {save.isError && <p role="alert" className="text-sm text-[var(--danger)]">{save.error.message} Your unsaved entries have been kept. <Button size="sm" variant="outline" onClick={() => marks.refetch()}>Reload saved marks</Button></p>}
    </fieldset></DialogBody>
    <DialogFooter>
      <Button variant="outline" disabled={save.isPending} onClick={close}>Close</Button>
      <Button loading={save.isPending} disabled={!entries.length || entries.length > 5000 || invalid || failed || busy} onClick={() => save.mutate()}>Save {entries.length} marks</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}
