'use client';

import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api';
import { debounce } from '@/lib/debounce';

type StudentListItem = {
  id: string;
  student_code: string;
  name: string;
  pending: string;
  status: 'active' | 'inactive';
};

export function StudentQuickSearch() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const setDebouncedFn = useMemo(() => debounce((v: string) => setDebounced(v), 250), []);
  useEffect(() => setDebouncedFn(search), [search, setDebouncedFn]);

  const q = useQuery({
    queryKey: ['quickSearch', debounced],
    enabled: debounced.trim().length >= 2,
    queryFn: () =>
      apiFetch<{ items: StudentListItem[]; total: number }>(
        `/students/balances?search=${encodeURIComponent(debounced)}&status=active&page=1&page_size=8`
      ),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or roll number..."
          prefix={<Search size={16} />}
          suffix={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded p-0.5 text-[var(--muted)] hover:text-[var(--text)]"
                aria-label="Clear search"
              >
                ×
              </button>
            ) : undefined
          }
        />

        {debounced.trim().length >= 2 && (
          <div className="space-y-1" role="listbox" aria-label="Search results">
            {q.isLoading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-[var(--muted)]">
                <Spinner size="sm" /> Searching...
              </div>
            ) : !q.data?.items.length ? (
              <div className="py-3 text-center text-sm text-[var(--muted)]">No results found</div>
            ) : (
              <>
                {q.data.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/students/${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--surface-subtle)]"
                    role="option"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--heading)]">{item.name}</div>
                      <div className="text-xs text-[var(--muted)]">{item.student_code}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {parseFloat(item.pending) > 0 && (
                        <span className="whitespace-nowrap text-xs font-medium text-[var(--chip-warn-text)]">
                          ₹{parseFloat(item.pending).toLocaleString('en-IN')}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-[var(--muted)]" />
                    </div>
                  </Link>
                ))}
                {q.data.total > 8 && (
                  <Link
                    href={`/students?search=${encodeURIComponent(debounced)}`}
                    className="block py-2 text-center text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    View all {q.data.total} results →
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
