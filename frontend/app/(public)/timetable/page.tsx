import Link from 'next/link';
import { Clock, Moon, Sun, Users } from 'lucide-react';

const BATCHES = [
  { name: 'Morning Batch', time: '6:00 AM - 8:00 AM', classes: '9th to 12th Standard', icon: Sun },
  { name: 'Evening Batch I', time: '4:30 PM - 6:00 PM', classes: '6th to 8th Standard', icon: Clock },
  { name: 'Evening Batch II', time: '6:00 PM - 7:30 PM', classes: '9th and 10th Standard', icon: Moon },
  { name: 'Weekend Revision', time: 'Saturday by schedule', classes: 'Board exam groups', icon: Users },
];

const WEEKLY_PLAN = [
  ['Monday', 'Core subject teaching and homework review'],
  ['Tuesday', 'Mathematics and problem practice'],
  ['Wednesday', 'Science and accountancy focused sessions'],
  ['Thursday', 'Language and writing practice'],
  ['Friday', 'Weekly revision and doubt clearing'],
  ['Saturday', 'Tests, parent updates, and special coaching'],
];

export default function TimetablePage() {
  return (
    <div>
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <span>/</span>
            <span className="font-medium text-white">Timetable</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Class Timetable</h1>
          <p className="mt-3 text-lg text-indigo-100">Regular batches, revision slots, and weekly learning rhythm.</p>
        </div>
      </section>

      <section className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BATCHES.map((batch) => {
              const Icon = batch.icon;
              return (
                <article key={batch.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-900">{batch.name}</h2>
                  <p className="mt-1 text-sm font-medium text-indigo-700">{batch.time}</p>
                  <p className="mt-2 text-sm text-slate-500">{batch.classes}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Weekly Plan</h2>
              <p className="mt-1 text-sm text-slate-500">Exact subject slots are confirmed by class teacher each week.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {WEEKLY_PLAN.map(([day, plan]) => (
                <div key={day} className="grid gap-2 px-5 py-4 sm:grid-cols-[160px_1fr]">
                  <div className="text-sm font-semibold text-slate-900">{day}</div>
                  <div className="text-sm text-slate-600">{plan}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
