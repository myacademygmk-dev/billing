'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CreditCard, Receipt, ShieldCheck, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toaster';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const login = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? 'Login failed');
      }
      return res.json();
    },
    onSuccess: () => {
      const next = params.get('next') || '/dashboard';
      window.location.href = next;
    },
    onError: (e) => toast({ title: 'Login failed', description: String(e), variant: 'error' }),
  });

  return (
    <div className="flex min-h-screen">
      {/* Left panel — dark branded section */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-[#1e2d42] to-[#0f1a2a] p-10 flex-col justify-between relative overflow-hidden">
        {/* Background dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(143,179,255,0.7) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        {/* Glowing orbs */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-[rgba(37,99,235,0.08)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-[rgba(143,179,255,0.06)] blur-[80px]" />
        {/* Floating geometric shapes */}
        <div className="absolute top-16 right-16 opacity-[0.08]">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <rect x="10" y="10" width="80" height="80" rx="10" stroke="white" strokeWidth="1" />
            <rect x="25" y="25" width="50" height="50" rx="6" stroke="white" strokeWidth="0.8" />
          </svg>
        </div>
        <div className="absolute bottom-28 right-12 opacity-[0.06]">
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <circle cx="35" cy="35" r="30" stroke="white" strokeWidth="1" />
            <circle cx="35" cy="35" r="16" stroke="white" strokeWidth="0.8" strokeDasharray="3 3" />
          </svg>
        </div>
        <div className="absolute top-1/2 left-6 opacity-[0.05]">
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <polygon points="25,3 47,42 3,42" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        {/* Top content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(143,179,255,0.2)] bg-[rgba(143,179,255,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8fb3ff]">
            <ShieldCheck className="h-3 w-3" />
            Secure Portal
          </div>
          <h1 className="mt-5 text-4xl font-bold text-white tracking-[-0.03em]">MY ACADEMY</h1>
          <p className="mt-1.5 text-sm font-medium text-[#8fb3ff]">Fee Management System</p>
          <p className="mt-4 max-w-sm text-[13px] text-[#94a3bd] leading-relaxed">
            Complete fee payment tracking, receipt management, and financial reporting for educational institutions.
          </p>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(143,179,255,0.15)] bg-[rgba(143,179,255,0.06)] px-3 py-1.5 text-[11px] text-[#94a3bd]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" fill="#8fb3ff"/></svg>
              Trusted by Institutions
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(143,179,255,0.15)] bg-[rgba(143,179,255,0.06)] px-3 py-1.5 text-[11px] text-[#94a3bd]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="#8fb3ff" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Auto Receipt Generation
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(143,179,255,0.15)] bg-[rgba(143,179,255,0.06)] px-3 py-1.5 text-[11px] text-[#94a3bd]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="#8fb3ff" strokeWidth="1.2"/><path d="M3.5 6L5.5 8L8.5 4" stroke="#8fb3ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Multi-user Access Control
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5">
          <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(143,179,255,0.12)] bg-[rgba(255,255,255,0.04)] p-3 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(143,179,255,0.12)]">
              <Users className="h-4 w-4 text-[#8fb3ff]" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Students</div>
              <div className="mt-0.5 text-[11px] text-[#94a3bd]">Track & manage records</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(143,179,255,0.12)] bg-[rgba(255,255,255,0.04)] p-3 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(143,179,255,0.12)]">
              <CreditCard className="h-4 w-4 text-[#8fb3ff]" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Fee Payments</div>
              <div className="mt-0.5 text-[11px] text-[#94a3bd]">Cycle-aware billing</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(143,179,255,0.12)] bg-[rgba(255,255,255,0.04)] p-3 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(143,179,255,0.12)]">
              <Receipt className="h-4 w-4 text-[#8fb3ff]" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Receipts</div>
              <div className="mt-0.5 text-[11px] text-[#94a3bd]">Print & download</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(143,179,255,0.12)] bg-[rgba(255,255,255,0.04)] p-3 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(143,179,255,0.12)]">
              <BookOpen className="h-4 w-4 text-[#8fb3ff]" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Reports</div>
              <div className="mt-0.5 text-[11px] text-[#94a3bd]">Analytics & exports</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="text-[11px] text-[#64748b]">© 2026 MY Academy</div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 bg-white relative overflow-hidden">
        {/* SVG illustration — top left (documents/receipts) */}
        <div className="absolute top-6 left-6 opacity-[0.22]">
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
            <rect x="20" y="10" width="80" height="105" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <rect x="30" y="5" width="80" height="105" rx="4" stroke="currentColor" strokeWidth="1.5" fill="white" />
            <path d="M45 30 L95 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M45 42 L85 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M45 54 L90 54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M45 66 L75 66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M45 82 L60 82" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M70 82 L95 82" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="130" cy="35" r="18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M122 35 L128 41 L139 29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="135" cy="100" r="12" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="135" cy="100" r="6" stroke="currentColor" strokeWidth="1" />
            <circle cx="125" cy="115" r="10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* SVG illustration — top right (calendar/schedule) */}
        <div className="absolute top-8 right-8 opacity-[0.2]">
          <svg width="130" height="120" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
            <rect x="10" y="15" width="100" height="85" rx="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 35 L110 35" stroke="currentColor" strokeWidth="1.5" />
            <path d="M30 5 L30 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 5 L60 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M90 5 L90 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="22" y="45" width="14" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="42" y="45" width="14" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="62" y="45" width="14" height="12" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="82" y="45" width="14" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="22" y="65" width="14" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="42" y="65" width="14" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="62" y="65" width="14" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="82" y="65" width="14" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="22" y="85" width="14" height="12" rx="2" fill="currentColor" opacity="0.2" />
            <rect x="42" y="85" width="14" height="12" rx="2" fill="currentColor" opacity="0.2" />
          </svg>
        </div>

        {/* SVG illustration — middle left (rupee/payment) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-6 opacity-[0.18]">
          <svg width="70" height="80" viewBox="0 0 70 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
            <circle cx="35" cy="40" r="30" stroke="currentColor" strokeWidth="1.5" />
            <path d="M24 28 L46 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 36 L46 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M30 28 C30 28 38 28 38 36 C38 44 30 44 28 44" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M26 52 L38 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* SVG illustration — middle right (pie chart) */}
        <div className="absolute top-1/3 right-6 opacity-[0.15]">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
            <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="1.5" />
            <path d="M40 10 L40 40 L65 55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M40 40 L15 55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="40" cy="40" r="12" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
          </svg>
        </div>

        {/* SVG illustration — bottom left (students/people) */}
        <div className="absolute bottom-8 left-8 opacity-[0.2]">
          <svg width="150" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
            <circle cx="40" cy="30" r="14" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 70 C20 52 60 52 60 70" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="75" cy="30" r="14" stroke="currentColor" strokeWidth="1.5" />
            <path d="M55 70 C55 52 95 52 95 70" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="110" cy="30" r="14" stroke="currentColor" strokeWidth="1.5" />
            <path d="M90 70 C90 52 130 52 130 70" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 85 L130 85" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
            <path d="M10 95 L90 95" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
          </svg>
        </div>

        {/* SVG illustration — bottom center (books/education) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-[0.1]">
          <svg width="100" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
            <rect x="10" y="15" width="25" height="35" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="38" y="10" width="25" height="40" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="66" y="18" width="25" height="32" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 52 L95 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* SVG illustration — bottom right (dashboard) */}
        <div className="absolute bottom-6 right-6 opacity-[0.18]">
          <svg width="280" height="220" viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Monitor/Dashboard */}
            <rect x="40" y="20" width="200" height="130" rx="8" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]" />
            <rect x="55" y="40" width="70" height="25" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]" />
            <rect x="55" y="75" width="70" height="25" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]" />
            <rect x="55" y="110" width="70" height="25" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]" />
            {/* Chart bars */}
            <rect x="145" y="100" width="12" height="35" rx="2" fill="currentColor" className="text-[var(--accent)]" />
            <rect x="163" y="80" width="12" height="55" rx="2" fill="currentColor" className="text-[var(--accent)]" />
            <rect x="181" y="90" width="12" height="45" rx="2" fill="currentColor" className="text-[var(--accent)]" />
            <rect x="199" y="70" width="12" height="65" rx="2" fill="currentColor" className="text-[var(--accent)]" />
            <rect x="217" y="85" width="12" height="50" rx="2" fill="currentColor" className="text-[var(--accent)]" />
            {/* Stand */}
            <rect x="120" y="150" width="40" height="6" rx="1" fill="currentColor" className="text-[var(--accent)]" />
            <rect x="135" y="156" width="10" height="20" fill="currentColor" className="text-[var(--accent)]" />
            <rect x="110" y="176" width="60" height="5" rx="2" fill="currentColor" className="text-[var(--accent)]" />
            {/* Person */}
            <circle cx="30" cy="170" r="12" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]" />
            <path d="M15 210 C15 195 45 195 45 210" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]" />
          </svg>
        </div>

        <div className="w-full max-w-[340px] relative z-10">
          {/* Mobile branding */}
          <div className="mb-6 lg:hidden text-center">
            <h1 className="text-xl font-bold text-[var(--heading)]">MY ACADEMY</h1>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Fee Management System</p>
          </div>

          {/* Form header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--heading)]">Welcome back</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">Sign in to your account</p>
          </div>

          {/* Form */}
          <form className="space-y-3.5" onSubmit={form.handleSubmit((v) => login.mutate(v))}>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[var(--heading)]">Username</label>
              <Input
                {...form.register('username')}
                placeholder="Enter username"
                error={form.formState.errors.username?.message}
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[var(--heading)]">Password</label>
              <Input
                type="password"
                {...form.register('password')}
                placeholder="Enter password"
                error={form.formState.errors.password?.message}
              />
            </div>
            <Button className="w-full mt-1" type="submit" disabled={login.isPending} loading={login.isPending}>
              Sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-5 flex items-center justify-between text-[11px]">
            <a href="/setup-password" className="text-[var(--accent)] hover:underline">
              Set up password
            </a>
            <span className="text-[var(--muted)]">Need help? Contact admin</span>
          </div>

          {/* Security note */}
          <div className="mt-4 border-t border-[var(--panel-line)] pt-3">
            <p className="text-[11px] text-[var(--muted)] text-center">
              Protected by end-to-end encryption. Only authorized personnel can access this system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
