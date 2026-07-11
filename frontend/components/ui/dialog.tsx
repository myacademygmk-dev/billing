'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';

import { cn } from '@/components/ui/cn';

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      // Store the element that triggered the dialog for focus restoration
      triggerRef.current = document.activeElement;

      // Auto-focus first focusable element after mount
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const focusable = containerRef.current.querySelector<HTMLElement>(
          'input:not([type=hidden]), select, textarea, button:not([disabled])'
        );
        if (focusable) focusable.focus();
        else containerRef.current.focus();
      });
    } else {
      // Restore focus to trigger element
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
      // Focus trap
      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 animate-fade-in"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="absolute inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center py-6">{children}</div>
      </div>
    </div>
  );
}

export function DialogContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('glass-panel relative my-auto w-full max-w-md animate-fade-in-scale rounded-2xl', className)}>
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('border-b border-[var(--panel-line)] px-5 py-3', className)}>{children}</div>;
}

export function DialogTitle({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  const generatedId = useId();
  return (
    <h2 id={id || generatedId} className={cn('theme-heading text-base font-semibold', className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('mt-0.5 text-sm text-[var(--muted)]', className)}>{children}</p>;
}

export function DialogBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 py-3.5', className)}>{children}</div>;
}

export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex justify-end gap-2.5 border-t border-[var(--panel-line)] px-5 py-3', className)}>
      {children}
    </div>
  );
}

export function DialogClose({
  onOpenChange,
  className,
}: {
  onOpenChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className={cn(
        'absolute right-4 top-4 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]',
        className
      )}
      aria-label="Close dialog"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
