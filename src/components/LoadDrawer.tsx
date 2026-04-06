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

export function LoadDrawer({ open, loads, analyses, selectedId, onSelect, onClose }: LoadDrawerProps) {
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
          <span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>Available Loads</span>
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
          {loads.map(l => {
            const a = analyses[l.id];
            if (!a) return null;
            const isSel = selectedId === l.id;
            const gc = GRADE_COLOR[a.grade] || C.t2;
            const gd = GRADE_DIM[a.grade] || C.cardHover;

            return (
              <button
                key={l.id}
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
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>{l.t}</div>
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
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: gc }}>{a.score}</span>
                  </div>
                </div>
              </button>
            );
          })}
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
