'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

type ClassItem = { id: string; class_name: string; section: string | null; subjects: { id: string; name: string; max_marks: number }[] };
type Mark = { student_id: string; subject_id: string; marks_obtained: string };
type Student = { id: string; name: string; student_code: string };

export function ClassMarksDialog({ examId, classes, onClose }: { examId: string; classes: ClassItem[]; onClose: () => void }) {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const selectedClass = classes.find((item) => item.id === classId);
  const subject = selectedClass?.subjects.find((item) => item.id === subjectId);
  const qc = useQueryClient();
  const { toast } = useToast();
  const roster = useQuery({
    queryKey: ['marksRoster', classId], enabled: !!selectedClass,
    queryFn: async () => {
      const items: Student[] = [];
      for (let page = 1; ; page++) {
        const result = await apiFetch<{ items: Student[]; total: number }>(`/students?class_name=${encodeURIComponent(selectedClass!.class_name)}&status=active&page=${page}&page_size=200`);
        items.push(...result.items);
        if (!result.items.length || items.length >= result.total) return items;
      }
    },
  });
  const marks = useQuery({ queryKey: ['marks', examId], queryFn: () => apiFetch<{ items: Mark[] }>(`/exams/marks?exam_id=${examId}`) });
  const existing = new Map(marks.data?.items.filter((mark) => mark.subject_id === subjectId).map((mark) => [mark.student_id, mark.marks_obtained]));
  const entries = (roster.data ?? []).filter((student) => !existing.has(student.id) && values[student.id]?.trim()).map((student) => ({ student_id: student.id, subject_id: subjectId, marks_obtained: Number(values[student.id]), max_marks: subject?.max_marks ?? 100 }));
  const invalid = entries.some((entry) => !Number.isFinite(entry.marks_obtained) || entry.marks_obtained < 0 || entry.marks_obtained > entry.max_marks);
  const save = useMutation({
    mutationFn: () => apiFetch('/exams/marks/bulk', { method: 'POST', body: JSON.stringify({ exam_id: examId, marks: entries }) }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['marks', examId] }); toast({ title: `${entries.length} marks saved`, variant: 'success' }); onClose(); },
    onError: (error) => toast({ title: 'Marks could not be saved', description: String(error), variant: 'error' }),
  });
  const dirty = Object.values(values).some((value) => value.trim());
  return <Dialog open onOpenChange={(open) => { if (!open && !save.isPending && (!dirty || window.confirm('Discard unsaved marks?'))) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Class marks</DialogTitle></DialogHeader>
    <DialogBody><fieldset disabled={save.isPending} className="min-w-0 space-y-4">
      <Select aria-label="Class roster" value={classId} onChange={(event) => { if (dirty && !window.confirm('Discard unsaved marks?')) return; setClassId(event.target.value); setSubjectId(''); setValues({}); }}><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_name} {item.section}</option>)}</Select>
      <Select aria-label="Roster subject" value={subjectId} disabled={!selectedClass} onChange={(event) => { if (dirty && !window.confirm('Discard unsaved marks?')) return; setSubjectId(event.target.value); setValues({}); }}><option value="">Select subject</option>{selectedClass?.subjects.map((item) => <option key={item.id} value={item.id}>{item.name} / {item.max_marks} marks</option>)}</Select>
      {roster.isError || marks.isError ? <p role="alert" className="text-sm text-[var(--danger)]">Unable to load the roster or recorded marks. <Button size="sm" variant="outline" onClick={() => { roster.refetch(); marks.refetch(); }}>Retry</Button></p> : subject && (roster.isLoading || marks.isLoading) ? <p className="text-sm">Loading roster...</p> : subject && <div className="max-h-80 overflow-auto divide-y divide-[var(--panel-line)]">
        {roster.data?.map((student) => <div key={student.id} className="flex items-center justify-between gap-3 py-3"><label htmlFor={`mark-${student.id}`} className="min-w-0 text-sm"><span className="block font-semibold">{student.name}</span><span className="text-xs text-[var(--muted)]">{student.student_code}</span></label><Input id={`mark-${student.id}`} type="number" min={0} max={subject.max_marks} step="0.01" className="w-24 shrink-0" placeholder={`/ ${subject.max_marks}`} value={existing.get(student.id) ?? values[student.id] ?? ''} disabled={existing.has(student.id)} title={existing.has(student.id) ? 'Already recorded' : undefined} onChange={(event) => setValues({ ...values, [student.id]: event.target.value })} /></div>)}
        {!roster.data?.length && <p className="py-5 text-sm text-[var(--muted)]">No active students in this class.</p>}
      </div>}
      {invalid && <p role="alert" className="text-sm text-[var(--danger)]">Marks must be between 0 and {subject?.max_marks}.</p>}
    </fieldset></DialogBody>
    <DialogFooter><Button variant="outline" disabled={save.isPending} onClick={() => { if (!dirty || window.confirm('Discard unsaved marks?')) onClose(); }}>Cancel</Button><Button loading={save.isPending} disabled={!subject || !entries.length || invalid || roster.isError || marks.isError || marks.isFetching} onClick={() => save.mutate()}>Save {entries.length} marks</Button></DialogFooter>
  </DialogContent></Dialog>;
}
