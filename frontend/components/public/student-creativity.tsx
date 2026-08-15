'use client';

import { useEffect, useState } from 'react';

interface CreativityItem {
  id: number;
  title?: string;
  image_url: string;
  student_name?: string;
}

export function StudentCreativity() {
  const [items, setItems] = useState<CreativityItem[] | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/backend/public/student-creativity');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setItems(data);
          } else {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    };
    fetchItems();
  }, []);

  // Don't render section if no items
  if (items !== null && items.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-14 bg-[#f5f3ff]">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center reveal">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Creativity</div>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Student Creativity</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">Celebrating the artistic talents and creative works of our students.</p>
        </div>

        {items === null ? (
          /* Loading state */
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 reveal reveal-delay-${(i % 4) + 1}`}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title || `Student artwork ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                {(item.title || item.student_name) && (
                  <div className="p-3">
                    {item.title && <h3 className="text-sm font-semibold text-slate-900 truncate">{item.title}</h3>}
                    {item.student_name && <p className="text-xs text-slate-500 mt-0.5">{item.student_name}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
