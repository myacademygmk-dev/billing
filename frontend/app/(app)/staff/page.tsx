'use client';

import { useState } from 'react';
import { CheckCircle2, Plus, Shield, Trash2, UserPlus, Users, UserCog, CalendarCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────

type StaffMember = {
  id: string;
  staff_code: string;
  name: string;
  role: string;
  status: string;
  phone?: string | null;
  email?: string | null;
  qualification?: string | null;
  subjects?: string | null;
  monthly_salary?: string | null;
  joining_date?: string | null;
};

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
  collect: 'Payments',
  savings: 'Savings',
  staff: 'Staff',
  academic: 'Academics',
  exams: 'Exams & Marks',
  cms: 'Website CMS',
  fees: 'Fee Structure',
  attendance: 'Attendance',
  reports: 'Reports & Analytics',
  transactions: 'Transactions',
  expenses: 'Expenses',
  settings: 'Settings',
};

// ─── Main Component ──────────────────────────────────────

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'users' | 'attendance'>('staff');

  return (
    <AppShell title="Staff" subtitle="Manage staff records, user accounts, and attendance.">
      {/* Tab Navigation */}
      <div className="mb-6 inline-flex gap-0.5 rounded-full border border-[var(--field-border)] bg-[var(--surface-subtle)] p-0.5">
        <button
          onClick={() => setActiveTab('staff')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
            activeTab === 'staff'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--heading)]'
          }`}
        >
          <UserCog className="h-3.5 w-3.5" />
          Staff
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
            activeTab === 'attendance'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--heading)]'
          }`}
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
            activeTab === 'users'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--heading)]'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          User Accounts
        </button>
      </div>

      {activeTab === 'staff' && <StaffTab />}
      {activeTab === 'attendance' && <StaffAttendanceTab />}
      {activeTab === 'users' && <UsersTab />}
    </AppShell>
  );
}

// ─── Staff Tab ───────────────────────────────────────────

function StaffTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({
    staff_code: '',
    name: '',
    role: 'teacher',
    phone: '',
    email: '',
    qualification: '',
    monthly_salary: '',
  });

  const { data, isLoading } = useQuery<{ items: StaffMember[]; total: number }>({
    queryKey: ['staff'],
    queryFn: () => apiFetch('/staff'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/staff', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      setShowAdd(false);
      setForm({ staff_code: '', name: '', role: 'teacher', phone: '', email: '', qualification: '', monthly_salary: '' });
      toast({ title: 'Staff member added', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/staff/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Staff member removed', variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast({ title: 'Delete failed', description: String(e), variant: 'error' });
      setDeleteTarget(null);
    },
  });

  return (
    <>
      <Card square>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Staff Members ({data?.total ?? 0})</CardTitle>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {isLoading ? (
            <SkeletonTable rows={4} cols={5} />
          ) : !data?.items.length ? (
            <EmptyState
              icon={<EmptyStateIcon type="staff" />}
              title="No staff members yet"
              description="Add your teaching and non-teaching staff to manage them here."
              action={
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Staff
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Code</TH>
                    <TH>Name</TH>
                    <TH>Role</TH>
                    <TH>Phone</TH>
                    <TH>Qualification</TH>
                    <TH>Salary</TH>
                    <TH className="text-right">Action</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.items.map((s) => (
                    <TR key={s.id}>
                      <TD className="font-mono text-xs">{s.staff_code}</TD>
                      <TD className="font-medium text-[var(--heading)]">{s.name}</TD>
                      <TD>
                        <Badge variant="default">{s.role.replace('_', ' ')}</Badge>
                      </TD>
                      <TD className="text-[var(--muted)]">{s.phone ?? '-'}</TD>
                      <TD className="text-[var(--muted)]">{s.qualification ?? '-'}</TD>
                      <TD>{s.monthly_salary ? `₹${parseFloat(s.monthly_salary).toLocaleString('en-IN')}` : '-'}</TD>
                      <TD className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                          onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Staff Code *</label>
                <Input placeholder="e.g. STF001" value={form.staff_code} onChange={(e) => setForm({ ...form, staff_code: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Full Name *</label>
                <Input placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Role</label>
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="teacher">Teacher</option>
                  <option value="admin_staff">Admin Staff</option>
                  <option value="non_teaching">Non-Teaching</option>
                  <option value="part_time">Part Time</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Phone</label>
                  <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Email</label>
                  <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Qualification</label>
                  <Input placeholder="e.g. M.Sc, B.Ed" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Monthly Salary</label>
                  <Input type="number" placeholder="e.g. 25000" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} prefix={<span className="text-sm">₹</span>} />
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ ...form, monthly_salary: form.monthly_salary ? Number(form.monthly_salary) : undefined })}
              disabled={!form.staff_code || !form.name}
              loading={createMutation.isPending}
            >
              Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This staff member will be permanently removed."
        variant="danger"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}

// ─── Users Tab ───────────────────────────────────────────

function UsersTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showRegister, setShowRegister] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; username: string } | null>(null);
  const [form, setForm] = useState({ username: '', email: '', role: 'staff' as 'admin' | 'staff' });

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch('/auth/users'),
  });

  const registerMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowRegister(false);
      setForm({ username: '', email: '', role: 'staff' });
      toast({ title: 'User created', description: 'They can set their password at /setup-password', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/auth/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted', variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast({ title: 'Failed', description: String(e.message || e), variant: 'error' });
      setDeleteTarget(null);
    },
  });

  const permissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      apiFetch(`/auth/users/${userId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowPermissions(false);
      setSelectedUser(null);
      toast({ title: 'Permissions updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e), variant: 'error' }),
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

  return (
    <>
      <Card square>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Accounts ({users.length})</CardTitle>
            <Button onClick={() => setShowRegister(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {isLoading ? (
            <SkeletonTable rows={3} cols={5} />
          ) : !users.length ? (
            <EmptyState
              icon={<EmptyStateIcon type="staff" />}
              title="No user accounts"
              description="Add user accounts to allow staff to log in."
              action={
                <Button onClick={() => setShowRegister(true)}>
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Add User
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Username</TH>
                    <TH>Email</TH>
                    <TH>Role</TH>
                    <TH>Access</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {users.map((user) => (
                    <TR key={user.id}>
                      <TD className="font-medium text-[var(--heading)]">{user.username}</TD>
                      <TD className="text-[var(--muted)]">{user.email || '—'}</TD>
                      <TD>
                        <Badge variant={user.role === 'admin' ? 'accent' : 'default'}>
                          {user.role}
                        </Badge>
                      </TD>
                      <TD>
                        {user.role === 'admin' ? (
                          <span className="text-xs text-[var(--muted)]">Full access</span>
                        ) : user.permissions.length === 0 ? (
                          <span className="text-xs text-[var(--danger)]">No access</span>
                        ) : user.permissions.length === Object.keys(PERMISSION_LABELS).length ? (
                          <Badge variant="success">All pages</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 3).map((p) => (
                              <Badge key={p} variant="accent">{PERMISSION_LABELS[p] ?? p}</Badge>
                            ))}
                            {user.permissions.length > 3 && (
                              <span className="text-xs text-[var(--muted)]">+{user.permissions.length - 3}</span>
                            )}
                          </div>
                        )}
                      </TD>
                      <TD>
                        <Badge variant={user.has_password ? 'success' : 'warning'}>
                          {user.has_password ? 'Active' : 'Pending'}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPermissions(user)}
                              aria-label={`Edit permissions for ${user.username}`}
                            >
                              <Shield className="mr-1 h-3.5 w-3.5" />
                              Access
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                            onClick={() => setDeleteTarget({ id: user.id, username: user.username })}
                            aria-label={`Delete ${user.username}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register User Dialog */}
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
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Username *</label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Role</label>
                <Select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
            <Button
              onClick={() => registerMutation.mutate(form)}
              disabled={!form.username || !form.email}
              loading={registerMutation.isPending}
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-lg">
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
              Select which pages this user can access.
            </p>
            <div className="mb-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditPermissions(Object.keys(PERMISSION_LABELS))}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditPermissions([])}>
                Deselect All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
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
              loading={permissionsMutation.isPending}
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete user "${deleteTarget?.username}"?`}
        description="This user will lose all access. This action cannot be undone."
        variant="danger"
        confirmLabel="Delete User"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}

// ─── Staff Attendance Tab ────────────────────────────────

type StaffAttendanceItem = {
  staff_id: string;
  staff_code: string;
  staff_name: string;
  role: string;
  date: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-[var(--chip-success-bg)] text-[var(--chip-success-text)] border-[var(--chip-success-bg)]',
  absent: 'bg-[var(--chip-danger-bg)] text-[var(--chip-danger-text)] border-[var(--chip-danger-bg)]',
  late: 'bg-[var(--chip-warn-bg)] text-[var(--chip-warn-text)] border-[var(--chip-warn-bg)]',
  leave: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-soft)]',
};

function StaffAttendanceTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

  const staffAttendance = useQuery<{ items: StaffAttendanceItem[]; total: number; marked: number }>({
    queryKey: ['staffAttendance', selectedDate],
    queryFn: () => apiFetch(`/attendance/staff?date=${selectedDate}`),
  });

  const markStaff = useMutation({
    mutationFn: (entries: { staff_id: string; status: string }[]) =>
      apiFetch('/attendance/staff', { method: 'POST', body: JSON.stringify({ date: selectedDate, entries }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staffAttendance'] });
      setLocalStatus({});
      toast({ title: 'Attendance saved', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed to save', description: String(e.message || e), variant: 'error' }),
  });

  function getStatus(id: string, serverStatus: string) {
    return localStatus[id] ?? (serverStatus === 'not_marked' ? '' : serverStatus);
  }

  function setStatus(id: string, status: string) {
    setLocalStatus((prev) => ({ ...prev, [id]: status }));
  }

  function markAllPresent() {
    if (!staffAttendance.data) return;
    const newStatus: Record<string, string> = {};
    staffAttendance.data.items.forEach((item) => {
      newStatus[item.staff_id] = 'present';
    });
    setLocalStatus(newStatus);
  }

  function saveAttendance() {
    const entries = Object.entries(localStatus)
      .filter(([, status]) => status)
      .map(([staff_id, status]) => ({ staff_id, status }));
    if (entries.length === 0) {
      toast({ title: 'No changes to save', variant: 'warning' });
      return;
    }
    markStaff.mutate(entries);
  }

  const changedCount = Object.values(localStatus).filter(Boolean).length;

  return (
    <Card square>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>
              Staff Attendance — {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </CardTitle>
            {staffAttendance.data && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {staffAttendance.data.marked} of {staffAttendance.data.total} marked
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="w-[160px]"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setLocalStatus({}); }}
            />
            <Button variant="outline" size="sm" onClick={markAllPresent}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              All Present
            </Button>
            <Button
              onClick={saveAttendance}
              disabled={markStaff.isPending || changedCount === 0}
              loading={markStaff.isPending}
            >
              Save {changedCount > 0 ? `(${changedCount})` : ''}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {staffAttendance.isLoading ? (
          <div className="flex items-center gap-2 py-8 text-[var(--muted)]"><Spinner /> Loading</div>
        ) : !staffAttendance.data?.items.length ? (
          <EmptyState
            icon={<EmptyStateIcon type="staff" />}
            title="No staff to mark"
            description="Add staff members first to mark their attendance."
            compact
          />
        ) : (
          <div className="space-y-1.5">
            {staffAttendance.data.items.map((item) => {
              const current = getStatus(item.staff_id, item.status);
              return (
                <div
                  key={item.staff_id}
                  className="flex items-center justify-between rounded-lg border border-[var(--panel-line)] px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--heading)]">{item.staff_name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {item.staff_code} · {item.role.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(['present', 'absent', 'late', 'leave'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatus(item.staff_id, status)}
                        aria-pressed={current === status}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase transition-all ${
                          current === status
                            ? STATUS_COLORS[status]
                            : 'border-transparent text-[var(--muted)] opacity-50 hover:opacity-80'
                        }`}
                      >
                        {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : 'LV'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
