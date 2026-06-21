import { NextResponse } from 'next/server';

import { env } from '@/lib/env';

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${env.apiBaseUrl}/auth/setup-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
