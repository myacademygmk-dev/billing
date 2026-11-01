'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClassMarksDialog } from './class-marks-dialog';
import { ExamMark, ExamMarksTable } from './exam-marks-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type Exam = { id: string; name: string; exam_type: string; class_section_id: string | null; start_date: string | null; end_date: string | null };
type ClassItem = { id: string; class_name: string; section: string | null; subjects: { id: string; name: string; max_marks: number }[] };
const emptyForm = { name: '', exam_type: 'quarterly', class_section_id: '', start_date: '', end_date: '' };

export function ExamsTab({ yearId }: { yearId: string | null }) {
  const [selectedExam, setSelectedExam] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const qc = useQueryClient();
  const me = useQuery<{ role: string }>({ queryKey: ['auth-me'], queryFn: () => apiFetch('/auth/me') });
  const classes = useQuery<ClassItem[]>({ queryKey: ['classesForYear', yearId], queryFn: () => apiFetch('/academic/classes?academic_year_id=' + yearId), enabled: !!yearId });
  const exams = useQuery<{ items: Exam[]; total: number }>({ queryKey: ['exams', yearId, page], queryFn: () => apiFetch('/exams?academic_year_id=' + yearId + '&page=' + page + '&page_size=20'), enabled: !!yearId });
  const exam = exams.data?.items.find((item) => item.id === selectedExam);
  const marks = useQuery<{ items: ExamMark[] }>({ queryKey: ['marks', selectedExam], queryFn: () => apiFetch('/exams/marks?exam_id=' + selectedExam), enabled: !!exam });
  const availableClasses = (classes.data ?? []).filter((item) => !exam?.class_section_id || item.id === exam.class_section_id);
  const badDates = !!form.start_date && !!form.end_date && form.end_date < form.start_date;
  const create = useMutation({
    mutationFn: () => apiFetch<Exam>('/exams', { method: 'POST', body: JSON.stringify({ ...form, name: form.name.trim(), academic_year_id: yearId, class_section_id: form.class_section_id || null, start_date: form.start_date || null, end_date: form.end_date || null }) }),
    onSuccess: async (created) => { setPage(1); await qc.invalidateQueries({ queryKey: ['exams'] }); setSelectedExam(created.id); setShowCreate(false); setForm(emptyForm); toast({ title: 'Exam created', variant: 'success' }); },
    onError: (error) => toast({ title: 'Exam could not be created', description: error.message, variant: 'error' }),
  });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Exams &amp; marks</h2><p className="text-sm text-[var(--muted)]">Select an exam, then enter a whole class in one sheet.</p></div>{me.data?.role === 'admin' && <Button disabled={!yearId} onClick={() => setShowCreate(true)}>New exam</Button>}</div>
    {!yearId ? <p>Select an academic year first.</p> : exams.isError ? <p role="alert">Exams could not be loaded. <Button variant="outline" onClick={() => exams.refetch()}>Retry</Button></p> : exams.isLoading ? <p role="status">Loading exams...</p> : <>
      <div className="overflow-auto rounded-lg border border-[var(--panel-line)]">
        <table className="w-full text-sm"><caption className="sr-only">Exams in the selected academic year</caption><thead className="bg-[var(--surface-subtle)]"><tr>{['Exam', 'Type', 'Class', 'Dates', ''].map((label, i) => <th scope="col" key={i} className="p-3 text-left">{label || <span className="sr-only">Action</span>}</th>)}</tr></thead>
          <tbody>{exams.data?.items.map((item) => <tr key={item.id} className={'border-t border-[var(--panel-line)] ' + (item.id === selectedExam ? 'bg-[var(--accent-soft)]' : '')}><th scope="row" className="p-3 text-left font-medium">{item.name}</th><td className="p-3 capitalize">{item.exam_type.replace(/_/g, ' ')}</td><td className="p-3">{item.class_section_id ? classes.data?.find((c) => c.id === item.class_section_id)?.class_name ?? 'Class' : 'All classes'}</td><td className="whitespace-nowrap p-3">{item.start_date ?? 'Not scheduled'}{item.end_date ? ' – ' + item.end_date : ''}</td><td className="p-3"><Button size="sm" variant={item.id === selectedExam ? 'default' : 'outline'} aria-label={'View marks for ' + item.name} onClick={() => setSelectedExam(item.id)}>View marks</Button></td></tr>)}</tbody>
        </table>
        {!exams.data?.items.length && <p className="p-8 text-center text-sm text-[var(--muted)]">No exams for this academic year yet.</p>}
      </div>
      {(exams.data?.total ?? 0) > 20 && <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={page === 1} onClick={() => { setPage(page - 1); setSelectedExam(''); }}>Previous</Button><span>Page {page}</span><Button variant="outline" disabled={page * 20 >= (exams.data?.total ?? 0)} onClick={() => { setPage(page + 1); setSelectedExam(''); }}>Next</Button></div>}
    </>}
    {exam && <section className="space-y-3" aria-label="Selected exam marks">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{exam.name}</h3><p className="text-xs text-[var(--muted)]">Saved scores grouped by student. A dash means no mark is recorded.</p></div><Button disabled={classes.isLoading || classes.isError || !availableClasses.length} onClick={() => setShowSheet(true)}>Open marks sheet</Button></div>
      {classes.isError && <p role="alert">Classes could not be loaded. <Button variant="outline" onClick={() => classes.refetch()}>Retry classes</Button></p>}
      {!classes.isLoading && !classes.isError && !availableClasses.length && <p>Add a class and its subjects under Years &amp; Classes to begin.</p>}
      {marks.isError ? <p role="alert">Marks could not be loaded. <Button variant="outline" onClick={() => marks.refetch()}>Retry marks</Button></p> : marks.isLoading ? <p role="status">Loading marks...</p> : <ExamMarksTable marks={marks.data?.items ?? []} />}
    </section>}
    <Dialog open={showCreate} onOpenChange={(open) => { if (!create.isPending) setShowCreate(open); }}><DialogContent>
      <DialogHeader><DialogTitle>Create exam</DialogTitle></DialogHeader><DialogBody><fieldset disabled={create.isPending} className="space-y-4">
        <label className="block text-sm font-medium">Exam name<Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. First quarterly exam" maxLength={200} /></label>
        <label className="block text-sm font-medium">Type<Select className="mt-1" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })}>{[['monthly_test', 'Monthly test'], ['quarterly', 'Quarterly'], ['half_yearly', 'Half yearly'], ['annual', 'Annual'], ['special', 'Special']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
        <label className="block text-sm font-medium">Class<Select className="mt-1" value={form.class_section_id} onChange={(e) => setForm({ ...form, class_section_id: e.target.value })}><option value="">All classes in this year</option>{classes.data?.map((item) => <option key={item.id} value={item.id}>{item.class_name} {item.section}</option>)}</Select></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Start date<Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label><label className="text-sm font-medium">End date<Input type="date" min={form.start_date || undefined} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label></div>
        {badDates && <p role="alert" className="text-sm text-[var(--danger)]">End date must be on or after start date.</p>}
      </fieldset></DialogBody><DialogFooter><Button variant="outline" disabled={create.isPending} onClick={() => setShowCreate(false)}>Cancel</Button><Button disabled={!yearId || !form.name.trim() || badDates} loading={create.isPending} onClick={() => create.mutate()}>Create exam</Button></DialogFooter>
    </DialogContent></Dialog>
    {showSheet && exam && <ClassMarksDialog examId={exam.id} examName={exam.name} classes={availableClasses} onClose={() => setShowSheet(false)} />}
  </div>;
}
