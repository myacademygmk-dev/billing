'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlowOrb } from '@/components/ui/glow-orb';

interface CreativityItem {
  id: number;
  title: string;
  student_name: string;
  class_name: string;
  type: 'image' | 'pdf';
  file_url: string;
  created_at: string;
}

export default function StudentCreativityPage() {
  const [items, setItems] = useState<CreativityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/backend/public/student-creativity');
        if (res.ok) {
          setItems(await res.json());
        }
      } catch {
        // API not ready yet
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/student-corner" className="hover:text-white transition-colors">Student Corner</Link>
            <span>/</span>
            <span className="text-white font-medium">Student Creativity</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Student Creativity</h1>
          <p className="mt-3 text-lg text-indigo-100">Showcasing the artistic talents of our students</p>
        </div>
      </section>

      {/* Content */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-14">
        <GlowOrb color="bg-violet-200/40" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-indigo-200/30" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-sm border border-slate-200">
                  <div className="h-48 rounded-lg bg-slate-200" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-slate-200">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-lg bg-indigo-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.764m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-900">No creative works to display yet</p>
              <p className="mt-2 text-sm text-slate-500">Student artwork, essays, and projects will be showcased here soon.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="group overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {item.type === 'image' ? (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.student_name} • {item.class_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
