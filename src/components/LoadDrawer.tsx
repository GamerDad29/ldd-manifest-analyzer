import { useState, useMemo } from 'react';
import { C, GRADE_COLOR, GRADE_DIM } from '../tokens';
import { fm, timeLeft } from '../utils';
import type { Load, AnalysisResult } from '../types';

interface LoadDrawerProps {
  open: boolean;
  loads: Load[];
  analyses: Record<string, AnalysisResult>;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const TOP_COUNT = 10;

export function LoadDrawer({ open, loads, analyses, selectedId, onSelect, onClose }: LoadDrawerProps) {
  const [showAll, setShowAll] = useState(false);

  // Sort loads by score descending so top 10 are the best deals
  const sorted = useMemo(() => {
    return [...loads].sort((a, b) => {
      const scoreA = analyses[a.id]?.score ?? 0;
      const scoreB = analyses[b.id]?.score ?? 0;
      return scoreB - scoreA;
    });
  }, [loads, analyses]);

  const topLoads = sorted.slice(0, TOP_COUNT);
  const restLoads = sorted.slice(TOP_COUNT);
  const visibleLoads = showAll ? sorted : topLoads;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 320, zIndex: 160,
        background: C.surface, borderRight: `1px solid rgba(255,255,255,0.10)`,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '20px 0 60px rgba(0,0,0,0.5)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 18px 12px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>Available Loads</span>
            <span style={{ fontSize: 11, color: C.t3, marginLeft: 8 }}>{loads.length} total</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', color: C.t2, fontSize: 16,
              fontFamily: 'inherit',
            }}
          >&#x2715;</button>
        </div>

        {/* Load list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {/* Section label */}
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.gold,
            textTransform: 'uppercase' as const, letterSpacing: '0.12em',
            padding: '6px 16px 8px',
          }}>Top {Math.min(TOP_COUNT, loads.length)} by Score</div>

          {visibleLoads.map((l, idx) => {
            const a = analyses[l.id];
            if (!a) return null;
            const isSel = selectedId === l.id;
            const gc = GRADE_COLOR[a.grade] || C.t2;
            const gd = GRADE_DIM[a.grade] || C.cardHover;
            const isInRest = idx >= TOP_COUNT;

            return (
              <div key={l.id}>
                {/* Divider before "rest" section */}
                {isInRest && idx === TOP_COUNT && (
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: C.t3,
                    textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                    padding: '12px 16px 8px',
                    borderTop: `1px solid ${C.border}`,
                    marginTop: 4,
                  }}>Remaining Loads</div>
                )}
                <button
                  onClick={() => onSelect(l.id)}
                  style={{
                    width: '100%', textAlign: 'left' as const,
                    padding: '14px 16px', borderRadius: 14, marginBottom: 4,
                    background: isSel ? C.goldDim : 'transparent',
                    border: isSel ? `1.5px solid ${C.borderGold}` : '1.5px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700, color: C.t1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{l.t}</div>
                      <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                        {fm(a.tr)} retail &middot; {a.ti.toLocaleString()} items
                      </div>
                      <div style={{ fontSize: 10, color: C.orange, fontWeight: 600, marginTop: 3 }}>
                        Ends {timeLeft(l.end)}
                      </div>
                    </div>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: gd, border: `1.5px solid ${gc}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginLeft: 10,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: gc }}>{a.score}</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Show more / show less toggle */}
          {restLoads.length > 0 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                width: '100%', padding: '12px 16px', marginTop: 4,
                borderRadius: 10, border: `1px solid ${C.border}`,
                background: 'transparent', color: C.t2,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.2s, color 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.goldDim;
                e.currentTarget.style.color = C.gold;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = C.t2;
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: showAll ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {showAll ? 'Show Top 10 Only' : `Show ${restLoads.length} More Loads`}
            </button>
          )}
        </div>

        {/* Bottom drop zone */}
        <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
          <div style={{
            padding: 14, borderRadius: 12,
            border: '1.5px dashed rgba(255,255,255,0.07)',
            textAlign: 'center' as const, fontSize: 12, color: C.t3,
          }}>
            Drop CSV for manual analysis
          </div>
        </div>
      </div>
    </>
  );
}
