import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/backend/[...path]/route';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('public backend proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('forwards public POST requests with method, body, query, and content type', async () => {
    vi.stubEnv('BACKEND_API_BASE_URL', 'http://backend.test/api');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));
    const body = JSON.stringify({ name: 'Parent', message: 'Good' });
    const req = new Request('http://localhost/api/backend/public/feedback?source=web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    });

    const res = await POST(req as never, { params: { path: ['public', 'feedback'] } });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend.test/api/public/feedback?source=web',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(ArrayBuffer),
      })
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(body);
  });
});
