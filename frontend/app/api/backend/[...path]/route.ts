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

async function handler(req: NextRequest, ctx: { params: { path: string[] } }) {
  const token = cookies().get('access_token')?.value;
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });

  const path = ctx.params.path.join('/');
  const url = new URL(req.url);
  const target = `${backendBaseUrl()}/${path}${url.search}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = req.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  const reqBody = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: reqBody
  });

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
