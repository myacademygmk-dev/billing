'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, FileText, Globe, Image, Megaphone, Newspaper, Plus, Star, Trash2 } from 'lucide-react';
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

type CreativityItem = {
  id: string;
  title: string;
  student_name: string;
  class_name?: string | null;
  file_url: string;
  file_type: string;
  description?: string | null;
  created_at?: string | null;
};

type TestimonialItem = {
  id: string;
  name: string;
  role?: string | null;
  message: string;
  rating?: number | null;
  is_approved: boolean;
  created_at?: string | null;
};

const SECTIONS = [
  { type: 'website', label: 'Website Settings', icon: Globe, description: 'Marquee text, hero, stats & website config', color: 'text-indigo-500' },
  { type: 'achievement', label: 'Achievements', icon: Star, description: 'Student toppers, rank holders, centum scorers', color: 'text-yellow-500' },
  { type: 'news', label: 'News', icon: Newspaper, description: 'Institute announcements and updates', color: 'text-blue-500' },
  { type: 'event', label: 'Events', icon: Megaphone, description: 'Annual day, exam dates, admission dates', color: 'text-purple-500' },
  { type: 'gallery', label: 'Gallery', icon: Image, description: 'Photo albums from events and activities', color: 'text-green-500' },
  { type: 'circular', label: 'Circulars', icon: Globe, description: 'Official notices and circulars', color: 'text-orange-500' },
  { type: 'creativity', label: 'Student Creativity', icon: Star, description: 'Student artworks, projects, creative submissions', color: 'text-pink-500' },
  { type: 'testimonials', label: 'Testimonials', icon: Megaphone, description: 'Feedback and testimonials from parents/students', color: 'text-teal-500' },
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
    enabled: !['website', 'creativity', 'testimonials'].includes(activeSection),
  });

  const createContent = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/cms', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmsContent'] }); setShowAdd(false); resetForm(); toast({ title: 'Content added' }); },
    onError: (e: any) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const deleteContent = useMutation({
    mutationFn: (id: string) => apiFetch(`/cms/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmsContent'] }); toast({ title: 'Deleted' }); },
  });

  const addPhoto = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/cms/photos', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmsContent'] }); setShowAddPhoto(false); setPhotoForm({ url: '', caption: '' }); toast({ title: 'Photo added' }); },
    onError: (e: any) => toast({ title: 'Failed', description: String(e.message || e) }),
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
        {activeSection === 'website' ? (
          <WebsiteSettingsPanel />
        ) : activeSection === 'creativity' ? (
          <CreativityPanel />
        ) : activeSection === 'testimonials' ? (
          <TestimonialsPanel />
        ) : (
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
        )}
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
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Image</label>
                  {form.image_url ? (
                    <div className="relative inline-block">
                      <img src={form.image_url} alt="Preview" className="h-20 rounded-lg object-cover" />
                      <button onClick={() => setForm({ ...form, image_url: '' })} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                    </div>
                  ) : (
                    <label className="flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--field-border)] hover:border-[var(--accent)] hover:bg-[var(--surface-subtle)] transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData(); fd.append('file', file);
                        try {
                          const res = await fetch('/api/backend/uploads', { method: 'POST', body: fd, credentials: 'include' });
                          if (!res.ok) throw new Error('Upload failed');
                          const data = await res.json();
                          const url = (data.url || '').replace('/api/uploads', '/api/backend/uploads');
                          setForm({ ...form, image_url: url });
                        } catch { toast({ title: 'Upload failed' }); }
                        e.target.value = '';
                      }} />
                      <div className="text-center">
                        <Plus className="mx-auto h-5 w-5 text-[var(--muted)]" />
                        <span className="mt-1 block text-[10px] text-[var(--muted)]">Upload Image</span>
                      </div>
                    </label>
                  )}
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
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Photo *</label>
                {photoForm.url ? (
                  <div className="relative inline-block">
                    <img src={photoForm.url} alt="Preview" className="h-32 w-full rounded-lg object-cover" />
                    <button onClick={() => setPhotoForm({ ...photoForm, url: '' })} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                  </div>
                ) : (
                  <label className="flex h-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--field-border)] hover:border-[var(--accent)] hover:bg-[var(--surface-subtle)] transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData(); fd.append('file', file);
                      try {
                        const res = await fetch('/api/backend/uploads', { method: 'POST', body: fd, credentials: 'include' });
                        if (!res.ok) throw new Error('Upload failed');
                        const data = await res.json();
                        const url = (data.url || '').replace('/api/uploads', '/api/backend/uploads');
                        setPhotoForm({ ...photoForm, url });
                      } catch { toast({ title: 'Upload failed' }); }
                      e.target.value = '';
                    }} />
                    <div className="text-center">
                      <Plus className="mx-auto h-5 w-5 text-[var(--muted)]" />
                      <span className="mt-1 block text-[10px] text-[var(--muted)]">Upload Photo</span>
                    </div>
                  </label>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Caption</label>
                <Input placeholder="Optional caption" value={photoForm.caption} onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })} />
              </div>
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

/* ═══════════════════════════════════════════════
   CREATIVITY PANEL
   ═══════════════════════════════════════════════ */
function CreativityPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', student_name: '', class_name: '', description: '', file_url: '' });
  const [uploading, setUploading] = useState(false);

  const creativity = useQuery<CreativityItem[]>({
    queryKey: ['creativity'],
    queryFn: () => apiFetch('/creativity/'),
  });

  const createCreativity = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch('/creativity/', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['creativity'] }); setShowAdd(false); setForm({ title: '', student_name: '', class_name: '', description: '', file_url: '' }); toast({ title: 'Creativity entry added' }); },
    onError: (e: any) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const deleteCreativity = useMutation({
    mutationFn: (id: string) => apiFetch(`/creativity/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['creativity'] }); toast({ title: 'Deleted' }); },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/backend/uploads', { method: 'POST', body: formData, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const rawUrl: string = data.url || data.file_url || '';
      const url = rawUrl.startsWith('/api/uploads') ? rawUrl.replace('/api/uploads', '/api/backend/uploads') : rawUrl;
      setForm((prev) => ({ ...prev, file_url: url }));
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message });
    }
    setUploading(false);
    e.target.value = '';
  }

  function getFileType(url: string): string {
    if (!url) return 'unknown';
    const lower = url.toLowerCase();
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    return 'file';
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Creativity</CardTitle>
              <p className="mt-1 text-xs text-[var(--muted)]">{creativity.data?.length ?? 0} items</p>
            </div>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {creativity.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-[var(--muted)]"><Spinner /> Loading</div>
          ) : !creativity.data?.length ? (
            <div className="py-10 text-center">
              <div className="text-3xl opacity-30">🎨</div>
              <p className="mt-2 text-sm text-[var(--muted)]">No creativity entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {creativity.data.map((item) => {
                const fileType = getFileType(item.file_url);
                return (
                  <div key={item.id} className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-4 transition-all duration-200 hover:bg-[var(--surface-muted)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Thumbnail / Icon */}
                        <div className="flex-shrink-0">
                          {fileType === 'image' ? (
                            <img src={item.file_url} alt={item.title} className="h-12 w-12 rounded-lg object-cover border border-[var(--panel-line)]" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 border border-red-100">
                              <FileText className="h-5 w-5 text-red-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[var(--heading)] truncate">{item.title}</h4>
                            <Badge className={`text-[10px] ${fileType === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                              {item.file_type || fileType}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 font-medium text-[var(--accent)]">{item.student_name}</span>
                            {item.class_name && <span className="text-[var(--muted)]">Class: {item.class_name}</span>}
                          </div>
                          {item.description && <p className="mt-1 text-xs text-[var(--muted)] line-clamp-1">{item.description}</p>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete this entry?')) deleteCreativity.mutate(item.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Creativity Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Creativity Entry</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Title *</label>
                <Input placeholder="Artwork title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Student Name *</label>
                  <Input placeholder="e.g. PRIYA.M" value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Class</label>
                  <Input placeholder="e.g. VIII-A" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Description</label>
                <textarea className="theme-field w-full rounded-xl px-4 py-3 text-sm" rows={2} placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">File (Image or PDF) *</label>
                <label className="mt-1 flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--field-border)] hover:border-[var(--accent)] hover:bg-[var(--surface-subtle)] transition-colors">
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  {uploading ? (
                    <Spinner className="h-5 w-5" />
                  ) : form.file_url ? (
                    <div className="text-center">
                      <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                      <span className="mt-1 block text-[11px] text-green-600">File uploaded</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Plus className="mx-auto h-5 w-5 text-[var(--muted)]" />
                      <span className="mt-1 block text-[11px] text-[var(--muted)]">Click to upload</span>
                    </div>
                  )}
                </label>
                {form.file_url && (
                  <p className="mt-1 text-[10px] text-[var(--muted)] truncate">{form.file_url}</p>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => createCreativity.mutate({
                title: form.title,
                student_name: form.student_name,
                class_name: form.class_name || null,
                description: form.description || null,
                file_url: form.file_url,
                file_type: getFileType(form.file_url),
              })}
              disabled={!form.title || !form.student_name || !form.file_url || createCreativity.isPending}
            >
              {createCreativity.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS PANEL
   ═══════════════════════════════════════════════ */
function TestimonialsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const testimonials = useQuery<TestimonialItem[]>({
    queryKey: ['testimonials'],
    queryFn: () => apiFetch('/testimonials/'),
  });

  const approveTestimonial = useMutation({
    mutationFn: (id: string) => apiFetch(`/testimonials/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['testimonials'] }); toast({ title: 'Testimonial approved' }); },
    onError: (e: any) => toast({ title: 'Failed', description: String(e.message || e) }),
  });

  const deleteTestimonial = useMutation({
    mutationFn: (id: string) => apiFetch(`/testimonials/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['testimonials'] }); toast({ title: 'Deleted' }); },
  });

  function renderStars(rating: number | null | undefined) {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`h-3.5 w-3.5 ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Testimonials</CardTitle>
            <p className="mt-1 text-xs text-[var(--muted)]">{testimonials.data?.length ?? 0} items • Testimonials come from the public feedback form</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {testimonials.isLoading ? (
          <div className="flex items-center gap-2 py-8 text-[var(--muted)]"><Spinner /> Loading</div>
        ) : !testimonials.data?.length ? (
          <div className="py-10 text-center">
            <div className="text-3xl opacity-30">💬</div>
            <p className="mt-2 text-sm text-[var(--muted)]">No testimonials yet. They will appear here when visitors submit feedback.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testimonials.data.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--panel-line)] bg-[var(--surface-subtle)] p-4 transition-all duration-200 hover:bg-[var(--surface-muted)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-[var(--heading)]">{item.name}</h4>
                      {item.role && (
                        <Badge className="text-[10px] bg-purple-100 text-purple-600">{item.role}</Badge>
                      )}
                      {item.is_approved ? (
                        <Badge className="text-[10px] bg-green-100 text-green-600">Approved</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-yellow-100 text-yellow-600">Pending</Badge>
                      )}
                    </div>
                    {renderStars(item.rating)}
                    <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2">{item.message}</p>
                    {item.created_at && <p className="mt-1 text-[10px] text-[var(--muted)]">{new Date(item.created_at).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {!item.is_approved && (
                      <Button size="sm" variant="outline" onClick={() => approveTestimonial.mutate(item.id)} title="Approve">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete this testimonial?')) deleteTestimonial.mutate(item.id); }}>
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
  );
}

/* ═══════════════════════════════════════════════
   WEBSITE SETTINGS PANEL
   ═══════════════════════════════════════════════ */
function WebsiteSettingsPanel() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [marquee, setMarquee] = useState('');
  const [statsStudents, setStatsStudents] = useState('');
  const [statsStaff, setStatsStaff] = useState('');
  const [statsYears, setStatsYears] = useState('');
  const [statsStandards, setStatsStandards] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [admissionText, setAdmissionText] = useState('');
  const [popupBannerUrl, setPopupBannerUrl] = useState('');
  const [heroSlides, setHeroSlides] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  // New fields
  const [videos, setVideos] = useState('');
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownTitle, setCountdownTitle] = useState('');
  const [managementTeam, setManagementTeam] = useState('');
  const [technicalTeam, setTechnicalTeam] = useState('');
  const [formerStaff, setFormerStaff] = useState('');

  const settings = useQuery<Record<string, any>>({
    queryKey: ['institutionSettings'],
    queryFn: () => apiFetch('/settings/institution'),
  });

  useEffect(() => {
    if (settings.data) {
      setMarquee(settings.data.marquee_text || '');
      setStatsStudents(settings.data.stats_students || '');
      setStatsStaff(settings.data.stats_staff || '');
      setStatsYears(settings.data.stats_years || '');
      setStatsStandards(settings.data.stats_standards || '');
      setHeroTitle(settings.data.hero_title || '');
      setHeroSubtitle(settings.data.hero_subtitle || '');
      setAdmissionText(settings.data.admission_text || '');
      setPopupBannerUrl(settings.data.popup_banner_url || '');
      const slides = settings.data.hero_slides
        ? settings.data.hero_slides.split('|').map((s: string) => s.trim()).filter(Boolean)
        : [];
      setHeroSlides(slides);
      // New fields
      setVideos(settings.data.videos || '');
      setCountdownDate(settings.data.countdown_date || '');
      setCountdownTitle(settings.data.countdown_title || '');
      setManagementTeam(settings.data.management_team || '');
      setTechnicalTeam(settings.data.technical_team || '');
      setFormerStaff(settings.data.former_staff || '');
    }
  }, [settings.data]);

  async function uploadFile(file: File, target: 'popup' | 'slide'): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/backend/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const rawUrl: string = data.url || data.file_url || '';
      const url = rawUrl.startsWith('/api/uploads')
        ? rawUrl.replace('/api/uploads', '/api/backend/uploads')
        : rawUrl;
      return url;
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message });
      return null;
    }
  }

  async function handleSlideUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('slide');
    const url = await uploadFile(file, 'slide');
    if (url) setHeroSlides((prev) => [...prev, url]);
    setUploading(null);
    e.target.value = '';
  }

  async function handlePopupUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('popup');
    const url = await uploadFile(file, 'popup');
    if (url) setPopupBannerUrl(url);
    setUploading(null);
    e.target.value = '';
  }

  function removeSlide(index: number) {
    setHeroSlides((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch('/settings/institution', {
        method: 'PATCH',
        body: JSON.stringify({
          marquee_text: marquee,
          stats_students: statsStudents,
          stats_staff: statsStaff,
          stats_years: statsYears,
          stats_standards: statsStandards,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          admission_text: admissionText,
          popup_banner_url: popupBannerUrl || null,
          hero_slides: heroSlides.length > 0 ? heroSlides.join('|') : null,
          // New fields
          videos: videos || null,
          countdown_date: countdownDate || null,
          countdown_title: countdownTitle || null,
          management_team: managementTeam || null,
          technical_team: technicalTeam || null,
          former_staff: formerStaff || null,
        }),
      });
      toast({ title: 'Website settings saved' });
    } catch (e: any) {
      toast({ title: 'Failed to save', description: String(e.message || e) });
    }
    setSaving(false);
  }

  if (settings.isLoading) return <div className="flex items-center gap-2 py-8 text-[var(--muted)]"><Spinner /> Loading settings...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--panel-line)] bg-[var(--panel-bg)] px-5 py-4 rounded-t-xl">
        <h3 className="text-base font-semibold text-[var(--heading)]">Website Settings</h3>
        <p className="mt-0.5 text-xs text-[var(--muted)]">Edit your public website content. Changes reflect immediately.</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Marquee */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Marquee / News Ticker</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Separate each announcement with a pipe ( | ) character</p>
          <textarea
            className="mt-2 w-full rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2.5 text-sm text-[var(--heading)] focus:border-[var(--accent)] focus:outline-none"
            rows={3}
            placeholder="Admissions Open 2025-2026|New Classes Starting|Board Results Announced"
            value={marquee}
            onChange={(e) => setMarquee(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Homepage Stats</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Numbers shown on the KPI cards on the homepage</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-[11px] text-[var(--muted)]">Years</label>
              <Input className="mt-1" value={statsYears} onChange={(e) => setStatsYears(e.target.value)} placeholder="15+" />
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted)]">Students</label>
              <Input className="mt-1" value={statsStudents} onChange={(e) => setStatsStudents(e.target.value)} placeholder="200+" />
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted)]">Staff</label>
              <Input className="mt-1" value={statsStaff} onChange={(e) => setStatsStaff(e.target.value)} placeholder="22" />
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted)]">Standards</label>
              <Input className="mt-1" value={statsStandards} onChange={(e) => setStatsStandards(e.target.value)} placeholder="LKG-12" />
            </div>
          </div>
        </div>

        {/* Admission Text */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Admission Banner Text</label>
          <Input className="mt-2" value={admissionText} onChange={(e) => setAdmissionText(e.target.value)} placeholder="Admissions Open for 2025-2026" />
        </div>

        {/* Hero Slides - Upload */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Hero Slideshow Images</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Upload images for the homepage banner slideshow</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {heroSlides.map((url, i) => (
              <div key={i} className="relative group rounded-lg border border-[var(--field-border)] overflow-hidden">
                <img src={url} alt={`Slide ${i + 1}`} className="w-full h-24 object-cover" />
                <button
                  onClick={() => removeSlide(i)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            {/* Upload button */}
            <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--field-border)] hover:border-[var(--accent)] hover:bg-[var(--surface-subtle)] transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleSlideUpload} disabled={uploading === 'slide'} />
              {uploading === 'slide' ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <div className="text-center">
                  <Plus className="mx-auto h-5 w-5 text-[var(--muted)]" />
                  <span className="mt-1 block text-[11px] text-[var(--muted)]">Add Image</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Popup Banner - Upload */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Popup Banner Image</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Shows as a popup when visitors open the website. Remove to disable.</p>
          {popupBannerUrl ? (
            <div className="mt-3 relative group rounded-lg border border-[var(--field-border)] overflow-hidden inline-block">
              <img src={popupBannerUrl} alt="Popup banner" className="max-h-40 object-contain rounded" />
              <button
                onClick={() => setPopupBannerUrl('')}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="mt-3 flex h-24 w-48 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--field-border)] hover:border-[var(--accent)] hover:bg-[var(--surface-subtle)] transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handlePopupUpload} disabled={uploading === 'popup'} />
              {uploading === 'popup' ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <div className="text-center">
                  <Plus className="mx-auto h-5 w-5 text-[var(--muted)]" />
                  <span className="mt-1 block text-[11px] text-[var(--muted)]">Upload Banner</span>
                </div>
              )}
            </label>
          )}
        </div>

        {/* Videos */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Videos (YouTube URLs)</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Separate multiple YouTube URLs with a pipe ( | ) character</p>
          <textarea
            className="mt-2 w-full rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2.5 text-sm text-[var(--heading)] focus:border-[var(--accent)] focus:outline-none"
            rows={3}
            placeholder="https://youtube.com/watch?v=abc123|https://youtube.com/watch?v=def456"
            value={videos}
            onChange={(e) => setVideos(e.target.value)}
          />
        </div>

        {/* Countdown */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Countdown Timer</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Shows a countdown timer on the website for an upcoming event</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] text-[var(--muted)]">Countdown Title</label>
              <Input className="mt-1" value={countdownTitle} onChange={(e) => setCountdownTitle(e.target.value)} placeholder="e.g. Annual Day Starts In" />
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted)]">Countdown Date</label>
              <Input type="date" className="mt-1" value={countdownDate} onChange={(e) => setCountdownDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Management Team */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Management Team</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">JSON array of team members, e.g. [{`{"name":"...", "role":"...", "image":"..."}`}]</p>
          <textarea
            className="mt-2 w-full rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2.5 text-sm text-[var(--heading)] focus:border-[var(--accent)] focus:outline-none font-mono"
            rows={4}
            placeholder='[{"name": "Mr. Rajesh", "role": "Chairman", "image": ""}]'
            value={managementTeam}
            onChange={(e) => setManagementTeam(e.target.value)}
          />
        </div>

        {/* Technical Team */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Technical Team</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">JSON array of team members, e.g. [{`{"name":"...", "role":"...", "image":"..."}`}]</p>
          <textarea
            className="mt-2 w-full rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2.5 text-sm text-[var(--heading)] focus:border-[var(--accent)] focus:outline-none font-mono"
            rows={4}
            placeholder='[{"name": "Ms. Priya", "role": "IT Head", "image": ""}]'
            value={technicalTeam}
            onChange={(e) => setTechnicalTeam(e.target.value)}
          />
        </div>

        {/* Former Staff */}
        <div>
          <label className="text-sm font-semibold text-[var(--heading)]">Former Staff</label>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">JSON array of former staff, e.g. [{`{"name":"...", "role":"...", "years":"..."}`}]</p>
          <textarea
            className="mt-2 w-full rounded-lg border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2.5 text-sm text-[var(--heading)] focus:border-[var(--accent)] focus:outline-none font-mono"
            rows={4}
            placeholder='[{"name": "Mr. Kumar", "role": "Principal", "years": "2005-2020"}]'
            value={formerStaff}
            onChange={(e) => setFormerStaff(e.target.value)}
          />
        </div>

      </div>

      {/* Fixed Save footer */}
      <div className="flex-shrink-0 border-t border-[var(--panel-line)] bg-[var(--panel-bg)] px-5 py-3 rounded-b-xl">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Spinner className="mr-1.5 h-3.5 w-3.5" /> Saving...</> : 'Save Website Settings'}
        </Button>
      </div>
    </div>
  );
}
