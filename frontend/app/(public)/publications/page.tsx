import Link from 'next/link';
import { BookOpen, Download, FileText, Newspaper } from 'lucide-react';

const PUBLICATIONS = [
  { title: 'Academy Magazine', description: 'Annual student articles, achievements, event reports, and creative work.', status: 'Coming soon', icon: Newspaper },
  { title: 'Study Notes', description: 'Class-wise revision notes and important question collections.', status: 'Teacher issued', icon: BookOpen },
  { title: 'Circulars', description: 'Important parent notices, schedules, and announcement documents.', status: 'Updated regularly', icon: FileText },
];

const DOWNLOADS = [
  'Admission checklist',
  'Parent communication guidelines',
  'Exam preparation checklist',
  'Holiday assignment tracker',
];

export default function PublicationsPage() {
  return (
    <div>
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <span>/</span>
            <span className="font-medium text-white">Publications</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Publications</h1>
          <p className="mt-3 text-lg text-indigo-100">Magazines, circulars, study materials, and parent resources.</p>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {PUBLICATIONS.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  <div className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-slate-200">
                    {item.status}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Download Center</h2>
            <p className="mt-1 text-sm text-slate-500">Downloadable files will appear here when published by the academy office.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {DOWNLOADS.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                  <Download className="h-4 w-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
