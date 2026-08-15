'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/public-card';
import { GlowOrb } from '@/components/ui/glow-orb';

interface TeamMember {
  name: string;
  role: string;
  photo_url?: string;
  qualification?: string;
}

const PLACEHOLDER_TEAM: TeamMember[] = [
  { name: 'Mr. Vasanthakumar V.', role: 'Full Stack Developer', qualification: 'B.Tech IT' },
  { name: 'Mr. Aravind K.', role: 'System Administrator', qualification: 'B.Sc. CS' },
  { name: 'Mr. Dinesh R.', role: 'Network & Hardware', qualification: 'Diploma in ECE' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((w) => w.length > 1 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

const AVATAR_COLORS = ['bg-teal-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-sky-600'];

export function TechnicalTeamSection() {
  const [team, setTeam] = useState<TeamMember[]>(PLACEHOLDER_TEAM);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch('/api/backend/public/website-config');
        if (res.ok) {
          const data = await res.json();
          if (data.technical_team && Array.isArray(data.technical_team) && data.technical_team.length > 0) {
            setTeam(data.technical_team);
          }
        }
      } catch {
        // fallback to placeholder
      }
    }
    fetchTeam();
  }, []);

  return (
    <section id="technical-team" className="relative overflow-hidden bg-white py-12 sm:py-14">
      <GlowOrb color="bg-teal-200/30" className="-right-16 -bottom-16 h-64 w-64" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 text-center">Tech Support</p>
        <h2 className="mt-1 text-2xl font-bold text-center">
          <span className="bg-gradient-to-r from-[#0d9488] to-[#0891b2] bg-clip-text text-transparent">Technical Team</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">The tech team powering our digital infrastructure</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <Card key={member.name + i}>
              <div className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-white">{getInitials(member.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{member.name}</h3>
                  <p className="mt-0.5 text-xs font-medium text-teal-600">{member.role}</p>
                  {member.qualification && (
                    <p className="mt-1 text-xs text-slate-500">{member.qualification}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
