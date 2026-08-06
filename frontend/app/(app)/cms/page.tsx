'use client';

import { useEffect, useState } from 'react';
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
  { type: 'website', label: 'Website Settings', icon: Globe, description: 'Marquee text, hero, stats & website config', color: 'text-indigo-500' },
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
        {activeSection === 'website' ? (
          <WebsiteSettingsPanel />
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
      // Backend returns url like "/api/uploads/files/xyz.jpg"
      // Frontend needs "/api/backend/uploads/files/xyz.jpg" to go through proxy
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
