'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SetupPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const invitationToken = params.get('token') ?? '';
    setToken(invitationToken);
    if (invitationToken) {
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This invitation link is missing or invalid. Ask an administrator for a new invitation.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Something went wrong');
      } else {
        setMessage(data.message || 'Password set! You can now log in.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-gradient)] p-4">
      <Card className="min-w-0 w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Your Password</CardTitle>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Choose a password to activate the account from your invitation.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {!token && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                Open the complete invitation link provided by your administrator.
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">Confirm Password</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}{' '}
                <a href="/login" className="font-medium underline">Go to Login</a>
              </div>
            )}

            <Button type="submit" disabled={!token || loading || !!message}>
              {loading ? 'Setting password...' : 'Set Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
