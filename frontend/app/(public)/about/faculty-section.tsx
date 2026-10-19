'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/public-card';

const AVATAR_COLORS = ['bg-indigo-600', 'bg-violet-600', 'bg-teal-600', 'bg-amber-600'];

interface StaffMember {
  name: string;
  initials?: string;
  designation: string;
  qualification: string;
  photo_url?: string;
}

const TEACHING_STAFF_FALLBACK: StaffMember[] = [];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((word) => word.length > 1 && word[0] === word[0].toUpperCase())
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
}

export function FacultySection() {
  const [staff, setStaff] = useState<StaffMember[]>(TEACHING_STAFF_FALLBACK);
  const [formerStaff, setFormerStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/backend/public/website-config');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.faculty) && data.faculty.length > 0) setStaff(data.faculty);
          if (Array.isArray(data.former_staff) && data.former_staff.length > 0) setFormerStaff(data.former_staff);
        }
      } catch {
        // Keep the section empty when published data is unavailable.
      }
    }
    fetchData();
  }, []);

  return (
    <section id="faculty" className="relative scroll-mt-24 overflow-hidden bg-[#f5f3ff] py-12 sm:py-14">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Faculty</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Teaching Staff</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Meet the experienced educators who guide and inspire our students every day.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {staff.length > 0 && staff.map((member, index) => (
            <Card key={member.name + index}>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-white">{member.initials || getInitials(member.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{member.name}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{member.designation}</p>
                  </div>
                </div>
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">{member.qualification}</p>
              </div>
            </Card>
          ))}
        </div>

        {formerStaff.length > 0 && (
          <div className="mt-10">
            <h3 className="text-center text-xl font-bold text-slate-900">Former Staff</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {formerStaff.map((member, index) => (
                <Card key={member.name + index}>
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-400">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-white">{member.initials || getInitials(member.name)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-900">{member.name}</h4>
                      <p className="mt-0.5 text-xs text-slate-500">{member.designation}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
