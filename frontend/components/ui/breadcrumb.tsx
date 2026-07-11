'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-1">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, i) => (
          <Fragment key={i}>
            {i > 0 && <ChevronRight size={14} className="text-[var(--muted)] opacity-60" />}
            <li>
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[var(--text-secondary)] font-medium">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
