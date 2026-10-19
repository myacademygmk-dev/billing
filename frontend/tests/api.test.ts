import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch } from '@/lib/api';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the backend proxy with JSON credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));

    await expect(apiFetch('/students')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/backend/students', expect.objectContaining({
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('returns undefined for no-content responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch('/students/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('raises ApiError with backend detail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ detail: 'Denied' }, { status: 403 }));

    await expect(apiFetch('/students')).rejects.toMatchObject({
      status: 403,
      message: 'Denied',
    });
  });

  it('refreshes and retries once after an unauthorized response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ items: [] }));

    await expect(apiFetch('/reports/pending')).resolves.toEqual({ items: [] });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/refresh', expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/backend/reports/pending', expect.any(Object));
  });
});
