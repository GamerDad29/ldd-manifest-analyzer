import { C } from '../tokens';
import { fm, fd, pc } from '../utils';
import type { AnalysisResult } from '../types';

interface BidModelerTabProps {
  a: AnalysisResult;
  bid: number;
  onBidChange: (v: number) => void;
}

export function BidModelerTab({ a, bid, onBidChange }: BidModelerTabProps) {
  const bidPct = bid / a.tr;
  const profit = a.er - bid;
  const roi = bid > 0 ? profit / bid : 0;

  const pctColor = bidPct > 0.25 ? C.pass : bidPct > 0.2 ? C.consider : C.buy;
  const pctBg = bidPct > 0.25 ? C.passDim : bidPct > 0.2 ? C.considerDim : C.buyDim;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12 }}>
      {/* Bid card */}
      <div style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${C.borderGold}`, padding: 22,
        boxShadow: `0 0 30px ${C.goldGlow}`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.t3,
            textTransform: 'uppercase' as const, letterSpacing: '0.14em',
          }}>Your Bid</div>
          <div style={{
            fontSize: 12, fontWeight: 800, padding: '4px 14px',
            borderRadius: 20, background: pctBg, color: pctColor,
          }}>{pc(bidPct)} of retail</div>
        </div>

        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 42, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.03em',
          color: bidPct > 0.2 ? C.pass : C.t1,
        }}>{fm(bid)}</div>
        <div style={{ fontSize: 11, color: C.t3, margin: '4px 0 16px' }}>
          includes {fm(a.fr)} freight
        </div>

        <input
          type="range"
          min={Math.round(a.tr * 0.05)}
          max={Math.round(a.tr * 0.35)}
          value={bid}
          onChange={e => onBidChange(Number(e.target.value))}
          aria-label="Adjust bid amount"
          style={{
            width: '100%', height: 6, borderRadius: 6, outline: 'none',
            appearance: 'none', WebkitAppearance: 'none',
            background: 'rgba(255,255,255,0.06)', marginBottom: 16,
          }}
        />

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        }}>
          {[
            { l: 'Per Item', v: fd(bid / a.ti), c: C.t1 },
            { l: 'Profit', v: fm(profit), c: profit > 0 ? C.buy : C.pass },
            { l: 'ROI', v: Math.round(roi * 100) + '%', c: roi > 0 ? C.buy : C.pass },
          ].map(m => (
            <div key={m.l} style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{
                fontSize: 9, color: C.t3,
                textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4,
              }}>{m.l}</div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 20, fontVariantNumeric: 'tabular-nums', color: m.c,
              }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reference + sell rates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`, padding: '18px 20px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.t3,
            textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 10,
          }}>Reference Points</div>
          {[
            { l: 'Target (20%)', v: fm(a.tr * 0.2), c: C.buy },
            { l: 'Break Even', v: fm(a.tr * 0.25), c: C.consider },
            { l: 'Max Risk', v: fm(a.tr * 0.3), c: C.pass },
          ].map(r => (
            <div key={r.l} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.02)', marginBottom: 4,
            }}>
              <span style={{ fontSize: 11, color: C.t2 }}>{r.l}</span>
              <span style={{
                fontSize: 13, fontWeight: 700, color: r.c,
                fontVariantNumeric: 'tabular-nums',
              }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`, padding: '18px 20px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.t3,
            textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 8,
          }}>Category Sell Rates</div>
          {a.cats.slice(0, 5).map((cat, i) => (
            <div key={cat.n} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: i < 4 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: 11, color: C.t2 }}>{cat.n}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: C.t1,
                fontVariantNumeric: 'tabular-nums',
              }}>{pc(cat.s)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
