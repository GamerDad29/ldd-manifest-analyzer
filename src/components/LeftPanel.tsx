import { C, GRADE_COLOR, GRADE_SURFACE, GRADE_LABEL } from '../tokens';
import { CompRing } from './CompRing';
import { timeLeft } from '../utils';
import type { Load, AnalysisResult } from '../types';

interface LeftPanelProps {
  load: Load;
  analysis: AnalysisResult;
}

export function LeftPanel({ load, analysis }: LeftPanelProps) {
  const gradeColor = GRADE_COLOR[analysis.grade] || C.t2;
  const gradeSurface = GRADE_SURFACE[analysis.grade] || C.cardHover;
  const gradeLabel = GRADE_LABEL[analysis.grade] || '?';
  const gradeBorder = analysis.grade === 'green'
    ? 'rgba(58,232,143,0.12)'
    : analysis.grade === 'yellow'
      ? 'rgba(232,201,58,0.12)'
      : C.passBorder;

  return (
    <div style={{
      padding: 20, overflowY: 'auto', borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Manifest header card */}
      <div style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${C.borderGold}`, padding: 22,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${C.gold}, ${C.orange}, ${C.gold})`,
        }} />
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.gold,
          letterSpacing: '0.10em', marginBottom: 8, textTransform: 'uppercase' as const,
        }}>{load.id}</div>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 26, letterSpacing: '-0.02em',
          lineHeight: 1.15, marginBottom: 10, color: C.t1,
          textWrap: 'balance' as never,
        }}>{load.t}</h1>
        <div style={{ fontSize: 12, color: C.t2 }}>{load.sub}</div>

        {/* Grade block */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', borderRadius: 12, marginTop: 12,
          background: gradeSurface, border: `1px solid ${gradeBorder}`,
        }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 44, lineHeight: 1, color: gradeColor,
            fontVariantNumeric: 'tabular-nums',
          }}>{analysis.score}</div>
          <div>
            <div style={{
              fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase' as const, color: gradeColor,
            }}>{gradeLabel}</div>
            <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>
              {analysis.score >= 70 ? 'Strong across all metrics' :
                analysis.score >= 40 ? 'Mixed signals, review details' :
                  'Weak load, proceed with caution'}
            </div>
          </div>
        </div>
      </div>

      {/* Auction countdown */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 10,
        background: 'rgba(232,147,58,0.06)', border: '1px solid rgba(232,147,58,0.10)',
      }}>
        <span style={{
          fontSize: 10, color: C.t3, textTransform: 'uppercase' as const,
          letterSpacing: '0.08em', fontWeight: 600,
        }}>Auction Closes</span>
        <span style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 18, color: C.orange, fontVariantNumeric: 'tabular-nums',
        }}>{timeLeft(load.end)}</span>
      </div>

      {/* Composition ring */}
      <div style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${C.border}`, padding: '18px 20px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.t3,
          textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 10,
        }}>
          Load Composition{' '}
          <span style={{ fontWeight: 500, textTransform: 'none' as const, letterSpacing: 0, color: C.t3 }}>
            by % of retail value
          </span>
        </div>
        <CompRing cats={analysis.cats} />
      </div>

      {/* CTA */}
      <button
        style={{
          width: '100%', padding: '14px 0', borderRadius: 10,
          background: C.gold, color: C.bg,
          fontFamily: "'DM Sans', system-ui", fontSize: 13,
          fontWeight: 700, letterSpacing: '0.02em',
          border: 'none', cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(232,176,58,0.2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        View on B-Stock &#x2197;
      </button>
    </div>
  );
}
