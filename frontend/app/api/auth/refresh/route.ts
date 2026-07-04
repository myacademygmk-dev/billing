import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { env } from '@/lib/env';

export async function POST() {
  const refreshToken = cookies().get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ detail: 'No refresh token' }, { status: 401 });
  }

  const res = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Clear cookies on refresh failure — user must re-login
    const response = NextResponse.json(data, { status: res.status });
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('access_token', data.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: 60 * 60 * 2,
  });
  response.cookies.set('refresh_token', data.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
