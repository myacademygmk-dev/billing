'use client';

import { useState } from 'react';
import { BookOpen, GraduationCap, Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type AcademicYear = { id: string; name: string; start_date: string; end_date: string; is_current: boolean };
type ClassSection = { id: string; class_name: string; section: string | null; subjects: { id: string; name: string; code: string | null; max_marks: number }[] };
type Exam = { id: string; name: string; exam_type: string; start_date?: string | null; end_date?: string | null };
type MarkItem = { id: string; student_name?: string | null; subject_name?: string | null; marks_obtained: string; max_marks: number; grade?: string | null };

export default function AcademicPage() {
  const [activeTab, setActiveTab] = useState<'academic' | 'exams'>('academic');

  const tabNav = (
    <div className="flex items-end">
      <button
        onClick={() => setActiveTab('academic')}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-b-0 transition-colors ${
          activeTab === 'academic'
            ? 'bg-white text-[var(--heading)] border-[var(--panel-line)] relative z-10 -mb-px'
            : 'bg-[#f1f5f9] text-[var(--muted)] border-[var(--panel-line)] hover:text-[var(--heading)] hover:bg-[#f8fafc]'
        }`}
      >
        <GraduationCap className="h-3.5 w-3.5" />
        Years & Classes
      </button>
      <button
        onClick={() => setActiveTab('exams')}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-b-0 transition-colors ${
          activeTab === 'exams'
            ? 'bg-white text-[var(--heading)] border-[var(--panel-line)] relative z-10 -mb-px'
            : 'bg-[#f1f5f9] text-[var(--muted)] border-[var(--panel-line)] hover:text-[var(--heading)] hover:bg-[#f8fafc]'
        }`}
      >
        <BookOpen className="h-3.5 w-3.5" />
        Exams & Marks
      </button>
    </div>
  );

  return (
    <AppShell title="Academics" subtitle="Manage academic structure, classes, subjects, and exams." action={tabNav}>
      <div className="border border-[var(--panel-line)] bg-white p-3 sm:p-4">
        {activeTab === 'academic' && <AcademicTab />}
        {activeTab === 'exams' && <ExamsTab />}
      </div>
    </AppShell>
  );
}

function AcademicTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAddYear, setShowAddYear] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '', is_current: false });
  const [classForm, setClassForm] = useState({ class_name: '', section: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', max_marks: '100' });

  const years = useQuery<AcademicYear[]>({ queryKey: ['academicYears'], queryFn: () => apiFetch('/academic/years') });
  const classes = useQuery<ClassSection[]>({
    queryKey: ['classesForYear', selectedYear],
    queryFn: () => apiFetch(`/academic/classes?academic_year_id=${selectedYear}`),
    enabled: !!selectedYear,
  });

  const createYear = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/academic/years', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academicYears'] }); setShowAddYear(false); setYearForm({ name: '', start_date: '', end_date: '', is_current: false }); toast({ title: 'Academic year created', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  const createClass = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/academic/classes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classesForYear'] }); setShowAddClass(false); setClassForm({ class_name: '', section: '' }); toast({ title: 'Class created', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  const createSubject = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/academic/subjects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classesForYear'] }); setShowAddSubject(false); setSubjectForm({ name: '', code: '', max_marks: '100' }); toast({ title: 'Subject added', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card square transparent>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h4">Academic Years</CardTitle>
              <Button size="sm" onClick={() => setShowAddYear(true)} aria-label="Add academic year"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {years.isLoading ? (
              <div className="flex items-center gap-2 py-4 text-[var(--muted)]"><Spinner size="sm" /> Loading</div>
            ) : !years.data?.length ? (
              <EmptyState icon={<EmptyStateIcon type="calendar" size={28} />} title="No academic years" description="Create your first academic year." compact />
            ) : (
              <div className="space-y-2">
                {years.data.map((y) => (
                  <button
                    key={y.id}
                    onClick={() => setSelectedYear(y.id)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${selectedYear === y.id ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-semibold' : 'border-[var(--field-border)] hover:bg-[var(--surface-subtle)]'}`}
                  >
                    <div className="font-medium text-[var(--heading)]">{y.name}</div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">{y.start_date} → {y.end_date}</div>
                    {y.is_current && <Badge variant="success" className="mt-1">Current</Badge>}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card square transparent>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h4">Classes & Subjects</CardTitle>
              {selectedYear && <Button size="sm" onClick={() => setShowAddClass(true)}><Plus className="mr-1 h-3.5 w-3.5" />Add Class</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedYear ? (
              <EmptyState icon={<EmptyStateIcon type="data" size={28} />} title="Select an academic year" description="Choose a year from the left to view classes." compact />
            ) : classes.isLoading ? (
              <div className="flex items-center gap-2 py-4 text-[var(--muted)]"><Spinner size="sm" /> Loading</div>
            ) : !classes.data?.length ? (
              <EmptyState icon={<EmptyStateIcon type="students" size={28} />} title="No classes yet" description="Add classes for this academic year." compact action={<Button size="sm" onClick={() => setShowAddClass(true)}><Plus className="mr-1 h-3.5 w-3.5" />Add Class</Button>} />
            ) : (
              <div className="space-y-3">
                {classes.data.map((cls) => (
                  <div key={cls.id} className="rounded-lg border border-[var(--panel-line)] p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-[var(--heading)]">{cls.class_name}{cls.section ? ` - ${cls.section}` : ''}</h4>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedClass(cls.id); setShowAddSubject(true); }}><Plus className="mr-1 h-3 w-3" />Subject</Button>
                    </div>
                    {cls.subjects.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {cls.subjects.map((sub) => (<Badge key={sub.id} variant="accent">{sub.name} ({sub.max_marks})</Badge>))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddYear} onOpenChange={setShowAddYear}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Academic Year</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Name *</label><Input placeholder="e.g. 2025-2026" value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Start Date *</label><Input type="date" value={yearForm.start_date} onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">End Date *</label><Input type="date" value={yearForm.end_date} onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-[var(--text)]"><input type="checkbox" checked={yearForm.is_current} onChange={(e) => setYearForm({ ...yearForm, is_current: e.target.checked })} className="h-4 w-4 rounded" />Set as current year</label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddYear(false)}>Cancel</Button>
            <Button onClick={() => createYear.mutate(yearForm)} disabled={!yearForm.name || !yearForm.start_date || !yearForm.end_date} loading={createYear.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddClass} onOpenChange={setShowAddClass}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Class Name *</label><Input placeholder="e.g. 10th, LKG" value={classForm.class_name} onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })} /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Section (optional)</label><Input placeholder="e.g. A, B" value={classForm.section} onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} /></div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClass(false)}>Cancel</Button>
            <Button onClick={() => createClass.mutate({ ...classForm, academic_year_id: selectedYear, section: classForm.section || null })} disabled={!classForm.class_name} loading={createClass.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Subject Name *</label><Input placeholder="e.g. Mathematics" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Code (optional)</label><Input placeholder="e.g. MATH" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Max Marks</label><Input type="number" value={subjectForm.max_marks} onChange={(e) => setSubjectForm({ ...subjectForm, max_marks: e.target.value })} /></div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubject(false)}>Cancel</Button>
            <Button onClick={() => createSubject.mutate({ class_section_id: selectedClass, name: subjectForm.name, code: subjectForm.code || null, max_marks: Number(subjectForm.max_marks) })} disabled={!subjectForm.name} loading={createSubject.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExamsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAddExam, setShowAddExam] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [showAddMark, setShowAddMark] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', exam_type: 'quarterly', start_date: '', end_date: '' });
  const [markForm, setMarkForm] = useState({ student_id: '', subject_id: '', marks_obtained: '', max_marks: '100' });

  const years = useQuery<AcademicYear[]>({ queryKey: ['academicYears'], queryFn: () => apiFetch('/academic/years') });
  const currentYear = years.data?.find((y) => y.is_current) ?? years.data?.[0];

  const exams = useQuery<{ items: Exam[]; total: number }>({
    queryKey: ['exams', currentYear?.id],
    queryFn: () => apiFetch(`/exams?academic_year_id=${currentYear?.id}`),
    enabled: !!currentYear?.id,
  });

  const marks = useQuery<{ items: MarkItem[]; total: number }>({
    queryKey: ['marks', selectedExam],
    queryFn: () => apiFetch(`/exams/marks?exam_id=${selectedExam}`),
    enabled: !!selectedExam,
  });

  const createExam = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/exams', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); setShowAddExam(false); setExamForm({ name: '', exam_type: 'quarterly', start_date: '', end_date: '' }); toast({ title: 'Exam created', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  const createMark = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/exams/marks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marks'] }); setShowAddMark(false); setMarkForm({ student_id: '', subject_id: '', marks_obtained: '', max_marks: '100' }); toast({ title: 'Mark recorded', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  return (
    <>
      <div className="page-grid">
        <Card square transparent>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h4">Exams {currentYear ? `(${currentYear.name})` : ''}</CardTitle>
              <Button size="sm" onClick={() => setShowAddExam(true)}><Plus className="mr-1 h-3.5 w-3.5" />New Exam</Button>
            </div>
          </CardHeader>
          <CardContent>
            {exams.isLoading ? (
              <div className="flex items-center gap-2 py-4 text-[var(--muted)]"><Spinner size="sm" /> Loading</div>
            ) : !exams.data?.items.length ? (
              <EmptyState icon={<EmptyStateIcon type="calendar" size={28} />} title="No exams yet" description="Create an exam to start recording marks." compact action={<Button size="sm" onClick={() => setShowAddExam(true)}><Plus className="mr-1 h-3.5 w-3.5" />New Exam</Button>} />
            ) : (
              <div className="space-y-2">
                {exams.data.items.map((exam) => (
                  <button key={exam.id} onClick={() => setSelectedExam(exam.id)} className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${selectedExam === exam.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--field-border)] hover:bg-[var(--surface-subtle)]'}`}>
                    <div className="font-semibold text-[var(--heading)]">{exam.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Badge variant="default">{exam.exam_type.replace('_', ' ')}</Badge>
                      {exam.start_date && <span>{exam.start_date}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedExam && (
          <Card square transparent>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle as="h4">Marks</CardTitle>
                <Button size="sm" onClick={() => setShowAddMark(true)}><Plus className="mr-1 h-3.5 w-3.5" />Add Mark</Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-0">
              {marks.isLoading ? (
                <SkeletonTable rows={4} cols={4} />
              ) : !marks.data?.items.length ? (
                <EmptyState icon={<EmptyStateIcon type="data" size={28} />} title="No marks recorded" description="Add marks for students in this exam." compact />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <THead><tr><TH>Student</TH><TH>Subject</TH><TH>Marks</TH><TH>Grade</TH></tr></THead>
                    <TBody>
                      {marks.data.items.map((m) => (
                        <TR key={m.id}>
                          <TD className="font-medium text-[var(--heading)]">{m.student_name ?? '-'}</TD>
                          <TD>{m.subject_name ?? '-'}</TD>
                          <TD><span className="font-medium">{m.marks_obtained}</span><span className="text-[var(--muted)]">/{m.max_marks}</span></TD>
                          <TD>{m.grade ? <Badge variant="accent">{m.grade}</Badge> : '-'}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddExam} onOpenChange={setShowAddExam}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Exam Name *</label><Input placeholder="e.g. First Quarterly" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Type</label>
                <Select value={examForm.exam_type} onChange={(e) => setExamForm({ ...examForm, exam_type: e.target.value })}>
                  <option value="monthly_test">Monthly Test</option><option value="quarterly">Quarterly</option><option value="half_yearly">Half Yearly</option><option value="annual">Annual</option><option value="special">Special</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Start Date</label><Input type="date" value={examForm.start_date} onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">End Date</label><Input type="date" value={examForm.end_date} onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })} /></div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExam(false)}>Cancel</Button>
            <Button onClick={() => createExam.mutate({ ...examForm, academic_year_id: currentYear?.id, start_date: examForm.start_date || null, end_date: examForm.end_date || null })} disabled={!examForm.name} loading={createExam.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMark} onOpenChange={setShowAddMark}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Mark</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Student ID *</label><Input placeholder="Student UUID" value={markForm.student_id} onChange={(e) => setMarkForm({ ...markForm, student_id: e.target.value })} /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Subject ID *</label><Input placeholder="Subject UUID" value={markForm.subject_id} onChange={(e) => setMarkForm({ ...markForm, subject_id: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Marks *</label><Input type="number" placeholder="85" value={markForm.marks_obtained} onChange={(e) => setMarkForm({ ...markForm, marks_obtained: e.target.value })} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Max Marks</label><Input type="number" value={markForm.max_marks} onChange={(e) => setMarkForm({ ...markForm, max_marks: e.target.value })} /></div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMark(false)}>Cancel</Button>
            <Button onClick={() => createMark.mutate({ exam_id: selectedExam, ...markForm, marks_obtained: Number(markForm.marks_obtained), max_marks: Number(markForm.max_marks) })} disabled={!markForm.student_id || !markForm.marks_obtained} loading={createMark.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
