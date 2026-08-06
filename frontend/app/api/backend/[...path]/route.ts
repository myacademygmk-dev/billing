import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function backendBaseUrl() {
  return (
    process.env.BACKEND_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:8000/api'
  ).replace(/\/+$/, '');
}

async function forwardRequest(req: NextRequest, token: string, path: string) {
  const url = new URL(req.url);
  const target = `${backendBaseUrl()}/${path}${url.search}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = req.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  const reqBody = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();

  return fetch(target, {
    method: req.method,
    headers,
    body: reqBody
  });
}

async function tryRefreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const res = await fetch(`${backendBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function handler(req: NextRequest, ctx: { params: { path: string[] } }) {
  const path = ctx.params.path.join('/');

  // Allow public access to uploaded files and public API (no auth required)
  if (path.startsWith('uploads/files/') || path.startsWith('public/')) {
    const target = `${backendBaseUrl()}/${path}`;
    const res = await fetch(target);
    return buildResponse(res);
  }

  const token = cookies().get('access_token')?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  let res = await forwardRequest(req, token, path);

  // If access token expired, attempt silent refresh
  if (res.status === 401) {
    const refreshToken = cookies().get('refresh_token')?.value;
    if (refreshToken) {
      const newTokens = await tryRefreshToken(refreshToken);
      if (newTokens) {
        // Retry the original request with the new access token
        res = await forwardRequest(req, newTokens.access_token, path);

        // Build response and set new cookies
        const out = await buildResponse(res);
        out.cookies.set('access_token', newTokens.access_token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.COOKIE_SECURE === 'true',
          path: '/',
          maxAge: 60 * 60 * 2,
        });
        out.cookies.set('refresh_token', newTokens.refresh_token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.COOKIE_SECURE === 'true',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
        return out;
      }
    }
  }

  return buildResponse(res);
}

async function buildResponse(res: Response): Promise<NextResponse> {
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const contentTypeRes = res.headers.get('content-type') ?? '';
  const isJson = contentTypeRes.includes('application/json');
  const resBody = isJson ? await res.text() : await res.arrayBuffer();

  const out = new NextResponse(resBody as BodyInit, { status: res.status });
  res.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'transfer-encoding') return;
    out.headers.set(k, v);
  });
  return out;
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
