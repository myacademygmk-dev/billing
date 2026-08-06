'use client';

import { useState } from 'react';
import { Calendar, Check, Clock, MessageSquare, Phone, Trash2, User, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type Enquiry = {
  id: string;
  student_name: string;
  parent_name: string | null;
  phone: string;
  email: string | null;
  standard: string | null;
  board: string | null;
  message: string | null;
  source: string | null;
  status: string;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'warning' | 'accent' | 'success' | 'danger' }> = {
  new: { label: 'New', variant: 'accent' },
  contacted: { label: 'Contacted', variant: 'warning' },
  demo_scheduled: { label: 'Demo Scheduled', variant: 'default' },
  enrolled: { label: 'Enrolled', variant: 'success' },
  lost: { label: 'Lost', variant: 'danger' },
};

export default function EnquiriesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const { data, isLoading } = useQuery<{ items: Enquiry[]; total: number }>({
    queryKey: ['enquiries', statusFilter],
    queryFn: () => apiFetch(`/enquiries?${statusFilter ? `status=${statusFilter}&` : ''}page_size=50`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch(`/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries'] });
      setSelectedEnquiry(null);
      toast({ title: 'Enquiry updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e), variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/enquiries/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries'] });
      setDeleteTarget(null);
      toast({ title: 'Enquiry deleted', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e), variant: 'error' }),
  });

  function openDetail(enquiry: Enquiry) {
    setSelectedEnquiry(enquiry);
    setUpdateStatus(enquiry.status);
    setFollowUpDate(enquiry.follow_up_date || '');
    setFollowUpNotes(enquiry.follow_up_notes || '');
  }

  return (
    <AppShell title="Enquiries" subtitle="Manage admission requests submitted from the website.">
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 w-[140px] text-xs">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="demo_scheduled">Demo Scheduled</option>
          <option value="enrolled">Enrolled</option>
          <option value="lost">Lost</option>
        </Select>
        {data && <span className="text-xs text-[var(--muted)]">{data.total} enquiries</span>}
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : !data?.items.length ? (
        <EmptyState
          title="No enquiries yet"
          description="When parents submit the contact form on your website, their requests will appear here."
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((enquiry) => {
            const statusInfo = STATUS_LABELS[enquiry.status] || STATUS_LABELS.new;
            return (
              <div
                key={enquiry.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-[var(--panel-line)] bg-white px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--surface-subtle)]"
                onClick={() => openDetail(enquiry)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--heading)] text-sm">{enquiry.student_name}</span>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    {enquiry.source && <span className="text-[10px] text-[var(--muted)]">via {enquiry.source}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted)]">
                    {enquiry.parent_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{enquiry.parent_name}</span>}
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{enquiry.phone}</span>
                    {enquiry.standard && <span>Class: {enquiry.standard}</span>}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-[var(--muted)]">
                    {new Date(enquiry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: enquiry.id, name: enquiry.student_name }); }}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Update Dialog */}
      <Dialog open={!!selectedEnquiry} onOpenChange={(v) => !v && setSelectedEnquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enquiry — {selectedEnquiry?.student_name}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {selectedEnquiry && (
              <div className="space-y-4">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-[var(--muted)]">Student Name</span>
                    <p className="font-medium text-[var(--heading)]">{selectedEnquiry.student_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)]">Parent Name</span>
                    <p className="font-medium text-[var(--heading)]">{selectedEnquiry.parent_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)]">Phone</span>
                    <p className="font-medium text-[var(--heading)]">{selectedEnquiry.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)]">Email</span>
                    <p className="font-medium text-[var(--heading)]">{selectedEnquiry.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)]">Class/Standard</span>
                    <p className="font-medium text-[var(--heading)]">{selectedEnquiry.standard || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)]">Submitted</span>
                    <p className="font-medium text-[var(--heading)]">{new Date(selectedEnquiry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {selectedEnquiry.message && (
                  <div>
                    <span className="text-xs text-[var(--muted)]">Message</span>
                    <p className="mt-0.5 text-sm text-[var(--text)] bg-[var(--surface-subtle)] rounded-md px-3 py-2">{selectedEnquiry.message}</p>
                  </div>
                )}

                {/* Update section */}
                <div className="border-t border-[var(--panel-line)] pt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--heading)]">Status</label>
                    <Select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="demo_scheduled">Demo Scheduled</option>
                      <option value="enrolled">Enrolled</option>
                      <option value="lost">Lost</option>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--heading)]">Follow-up Date</label>
                    <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--heading)]">Notes</label>
                    <Input value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="Add follow-up notes..." />
                  </div>
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEnquiry(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedEnquiry) return;
                updateMutation.mutate({
                  id: selectedEnquiry.id,
                  body: {
                    status: updateStatus,
                    follow_up_date: followUpDate || null,
                    follow_up_notes: followUpNotes || null,
                  },
                });
              }}
              loading={updateMutation.isPending}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete enquiry from "${deleteTarget?.name}"?`}
        description="This enquiry will be permanently removed."
        variant="danger"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
      />
    </AppShell>
  );
}
