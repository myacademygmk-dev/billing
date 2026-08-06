'use client';

import { Card } from '@/components/ui/public-card';
import { GlowOrb } from '@/components/ui/glow-orb';

// A small curated rotation — not a rainbow, but enough variety per icon tile
// to give each facility its own identity, with a soft glow ring to match
// the medal treatment used on the Achievements page.
const ICON_ACCENTS = [
  { bg: 'bg-indigo-500', glow: 'shadow-[0_0_0_3px_rgba(99,102,241,0.16)]' },
  { bg: 'bg-teal-500', glow: 'shadow-[0_0_0_3px_rgba(20,184,166,0.16)]' },
  { bg: 'bg-amber-500', glow: 'shadow-[0_0_0_3px_rgba(245,158,11,0.16)]' },
  { bg: 'bg-violet-500', glow: 'shadow-[0_0_0_3px_rgba(139,92,246,0.16)]' },
];

// Lighter variant of the same rotation, for icon chips on white cards.
const HIGHLIGHT_ACCENTS = [
  { chip: 'bg-indigo-50', icon: 'text-indigo-600' },
  { chip: 'bg-teal-50', icon: 'text-teal-600' },
  { chip: 'bg-amber-50', icon: 'text-amber-600' },
  { chip: 'bg-violet-50', icon: 'text-violet-600' },
];

const FACILITIES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: 'Modern Science Labs',
    description: 'Fully equipped physics, chemistry, and biology laboratories with the latest instruments and safety equipment for hands-on learning.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: 'Digital Library',
    description: 'A vast collection of 25,000+ books, digital resources, e-journals, and a quiet reading space with dedicated research areas.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    ),
    title: 'Sports Complex',
    description: 'Multi-purpose sports grounds with cricket pitch, basketball court, volleyball court, and indoor badminton and table tennis facilities.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
      </svg>
    ),
    title: 'Computer Labs',
    description: 'State-of-the-art computer labs with 100+ systems, high-speed internet, and the latest software for programming and digital literacy.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    title: 'Smart Classrooms',
    description: 'Interactive smart boards, projectors, and audio-visual aids in every classroom for an engaging and immersive learning experience.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Transportation',
    description: 'Safe and reliable bus service covering 20+ routes across the city and nearby towns with GPS tracking and trained drivers.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
      </svg>
    ),
    title: 'Arts & Music',
    description: 'Dedicated studios for music, dance, and fine arts with professional instruments and performance stages for cultural development.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
    title: 'Playground & Recreation',
    description: 'Spacious playgrounds, garden areas, and recreation zones ensuring students have a balanced mix of academics and leisure activities.',
  },
];

export default function FacilitiesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-8 sm:py-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Facilities</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Our Facilities</h1>
          <p className="mt-3 text-lg text-indigo-100">
            World-class infrastructure and modern facilities for an ideal learning environment.
          </p>
        </div>
      </section>

      {/* Facilities Grid - Dark Section */}
      <section className="relative overflow-hidden bg-[#0f172a] py-12 sm:py-14">
        <GlowOrb color="bg-indigo-500/10" className="-left-20 -top-20 h-72 w-72" />
        <GlowOrb color="bg-violet-500/10" className="-bottom-16 -right-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal text-center">
            <h2 className="text-3xl font-bold text-white">Why Choose Us</h2>
            <p className="mt-3 text-gray-400">Everything your child needs for a holistic education, all under one roof</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.map((facility, i) => {
              const accent = ICON_ACCENTS[i % ICON_ACCENTS.length];
              return (
                <Card key={facility.title} tone="dark" className={`reveal reveal-delay-${(i % 6) + 1} hover:border-white/15`}>
                  <div className="p-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white transition-transform duration-200 group-hover:scale-105 ${accent.bg} ${accent.glow}`}>
                      {facility.icon}
                    </div>
                    <h3 className="mt-3.5 text-base font-semibold text-white">{facility.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{facility.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Campus Highlights */}
      <section className="relative overflow-hidden bg-[#fefce8] py-12 sm:py-14">
        <GlowOrb color="bg-amber-200/40" className="-right-16 -top-16 h-64 w-64" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal text-center">
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Campus Highlights</span>
            </h2>
            <p className="mt-3 text-gray-600">A few more reasons that make our campus special</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            {[
              'CCTV surveillance across campus for safety',
              'Purified drinking water and hygienic canteen',
              'Medical room with first-aid and nurse on duty',
              'Auditorium with 500+ seating capacity',
              'Separate activity rooms for each grade level',
              'Solar-powered campus promoting sustainability',
            ].map((item, i) => {
              const accent = HIGHLIGHT_ACCENTS[i % HIGHLIGHT_ACCENTS.length];
              return (
                <Card key={item} className={`reveal reveal-delay-${(i % 6) + 1}`}>
                  <div className="flex items-start gap-3 p-4">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${accent.chip} ${accent.icon}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">{item}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
