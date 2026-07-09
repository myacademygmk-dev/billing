'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/components/ui/cn';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastCtx = {
  toast: (t: Omit<Toast, 'id'>) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within Toaster');
  return ctx;
}

const MAX_TOASTS = 4;
const DISMISS_MS = 4000;

export function Toaster({ children }: { children?: ReactNode }) {
  const [items, setItems] = useState<(Toast & { exiting?: boolean })[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 200);
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      setItems((prev) => {
        const next = [...prev, { ...t, id }];
        return next.slice(-MAX_TOASTS);
      });
      setTimeout(() => dismiss(id), DISMISS_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  const variantStyles: Record<ToastVariant, string> = {
    default: 'border-l-[var(--accent)]',
    success: 'border-l-[var(--success)]',
    error: 'border-l-[var(--danger)]',
    warning: 'border-l-[var(--warn)]',
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-50 flex flex-col gap-2.5"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'glass-panel flex w-80 items-start gap-3 rounded-xl border-l-4 px-4 py-3',
              variantStyles[t.variant || 'default'],
              t.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
            )}
            role="alert"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--heading)]">{t.title}</div>
              {t.description && (
                <div className="mt-0.5 text-sm text-[var(--muted)] line-clamp-2">{t.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-0.5 shrink-0 rounded-md p-0.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
