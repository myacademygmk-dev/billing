'use client';

export type ExamMark = { id: string; student_id: string; subject_id: string; student_name?: string | null; subject_name?: string | null; marks_obtained: string; max_marks: number };

export function ExamMarksTable({ marks }: { marks: ExamMark[] }) {
  const subjects = Array.from(new Map(marks.map((mark) => [mark.subject_id, mark.subject_name ?? 'Subject'])).entries());
  const students = new Map<string, ExamMark[]>();
  marks.forEach((mark) => students.set(mark.student_id, [...(students.get(mark.student_id) ?? []), mark]));
  if (!marks.length) return <p className="py-10 text-center text-sm text-[var(--muted)]">No marks recorded yet. Open the marks sheet to enter student scores.</p>;
  return <div className="max-h-[55vh] overflow-auto rounded-lg border border-[var(--panel-line)]" tabIndex={0} role="region" aria-label="Recorded marks table">
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Recorded exam marks by student and subject. Totals include recorded subjects only.</caption>
      <thead className="sticky top-0 z-20 bg-[var(--surface-subtle)]"><tr><th scope="col" className="min-w-48 p-3 text-left">Student</th>{subjects.map(([id, name]) => <th key={id} scope="col" className="min-w-28 p-3 text-right">{name}</th>)}<th scope="col" className="min-w-36 p-3 text-right">Recorded total</th></tr></thead>
      <tbody>{Array.from(students.entries()).sort((a, b) => (a[1][0].student_name ?? '').localeCompare(b[1][0].student_name ?? '')).map(([id, scores]) => {
        const total = scores.reduce((sum, score) => sum + Number(score.marks_obtained), 0);
        const max = scores.reduce((sum, score) => sum + score.max_marks, 0);
        return <tr key={id} className="border-t border-[var(--panel-line)]"><th scope="row" className="sticky left-0 bg-white p-3 text-left font-medium">{scores[0].student_name ?? 'Student'}</th>{subjects.map(([subjectId]) => {
          const mark = scores.find((score) => score.subject_id === subjectId);
          return <td key={subjectId} className="p-3 text-right tabular-nums">{mark ? <>{Number(mark.marks_obtained)}<span className="text-xs text-[var(--muted)]"> / {mark.max_marks}</span></> : <span aria-label="Not recorded">—</span>}</td>;
        })}<td className="p-3 text-right font-semibold tabular-nums">{Number(total.toFixed(2))} / {max}<span className="block text-xs font-normal text-[var(--muted)]">{scores.length} subjects recorded</span></td></tr>;
      })}</tbody>
    </table>
  </div>;
}
