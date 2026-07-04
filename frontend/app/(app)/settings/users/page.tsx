'use client';

import { useState } from 'react';
import { Shield, Trash2, UserPlus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type UserItem = {
  id: string;
  username: string;
  email: string | null;
  role: 'admin' | 'staff';
  has_password: boolean;
  permissions: string[];
};

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  collect: 'Collect Fees',
  savings: 'Savings',
  expenses: 'Expenses',
  transactions: 'Transactions',
  reports: 'Reports',
  settings: 'Settings',
};

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRegister, setShowRegister] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [form, setForm] = useState({ username: '', email: '', role: 'staff' as 'admin' | 'staff' });

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch('/auth/users'),
  });

  const registerMutation = useMutation({
    mutationFn: (data: typeof form) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowRegister(false);
      setForm({ username: '', email: '', role: 'staff' });
      toast({ title: 'User created. They can set their password at /setup-password' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/auth/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const permissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      apiFetch(`/auth/users/${userId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowPermissions(false);
      setSelectedUser(null);
      toast({ title: 'Permissions updated' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  function openPermissions(user: UserItem) {
    setSelectedUser(user);
    setEditPermissions([...user.permissions]);
    setShowPermissions(true);
  }

  function togglePermission(key: string) {
    setEditPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function selectAll() {
    setEditPermissions(Object.keys(PERMISSION_LABELS));
  }

  function deselectAll() {
    setEditPermissions([]);
  }

  return (
    <AppShell title="User Management" subtitle="Add staff accounts and control what each user can access">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <Button onClick={() => setShowRegister(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-[var(--muted)]">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--panel-line)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Access</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--panel-line)]">
                      <td className="px-4 py-3 font-medium">{user.username}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{user.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'admin' ? (
                          <span className="text-xs text-[var(--muted)]">Full access</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.length === 0 ? (
                              <span className="text-xs text-rose-400">No access</span>
                            ) : user.permissions.length === Object.keys(PERMISSION_LABELS).length ? (
                              <span className="text-xs text-green-400">All pages</span>
                            ) : (
                              user.permissions.slice(0, 3).map((p) => (
                                <span key={p} className="inline-block rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                                  {PERMISSION_LABELS[p] ?? p}
                                </span>
                              ))
                            )}
                            {user.permissions.length > 3 && (
                              <span className="text-[10px] text-[var(--muted)]">+{user.permissions.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.has_password ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {user.has_password ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {user.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPermissions(user)}
                              aria-label={`Edit permissions for ${user.username}`}
                            >
                              <Shield className="mr-1 h-3.5 w-3.5" />
                              Access
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Delete user "${user.username}"?`)) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            aria-label={`Delete ${user.username}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="mb-4 text-sm text-[var(--muted)]">
              The user will set their own password at <strong>/setup-password</strong> using their email.
            </p>
            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Username</label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Role</label>
                <select
                  className="theme-select w-full rounded-xl px-4 py-2.5 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}
                  aria-label="User role"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
            <Button
              onClick={() => registerMutation.mutate(form)}
              disabled={!form.username || !form.email || registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[var(--accent)]" />
                Access Control — {selectedUser?.username}
              </div>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Select which pages this staff member can access. They will only see the pages you enable here.
            </p>
            <div className="mb-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    editPermissions.includes(key)
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--field-border)] bg-[var(--field-bg)] hover:border-[var(--panel-line)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={editPermissions.includes(key)}
                    onChange={() => togglePermission(key)}
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <span className="text-sm font-medium text-[var(--text)]">{label}</span>
                </label>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissions(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  permissionsMutation.mutate({ userId: selectedUser.id, permissions: editPermissions });
                }
              }}
              disabled={permissionsMutation.isPending}
            >
              {permissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
