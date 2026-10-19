import { Trophy } from 'lucide-react';

export type PublicAchievement = {
  id: string | number;
  student_name?: string;
  title?: string;
  class_name?: string;
  year?: string;
  rank?: number;
  marks?: string;
  image_url?: string | null;
};

export function AchievementCard({ achievement }: { achievement: PublicAchievement }) {
  const name = achievement.student_name || achievement.title || 'Student achievement';
  const rank = achievement.rank && achievement.rank > 0 ? achievement.rank : null;
  return (
    <article className="group relative overflow-hidden rounded-[8px] border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg">
      <div className="flex min-h-[220px] flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            <Trophy size={16} aria-hidden="true" /> Recognition
          </div>
          {achievement.year && <span className="shrink-0 text-xs font-medium tabular-nums text-slate-400">{achievement.year}</span>}
        </div>
        <div className="mt-6 flex min-w-0 items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[6px] bg-slate-900 text-2xl font-semibold tabular-nums text-white">
            {rank ? String(rank).padStart(2, '0') : '—'}
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold leading-7 text-slate-900">{name}</h3>
            {achievement.class_name && <p className="mt-1 break-words text-sm text-slate-500">{achievement.class_name}</p>}
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Result</p><p className="mt-1 text-sm font-medium text-slate-700">{rank ? `Rank ${rank}` : 'Academic recognition'}</p></div>
          {achievement.marks && <div className="text-right"><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Score</p><p className="mt-1 break-words text-lg font-semibold tabular-nums text-slate-900">{achievement.marks}</p></div>}
        </div>
      </div>
    </article>
  );
}
