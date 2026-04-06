import { C, RING_COLORS } from '../tokens';
import type { CategoryData } from '../types';

interface CompRingProps {
  cats: CategoryData[];
  size?: number;
}

export function CompRing({ cats, size = 130 }: CompRingProps) {
  const r = 56;
  const cx = 70;
  const cy = 70;
  const sw = 15;
  const circ = 2 * Math.PI * r;

  const top5 = cats.slice(0, 5);
  const otherPct = cats.slice(5).reduce((a, c) => a + c.pct, 0);
  const segments = [
    ...top5.map((c, i) => ({ ...c, color: RING_COLORS[i]! })),
    ...(otherPct > 0 ? [{ n: 'Other', pct: otherPct, color: C.t3 }] : []),
  ];

  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
        {segments.map((seg, i) => {
          const dash = circ * seg.pct;
          const off = circ * offset;
          offset += seg.pct;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-off}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
              opacity={seg.n === 'Other' ? 0.6 : 0.85}
              style={{ transition: 'all 0.7s ease' }}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.t2 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            {seg.n}{' '}
            <span style={{ color: C.t1, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(seg.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
