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
let _refreshing: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    return res.ok;
  } catch {
    return false;
  }
}

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
      // Try to refresh the token before giving up
      if (!_refreshing) {
        _refreshing = attemptRefresh().finally(() => { _refreshing = null; });
      }
      const refreshed = await _refreshing;
      if (refreshed) {
        // Retry the original request after successful refresh
        const retryRes = await fetch(`/api/backend${path}`, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {})
          },
          credentials: 'include'
        });
        if (retryRes.ok) {
          if (retryRes.status === 204) return undefined as T;
          return (await retryRes.json()) as T;
        }
      }

      // Refresh failed — redirect to login
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
