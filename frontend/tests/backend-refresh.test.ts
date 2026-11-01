import { afterEach, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/backend/[...path]/route';
const jar = vi.hoisted(() => new Map<string, { value: string }>());
vi.mock('next/headers', () => ({ cookies: () => ({ get: (name: string) => jar.get(name) }) }));
afterEach(() => { jar.clear(); vi.restoreAllMocks(); });
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

it('replays the same POST bytes after refreshing an expired access token', async () => {
  jar.set('access_token', { value: 'expired' }); jar.set('refresh_token', { value: 'refresh' });
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({ access_token: 'new-access', refresh_token: 'new-refresh' })).mockResolvedValueOnce(response({ saved: true }, 201));
  const body = JSON.stringify({ exam_id: 'exam', marks: [{ marks_obtained: 0 }] });
  const result = await POST(new Request('http://localhost/api/backend/exams/marks/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }) as never, { params: { path: ['exams', 'marks', 'bulk'] } });
  expect(result.status).toBe(201);
  expect(new TextDecoder().decode(fetchMock.mock.calls[0][1]?.body as ArrayBuffer)).toBe(body);
  expect(new TextDecoder().decode(fetchMock.mock.calls[2][1]?.body as ArrayBuffer)).toBe(body);
  expect((fetchMock.mock.calls[2][1]?.headers as Headers).get('Authorization')).toBe('Bearer new-access');
  expect(result.headers.get('set-cookie')).toContain('access_token=new-access');
});

it('refreshes when the browser access cookie has already expired', async () => {
  jar.set('refresh_token', { value: 'refresh' });
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response({ access_token: 'new-access', refresh_token: 'new-refresh' })).mockResolvedValueOnce(response({ saved: true }));
  const result = await POST(new Request('http://localhost/api/backend/exams', { method: 'POST', body: '{}' }) as never, { params: { path: ['exams'] } });
  expect(result.status).toBe(200);
  expect(fetchMock.mock.calls[0][0]).toContain('/auth/refresh');
});
