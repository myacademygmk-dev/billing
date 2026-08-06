'use client';

import { RankMedal, tierDotColor } from '@/components/ui/public-card';
import { ScoreRing } from '@/components/ui/score-ring';

/** Parses "493 / 500" style strings into a rounded percentage. Returns null if unparseable. */
function parsePercent(marks: unknown): number | null {
  const match = String(marks ?? '').match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const [, num, den] = match;
  const n = parseFloat(num);
  const d = parseFloat(den);
  if (!d) return null;
  return Math.round((n / d) * 100);
}

const SIZES = {
  sm: { ring: 44, medal: 'sm' as const },
  md: { ring: 52, medal: 'md' as const },
};

/**
 * The medal, with an animated progress ring around it whenever marks are in
 * an "x / y" format — turns a static badge into a visualized score, the way
 * fitness rings do. Falls back to a plain medal when marks aren't parseable
 * (e.g. a non-numeric award like "Gold Medal").
 */
export function AchievementMedal({ rank, marks, size = 'md' }: { rank: unknown; marks?: unknown; size?: 'sm' | 'md' }) {
  const percent = parsePercent(marks);
  const { ring, medal } = SIZES[size];

  if (percent === null) {
    return <RankMedal rank={rank} size={medal} />;
  }

  return (
    <ScoreRing percent={percent} color={tierDotColor(rank)} size={ring}>
      <RankMedal rank={rank} size={medal} />
    </ScoreRing>
  );
}
