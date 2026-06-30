export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let _redirecting = false;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    credentials: 'include'
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !_redirecting) {
      _redirecting = true;
      setTimeout(() => { _redirecting = false; }, 3000);
      window.location.href = '/login';
      return undefined as T;
    }

    let data: unknown = undefined;
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError((data as any)?.detail ?? 'Request failed', res.status, data);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
