import { NextResponse } from 'next/server';

export async function POST() {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  const response = NextResponse.json({ ok: true });
  response.cookies.set('access_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
    maxAge: 0,
  });
  return response;
}
