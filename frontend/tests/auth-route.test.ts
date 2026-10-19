import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/auth/login/route';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('login route handler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets http-only auth cookies after a successful backend login', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ access_token: 'access-token', refresh_token: 'refresh-token' })
    );
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });

    const res = await POST(req);

    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('access_token=access-token');
    expect(setCookie).toContain('HttpOnly');
  });

  it('passes backend login errors through without setting cookies', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ detail: 'Invalid credentials' }, { status: 401 })
    );
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'bad', password: 'bad' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ detail: 'Invalid credentials' });
    expect(res.headers.get('set-cookie')).toBeNull();
  });
});
