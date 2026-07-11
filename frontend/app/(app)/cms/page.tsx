'use client';

import { useState } from 'react';
import { Globe, Image, Megaphone, Newspaper, Plus, Star, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

type ContentItem = {
  id: string;
  content_type: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  event_date?: string | null;
  is_published: boolean;
  student_name?: string | null;
  rank?: string | null;
  marks?: string | null;
  year?: string | null;
  photos: { id: string; url: string; caption?: string | null }[];
};

const SECTIONS = [
  { type: 'achievement', label: 'Achievements', icon: Star, description: 'Student toppers, rank holders, centum scorers', color: 'text-yellow-500' },
  { type: 'news', label: 'News', icon: Newspaper, description: 'Institute announcements and updates', color: 'text-blue-500' },
  { type: 'event', label: 'Events', icon: Megaphone, description: 'Annual day, exam dates, admission dates', color: 'text-purple-500' },
  { type: 'gallery', label: 'Gallery', icon: Image, description: 'Photo albums from events and activities', color: 'text-green-500' },
  { type: 'circular', label: 'Circulars', icon: Globe, description: 'Official notices and circulars', color: 'text-orange-500' },
];

export default function CmsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState('achievement');
  const [showAdd, setShowAdd] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', image_url: '', event_date: '', student_name: '', rank: '', marks: '', year: '' });
  const [photoForm, setPhotoForm] = useState({ url: '', caption: '' });

  const content = useQuery<{ items: ContentItem[]; total: number }>({
    queryKey: ['cmsContent', activeSection],
    queryFn: () => apiFetch(`/cms?content_type=${activeSection}`),
  });

  const createContent = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/cms', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmsContent'] }); setShowAdd(false); resetForm(); toast({ title: 'Content added' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const deleteContent = useMutation({
    mutationFn: (id: string) => apiFetch(`/cms/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmsContent'] }); toast({ title: 'Deleted' }); },
  });

  const addPhoto = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/cms/photos', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmsContent'] }); setShowAddPhoto(false); setPhotoForm({ url: '', caption: '' }); toast({ title: 'Photo added' }); },
    onError: (e) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const deletePhoto = useMutation({
    mutationFn: (id: string) => apiFetch(`/cms/photos/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmsContent'] }); toast({ title: 'Photo removed' }); },
  });

  function resetForm() {
    setForm({ title: '', description: '', image_url: '', event_date: '', student_name: '', rank: '', marks: '', year: '' });
  }

  const currentSection = SECTIONS.find((s) => s.type === activeSection)!;

  return (
    <AppShell title="Website CMS" subtitle="Manage your public website content — achievements, news, events, gallery & circulars">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Section Selector */}
        <div className="space-y-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.type;
            return (
              <button
                key={section.type}
                onClick={() => setActiveSection(section.type)}
                className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${isActive ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm' : 'border-[var(--field-border)] hover:bg-[var(--surface-subtle)]'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-[var(--accent)]' : section.color}`} />
                  <div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-[var(--heading)]' : ''}`}>{section.label}</div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">{section.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentSection.label}</CardTitle>
                <p className="mt-1 text-xs text-[var(--muted)]">{content.data?.total ?? 0} items</p>
              </div>
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add {currentSection.label.slice(0, -1)}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {content.isLoading ? (
              <div className="flex items-center gap-2 py-8 text-[var(--muted)]"><Spinner /> Loading</div>
            ) : content.data?.items.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl opacity-30">📭</div>
                <p className="mt-2 text-sm text-[var(--muted)]">No {currentSection.label.toLowerCase()} yet. Click the button above to add.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {content.data?.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-4 transition-all duration-200 hover:bg-[var(--surface-muted)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[var(--heading)] truncate">{item.title}</h4>
                          {!item.is_published && <Badge className="theme-chip-warn text-[10px]">Draft</Badge>}
                        </div>
                        {item.description && <p className="mt-1 text-xs text-[var(--muted)] line-clamp-1">{item.description}</p>}
                        {item.student_name && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 font-medium text-[var(--accent)]">{item.student_name}</span>
                            {item.rank && <span className="rounded bg-yellow-500/10 px-2 py-0.5 font-medium text-yellow-500">Rank: {item.rank}</span>}
                            {item.marks && <span className="rounded bg-blue-500/10 px-2 py-0.5 font-medium text-blue-400">{item.marks}</span>}
                            {item.year && <span className="text-[var(--muted)]">{item.year}</span>}
                          </div>
                        )}
                        {item.event_date && <p className="mt-1 text-[11px] text-[var(--muted)]">📅 {item.event_date}</p>}
                        {/* Photos for gallery */}
                        {item.photos.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.photos.map((p) => (
                              <div key={p.id} className="group relative">
                                <img src={p.url} alt={p.caption ?? ''} className="h-10 w-10 rounded-lg object-cover border border-[var(--panel-line)]" />
                                <button
                                  onClick={() => deletePhoto.mutate(p.id)}
                                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white group-hover:flex"
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {activeSection === 'gallery' && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedContent(item.id); setShowAddPhoto(true); }}>
                            <Image className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete this item?')) deleteContent.mutate(item.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Content Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {currentSection.label.slice(0, -1)}</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Title *</label>
                <Input placeholder="Enter title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Description</label>
                <textarea className="theme-field w-full rounded-xl px-4 py-3 text-sm" rows={2} placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {(activeSection === 'news' || activeSection === 'event' || activeSection === 'gallery') && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Image URL</label>
                  <Input placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                </div>
              )}
              {(activeSection === 'event') && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Event Date</label>
                  <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                </div>
              )}
              {activeSection === 'achievement' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Student Name *</label>
                      <Input placeholder="e.g. PRIYA.M" value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Class</label>
                      <Input placeholder="e.g. XII" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Rank</label>
                      <Input placeholder="e.g. 1st" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Marks</label>
                      <Input placeholder="e.g. 572/600" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={() => createContent.mutate({
                content_type: activeSection,
                title: form.title,
                description: form.description || null,
                image_url: form.image_url || null,
                event_date: form.event_date || null,
                student_name: form.student_name || null,
                class_name: activeSection === 'achievement' ? form.year : null,
                rank: form.rank || null,
                marks: form.marks || null,
                year: form.year || null,
              })}
              disabled={!form.title || createContent.isPending}
            >
              {createContent.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Photo Dialog */}
      <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Photo to Gallery</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Photo URL *</label>
                <Input placeholder="https://..." value={photoForm.url} onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Caption</label>
                <Input placeholder="Optional caption" value={photoForm.caption} onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })} />
              </div>
              {photoForm.url && (
                <div className="rounded-lg border border-[var(--panel-line)] p-2">
                  <img src={photoForm.url} alt="Preview" className="h-32 w-full rounded object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPhoto(false)}>Cancel</Button>
            <Button
              onClick={() => addPhoto.mutate({ content_id: selectedContent, url: photoForm.url, caption: photoForm.caption || null })}
              disabled={!photoForm.url || addPhoto.isPending}
            >
              {addPhoto.isPending ? 'Adding...' : 'Add Photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
