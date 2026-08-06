'use client';

import { useState } from 'react';
import { Plus, Pencil, Shield, Trash2, UserPlus, Users, UserCog, CalendarCheck } from 'lucide-react';
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

  const tabNav = (
    <div className="flex items-end">
      <button
        onClick={() => setActiveTab('staff')}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-b-0 transition-colors ${
          activeTab === 'staff'
            ? 'bg-white text-[var(--heading)] border-[var(--panel-line)] relative z-10 -mb-px'
            : 'bg-[#f1f5f9] text-[var(--muted)] border-[var(--panel-line)] hover:text-[var(--heading)] hover:bg-[#f8fafc]'
        }`}
      >
        <UserCog className="h-3.5 w-3.5" />
        Staff
      </button>
      <button
        onClick={() => setActiveTab('attendance')}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-b-0 transition-colors ${
          activeTab === 'attendance'
            ? 'bg-white text-[var(--heading)] border-[var(--panel-line)] relative z-10 -mb-px'
            : 'bg-[#f1f5f9] text-[var(--muted)] border-[var(--panel-line)] hover:text-[var(--heading)] hover:bg-[#f8fafc]'
        }`}
      >
        <CalendarCheck className="h-3.5 w-3.5" />
        Attendance
      </button>
      <button
        onClick={() => setActiveTab('users')}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-b-0 transition-colors ${
          activeTab === 'users'
            ? 'bg-white text-[var(--heading)] border-[var(--panel-line)] relative z-10 -mb-px'
            : 'bg-[#f1f5f9] text-[var(--muted)] border-[var(--panel-line)] hover:text-[var(--heading)] hover:bg-[#f8fafc]'
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        User Accounts
      </button>
    </div>
  );

  return (
    <AppShell title="Staff" subtitle="Manage staff records, user accounts, and attendance." action={tabNav}>
      <div className="border border-[var(--panel-line)] bg-white p-3 sm:p-4">
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'attendance' && <StaffAttendanceTab />}
        {activeTab === 'users' && <UsersTab />}
      </div>
    </AppShell>
  );
}

// ─── Staff Tab ───────────────────────────────────────────

function StaffTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({
    staff_code: '',
    name: '',
    role: 'teacher',
    phone: '',
    email: '',
    qualification: '',
    monthly_salary: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    qualification: '',
    monthly_salary: '',
    joining_date: '',
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

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Staff member updated', variant: 'success' });
      setEditTarget(null);
    },
    onError: (e) => {
      toast({ title: 'Update failed', description: String(e.message || e), variant: 'error' });
    },
  });

  function openEdit(s: StaffMember) {
    setEditForm({
      name: s.name ?? '',
      role: s.role ?? 'teacher',
      phone: s.phone ?? '',
      email: s.email ?? '',
      qualification: s.qualification ?? '',
      monthly_salary: s.monthly_salary ?? '',
      joining_date: s.joining_date ?? '',
    });
    setEditTarget(s);
  }

  function handleEditSubmit() {
    if (!editTarget) return;
    const changed: Record<string, unknown> = {};
    if (editForm.name !== editTarget.name) changed.name = editForm.name;
    if (editForm.role !== editTarget.role) changed.role = editForm.role;
    if (editForm.phone !== (editTarget.phone ?? '')) changed.phone = editForm.phone || null;
    if (editForm.email !== (editTarget.email ?? '')) changed.email = editForm.email || null;
    if (editForm.qualification !== (editTarget.qualification ?? '')) changed.qualification = editForm.qualification || null;
    if (editForm.monthly_salary !== (editTarget.monthly_salary ?? '')) changed.monthly_salary = editForm.monthly_salary ? Number(editForm.monthly_salary) : null;
    if (editForm.joining_date !== (editTarget.joining_date ?? '')) changed.joining_date = editForm.joining_date || null;

    if (Object.keys(changed).length === 0) {
      toast({ title: 'No changes to save' });
      setEditTarget(null);
      return;
    }
    editMutation.mutate({ id: editTarget.id, data: changed });
  }

  return (
    <>
      <Card square transparent>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(s)}
                            aria-label={`Edit ${s.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                            onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                            aria-label={`Delete ${s.name}`}
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

      {/* Edit Staff Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Full Name *</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Role</label>
                <Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="teacher">Teacher</option>
                  <option value="admin_staff">Admin Staff</option>
                  <option value="non_teaching">Non-Teaching</option>
                  <option value="part_time">Part Time</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Phone</label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Email</label>
                  <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Qualification</label>
                  <Input value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Monthly Salary</label>
                  <Input type="number" value={editForm.monthly_salary} onChange={(e) => setEditForm({ ...editForm, monthly_salary: e.target.value })} prefix={<span className="text-sm">₹</span>} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Date of Joining</label>
                <Input type="date" value={editForm.joining_date} onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!editForm.name}
              loading={editMutation.isPending}
            >
              Save Changes
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
      <Card square transparent>
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

// ─── Staff Attendance Tab (Clock In/Out) ─────────────────

type ClockRecord = {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_code: string;
  clock_in: string | null;
  clock_out: string | null;
  note_in: string | null;
  note_out: string | null;
  status: 'on_time' | 'late' | 'not_clocked_in';
  total_hours: number | null;
};

type ClockAnalytics = {
  staff_id: string;
  staff_name: string;
  days_present: number;
  avg_clock_in: string;
  avg_hours_per_day: number;
  late_count: number;
  on_time_count: number;
  total_hours: number;
};

function StaffAttendanceTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [noteDialog, setNoteDialog] = useState<{ staffId: string; action: 'in' | 'out'; staffName: string } | null>(null);
  const [note, setNote] = useState('');
  const [analyticsMonth, setAnalyticsMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Fetch today's clock records
  const { data: clockRecords, isLoading: loadingRecords } = useQuery<ClockRecord[]>({
    queryKey: ['clockRecords', today],
    queryFn: () => apiFetch(`/attendance/staff/clock-records?date=${today}`),
  });

  // Fetch monthly analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery<ClockAnalytics[]>({
    queryKey: ['clockAnalytics', analyticsMonth],
    queryFn: () => apiFetch(`/attendance/staff/clock-analytics?month=${analyticsMonth}-01`),
  });

  // Clock In mutation
  const clockInMutation = useMutation({
    mutationFn: (data: { staff_id: string; note?: string }) =>
      apiFetch('/attendance/staff/clock-in', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clockRecords'] });
      qc.invalidateQueries({ queryKey: ['clockAnalytics'] });
      setNoteDialog(null);
      setNote('');
      toast({ title: 'Clocked in successfully', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Clock in failed', description: String(e.message || e), variant: 'error' }),
  });

  // Clock Out mutation
  const clockOutMutation = useMutation({
    mutationFn: (data: { staff_id: string; note?: string }) =>
      apiFetch(`/attendance/staff/${data.staff_id}/clock-out`, { method: 'POST', body: JSON.stringify({ note: data.note }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clockRecords'] });
      qc.invalidateQueries({ queryKey: ['clockAnalytics'] });
      setNoteDialog(null);
      setNote('');
      toast({ title: 'Clocked out successfully', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Clock out failed', description: String(e.message || e), variant: 'error' }),
  });

  function handleClockAction() {
    if (!noteDialog) return;
    const { staffId, action } = noteDialog;
    if (action === 'in') {
      clockInMutation.mutate({ staff_id: staffId, note: note || undefined });
    } else {
      clockOutMutation.mutate({ staff_id: staffId, note: note || undefined });
    }
  }

  function formatTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function formatHours(hours: number | null): string {
    if (hours === null || hours === undefined) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  const clockedInCount = clockRecords?.filter((r) => r.clock_in).length ?? 0;
  const clockedOutCount = clockRecords?.filter((r) => r.clock_out).length ?? 0;

  return (
    <div className="space-y-6">
      {/* ─── Clock In/Out Panel ─── */}
      <Card square transparent>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>
                Today — {new Date(today).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </CardTitle>
              {clockRecords && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {clockedInCount} clocked in · {clockedOutCount} clocked out · {(clockRecords.length - clockedInCount)} not yet
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="flex items-center gap-2 py-8 text-[var(--muted)]"><Spinner /> Loading</div>
          ) : !clockRecords?.length ? (
            <EmptyState
              icon={<EmptyStateIcon type="staff" />}
              title="No staff found"
              description="Add staff members first to track attendance."
              compact
            />
          ) : (
            <div className="space-y-2">
              {clockRecords.map((record) => (
                <div
                  key={record.staff_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--panel-line)] px-4 py-3"
                >
                  {/* Staff Info */}
                  <div className="min-w-[140px]">
                    <div className="text-sm font-medium text-[var(--heading)]">{record.staff_name}</div>
                    <div className="text-xs text-[var(--muted)]">{record.staff_code}</div>
                  </div>

                  {/* Times */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="text-[10px] uppercase text-[var(--muted)]">In</div>
                      <div className={record.clock_in ? 'font-medium text-emerald-600' : 'text-[var(--muted)]'}>
                        {formatTime(record.clock_in)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase text-[var(--muted)]">Out</div>
                      <div className={record.clock_out ? 'font-medium text-blue-600' : 'text-[var(--muted)]'}>
                        {formatTime(record.clock_out)}
                      </div>
                    </div>
                    {record.total_hours !== null && (
                      <div className="text-center">
                        <div className="text-[10px] uppercase text-[var(--muted)]">Hours</div>
                        <div className="font-medium text-[var(--heading)]">{formatHours(record.total_hours)}</div>
                      </div>
                    )}
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        record.status === 'on_time' ? 'success' :
                        record.status === 'late' ? 'warning' : 'default'
                      }
                    >
                      {record.status === 'on_time' ? 'On Time' :
                       record.status === 'late' ? 'Late' : 'Not Clocked In'}
                    </Badge>

                    {!record.clock_in && (
                      <Button
                        size="sm"
                        onClick={() => setNoteDialog({ staffId: record.staff_id, action: 'in', staffName: record.staff_name })}
                      >
                        Clock In
                      </Button>
                    )}
                    {record.clock_in && !record.clock_out && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setNoteDialog({ staffId: record.staff_id, action: 'out', staffName: record.staff_name })}
                      >
                        Clock Out
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Analytics Section ─── */}
      <Card square transparent>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Monthly Analytics</CardTitle>
            <Input
              type="month"
              className="w-[180px]"
              value={analyticsMonth}
              onChange={(e) => setAnalyticsMonth(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {loadingAnalytics ? (
            <div className="flex items-center gap-2 px-4 py-8 text-[var(--muted)]"><Spinner /> Loading analytics</div>
          ) : !analytics?.length ? (
            <EmptyState
              icon={<EmptyStateIcon type="staff" />}
              title="No data for this month"
              description="Attendance records will appear here once staff start clocking in."
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Staff Name</TH>
                    <TH className="text-center">Days Present</TH>
                    <TH className="text-center">Avg Clock-In</TH>
                    <TH className="text-center">Avg Hours/Day</TH>
                    <TH className="text-center">Late</TH>
                    <TH className="text-center">On Time</TH>
                    <TH className="text-right">Total Hours</TH>
                  </tr>
                </THead>
                <TBody>
                  {analytics.map((row) => (
                    <TR key={row.staff_id}>
                      <TD className="font-medium text-[var(--heading)]">{row.staff_name}</TD>
                      <TD className="text-center">{row.days_present}</TD>
                      <TD className="text-center text-[var(--muted)]">{row.avg_clock_in || '—'}</TD>
                      <TD className="text-center">{row.avg_hours_per_day ? `${row.avg_hours_per_day.toFixed(1)}h` : '—'}</TD>
                      <TD className="text-center">
                        {row.late_count > 0 ? (
                          <Badge variant="warning">{row.late_count}</Badge>
                        ) : (
                          <span className="text-[var(--muted)]">0</span>
                        )}
                      </TD>
                      <TD className="text-center">
                        {row.on_time_count > 0 ? (
                          <Badge variant="success">{row.on_time_count}</Badge>
                        ) : (
                          <span className="text-[var(--muted)]">0</span>
                        )}
                      </TD>
                      <TD className="text-right font-medium">{row.total_hours ? formatHours(row.total_hours) : '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Note Dialog (Clock In / Clock Out) ─── */}
      <Dialog open={!!noteDialog} onOpenChange={(v) => { if (!v) { setNoteDialog(null); setNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteDialog?.action === 'in' ? 'Clock In' : 'Clock Out'} — {noteDialog?.staffName}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--heading)]">Note (optional)</label>
              <Input
                placeholder={noteDialog?.action === 'in' ? 'e.g. Arrived early for meeting' : 'e.g. Left for personal errand'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNoteDialog(null); setNote(''); }}>Cancel</Button>
            <Button
              onClick={handleClockAction}
              loading={clockInMutation.isPending || clockOutMutation.isPending}
            >
              {noteDialog?.action === 'in' ? 'Clock In' : 'Clock Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
